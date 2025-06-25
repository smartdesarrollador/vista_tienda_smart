import { Injectable, inject, signal, computed } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Producto,
  ProductoResponse,
  ProductosResponse,
  CreateProductoRequest,
  UpdateProductoRequest,
  ProductoFilters,
  ProductoStatistics,
  ProductoStatisticsResponse,
  ProductoSearchParams,
  ProductoState,
  ProductoApiError,
  ProductoPaginationMeta,
} from '../models/producto.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = environment.apiUrl;
  readonly baseUrlImagenes = environment.urlDominioApi + '/';

  // Signals para el estado reactivo
  private readonly _state = signal<ProductoState>({
    productos: [],
    currentProducto: null,
    loading: false,
    error: null,
    filters: {},
    pagination: null,
    statistics: null,
  });

  // Signals públicos computados
  readonly productos = computed(() => this._state().productos);
  readonly currentProducto = computed(() => this._state().currentProducto);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly filters = computed(() => this._state().filters);
  readonly pagination = computed(() => this._state().pagination);
  readonly statistics = computed(() => this._state().statistics);

  // Computed signals adicionales
  readonly hasProductos = computed(() => this.productos().length > 0);
  readonly totalProductos = computed(() => this.pagination()?.total ?? 0);
  readonly currentPage = computed(() => this.pagination()?.current_page ?? 1);
  readonly lastPage = computed(() => this.pagination()?.last_page ?? 1);
  readonly hasNextPage = computed(() => this.currentPage() < this.lastPage());
  readonly hasPrevPage = computed(() => this.currentPage() > 1);

  // Subject para refrescar datos
  private readonly refreshSubject = new BehaviorSubject<void>(undefined);

  constructor() {
    // Remover la auto-suscripción que causaba el ciclo infinito
    // La carga de productos ahora debe ser explícita
  }

  /**
   * Obtener productos con filtros y paginación
   */
  getProductos(filters: ProductoFilters = {}): Observable<ProductosResponse> {
    this.setLoading(true);
    this.setError(null);

    let params = new HttpParams();

    // Para el catálogo público, solicitar todos los productos
    if (!filters.per_page) {
      params = params.set('per_page', '100'); // Usar un número alto para obtener todos los productos
    }

    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    const url = `${this.baseUrl}/productos`;
    console.log('ProductoService: Haciendo petición a:', url);
    console.log('ProductoService: Base URL:', this.baseUrl);
    console.log('ProductoService: Environment API URL:', environment.apiUrl);
    console.log('ProductoService: Parámetros:', params.toString());

    return this.http.get<ProductosResponse>(url, { params }).pipe(
      tap((response) => {
        console.log('ProductoService: Respuesta recibida:', response);
        console.log(
          'ProductoService: Total de productos:',
          response.data.length
        );
        this.updateState({
          productos: response.data,
          pagination: response.meta,
          filters,
        });
      }),
      catchError((error) => {
        console.error('ProductoService: Error en petición:', error);
        return this.handleError(error);
      }),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Obtener un producto por ID
   */
  getProducto(id: number): Observable<ProductoResponse> {
    this.setLoading(true);
    this.setError(null);

    return this.http
      .get<ProductoResponse>(`${this.baseUrl}/productos/${id}`)
      .pipe(
        tap((response) => {
          this.updateState({
            currentProducto: response.data,
          });
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Crear nuevo producto
   */
  createProducto(data: CreateProductoRequest): Observable<ProductoResponse> {
    this.setLoading(true);
    this.setError(null);

    const formData = this.buildFormData(data);

    return this.http
      .post<ProductoResponse>(`${this.baseUrl}/vista/productos`, formData)
      .pipe(
        tap((response) => {
          this.updateState({
            currentProducto: response.data,
          });
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Actualizar producto existente
   */
  updateProducto(
    id: number,
    data: UpdateProductoRequest
  ): Observable<ProductoResponse> {
    this.setLoading(true);
    this.setError(null);

    const formData = this.buildFormData(data);

    return this.http
      .post<ProductoResponse>(`${this.baseUrl}/vista/productos/${id}`, formData)
      .pipe(
        tap((response) => {
          this.updateState({
            currentProducto: response.data,
          });
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Eliminar producto
   */
  deleteProducto(id: number): Observable<void> {
    this.setLoading(true);
    this.setError(null);

    return this.http.delete<void>(`${this.baseUrl}/vista/productos/${id}`).pipe(
      tap(() => {
        this.updateState({
          currentProducto: null,
        });
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Obtener productos por categoría
   */
  getProductosByCategoria(categoriaId: number): Observable<Producto[]> {
    this.setLoading(true);
    this.setError(null);

    return this.http
      .get<{ data: Producto[] }>(
        `${this.baseUrl}/productos/categoria/${categoriaId}`
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Obtener productos destacados
   */
  getProductosDestacados(limit: number = 10): Observable<Producto[]> {
    this.setLoading(true);
    this.setError(null);

    const params = new HttpParams().set('limit', limit.toString());

    return this.http
      .get<{ data: Producto[] }>(`${this.baseUrl}/productos/destacados`, {
        params,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Buscar productos
   */
  searchProductos(searchParams: ProductoSearchParams): Observable<Producto[]> {
    this.setLoading(true);
    this.setError(null);

    let params = new HttpParams().set('q', searchParams.q);
    if (searchParams.limit) {
      params = params.set('limit', searchParams.limit.toString());
    }

    return this.http
      .get<{ data: Producto[] }>(`${this.baseUrl}/productos/search`, { params })
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Alternar estado destacado
   */
  toggleDestacado(id: number): Observable<ProductoResponse> {
    this.setLoading(true);
    this.setError(null);

    return this.http
      .post<ProductoResponse>(
        `${this.baseUrl}/vista/productos/${id}/toggle-destacado`,
        {}
      )
      .pipe(
        tap((response) => {
          this.updateState({
            currentProducto: response.data,
          });
          // Remover auto-refresh para evitar ciclos
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Alternar estado activo
   */
  toggleActivo(id: number): Observable<ProductoResponse> {
    this.setLoading(true);
    this.setError(null);

    return this.http
      .post<ProductoResponse>(
        `${this.baseUrl}/vista/productos/${id}/toggle-activo`,
        {}
      )
      .pipe(
        tap((response) => {
          this.updateState({
            currentProducto: response.data,
          });
          // Remover auto-refresh para evitar ciclos
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Eliminar imagen principal
   */
  removeImagenPrincipal(id: number): Observable<ProductoResponse> {
    this.setLoading(true);
    this.setError(null);

    return this.http
      .delete<ProductoResponse>(
        `${this.baseUrl}/vista/productos/${id}/imagen-principal`
      )
      .pipe(
        tap((response) => {
          this.updateState({
            currentProducto: response.data,
          });
          // Remover auto-refresh para evitar ciclos
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Obtener estadísticas de productos
   */
  getStatistics(): Observable<ProductoStatistics> {
    this.setLoading(true);
    this.setError(null);

    const url = `${this.baseUrl}/vista/productos/statistics`;
    console.log('ProductoService: Obteniendo estadísticas desde:', url);

    return this.http.get<ProductoStatisticsResponse>(url).pipe(
      map((response) => response.data),
      tap((statistics) => {
        console.log('ProductoService: Estadísticas recibidas:', statistics);
        this.updateState({ statistics });
      }),
      catchError((error) => {
        console.error('ProductoService: Error al obtener estadísticas:', error);
        return this.handleError(error);
      }),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Cargar productos con filtros actuales
   */
  loadProductos(filters?: ProductoFilters): void {
    const currentFilters = filters || this.filters();
    this.getProductos(currentFilters).subscribe({
      next: () => {
        // Productos cargados exitosamente
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      },
    });
  }

  /**
   * Refrescar datos - ahora es un método manual
   */
  refresh(): void {
    // Simplemente emitir el subject, pero sin auto-suscripción
    this.refreshSubject.next();
  }

  /**
   * Refrescar productos manualmente
   */
  refreshProductos(): void {
    this.loadProductos();
  }

  /**
   * Limpiar estado
   */
  clearState(): void {
    this._state.set({
      productos: [],
      currentProducto: null,
      loading: false,
      error: null,
      filters: {},
      pagination: null,
      statistics: null,
    });
  }

  /**
   * Establecer filtros
   */
  setFilters(filters: ProductoFilters): void {
    this.updateState({ filters });
  }

  /**
   * Limpiar filtros
   */
  clearFilters(): void {
    this.updateState({ filters: {} });
  }

  /**
   * Ir a página específica
   */
  goToPage(page: number): void {
    const currentFilters = { ...this.filters(), page };
    this.loadProductos(currentFilters);
  }

  /**
   * Página siguiente
   */
  nextPage(): void {
    if (this.hasNextPage()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  /**
   * Página anterior
   */
  prevPage(): void {
    if (this.hasPrevPage()) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  /**
   * Cambiar tamaño de página
   */
  changePageSize(perPage: number): void {
    const currentFilters = { ...this.filters(), per_page: perPage, page: 1 };
    this.loadProductos(currentFilters);
  }

  // Métodos privados

  private updateState(partialState: Partial<ProductoState>): void {
    this._state.update((state) => ({ ...state, ...partialState }));
  }

  private setLoading(loading: boolean): void {
    this.updateState({ loading });
  }

  private setError(error: string | null): void {
    this.updateState({ error });
  }

  private buildFormData(
    data: CreateProductoRequest | UpdateProductoRequest
  ): FormData {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'imagen_principal' && value instanceof File) {
          formData.append(key, value);
        } else if (key === 'atributos_extra' && typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Agregar _method para Laravel
    if ('id' in data) {
      formData.append('_method', 'PUT');
    }

    return formData;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      const apiError = error.error as ProductoApiError;
      if (apiError?.message) {
        errorMessage = apiError.message;
      } else if (error.status === 0) {
        errorMessage = 'No se puede conectar con el servidor';
      } else {
        errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }

    this.setError(errorMessage);
    console.error('ProductoService Error:', error);

    return throwError(() => new Error(errorMessage));
  }
}
