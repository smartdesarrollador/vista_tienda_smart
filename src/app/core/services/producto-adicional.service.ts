import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ProductoAdicional,
  CreateProductoAdicionalDto,
  UpdateProductoAdicionalDto,
  FiltrosProductoAdicional,
  ProductoAdicionalResponse,
  ProductoAdicionalesResponse,
  EstadisticasProductoAdicional,
  ConfiguracionOrden,
  esProductoAdicionalObligatorio,
  obtenerPrecioEfectivo,
  formatearPrecio,
  obtenerTextoMaximoCantidad,
  validarProductoAdicional,
  calcularTotalAdicionales,
  agruparPorProducto,
  ordenarPorOrden,
  OPCIONES_ORDEN,
  DIRECCIONES_ORDEN,
} from '../models/producto-adicional.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductoAdicionalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vista/producto-adicionales`;

  // Signals para estado reactivo
  private readonly productosAdicionalesSignal = signal<ProductoAdicional[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly filtrosActualesSignal = signal<FiltrosProductoAdicional>({});

  // Subjects para paginación y metadatos
  private readonly metaSubject = new BehaviorSubject<any>(null);
  private readonly filtrosSubject =
    new BehaviorSubject<FiltrosProductoAdicional>({});

  // Computed signals
  readonly productosAdicionales = this.productosAdicionalesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly filtrosActuales = this.filtrosActualesSignal.asReadonly();

  // Computed para estadísticas
  readonly totalProductosAdicionales = computed(
    () => this.productosAdicionales().length
  );
  readonly productosAdicionalesActivos = computed(() =>
    this.productosAdicionales().filter((pa) => pa.activo)
  );
  readonly productosAdicionalesObligatorios = computed(() =>
    this.productosAdicionales().filter((pa) =>
      esProductoAdicionalObligatorio(pa)
    )
  );
  readonly productosAdicionalesAgrupados = computed(() =>
    agruparPorProducto(this.productosAdicionales())
  );
  readonly precioPromedio = computed(() => {
    const productos = this.productosAdicionales();
    if (productos.length === 0) return 0;
    const total = productos.reduce(
      (sum, pa) => sum + obtenerPrecioEfectivo(pa),
      0
    );
    return total / productos.length;
  });

  // Observables para compatibilidad
  readonly meta$ = this.metaSubject.asObservable();
  readonly filtros$ = this.filtrosSubject.asObservable();

  /**
   * Obtiene todos los productos adicionales con filtros opcionales
   */
  obtenerProductosAdicionales(
    filtros: FiltrosProductoAdicional = {}
  ): Observable<ProductoAdicionalesResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.filtrosActualesSignal.set(filtros);
    this.filtrosSubject.next(filtros);

    let params = new HttpParams();

    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<ProductoAdicionalesResponse>(this.baseUrl, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this.productosAdicionalesSignal.set(response.data);
            this.metaSubject.next(response.meta);
          }
        }),
        catchError((error) => {
          this.errorSignal.set(this.manejarError(error));
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  /**
   * Obtiene un producto adicional por ID
   */
  obtenerProductoAdicional(id: number): Observable<ProductoAdicionalResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .get<ProductoAdicionalResponse>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError((error) => {
          this.errorSignal.set(this.manejarError(error));
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  /**
   * Crea un nuevo producto adicional
   */
  crearProductoAdicional(
    productoAdicional: CreateProductoAdicionalDto
  ): Observable<ProductoAdicionalResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // Validar datos antes de enviar
    const errores = validarProductoAdicional(productoAdicional);
    if (errores.length > 0) {
      this.errorSignal.set(errores.join(', '));
      this.loadingSignal.set(false);
      return throwError(() => new Error(errores.join(', ')));
    }

    return this.http
      .post<ProductoAdicionalResponse>(this.baseUrl, productoAdicional)
      .pipe(
        tap((response) => {
          if (response.success) {
            const productosActuales = this.productosAdicionalesSignal();
            this.productosAdicionalesSignal.set([
              ...productosActuales,
              response.data,
            ]);
          }
        }),
        catchError((error) => {
          this.errorSignal.set(this.manejarError(error));
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  /**
   * Actualiza un producto adicional existente
   */
  actualizarProductoAdicional(
    id: number,
    productoAdicional: UpdateProductoAdicionalDto
  ): Observable<ProductoAdicionalResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // Validar datos antes de enviar
    const errores = validarProductoAdicional(productoAdicional);
    if (errores.length > 0) {
      this.errorSignal.set(errores.join(', '));
      this.loadingSignal.set(false);
      return throwError(() => new Error(errores.join(', ')));
    }

    return this.http
      .put<ProductoAdicionalResponse>(
        `${this.baseUrl}/${id}`,
        productoAdicional
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this.actualizarProductoAdicionalEnLista(response.data);
          }
        }),
        catchError((error) => {
          this.errorSignal.set(this.manejarError(error));
          return throwError(() => error);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  /**
   * Elimina un producto adicional
   */
  eliminarProductoAdicional(id: number): Observable<any> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.removerProductoAdicionalDeLista(id);
      }),
      catchError((error) => {
        this.errorSignal.set(this.manejarError(error));
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /**
   * Métodos de filtrado específicos
   */
  obtenerPorProducto(
    productoId: number
  ): Observable<ProductoAdicionalesResponse> {
    return this.obtenerProductosAdicionales({ producto_id: productoId });
  }

  obtenerPorAdicional(
    adicionalId: number
  ): Observable<ProductoAdicionalesResponse> {
    return this.obtenerProductosAdicionales({ adicional_id: adicionalId });
  }

  obtenerObligatorios(): Observable<ProductoAdicionalesResponse> {
    return this.obtenerProductosAdicionales({ obligatorio: true });
  }

  obtenerActivos(): Observable<ProductoAdicionalesResponse> {
    return this.obtenerProductosAdicionales({ activo: true });
  }

  obtenerPorRangoPrecio(
    precioMin: number,
    precioMax: number
  ): Observable<ProductoAdicionalesResponse> {
    return this.obtenerProductosAdicionales({
      precio_min: precioMin,
      precio_max: precioMax,
    });
  }

  /**
   * Búsqueda de productos adicionales
   */
  buscarProductosAdicionales(
    termino: string
  ): Observable<ProductoAdicionalesResponse> {
    return this.obtenerProductosAdicionales({ search: termino });
  }

  /**
   * Métodos de utilidad
   */
  calcularTotalProductosAdicionales(
    productosAdicionales: ProductoAdicional[],
    cantidades: { [key: number]: number }
  ): number {
    return calcularTotalAdicionales(productosAdicionales, cantidades);
  }

  formatearPrecioProductoAdicional(precio: number): string {
    return formatearPrecio(precio);
  }

  obtenerTextoMaximoCantidadProductoAdicional(maximo: number | null): string {
    return obtenerTextoMaximoCantidad(maximo);
  }

  validarProductoAdicionalData(
    data: CreateProductoAdicionalDto | UpdateProductoAdicionalDto
  ): string[] {
    return validarProductoAdicional(data);
  }

  /**
   * Gestión de orden
   */
  actualizarOrdenProductosAdicionales(
    configuracion: ConfiguracionOrden
  ): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/actualizar-orden`, configuracion)
      .pipe(
        tap(() => {
          // Refrescar la lista después de actualizar el orden
          this.refrescar();
        }),
        catchError((error) => {
          this.errorSignal.set(this.manejarError(error));
          return throwError(() => error);
        })
      );
  }

  ordenarProductosAdicionales(
    productosAdicionales: ProductoAdicional[]
  ): ProductoAdicional[] {
    return ordenarPorOrden(productosAdicionales);
  }

  /**
   * Estadísticas
   */
  obtenerEstadisticas(): Observable<EstadisticasProductoAdicional> {
    return this.http
      .get<EstadisticasProductoAdicional>(`${this.baseUrl}/estadisticas`)
      .pipe(
        catchError((error) => {
          this.errorSignal.set(this.manejarError(error));
          return throwError(() => error);
        })
      );
  }

  /**
   * Exportación de datos
   */
  exportarProductosAdicionales(
    formato: 'csv' | 'excel' = 'csv'
  ): Observable<Blob> {
    const params = new HttpParams().set('formato', formato);

    return this.http
      .get(`${this.baseUrl}/exportar`, {
        params,
        responseType: 'blob',
      })
      .pipe(
        catchError((error) => {
          this.errorSignal.set(this.manejarError(error));
          return throwError(() => error);
        })
      );
  }

  /**
   * Operaciones masivas
   */
  activarMultiples(ids: number[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/activar-multiples`, { ids }).pipe(
      tap(() => {
        this.refrescar();
      }),
      catchError((error) => {
        this.errorSignal.set(this.manejarError(error));
        return throwError(() => error);
      })
    );
  }

  desactivarMultiples(ids: number[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/desactivar-multiples`, { ids }).pipe(
      tap(() => {
        this.refrescar();
      }),
      catchError((error) => {
        this.errorSignal.set(this.manejarError(error));
        return throwError(() => error);
      })
    );
  }

  eliminarMultiples(ids: number[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/eliminar-multiples`, { ids }).pipe(
      tap(() => {
        this.refrescar();
      }),
      catchError((error) => {
        this.errorSignal.set(this.manejarError(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * Configuración
   */
  obtenerOpcionesOrden() {
    return [...OPCIONES_ORDEN];
  }

  obtenerDireccionesOrden() {
    return [...DIRECCIONES_ORDEN];
  }

  /**
   * Limpia el estado del servicio
   */
  limpiarEstado(): void {
    this.productosAdicionalesSignal.set([]);
    this.errorSignal.set(null);
    this.filtrosActualesSignal.set({});
    this.metaSubject.next(null);
    this.filtrosSubject.next({});
  }

  /**
   * Refresca los datos
   */
  refrescar(): Observable<ProductoAdicionalesResponse> {
    const filtrosActuales = this.filtrosActuales();
    return this.obtenerProductosAdicionales(filtrosActuales);
  }

  // Métodos privados
  private actualizarProductoAdicionalEnLista(
    productoAdicionalActualizado: ProductoAdicional
  ): void {
    const productosAdicionales = this.productosAdicionalesSignal();
    const index = productosAdicionales.findIndex(
      (pa) => pa.id === productoAdicionalActualizado.id
    );

    if (index !== -1) {
      const nuevosProductosAdicionales = [...productosAdicionales];
      nuevosProductosAdicionales[index] = productoAdicionalActualizado;
      this.productosAdicionalesSignal.set(nuevosProductosAdicionales);
    }
  }

  private removerProductoAdicionalDeLista(id: number): void {
    const productosAdicionales = this.productosAdicionalesSignal();
    const nuevosProductosAdicionales = productosAdicionales.filter(
      (pa) => pa.id !== id
    );
    this.productosAdicionalesSignal.set(nuevosProductosAdicionales);
  }

  private manejarError(error: any): string {
    console.error('Error en ProductoAdicionalService:', error);

    if (error.error?.message) {
      return error.error.message;
    }

    if (error.message) {
      return error.message;
    }

    switch (error.status) {
      case 400:
        return 'Datos inválidos. Por favor, revise la información ingresada.';
      case 401:
        return 'No tiene permisos para realizar esta acción.';
      case 403:
        return 'Acceso denegado.';
      case 404:
        return 'Producto adicional no encontrado.';
      case 422:
        return 'Error de validación. Revise los datos ingresados.';
      case 500:
        return 'Error interno del servidor. Intente nuevamente más tarde.';
      default:
        return 'Ha ocurrido un error inesperado.';
    }
  }
}
