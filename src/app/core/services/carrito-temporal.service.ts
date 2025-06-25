import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';

import {
  CarritoTemporal,
  CreateCarritoTemporalDto,
  UpdateCarritoTemporalDto,
  LimpiarCarritoDto,
  FiltrosCarritoTemporal,
  CarritoTemporalResponse,
  CarritosTemporalResponse,
  LimpiarCarritoResponse,
  EstadisticasCarrito,
  esCarritoValido,
  calcularTotalCarrito,
  obtenerProductosUnicos,
  agruparPorProducto,
  crearSessionId,
  esItemDuplicado,
  TIEMPO_EXPIRACION_HORAS,
} from '../models/carrito-temporal.interface';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CarritoTemporalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/carrito-temporal`;

  // Signals para estado reactivo
  private readonly _carritosTemporales = signal<CarritoTemporal[]>([]);
  private readonly _carritoTemporalActual = signal<CarritoTemporal | null>(
    null
  );
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtros = signal<FiltrosCarritoTemporal>({});
  private readonly _paginacion = signal({
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1,
    from: null as number | null,
    to: null as number | null,
  });
  private readonly _estadisticas = signal<EstadisticasCarrito | null>(null);

  // Computed signals para datos derivados
  readonly carritosTemporales = this._carritosTemporales.asReadonly();
  readonly carritoTemporalActual = this._carritoTemporalActual.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filtros = this._filtros.asReadonly();
  readonly paginacion = this._paginacion.asReadonly();
  readonly estadisticas = this._estadisticas.asReadonly();

  // Computed signals para análisis de datos
  readonly carritosValidos = computed(() =>
    this._carritosTemporales().filter((carrito) => esCarritoValido(carrito))
  );

  readonly carritosExpirados = computed(() =>
    this._carritosTemporales().filter((carrito) => carrito.esta_expirado)
  );

  readonly totalItems = computed(() => this._carritosTemporales().length);

  readonly totalProductos = computed(
    () => obtenerProductosUnicos(this._carritosTemporales()).length
  );

  readonly subtotalGeneral = computed(() =>
    calcularTotalCarrito(this._carritosTemporales())
  );

  readonly carritosPorProducto = computed(() =>
    agruparPorProducto(this._carritosTemporales())
  );

  readonly hayCarritos = computed(() => this._carritosTemporales().length > 0);

  readonly hayCarritosValidos = computed(
    () => this.carritosValidos().length > 0
  );

  readonly sessionId = signal<string>(this.obtenerOCrearSessionId());

  // BehaviorSubjects para compatibilidad con observables existentes
  private readonly carritosSubject = new BehaviorSubject<CarritoTemporal[]>([]);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos
  readonly carritos$ = this.carritosSubject.asObservable();
  readonly cargando$ = this.cargandoSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  constructor() {
    // Sincronizar signals con BehaviorSubjects
    this.sincronizarSignalsConObservables();
  }

  /**
   * Obtener todos los carritos temporales con filtros
   */
  obtenerCarritos(
    filtros: FiltrosCarritoTemporal = {}
  ): Observable<CarritosTemporalResponse> {
    this.iniciarCarga();
    this._filtros.set(filtros);

    let params = new HttpParams();

    if (filtros.user_id) {
      params = params.set('user_id', filtros.user_id.toString());
    }

    if (filtros.session_id) {
      params = params.set('session_id', filtros.session_id);
    }

    if (filtros.per_page) {
      params = params.set('per_page', filtros.per_page.toString());
    }

    if (filtros.page) {
      params = params.set('page', filtros.page.toString());
    }

    return this.http
      .get<CarritosTemporalResponse>(this.baseUrl, { params })
      .pipe(
        tap((response) => {
          this._carritosTemporales.set(response.data);
          this._paginacion.set(response.meta);
          this.carritosSubject.next(response.data);
        }),
        catchError((error) =>
          this.manejarError('Error al obtener carritos temporales', error)
        ),
        finalize(() => this.finalizarCarga())
      );
  }

  /**
   * Obtener carrito temporal por ID
   */
  obtenerCarritoPorId(id: number): Observable<CarritoTemporalResponse> {
    this.iniciarCarga();

    return this.http.get<CarritoTemporalResponse>(`${this.baseUrl}/${id}`).pipe(
      tap((response) => {
        this._carritoTemporalActual.set(response.data);
      }),
      catchError((error) =>
        this.manejarError('Error al obtener carrito temporal', error)
      ),
      finalize(() => this.finalizarCarga())
    );
  }

  /**
   * Agregar producto al carrito temporal
   */
  agregarProducto(
    datos: CreateCarritoTemporalDto
  ): Observable<CarritoTemporalResponse> {
    this.iniciarCarga();

    // Asegurar session_id si no hay user_id
    if (!datos.user_id && !datos.session_id) {
      datos.session_id = this.sessionId();
    }

    return this.http.post<CarritoTemporalResponse>(this.baseUrl, datos).pipe(
      tap((response) => {
        this.actualizarCarritoEnLista(response.data);
        this._carritoTemporalActual.set(response.data);
      }),
      catchError((error) =>
        this.manejarError('Error al agregar producto al carrito', error)
      ),
      finalize(() => this.finalizarCarga())
    );
  }

  /**
   * Actualizar carrito temporal
   */
  actualizarCarrito(
    id: number,
    datos: UpdateCarritoTemporalDto
  ): Observable<CarritoTemporalResponse> {
    this.iniciarCarga();

    return this.http
      .put<CarritoTemporalResponse>(`${this.baseUrl}/${id}`, datos)
      .pipe(
        tap((response) => {
          this.actualizarCarritoEnLista(response.data);
          this._carritoTemporalActual.set(response.data);
        }),
        catchError((error) =>
          this.manejarError('Error al actualizar carrito', error)
        ),
        finalize(() => this.finalizarCarga())
      );
  }

  /**
   * Eliminar carrito temporal
   */
  eliminarCarrito(id: number): Observable<{ message: string }> {
    this.iniciarCarga();

    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.eliminarCarritoDeLista(id);
      }),
      catchError((error) =>
        this.manejarError('Error al eliminar carrito', error)
      ),
      finalize(() => this.finalizarCarga())
    );
  }

  /**
   * Limpiar todo el carrito
   */
  limpiarCarrito(
    datos: LimpiarCarritoDto = {}
  ): Observable<LimpiarCarritoResponse> {
    this.iniciarCarga();

    // Usar session_id actual si no se proporciona user_id
    if (!datos.user_id && !datos.session_id) {
      datos.session_id = this.sessionId();
    }

    return this.http
      .delete<LimpiarCarritoResponse>(`${this.baseUrl}/limpiar`, {
        body: datos,
      })
      .pipe(
        tap(() => {
          this._carritosTemporales.set([]);
          this._carritoTemporalActual.set(null);
          this.carritosSubject.next([]);
        }),
        catchError((error) =>
          this.manejarError('Error al limpiar carrito', error)
        ),
        finalize(() => this.finalizarCarga())
      );
  }

  /**
   * Limpiar carritos expirados
   */
  limpiarCarritosExpirados(): Observable<LimpiarCarritoResponse> {
    this.iniciarCarga();

    return this.http
      .delete<LimpiarCarritoResponse>(`${this.baseUrl}/limpiar-expirados`)
      .pipe(
        tap(() => {
          // Actualizar lista local removiendo expirados
          const carritosValidos = this._carritosTemporales().filter(
            (carrito) => !carrito.esta_expirado
          );
          this._carritosTemporales.set(carritosValidos);
          this.carritosSubject.next(carritosValidos);
        }),
        catchError((error) =>
          this.manejarError('Error al limpiar carritos expirados', error)
        ),
        finalize(() => this.finalizarCarga())
      );
  }

  /**
   * Obtener carritos por session ID
   */
  obtenerCarritosPorSession(
    sessionId?: string
  ): Observable<CarritosTemporalResponse> {
    const session = sessionId || this.sessionId();
    return this.obtenerCarritos({ session_id: session });
  }

  /**
   * Obtener carritos por user ID
   */
  obtenerCarritosPorUsuario(
    userId: number
  ): Observable<CarritosTemporalResponse> {
    return this.obtenerCarritos({ user_id: userId });
  }

  /**
   * Verificar si un producto ya está en el carrito
   */
  verificarProductoEnCarrito(
    productoId: number,
    variacionId?: number
  ): CarritoTemporal | null {
    return esItemDuplicado(this._carritosTemporales(), productoId, variacionId);
  }

  /**
   * Calcular estadísticas del carrito
   */
  calcularEstadisticas(): EstadisticasCarrito {
    const carritos = this._carritosTemporales();
    const carritosValidos = this.carritosValidos();
    const carritosExpirados = this.carritosExpirados();

    const estadisticas: EstadisticasCarrito = {
      total_items: carritos.length,
      total_productos: this.totalProductos(),
      subtotal_general: this.subtotalGeneral(),
      total_adicionales: carritos.reduce(
        (total, carrito) => total + carrito.total_adicionales,
        0
      ),
      items_expirados: carritosExpirados.length,
      items_validos: carritosValidos.length,
      productos_mas_agregados: this.obtenerProductosMasAgregados(),
      usuarios_activos: this.contarUsuariosActivos(),
      sesiones_activas: this.contarSesionesActivas(),
    };

    this._estadisticas.set(estadisticas);
    return estadisticas;
  }

  /**
   * Actualizar cantidad de un item
   */
  actualizarCantidad(
    id: number,
    cantidad: number
  ): Observable<CarritoTemporalResponse> {
    return this.actualizarCarrito(id, { cantidad });
  }

  /**
   * Actualizar observaciones de un item
   */
  actualizarObservaciones(
    id: number,
    observaciones: string
  ): Observable<CarritoTemporalResponse> {
    return this.actualizarCarrito(id, { observaciones });
  }

  /**
   * Refrescar carritos
   */
  refrescar(): Observable<CarritosTemporalResponse> {
    return this.obtenerCarritos(this._filtros());
  }

  /**
   * Limpiar estado
   */
  limpiarEstado(): void {
    this._carritosTemporales.set([]);
    this._carritoTemporalActual.set(null);
    this._error.set(null);
    this._estadisticas.set(null);
    this.carritosSubject.next([]);
    this.errorSubject.next(null);
  }

  /**
   * Establecer filtros
   */
  establecerFiltros(filtros: FiltrosCarritoTemporal): void {
    this._filtros.set(filtros);
  }

  /**
   * Obtener o crear session ID
   */
  private obtenerOCrearSessionId(): string {
    let sessionId = localStorage.getItem('carrito_session_id');

    if (!sessionId) {
      sessionId = crearSessionId();
      localStorage.setItem('carrito_session_id', sessionId);
    }

    return sessionId;
  }

  /**
   * Actualizar carrito en la lista local
   */
  private actualizarCarritoEnLista(carrito: CarritoTemporal): void {
    const carritos = this._carritosTemporales();
    const index = carritos.findIndex((c) => c.id === carrito.id);

    if (index >= 0) {
      const nuevosCarritos = [...carritos];
      nuevosCarritos[index] = carrito;
      this._carritosTemporales.set(nuevosCarritos);
      this.carritosSubject.next(nuevosCarritos);
    } else {
      const nuevosCarritos = [carrito, ...carritos];
      this._carritosTemporales.set(nuevosCarritos);
      this.carritosSubject.next(nuevosCarritos);
    }
  }

  /**
   * Eliminar carrito de la lista local
   */
  private eliminarCarritoDeLista(id: number): void {
    const carritos = this._carritosTemporales().filter((c) => c.id !== id);
    this._carritosTemporales.set(carritos);
    this.carritosSubject.next(carritos);

    if (this._carritoTemporalActual()?.id === id) {
      this._carritoTemporalActual.set(null);
    }
  }

  /**
   * Obtener productos más agregados
   */
  private obtenerProductosMasAgregados() {
    const productosMap = new Map<
      number,
      { nombre: string; cantidad_total: number; veces_agregado: number }
    >();

    this._carritosTemporales().forEach((carrito) => {
      if (carrito.producto) {
        const key = carrito.producto.id;
        const existing = productosMap.get(key);

        if (existing) {
          existing.cantidad_total += carrito.cantidad;
          existing.veces_agregado += 1;
        } else {
          productosMap.set(key, {
            nombre: carrito.producto.nombre,
            cantidad_total: carrito.cantidad,
            veces_agregado: 1,
          });
        }
      }
    });

    return Array.from(productosMap.entries())
      .map(([producto_id, data]) => ({
        producto_id,
        ...data,
      }))
      .sort((a, b) => b.veces_agregado - a.veces_agregado)
      .slice(0, 10);
  }

  /**
   * Contar usuarios activos
   */
  private contarUsuariosActivos(): number {
    const usuarios = new Set(
      this._carritosTemporales()
        .filter((carrito) => carrito.user_id)
        .map((carrito) => carrito.user_id)
    );
    return usuarios.size;
  }

  /**
   * Contar sesiones activas
   */
  private contarSesionesActivas(): number {
    const sesiones = new Set(
      this._carritosTemporales()
        .filter((carrito) => carrito.session_id)
        .map((carrito) => carrito.session_id)
    );
    return sesiones.size;
  }

  /**
   * Iniciar estado de carga
   */
  private iniciarCarga(): void {
    this._cargando.set(true);
    this._error.set(null);
    this.cargandoSubject.next(true);
    this.errorSubject.next(null);
  }

  /**
   * Finalizar estado de carga
   */
  private finalizarCarga(): void {
    this._cargando.set(false);
    this.cargandoSubject.next(false);
  }

  /**
   * Manejar errores
   */
  private manejarError(mensaje: string, error: any): Observable<never> {
    console.error(mensaje, error);
    const errorMsg = error?.error?.message || error?.message || mensaje;
    this._error.set(errorMsg);
    this.errorSubject.next(errorMsg);
    return throwError(() => new Error(errorMsg));
  }

  /**
   * Sincronizar signals con BehaviorSubjects para compatibilidad
   */
  private sincronizarSignalsConObservables(): void {
    // Los signals ya están sincronizados en los métodos correspondientes
    // Esta función está disponible para futuras sincronizaciones si es necesario
  }
}
