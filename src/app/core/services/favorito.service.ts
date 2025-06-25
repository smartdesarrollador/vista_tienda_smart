import { Injectable, inject, signal, computed } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError, finalize } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  Favorito,
  CreateFavoritoDto,
  UpdateFavoritoDto,
  FavoritoFilters,
  FavoritoResponse,
  FavoritoSingleResponse,
  FavoritosByUsuarioResponse,
  EstadisticasFavoritos,
  FavoritoOperationResponse,
  ToggleFavoritoResponse,
  VerificarFavoritoRequest,
  VerificarFavoritoResponse,
  LimpiarFavoritosRequest,
  LimpiarFavoritosResponse,
  FavoritoValidation,
  ResumenFavoritos,
  FiltrosRapidosFavoritos,
  AccionMasivaFavoritos,
  AccionMasivaFavoritosResponse,
  TipoOrdenamientoFavorito,
  DireccionOrdenamientoFavorito,
  FAVORITO_CONSTANTS,
  FavoritoUtils,
} from '../models/favorito.interface';

/**
 * Servicio para gestión de favoritos de usuarios
 * Implementa todas las operaciones CRUD y funcionalidades especiales
 */
@Injectable({
  providedIn: 'root',
})
export class FavoritoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/favoritos`;

  // Signals para estado reactivo
  private readonly _favoritos = signal<Favorito[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _totalItems = signal<number>(0);
  private readonly _resumen = signal<ResumenFavoritos | null>(null);

  // Computed signals para datos derivados
  readonly favoritos = this._favoritos.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalItems = this._totalItems.asReadonly();
  readonly resumen = this._resumen.asReadonly();
  readonly isEmpty = computed(() => this._favoritos().length === 0);
  readonly hasError = computed(() => this._error() !== null);
  readonly favoritosRecientes = computed(() =>
    this._favoritos().filter((f) => {
      const fecha = new Date(f.created_at);
      const ahora = new Date();
      const diferenciaDias = Math.floor(
        (ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diferenciaDias <= FAVORITO_CONSTANTS.DIAS_RECIENTES_DEFAULT;
    })
  );
  readonly favoritosConOfertas = computed(() =>
    this._favoritos().filter((f) => f.producto?.tiene_oferta)
  );
  readonly favoritosDisponibles = computed(() =>
    this._favoritos().filter((f) => FavoritoUtils.estaDisponible(f.producto!))
  );

  // BehaviorSubject para filtros actuales
  private readonly _currentFilters = new BehaviorSubject<FavoritoFilters>({});
  readonly currentFilters$ = this._currentFilters.asObservable();

  // Filtros rápidos predefinidos
  readonly filtrosRapidos: FiltrosRapidosFavoritos = {
    todos: {},
    recientes: {
      recientes: FAVORITO_CONSTANTS.DIAS_RECIENTES_DEFAULT,
      sort_by: 'created_at',
      sort_direction: 'desc',
    },
    con_ofertas: { con_ofertas: true },
    disponibles: { productos_disponibles: true },
    por_precio_alto: {
      sort_by: 'producto_precio',
      sort_direction: 'desc',
    },
    por_precio_bajo: {
      sort_by: 'producto_precio',
      sort_direction: 'asc',
    },
    esta_semana: {
      recientes: 7,
      sort_by: 'created_at',
      sort_direction: 'desc',
    },
    este_mes: {
      recientes: 30,
      sort_by: 'created_at',
      sort_direction: 'desc',
    },
  };

  /**
   * Obtiene todos los favoritos con filtros y paginación
   */
  getFavoritos(filters: FavoritoFilters = {}): Observable<FavoritoResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();

    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<FavoritoResponse>(this.apiUrl, { params }).pipe(
      tap((response) => {
        if (response.success) {
          this._favoritos.set(response.data);
          this._totalItems.set(response.meta.total);
          this._currentFilters.next(filters);
          this.updateResumen(response.data);
        }
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Obtiene un favorito específico por ID
   */
  getFavorito(id: number): Observable<FavoritoSingleResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<FavoritoSingleResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Crea un nuevo favorito
   */
  createFavorito(
    favoritoData: CreateFavoritoDto
  ): Observable<FavoritoOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<FavoritoOperationResponse>(this.apiUrl, favoritoData)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Agregar el nuevo favorito al estado local
            const currentFavoritos = this._favoritos();
            this._favoritos.set([response.data, ...currentFavoritos]);
            this._totalItems.update((total) => total + 1);
            this.updateResumen([response.data, ...currentFavoritos]);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Actualiza un favorito existente
   */
  updateFavorito(
    id: number,
    favoritoData: UpdateFavoritoDto
  ): Observable<FavoritoOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<FavoritoOperationResponse>(`${this.apiUrl}/${id}`, favoritoData)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Actualizar el favorito en el estado local
            const currentFavoritos = this._favoritos();
            const updatedFavoritos = currentFavoritos.map((favorito) =>
              favorito.id === id ? response.data! : favorito
            );
            this._favoritos.set(updatedFavoritos);
            this.updateResumen(updatedFavoritos);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Elimina un favorito
   */
  deleteFavorito(id: number): Observable<FavoritoOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .delete<FavoritoOperationResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        tap((response) => {
          if (response.success) {
            // Remover el favorito del estado local
            const currentFavoritos = this._favoritos();
            const filteredFavoritos = currentFavoritos.filter(
              (favorito) => favorito.id !== id
            );
            this._favoritos.set(filteredFavoritos);
            this._totalItems.update((total) => total - 1);
            this.updateResumen(filteredFavoritos);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene favoritos por usuario específico
   */
  getFavoritosByUsuario(
    usuarioId: number,
    filters: Partial<FavoritoFilters> = {}
  ): Observable<FavoritosByUsuarioResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<FavoritosByUsuarioResponse>(`${this.apiUrl}/usuario/${usuarioId}`, {
        params,
      })
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Alterna el estado de favorito (agregar/eliminar)
   */
  toggleFavorito(
    userId: number,
    productoId: number
  ): Observable<ToggleFavoritoResponse> {
    this._loading.set(true);
    this._error.set(null);

    const toggleData = {
      user_id: userId,
      producto_id: productoId,
    };

    return this.http
      .post<ToggleFavoritoResponse>(`${this.apiUrl}/toggle`, toggleData)
      .pipe(
        tap((response) => {
          if (response.success) {
            const currentFavoritos = this._favoritos();

            if (response.accion === 'agregado' && response.data) {
              // Agregar nuevo favorito
              this._favoritos.set([response.data, ...currentFavoritos]);
              this._totalItems.update((total) => total + 1);
              this.updateResumen([response.data, ...currentFavoritos]);
            } else if (response.accion === 'eliminado') {
              // Eliminar favorito existente
              const filteredFavoritos = currentFavoritos.filter(
                (f) => !(f.user_id === userId && f.producto_id === productoId)
              );
              this._favoritos.set(filteredFavoritos);
              this._totalItems.update((total) => total - 1);
              this.updateResumen(filteredFavoritos);
            }
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Verifica si un producto es favorito de un usuario
   */
  verificarFavorito(
    request: VerificarFavoritoRequest
  ): Observable<VerificarFavoritoResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<VerificarFavoritoResponse>(`${this.apiUrl}/verificar`, request)
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Limpia favoritos según criterios específicos
   */
  limpiarFavoritos(
    request: LimpiarFavoritosRequest
  ): Observable<LimpiarFavoritosResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .delete<LimpiarFavoritosResponse>(`${this.apiUrl}/limpiar`, {
        body: request,
      })
      .pipe(
        tap((response) => {
          if (response.success) {
            // Recargar la lista después de la limpieza
            this.refresh();
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene estadísticas completas del sistema de favoritos
   */
  getEstadisticas(
    fechaDesde?: string,
    fechaHasta?: string,
    userId?: number
  ): Observable<EstadisticasFavoritos> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (fechaDesde) params = params.set('fecha_desde', fechaDesde);
    if (fechaHasta) params = params.set('fecha_hasta', fechaHasta);
    if (userId) params = params.set('user_id', userId.toString());

    return this.http
      .get<EstadisticasFavoritos>(`${this.apiUrl}/statistics`, { params })
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Valida los datos de un favorito
   */
  validateFavorito(
    favoritoData: Partial<CreateFavoritoDto>
  ): FavoritoValidation {
    const errors: string[] = [];
    const validation: FavoritoValidation = {
      user_id: false,
      producto_id: false,
      isValid: false,
      errors,
    };

    // Validar user_id
    if (!favoritoData.user_id || favoritoData.user_id <= 0) {
      errors.push('Debe especificar un usuario válido');
    } else {
      validation.user_id = true;
    }

    // Validar producto_id
    if (!favoritoData.producto_id || favoritoData.producto_id <= 0) {
      errors.push('Debe especificar un producto válido');
    } else {
      validation.producto_id = true;
    }

    validation.isValid = validation.user_id && validation.producto_id;

    return validation;
  }

  /**
   * Busca favoritos por texto
   */
  searchFavoritos(
    searchTerm: string,
    filters: Partial<FavoritoFilters> = {}
  ): Observable<FavoritoResponse> {
    const searchFilters: FavoritoFilters = {
      ...filters,
      search: searchTerm,
      per_page: filters.per_page || FAVORITO_CONSTANTS.DEFAULT_PER_PAGE,
    };

    return this.getFavoritos(searchFilters);
  }

  /**
   * Aplica un filtro rápido predefinido
   */
  aplicarFiltroRapido(
    filtro: keyof FiltrosRapidosFavoritos
  ): Observable<FavoritoResponse> {
    const filtroConfig = this.filtrosRapidos[filtro];
    return this.getFavoritos(filtroConfig);
  }

  /**
   * Obtiene favoritos por categoría específica
   */
  getFavoritosByCategoria(categoriaId: number): Observable<FavoritoResponse> {
    return this.getFavoritos({ categoria_id: categoriaId });
  }

  /**
   * Obtiene favoritos con ofertas
   */
  getFavoritosConOfertas(): Observable<FavoritoResponse> {
    return this.getFavoritos({ con_ofertas: true });
  }

  /**
   * Obtiene favoritos disponibles
   */
  getFavoritosDisponibles(): Observable<FavoritoResponse> {
    return this.getFavoritos({ productos_disponibles: true });
  }

  /**
   * Obtiene favoritos recientes
   */
  getFavoritosRecientes(
    dias: number = FAVORITO_CONSTANTS.DIAS_RECIENTES_DEFAULT
  ): Observable<FavoritoResponse> {
    return this.getFavoritos({
      recientes: dias,
      sort_by: 'created_at',
      sort_direction: 'desc',
    });
  }

  /**
   * Obtiene favoritos por rango de precio
   */
  getFavoritosByRangoPrecio(
    precioMin: number,
    precioMax: number
  ): Observable<FavoritoResponse> {
    return this.getFavoritos({
      rango_precio: `${precioMin}-${precioMax}`,
    });
  }

  /**
   * Realiza acciones masivas en favoritos
   */
  accionMasiva(
    accionData: AccionMasivaFavoritos
  ): Observable<AccionMasivaFavoritosResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<AccionMasivaFavoritosResponse>(
        `${this.apiUrl}/accion-masiva`,
        accionData
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            // Actualizar el estado local según la acción realizada
            this.refresh();
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Exporta favoritos a diferentes formatos
   */
  exportarFavoritos(
    formato: 'excel' | 'csv' | 'pdf',
    filters: FavoritoFilters = {}
  ): Observable<Blob> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });
    params = params.set('formato', formato);

    return this.http
      .get(`${this.apiUrl}/exportar`, {
        params,
        responseType: 'blob',
      })
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Refresca la lista de favoritos con los filtros actuales
   */
  refresh(): void {
    const currentFilters = this._currentFilters.value;
    this.getFavoritos(currentFilters).subscribe();
  }

  /**
   * Limpia el estado del servicio
   */
  clearState(): void {
    this._favoritos.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._totalItems.set(0);
    this._resumen.set(null);
    this._currentFilters.next({});
  }

  /**
   * Obtiene un favorito del estado local por ID
   */
  getFavoritoFromState(id: number): Favorito | undefined {
    return this._favoritos().find((favorito) => favorito.id === id);
  }

  /**
   * Verifica si un favorito existe en el estado local
   */
  existsInState(id: number): boolean {
    return this._favoritos().some((favorito) => favorito.id === id);
  }

  /**
   * Verifica si un producto es favorito en el estado local
   */
  isProductoFavoritoInState(userId: number, productoId: number): boolean {
    return this._favoritos().some(
      (favorito) =>
        favorito.user_id === userId && favorito.producto_id === productoId
    );
  }

  /**
   * Obtiene favoritos filtrados del estado local
   */
  getFilteredFavoritosFromState(
    predicate: (favorito: Favorito) => boolean
  ): Favorito[] {
    return this._favoritos().filter(predicate);
  }

  /**
   * Obtiene favoritos por usuario del estado local
   */
  getFavoritosByUsuarioFromState(userId: number): Favorito[] {
    return this._favoritos().filter((favorito) => favorito.user_id === userId);
  }

  /**
   * Obtiene el valor total de favoritos del estado local
   */
  getValorTotalFromState(): number {
    return FavoritoUtils.calcularValorTotal(this._favoritos());
  }

  /**
   * Obtiene la distribución por categorías del estado local
   */
  getDistribucionCategoriasFromState(): Record<string, number> {
    return FavoritoUtils.generarResumenPorCategoria(this._favoritos());
  }

  /**
   * Filtra favoritos del estado local por criterios
   */
  filtrarFavoritosFromState(criterios: {
    disponibles?: boolean;
    conOfertas?: boolean;
    categoria?: string;
    precioMin?: number;
    precioMax?: number;
  }): Favorito[] {
    return FavoritoUtils.filtrarFavoritos(this._favoritos(), criterios);
  }

  /**
   * Actualiza el resumen de favoritos
   */
  private updateResumen(favoritos: Favorito[]): void {
    const total = favoritos.length;
    const ahora = new Date();

    // Calcular favoritos recientes
    const recientes24h = favoritos.filter((f) => {
      const fecha = new Date(f.created_at);
      const diferencia = ahora.getTime() - fecha.getTime();
      return diferencia <= 24 * 60 * 60 * 1000; // 24 horas
    }).length;

    const estaSemana = favoritos.filter((f) => {
      const fecha = new Date(f.created_at);
      const diferencia = ahora.getTime() - fecha.getTime();
      return diferencia <= 7 * 24 * 60 * 60 * 1000; // 7 días
    }).length;

    const esteMes = favoritos.filter((f) => {
      const fecha = new Date(f.created_at);
      const diferencia = ahora.getTime() - fecha.getTime();
      return diferencia <= 30 * 24 * 60 * 60 * 1000; // 30 días
    }).length;

    const productosDisponibles = favoritos.filter((f) =>
      f.producto ? FavoritoUtils.estaDisponible(f.producto) : false
    ).length;

    const productosConOfertas = favoritos.filter(
      (f) => f.producto?.tiene_oferta
    ).length;

    const valorTotal = FavoritoUtils.calcularValorTotal(favoritos);

    this._resumen.set({
      total,
      recientes_24h: recientes24h,
      esta_semana: estaSemana,
      este_mes: esteMes,
      productos_disponibles: productosDisponibles,
      productos_con_ofertas: productosConOfertas,
      valor_total: valorTotal,
    });
  }

  /**
   * Maneja errores HTTP de manera centralizada
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.status === 0) {
        errorMessage =
          'No se puede conectar al servidor. Verifique su conexión a internet.';
      } else if (error.status >= 400 && error.status < 500) {
        errorMessage =
          error.error?.message || `Error del cliente: ${error.status}`;
      } else if (error.status >= 500) {
        errorMessage =
          'Error interno del servidor. Intente nuevamente más tarde.';
      }
    }

    this._error.set(errorMessage);
    console.error('Error en FavoritoService:', error);

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Utilidades del servicio (acceso a FavoritoUtils)
   */
  readonly utils = FavoritoUtils;
}
