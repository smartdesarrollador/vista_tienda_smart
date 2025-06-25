import { Injectable, inject, signal, computed } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  VariacionProductoInterface,
  VariacionProductoResponse,
  VariacionesProductoResponse,
  VariacionesByProductoResponse,
  CreateVariacionProductoRequest,
  UpdateVariacionProductoRequest,
  VariacionProductoFilters,
  VariacionProductoState,
  VariacionProductoApiError,
  VariacionProductoPagination,
  UpdateStockRequest,
  UpdateStockResponse,
  EstadoStock,
  OperacionStock,
  SortField,
  SortOrder,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class VariacionProductoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vista/variaciones-producto`;

  // Signals para el estado reactivo
  private readonly _state = signal<VariacionProductoState>({
    variaciones: [],
    currentVariacion: null,
    loading: false,
    error: null,
    filters: {},
    pagination: null,
  });

  // Signals públicos computados
  readonly variaciones = computed(() => this._state().variaciones);
  readonly currentVariacion = computed(() => this._state().currentVariacion);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly filters = computed(() => this._state().filters);
  readonly pagination = computed(() => this._state().pagination);

  // Computed signals adicionales
  readonly hasVariaciones = computed(() => this.variaciones().length > 0);
  readonly totalVariaciones = computed(() => this.pagination()?.total ?? 0);
  readonly currentPage = computed(() => this.pagination()?.current_page ?? 1);
  readonly lastPage = computed(() => this.pagination()?.last_page ?? 1);
  readonly hasNextPage = computed(() => this.currentPage() < this.lastPage());
  readonly hasPrevPage = computed(() => this.currentPage() > 1);

  // Computed signals para estadísticas
  readonly variacionesActivas = computed(
    () => this.variaciones().filter((v) => v.activo).length
  );
  readonly variacionesConStock = computed(
    () => this.variaciones().filter((v) => v.stock > 0).length
  );
  readonly variacionesSinStock = computed(
    () => this.variaciones().filter((v) => v.stock === 0).length
  );
  readonly stockTotal = computed(() =>
    this.variaciones().reduce((total, v) => total + v.stock, 0)
  );

  // Subject para refrescar datos
  private readonly refreshSubject = new BehaviorSubject<void>(undefined);

  /**
   * Obtener variaciones con filtros y paginación
   */
  getVariaciones(
    filters: VariacionProductoFilters = {}
  ): Observable<VariacionesProductoResponse> {
    this.setLoading(true);
    this.setError(null);

    let params = new HttpParams();

    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<VariacionesProductoResponse>(this.baseUrl, { params })
      .pipe(
        tap((response) => {
          this.updateState({
            variaciones: response.data,
            pagination: response.pagination,
            filters,
          });
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Obtener una variación por ID
   */
  getVariacion(id: number): Observable<VariacionProductoResponse> {
    this.setLoading(true);
    this.setError(null);

    return this.http
      .get<VariacionProductoResponse>(`${this.baseUrl}/${id}`)
      .pipe(
        tap((response) => {
          this.updateState({
            currentVariacion: response.data,
          });
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Obtener variaciones por producto
   */
  getVariacionesByProducto(
    productoId: number
  ): Observable<VariacionesByProductoResponse> {
    this.setLoading(true);
    this.setError(null);

    return this.http
      .get<VariacionesByProductoResponse>(
        `${this.baseUrl}/producto/${productoId}`
      )
      .pipe(
        tap((response) => {
          this.updateState({
            variaciones: response.data,
          });
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Crear nueva variación
   */
  createVariacion(
    data: CreateVariacionProductoRequest
  ): Observable<VariacionProductoResponse> {
    this.setLoading(true);
    this.setError(null);

    return this.http.post<VariacionProductoResponse>(this.baseUrl, data).pipe(
      tap((response) => {
        this.updateState({
          currentVariacion: response.data,
        });
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Actualizar variación existente
   */
  updateVariacion(
    id: number,
    data: UpdateVariacionProductoRequest
  ): Observable<VariacionProductoResponse> {
    this.setLoading(true);
    this.setError(null);

    return this.http
      .put<VariacionProductoResponse>(`${this.baseUrl}/${id}`, data)
      .pipe(
        tap((response) => {
          this.updateState({
            currentVariacion: response.data,
          });
          // Actualizar la variación en la lista si existe
          this.updateVariacionInList(response.data);
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Eliminar variación
   */
  deleteVariacion(
    id: number
  ): Observable<{ success: boolean; message: string }> {
    this.setLoading(true);
    this.setError(null);

    return this.http
      .delete<{ success: boolean; message: string }>(`${this.baseUrl}/${id}`)
      .pipe(
        tap(() => {
          this.updateState({
            currentVariacion: null,
          });
          // Remover la variación de la lista
          this.removeVariacionFromList(id);
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Alternar estado activo
   */
  toggleActivo(id: number): Observable<VariacionProductoResponse> {
    this.setLoading(true);
    this.setError(null);

    return this.http
      .post<VariacionProductoResponse>(
        `${this.baseUrl}/${id}/toggle-activo`,
        {}
      )
      .pipe(
        tap((response) => {
          this.updateVariacionInList(response.data);
          if (this.currentVariacion()?.id === id) {
            this.updateState({
              currentVariacion: response.data,
            });
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Actualizar stock
   */
  updateStock(
    id: number,
    stockData: UpdateStockRequest
  ): Observable<UpdateStockResponse> {
    this.setLoading(true);
    this.setError(null);

    return this.http
      .post<UpdateStockResponse>(
        `${this.baseUrl}/${id}/update-stock`,
        stockData
      )
      .pipe(
        tap((response) => {
          this.updateVariacionInList(response.data);
          if (this.currentVariacion()?.id === id) {
            this.updateState({
              currentVariacion: response.data,
            });
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Cargar variaciones con filtros
   */
  loadVariaciones(filters?: VariacionProductoFilters): void {
    const currentFilters = filters || this.filters();
    this.getVariaciones(currentFilters).subscribe();
  }

  /**
   * Refrescar datos
   */
  refresh(): void {
    this.refreshSubject.next();
    this.loadVariaciones();
  }

  /**
   * Refrescar variaciones
   */
  refreshVariaciones(): void {
    this.loadVariaciones(this.filters());
  }

  /**
   * Limpiar estado
   */
  clearState(): void {
    this.updateState({
      variaciones: [],
      currentVariacion: null,
      loading: false,
      error: null,
      filters: {},
      pagination: null,
    });
  }

  /**
   * Establecer filtros
   */
  setFilters(filters: VariacionProductoFilters): void {
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
    this.loadVariaciones(currentFilters);
  }

  /**
   * Ir a página siguiente
   */
  nextPage(): void {
    if (this.hasNextPage()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  /**
   * Ir a página anterior
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
    this.loadVariaciones(currentFilters);
  }

  /**
   * Filtrar por producto
   */
  filterByProducto(productoId: number): void {
    const filters = { ...this.filters(), producto_id: productoId, page: 1 };
    this.loadVariaciones(filters);
  }

  /**
   * Filtrar por estado activo
   */
  filterByActivo(activo: boolean | null): void {
    const filters = { ...this.filters(), activo: activo ?? undefined, page: 1 };
    this.loadVariaciones(filters);
  }

  /**
   * Filtrar por stock
   */
  filterByStock(conStock: boolean | null): void {
    const filters = {
      ...this.filters(),
      con_stock: conStock ?? undefined,
      page: 1,
    };
    this.loadVariaciones(filters);
  }

  /**
   * Filtrar por rango de precios
   */
  filterByPriceRange(precioMin?: number, precioMax?: number): void {
    const filters = {
      ...this.filters(),
      precio_min: precioMin,
      precio_max: precioMax,
      page: 1,
    };
    this.loadVariaciones(filters);
  }

  /**
   * Buscar por SKU
   */
  searchBySku(search: string): void {
    const filters = { ...this.filters(), search, page: 1 };
    this.loadVariaciones(filters);
  }

  /**
   * Ordenar variaciones
   */
  sortVariaciones(sortBy: SortField, sortOrder: SortOrder): void {
    const filters = {
      ...this.filters(),
      sort_by: sortBy,
      sort_order: sortOrder,
      page: 1,
    };
    this.loadVariaciones(filters);
  }

  /**
   * Obtener variaciones por estado de stock
   */
  getVariacionesByEstadoStock(
    estado: EstadoStock
  ): VariacionProductoInterface[] {
    return this.variaciones().filter((v) => v.estado_stock === estado);
  }

  /**
   * Obtener variaciones con descuento
   */
  getVariacionesConDescuento(): VariacionProductoInterface[] {
    return this.variaciones().filter(
      (v) => v.precio_oferta && v.precio_oferta < v.precio
    );
  }

  /**
   * Actualizar estado parcial
   */
  private updateState(partialState: Partial<VariacionProductoState>): void {
    this._state.update((state) => ({ ...state, ...partialState }));
  }

  /**
   * Establecer estado de carga
   */
  private setLoading(loading: boolean): void {
    this.updateState({ loading });
  }

  /**
   * Establecer error
   */
  private setError(error: string | null): void {
    this.updateState({ error });
  }

  /**
   * Actualizar variación en la lista
   */
  private updateVariacionInList(
    updatedVariacion: VariacionProductoInterface
  ): void {
    const currentVariaciones = this.variaciones();
    const index = currentVariaciones.findIndex(
      (v) => v.id === updatedVariacion.id
    );

    if (index !== -1) {
      const newVariaciones = [...currentVariaciones];
      newVariaciones[index] = updatedVariacion;
      this.updateState({ variaciones: newVariaciones });
    }
  }

  /**
   * Remover variación de la lista
   */
  private removeVariacionFromList(id: number): void {
    const currentVariaciones = this.variaciones();
    const newVariaciones = currentVariaciones.filter((v) => v.id !== id);
    this.updateState({ variaciones: newVariaciones });
  }

  /**
   * Manejar errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      const apiError = error.error as VariacionProductoApiError;
      if (apiError?.message) {
        errorMessage = apiError.message;
      } else {
        errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }

    this.setError(errorMessage);
    console.error('VariacionProductoService Error:', error);

    return throwError(() => new Error(errorMessage));
  }
}
