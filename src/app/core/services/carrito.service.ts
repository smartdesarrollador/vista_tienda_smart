import {
  Injectable,
  signal,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap, debounceTime, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ItemCarrito,
  EstadoCarrito,
  ResumenCarrito,
  AgregarItemRequest,
  ActualizarCantidadRequest,
  AplicarCuponRequest,
  CalcularEnvioRequest,
  CarritoResponse,
  CuponDescuento,
  ValidacionCupon,
  ConfiguracionCarrito,
  EventoCarrito,
  ProductoRelacionado,
  DescuentoAplicado,
} from '../models/carrito.interface';

@Injectable({
  providedIn: 'root',
})
export class CarritoService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly API_URL = `${environment.apiUrl}/carrito`;
  private readonly STORAGE_KEY = 'tienda_carrito';

  // Opciones HTTP simplificadas
  private get httpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
    };
  }

  // Signals para estado reactivo
  private readonly _items = signal<ItemCarrito[]>([]);
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _cuponAplicado = signal<CuponDescuento | null>(null);
  private readonly _sincronizado = signal<boolean>(true);

  // Subject para eventos del carrito
  private readonly eventosCarrito$ = new BehaviorSubject<EventoCarrito | null>(
    null
  );

  // Configuración por defecto
  private readonly configuracion: ConfiguracionCarrito = {
    maximo_items: 50,
    maximo_cantidad_por_item: 99,
    tiempo_sesion_minutos: 120,
    auto_limpiar_items_sin_stock: true,
    mostrar_productos_relacionados: true,
    permitir_compra_sin_cuenta: true,
    calcular_impuestos: true,
    porcentaje_igv: 18,
  };

  // Computed signals públicos
  readonly items = this._items.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly cuponAplicado = this._cuponAplicado.asReadonly();
  readonly sincronizado = this._sincronizado.asReadonly();

  readonly itemsCount = computed(() => this._items().length);
  readonly totalItems = computed(() =>
    this._items().reduce((total, item) => total + item.cantidad, 0)
  );

  readonly subtotal = computed(() =>
    this._items().reduce((total, item) => total + item.subtotal, 0)
  );

  readonly descuentos = computed(() => {
    let descuento = 0;

    // Descuentos por ofertas de productos
    this._items().forEach((item) => {
      if (item.precio_oferta && item.precio_oferta < item.precio) {
        descuento += (item.precio - item.precio_oferta) * item.cantidad;
      }
    });

    // Descuento por cupón
    const cupon = this._cuponAplicado();
    if (cupon) {
      if (cupon.tipo === 'porcentaje') {
        descuento += (this.subtotal() * cupon.valor) / 100;
      } else if (cupon.tipo === 'monto_fijo') {
        descuento += cupon.valor;
      }
    }

    return descuento;
  });

  readonly impuestos = computed(() => {
    if (!this.configuracion.calcular_impuestos) return 0;
    const baseImponible = this.subtotal() - this.descuentos();
    return (baseImponible * this.configuracion.porcentaje_igv) / 100;
  });

  readonly total = computed(() => {
    return this.subtotal() - this.descuentos() + this.impuestos();
  });

  readonly estaVacio = computed(() => this._items().length === 0);

  readonly resumen = computed<ResumenCarrito>(() => ({
    items_count: this.itemsCount(),
    subtotal: this.subtotal(),
    descuentos: this.descuentos(),
    descuentos_aplicados: this.obtenerDescuentosAplicados(),
    impuestos: this.impuestos(),
    costo_envio: 0, // Se calculará con el módulo de envío
    envio_gratis: false,
    total: this.total(),
    peso_total: this.calcularPesoTotal(),
  }));

  constructor() {
    // Cargar carrito desde localStorage al iniciar
    if (this.isBrowser) {
      this.cargarDesdeStorage();

      // Auto-guardar cuando cambie el estado
      setInterval(() => {
        if (!this._sincronizado()) {
          this.guardarEnStorage();
        }
      }, 5000); // Cada 5 segundos
    }
  }

  // Métodos públicos

  /**
   * Agregar item al carrito
   */
  agregarItem(request: AgregarItemRequest): Observable<CarritoResponse> {
    this._cargando.set(true);
    this._error.set(null);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Session-ID': this.generateUniqueId(),
    });

    return this.http
      .post<CarritoResponse>(`${this.API_URL}/agregar`, request, { headers })
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Actualizar todo el estado del carrito con la respuesta del servidor
            this._items.set(response.data.items || []);
            this._cuponAplicado.set(response.data.cupon_aplicado || null);
            this._sincronizado.set(true);
            this.guardarEnStorage();

            // Encontrar el item que se acaba de agregar para el evento
            const itemAgregado = response.data.items?.find(
              (item: ItemCarrito) =>
                item.producto_id === request.producto_id &&
                item.variacion_id === request.variacion_id
            );

            if (itemAgregado) {
              this.emitirEvento({
                tipo: 'item_agregado',
                item: itemAgregado,
                timestamp: new Date(),
              });
            }
          }
        }),
        catchError((error) => {
          this._error.set('Error al agregar producto al carrito');
          return this.manejarErrorOffline(request);
        }),
        tap(() => this._cargando.set(false))
      );
  }

  /**
   * Actualizar cantidad de un item
   */
  actualizarCantidad(
    itemId: string,
    cantidad: number
  ): Observable<CarritoResponse> {
    if (cantidad <= 0) {
      return this.removerItem(itemId);
    }

    if (cantidad > this.configuracion.maximo_cantidad_por_item) {
      cantidad = this.configuracion.maximo_cantidad_por_item;
    }

    this._cargando.set(true);

    const request: ActualizarCantidadRequest = { item_id: itemId, cantidad };

    return this.http
      .put<CarritoResponse>(
        `${this.API_URL}/actualizar`,
        request,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Actualizar todo el estado del carrito con la respuesta del servidor
            this._items.set(response.data.items || []);
            this._cuponAplicado.set(response.data.cupon_aplicado || null);
            this._sincronizado.set(true);
            this.guardarEnStorage();
          }
        }),
        catchError((error) => {
          this._error.set('Error al actualizar cantidad');
          return this.actualizarCantidadOffline(itemId, cantidad);
        }),
        tap(() => this._cargando.set(false))
      );
  }

  /**
   * Remover item del carrito
   */
  removerItem(itemId: string): Observable<CarritoResponse> {
    this._cargando.set(true);

    return this.http
      .delete<CarritoResponse>(
        `${this.API_URL}/remover/${itemId}`,
        this.httpOptions
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            const itemRemovido = this._items().find(
              (item) => item.id === itemId
            );

            // Actualizar todo el estado del carrito con la respuesta del servidor
            this._items.set(response.data.items || []);
            this._cuponAplicado.set(response.data.cupon_aplicado || null);
            this._sincronizado.set(true);
            this.guardarEnStorage();

            if (itemRemovido) {
              this.emitirEvento({
                tipo: 'item_removido',
                item: itemRemovido,
                timestamp: new Date(),
              });
            }
          }
        }),
        catchError((error) => {
          this._error.set('Error al remover producto');
          return this.removerItemOffline(itemId);
        }),
        tap(() => this._cargando.set(false))
      );
  }

  /**
   * Limpiar carrito completo
   */
  limpiarCarrito(): Observable<CarritoResponse> {
    this._cargando.set(true);

    return this.http
      .delete<CarritoResponse>(`${this.API_URL}/limpiar`, this.httpOptions)
      .pipe(
        tap((response) => {
          if (response.success) {
            // Limpiar completamente el estado local
            this._items.set([]);
            this._cuponAplicado.set(null);
            this._sincronizado.set(true);
            this.guardarEnStorage();

            this.emitirEvento({
              tipo: 'carrito_limpiado',
              timestamp: new Date(),
            });
          }
        }),
        catchError((error) => {
          this._error.set('Error al limpiar carrito');
          return throwError(() => error);
        }),
        tap(() => this._cargando.set(false))
      );
  }

  /**
   * Aplicar cupón de descuento
   */
  aplicarCupon(request: AplicarCuponRequest): Observable<any> {
    // Simulación de aplicación de cupón - en producción sería una llamada HTTP
    return of({
      success: true,
      message: `Cupón ${request.codigo} aplicado correctamente`,
      descuento: {
        tipo: 'cupon',
        codigo: request.codigo,
        descripcion: `Descuento por cupón ${request.codigo}`,
        monto: 25.5,
      },
    }).pipe(
      delay(1000), // Simular latencia de red
      tap((response) => {
        if (response.success) {
          // Crear objeto cupón y aplicarlo
          const cupon: CuponDescuento = {
            id: Date.now(),
            codigo: request.codigo,
            descripcion: `Descuento por cupón ${request.codigo}`,
            tipo: 'porcentaje',
            valor: 15,
            fecha_inicio: new Date(),
            fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
            activo: true,
          };

          this._cuponAplicado.set(cupon);

          // Emitir evento
          this.emitirEvento({
            tipo: 'cupon_aplicado',
            cupon: request.codigo,
            timestamp: new Date(),
          });

          this.guardarEnStorage();
        }
      })
    );
  }

  /**
   * Remover cupón de descuento
   */
  removerCupon(codigo: string): Observable<any> {
    return of({
      success: true,
      message: `Cupón ${codigo} eliminado correctamente`,
    }).pipe(
      delay(500),
      tap((response) => {
        if (response.success) {
          // Remover cupón aplicado
          this._cuponAplicado.set(null);
          this.guardarEnStorage();
        }
      })
    );
  }

  /**
   * Obtener productos relacionados para carrito vacío
   */
  obtenerProductosRelacionados(): Observable<ProductoRelacionado[]> {
    return this.http
      .get<ProductoRelacionado[]>(
        `${this.API_URL}/productos-relacionados`,
        this.httpOptions
      )
      .pipe(
        catchError((error) => {
          console.error('Error al cargar productos relacionados:', error);
          return of([]);
        })
      );
  }

  /**
   * Verificar disponibilidad de items
   */
  verificarDisponibilidad(): Observable<ItemCarrito[]> {
    const items = this._items().map((item) => ({
      producto_id: item.producto_id,
      variacion_id: item.variacion_id,
      cantidad: item.cantidad,
    }));

    return this.http
      .post<any>(`${this.API_URL}/verificar-stock`, { items }, this.httpOptions)
      .pipe(
        tap((response) => {
          // Verificar que la respuesta tenga la estructura esperada
          const itemsActualizados = response?.data || response;

          // Asegurar que es un array antes de usar forEach
          if (Array.isArray(itemsActualizados)) {
            itemsActualizados.forEach((itemActualizado) => {
              const itemLocal = this._items().find(
                (item) =>
                  item.producto_id === itemActualizado.producto_id &&
                  item.variacion_id === itemActualizado.variacion_id
              );

              if (
                itemLocal &&
                itemLocal.stock_disponible !== itemActualizado.stock_disponible
              ) {
                this.actualizarStockLocal(
                  itemLocal.id,
                  itemActualizado.stock_disponible
                );
              }
            });
          } else {
            console.warn(
              'La respuesta de verificar-stock no es un array:',
              response
            );
          }
        }),
        map((response) => {
          // Retornar el array de items o un array vacío
          const itemsActualizados = response?.data || response;
          return Array.isArray(itemsActualizados) ? itemsActualizados : [];
        }),
        catchError((error) => {
          console.error('Error al verificar disponibilidad:', error);
          return of([]);
        })
      );
  }

  /**
   * Cargar carrito desde el servidor
   */
  cargarCarrito(): Observable<CarritoResponse> {
    // Agregar sessionId al header si está disponible
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Session-ID': this.generateUniqueId(),
    });

    return this.http.get<CarritoResponse>(`${this.API_URL}`, { headers }).pipe(
      tap((response) => {
        console.log('Carrito cargado desde servidor:', response);
        if (response?.success && response?.data) {
          // Actualizar estado local con datos del servidor
          this._items.set(response.data.items || []);
          this._cuponAplicado.set(response.data.cupon_aplicado || null);
          this._sincronizado.set(true);
          this.guardarEnStorage();
        }
      }),
      catchError((error) => {
        console.error('Error al cargar carrito:', error);
        this._error.set('Error al cargar el carrito');
        return of({
          success: false,
          message: 'Error al cargar carrito',
          data: {} as EstadoCarrito,
        });
      })
    );
  }

  // Métodos privados

  /**
   * Generar un ID único para la sesión
   */
  private generateUniqueId(): string {
    return (
      'carrito_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    );
  }

  private agregarItemLocal(nuevoItem: ItemCarrito): void {
    const items = this._items();
    const itemExistente = items.find(
      (item) =>
        item.producto_id === nuevoItem.producto_id &&
        item.variacion_id === nuevoItem.variacion_id
    );

    if (itemExistente) {
      // Actualizar cantidad si ya existe
      const nuevaCantidad = itemExistente.cantidad + nuevoItem.cantidad;
      this.actualizarCantidadLocal(itemExistente.id, nuevaCantidad);
    } else {
      // Agregar nuevo item
      this._items.set([...items, nuevoItem]);
    }

    this._sincronizado.set(false);
    this.guardarEnStorage();
  }

  private actualizarCantidadLocal(itemId: string, cantidad: number): void {
    const items = this._items();
    const itemIndex = items.findIndex((item) => item.id === itemId);

    if (itemIndex !== -1) {
      const itemActualizado = {
        ...items[itemIndex],
        cantidad,
        subtotal:
          cantidad *
          (items[itemIndex].precio_oferta || items[itemIndex].precio),
        modificado_en: new Date(),
      };

      const nuevosItems = [...items];
      nuevosItems[itemIndex] = itemActualizado;
      this._items.set(nuevosItems);

      this.emitirEvento({
        tipo: 'cantidad_actualizada',
        item: itemActualizado,
        cantidad_anterior: items[itemIndex].cantidad,
        cantidad_nueva: cantidad,
        timestamp: new Date(),
      });
    }

    this._sincronizado.set(false);
    this.guardarEnStorage();
  }

  private removerItemLocal(itemId: string): void {
    const items = this._items();
    this._items.set(items.filter((item) => item.id !== itemId));
    this._sincronizado.set(false);
    this.guardarEnStorage();
  }

  private actualizarStockLocal(itemId: string, nuevoStock: number): void {
    const items = this._items();
    const itemIndex = items.findIndex((item) => item.id === itemId);

    if (itemIndex !== -1) {
      const nuevosItems = [...items];
      nuevosItems[itemIndex] = {
        ...nuevosItems[itemIndex],
        stock_disponible: nuevoStock,
      };
      this._items.set(nuevosItems);
      this.guardarEnStorage();
    }
  }

  private obtenerDescuentosAplicados(): DescuentoAplicado[] {
    const descuentos: DescuentoAplicado[] = [];

    // Descuentos por ofertas
    this._items().forEach((item) => {
      if (item.precio_oferta && item.precio_oferta < item.precio) {
        const monto = (item.precio - item.precio_oferta) * item.cantidad;
        descuentos.push({
          tipo: 'promocion',
          descripcion: `Oferta en ${item.nombre}`,
          monto,
          porcentaje: ((item.precio - item.precio_oferta) / item.precio) * 100,
        });
      }
    });

    // Descuento por cupón
    const cupon = this._cuponAplicado();
    if (cupon) {
      let monto = 0;
      if (cupon.tipo === 'porcentaje') {
        monto = (this.subtotal() * cupon.valor) / 100;
      } else if (cupon.tipo === 'monto_fijo') {
        monto = cupon.valor;
      }

      descuentos.push({
        tipo: 'cupon',
        codigo: cupon.codigo,
        descripcion: cupon.descripcion,
        monto,
        porcentaje: cupon.tipo === 'porcentaje' ? cupon.valor : undefined,
      });
    }

    return descuentos;
  }

  private calcularPesoTotal(): number {
    // Implementar cálculo de peso si es necesario
    return this._items().reduce((peso, item) => peso + item.cantidad * 0.5, 0); // 0.5kg por defecto
  }

  private cargarDesdeStorage(): void {
    try {
      const carritoGuardado = localStorage.getItem(this.STORAGE_KEY);
      if (carritoGuardado) {
        const estado: EstadoCarrito = JSON.parse(carritoGuardado);
        this._items.set(estado.items || []);
        this._cuponAplicado.set(estado.cupon_aplicado || null);
      }
    } catch (error) {
      console.error('Error al cargar carrito desde localStorage:', error);
    }
  }

  private guardarEnStorage(): void {
    if (!this.isBrowser) return;

    try {
      const estado: EstadoCarrito = {
        items: this._items(),
        resumen: this.resumen(),
        cupon_aplicado: this._cuponAplicado() || undefined,
        cargando: false,
        guardado_en: new Date(),
        sincronizado: this._sincronizado(),
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(estado));
      this._sincronizado.set(true);
    } catch (error) {
      console.error('Error al guardar carrito en localStorage:', error);
    }
  }

  private emitirEvento(evento: EventoCarrito): void {
    this.eventosCarrito$.next(evento);
  }

  // Métodos offline (fallback)
  private manejarErrorOffline(
    request: AgregarItemRequest
  ): Observable<CarritoResponse> {
    // Implementar lógica offline básica
    return of({
      success: false,
      message:
        'Sin conexión. El producto se agregará cuando se restablezca la conexión.',
      data: {} as EstadoCarrito,
      errors: ['offline'],
    });
  }

  private actualizarCantidadOffline(
    itemId: string,
    cantidad: number
  ): Observable<CarritoResponse> {
    this.actualizarCantidadLocal(itemId, cantidad);
    return of({
      success: true,
      message: 'Cantidad actualizada localmente',
      data: {} as EstadoCarrito,
    });
  }

  private removerItemOffline(itemId: string): Observable<CarritoResponse> {
    this.removerItemLocal(itemId);
    return of({
      success: true,
      message: 'Producto removido localmente',
      data: {} as EstadoCarrito,
    });
  }

  // Getters para eventos
  get eventos$() {
    return this.eventosCarrito$.asObservable();
  }
}
