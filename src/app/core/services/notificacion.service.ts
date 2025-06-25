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
  Notificacion,
  CreateNotificacionDto,
  UpdateNotificacionDto,
  NotificacionFilters,
  NotificacionResponse,
  NotificacionSingleResponse,
  NotificacionesByUsuarioResponse,
  EstadisticasNotificaciones,
  NotificacionOperationResponse,
  MarcarLeidasRequest,
  MarcarLeidasResponse,
  LimpiarAntiguasRequest,
  LimpiarAntiguasResponse,
  EnviarMasivaRequest,
  EnviarMasivaResponse,
  NotificacionValidation,
  ResumenNotificaciones,
  FiltrosRapidosNotificaciones,
  AccionMasivaNotificaciones,
  AccionMasivaNotificacionesResponse,
  TipoNotificacion,
  PrioridadNotificacion,
  TipoOrdenamientoNotificacion,
  DireccionOrdenamientoNotificacion,
  NOTIFICACION_CONSTANTS,
  NotificacionUtils,
} from '../models/notificacion.interface';

/**
 * Servicio para gestión de notificaciones del sistema
 * Implementa todas las operaciones CRUD y funcionalidades especiales
 */
@Injectable({
  providedIn: 'root',
})
export class NotificacionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/notificaciones`;

  // Signals para estado reactivo
  private readonly _notificaciones = signal<Notificacion[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _totalItems = signal<number>(0);
  private readonly _resumen = signal<ResumenNotificaciones | null>(null);

  // Computed signals para datos derivados
  readonly notificaciones = this._notificaciones.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalItems = this._totalItems.asReadonly();
  readonly resumen = this._resumen.asReadonly();
  readonly isEmpty = computed(() => this._notificaciones().length === 0);
  readonly hasError = computed(() => this._error() !== null);
  readonly notificacionesNoLeidas = computed(() =>
    this._notificaciones().filter((n) => !n.leido)
  );
  readonly notificacionesRecientes = computed(() =>
    this._notificaciones().filter((n) => n.es_reciente)
  );
  readonly notificacionesRequierenAccion = computed(() =>
    this._notificaciones().filter((n) => n.requiere_accion)
  );
  readonly notificacionesPorTipo = computed(() =>
    NotificacionUtils.agruparPorTipo(this._notificaciones())
  );
  readonly contadorNoLeidas = computed(
    () => this.notificacionesNoLeidas().length
  );
  readonly contadorRequierenAccion = computed(
    () => this.notificacionesRequierenAccion().length
  );

  // BehaviorSubject para filtros actuales
  private readonly _currentFilters = new BehaviorSubject<NotificacionFilters>(
    {}
  );
  readonly currentFilters$ = this._currentFilters.asObservable();

  // Filtros rápidos predefinidos
  readonly filtrosRapidos: FiltrosRapidosNotificaciones = {
    todas: {},
    no_leidas: { leido: false },
    recientes: {
      recientes: NOTIFICACION_CONSTANTS.HORAS_RECIENTES_DEFAULT,
      sort_by: 'created_at',
      sort_direction: 'desc',
    },
    alta_prioridad: { prioridad: 'alta' },
    requieren_accion: { requiere_accion: true },
    por_tipo: {
      admin: { tipo: 'admin' },
      inventario: { tipo: 'inventario' },
      stock: { tipo: 'stock' },
      pedido: { tipo: 'pedido' },
      promocion: { tipo: 'promocion' },
      credito: { tipo: 'credito' },
      bienvenida: { tipo: 'bienvenida' },
      pago: { tipo: 'pago' },
      recordatorio: { tipo: 'recordatorio' },
      sistema: { tipo: 'sistema' },
      general: { tipo: 'general' },
    },
    esta_semana: {
      fecha_desde: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      sort_by: 'created_at',
      sort_direction: 'desc',
    },
    este_mes: {
      fecha_desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      sort_by: 'created_at',
      sort_direction: 'desc',
    },
  };

  /**
   * Obtiene todas las notificaciones con filtros y paginación
   */
  getNotificaciones(
    filters: NotificacionFilters = {}
  ): Observable<NotificacionResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();

    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<NotificacionResponse>(this.apiUrl, { params }).pipe(
      tap((response) => {
        if (response.success) {
          this._notificaciones.set(response.data);
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
   * Obtiene una notificación específica por ID
   */
  getNotificacion(id: number): Observable<NotificacionSingleResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<NotificacionSingleResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Crea una nueva notificación
   */
  createNotificacion(
    notificacionData: CreateNotificacionDto
  ): Observable<NotificacionOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<NotificacionOperationResponse>(this.apiUrl, notificacionData)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Agregar la nueva notificación al estado local
            const currentNotificaciones = this._notificaciones();
            this._notificaciones.set([response.data, ...currentNotificaciones]);
            this._totalItems.update((total) => total + 1);
            this.updateResumen([response.data, ...currentNotificaciones]);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Actualiza una notificación existente
   */
  updateNotificacion(
    id: number,
    notificacionData: UpdateNotificacionDto
  ): Observable<NotificacionOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<NotificacionOperationResponse>(
        `${this.apiUrl}/${id}`,
        notificacionData
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Actualizar la notificación en el estado local
            const currentNotificaciones = this._notificaciones();
            const updatedNotificaciones = currentNotificaciones.map(
              (notificacion) =>
                notificacion.id === id ? response.data! : notificacion
            );
            this._notificaciones.set(updatedNotificaciones);
            this.updateResumen(updatedNotificaciones);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Elimina una notificación
   */
  deleteNotificacion(id: number): Observable<NotificacionOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .delete<NotificacionOperationResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        tap((response) => {
          if (response.success) {
            // Remover la notificación del estado local
            const currentNotificaciones = this._notificaciones();
            const filteredNotificaciones = currentNotificaciones.filter(
              (notificacion) => notificacion.id !== id
            );
            this._notificaciones.set(filteredNotificaciones);
            this._totalItems.update((total) => total - 1);
            this.updateResumen(filteredNotificaciones);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene notificaciones por usuario específico
   */
  getNotificacionesByUsuario(
    usuarioId: number,
    filters: Partial<NotificacionFilters> = {}
  ): Observable<NotificacionesByUsuarioResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<NotificacionesByUsuarioResponse>(
        `${this.apiUrl}/usuario/${usuarioId}`,
        {
          params,
        }
      )
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Marca una notificación como leída
   */
  marcarLeida(id: number): Observable<NotificacionOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<NotificacionOperationResponse>(
        `${this.apiUrl}/${id}/marcar-leida`,
        {}
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Actualizar el estado local
            const currentNotificaciones = this._notificaciones();
            const updatedNotificaciones = currentNotificaciones.map(
              (notificacion) =>
                notificacion.id === id
                  ? { ...notificacion, leido: true }
                  : notificacion
            );
            this._notificaciones.set(updatedNotificaciones);
            this.updateResumen(updatedNotificaciones);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Marca una notificación como no leída
   */
  marcarNoLeida(id: number): Observable<NotificacionOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<NotificacionOperationResponse>(
        `${this.apiUrl}/${id}/marcar-no-leida`,
        {}
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Actualizar el estado local
            const currentNotificaciones = this._notificaciones();
            const updatedNotificaciones = currentNotificaciones.map(
              (notificacion) =>
                notificacion.id === id
                  ? { ...notificacion, leido: false }
                  : notificacion
            );
            this._notificaciones.set(updatedNotificaciones);
            this.updateResumen(updatedNotificaciones);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  marcarTodasLeidas(
    request: MarcarLeidasRequest
  ): Observable<MarcarLeidasResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<MarcarLeidasResponse>(`${this.apiUrl}/marcar-todas-leidas`, request)
      .pipe(
        tap((response) => {
          if (response.success) {
            // Actualizar el estado local
            const currentNotificaciones = this._notificaciones();
            const updatedNotificaciones = currentNotificaciones.map(
              (notificacion) =>
                notificacion.user_id === request.user_id
                  ? { ...notificacion, leido: true }
                  : notificacion
            );
            this._notificaciones.set(updatedNotificaciones);
            this.updateResumen(updatedNotificaciones);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Limpia notificaciones antiguas
   */
  limpiarAntiguas(
    request: LimpiarAntiguasRequest
  ): Observable<LimpiarAntiguasResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .delete<LimpiarAntiguasResponse>(`${this.apiUrl}/limpiar-antiguas`, {
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
   * Envía notificaciones masivas
   */
  enviarMasiva(request: EnviarMasivaRequest): Observable<EnviarMasivaResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<EnviarMasivaResponse>(`${this.apiUrl}/enviar-masiva`, request)
      .pipe(
        tap((response) => {
          if (response.success) {
            // Recargar la lista después del envío masivo
            this.refresh();
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene estadísticas completas del sistema de notificaciones
   */
  getEstadisticas(
    fechaDesde?: string,
    fechaHasta?: string,
    userId?: number
  ): Observable<EstadisticasNotificaciones> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (fechaDesde) params = params.set('fecha_desde', fechaDesde);
    if (fechaHasta) params = params.set('fecha_hasta', fechaHasta);
    if (userId) params = params.set('user_id', userId.toString());

    return this.http
      .get<EstadisticasNotificaciones>(`${this.apiUrl}/statistics`, { params })
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Valida los datos de una notificación
   */
  validateNotificacion(
    notificacionData: Partial<CreateNotificacionDto>
  ): NotificacionValidation {
    return NotificacionUtils.validarNotificacion(notificacionData);
  }

  /**
   * Busca notificaciones por texto
   */
  searchNotificaciones(
    searchTerm: string,
    filters: Partial<NotificacionFilters> = {}
  ): Observable<NotificacionResponse> {
    const searchFilters: NotificacionFilters = {
      ...filters,
      search: searchTerm,
      per_page: filters.per_page || NOTIFICACION_CONSTANTS.DEFAULT_PER_PAGE,
    };

    return this.getNotificaciones(searchFilters);
  }

  /**
   * Aplica un filtro rápido predefinido
   */
  aplicarFiltroRapido(
    filtro: keyof Omit<FiltrosRapidosNotificaciones, 'por_tipo'>
  ): Observable<NotificacionResponse> {
    const filtroConfig = this.filtrosRapidos[filtro];
    return this.getNotificaciones(filtroConfig);
  }

  /**
   * Aplica filtro por tipo específico
   */
  aplicarFiltroPorTipo(
    tipo: TipoNotificacion
  ): Observable<NotificacionResponse> {
    const filtroConfig = this.filtrosRapidos.por_tipo[tipo];
    return this.getNotificaciones(filtroConfig);
  }

  /**
   * Obtiene notificaciones por prioridad
   */
  getNotificacionesByPrioridad(
    prioridad: PrioridadNotificacion
  ): Observable<NotificacionResponse> {
    return this.getNotificaciones({ prioridad });
  }

  /**
   * Obtiene notificaciones no leídas
   */
  getNotificacionesNoLeidas(): Observable<NotificacionResponse> {
    return this.getNotificaciones({ leido: false });
  }

  /**
   * Obtiene notificaciones recientes
   */
  getNotificacionesRecientes(
    horas: number = NOTIFICACION_CONSTANTS.HORAS_RECIENTES_DEFAULT
  ): Observable<NotificacionResponse> {
    return this.getNotificaciones({
      recientes: horas,
      sort_by: 'created_at',
      sort_direction: 'desc',
    });
  }

  /**
   * Obtiene notificaciones que requieren acción
   */
  getNotificacionesRequierenAccion(): Observable<NotificacionResponse> {
    return this.getNotificaciones({ requiere_accion: true });
  }

  /**
   * Obtiene notificaciones por rango de fechas
   */
  getNotificacionesByRangoFechas(
    fechaDesde: string,
    fechaHasta: string
  ): Observable<NotificacionResponse> {
    return this.getNotificaciones({
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
    });
  }

  /**
   * Realiza acciones masivas en notificaciones
   */
  accionMasiva(
    accionData: AccionMasivaNotificaciones
  ): Observable<AccionMasivaNotificacionesResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<AccionMasivaNotificacionesResponse>(
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
   * Exporta notificaciones a diferentes formatos
   */
  exportarNotificaciones(
    formato: 'excel' | 'csv' | 'pdf',
    filters: NotificacionFilters = {}
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
   * Refresca la lista de notificaciones con los filtros actuales
   */
  refresh(): void {
    const currentFilters = this._currentFilters.value;
    this.getNotificaciones(currentFilters).subscribe();
  }

  /**
   * Limpia el estado del servicio
   */
  clearState(): void {
    this._notificaciones.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._totalItems.set(0);
    this._resumen.set(null);
    this._currentFilters.next({});
  }

  /**
   * Obtiene una notificación del estado local por ID
   */
  getNotificacionFromState(id: number): Notificacion | undefined {
    return this._notificaciones().find(
      (notificacion) => notificacion.id === id
    );
  }

  /**
   * Verifica si una notificación existe en el estado local
   */
  existsInState(id: number): boolean {
    return this._notificaciones().some(
      (notificacion) => notificacion.id === id
    );
  }

  /**
   * Obtiene notificaciones filtradas del estado local
   */
  getFilteredNotificacionesFromState(
    predicate: (notificacion: Notificacion) => boolean
  ): Notificacion[] {
    return this._notificaciones().filter(predicate);
  }

  /**
   * Obtiene notificaciones por usuario del estado local
   */
  getNotificacionesByUsuarioFromState(userId: number): Notificacion[] {
    return this._notificaciones().filter(
      (notificacion) => notificacion.user_id === userId
    );
  }

  /**
   * Obtiene notificaciones por tipo del estado local
   */
  getNotificacionesByTipoFromState(tipo: TipoNotificacion): Notificacion[] {
    return this._notificaciones().filter(
      (notificacion) => notificacion.tipo === tipo
    );
  }

  /**
   * Filtra notificaciones del estado local por criterios
   */
  filtrarNotificacionesFromState(criterios: {
    leidas?: boolean;
    tipos?: TipoNotificacion[];
    prioridad?: PrioridadNotificacion;
    recientes?: boolean;
    requierenAccion?: boolean;
  }): Notificacion[] {
    return NotificacionUtils.filtrarNotificaciones(
      this._notificaciones(),
      criterios
    );
  }

  /**
   * Obtiene el conteo de notificaciones por tipo del estado local
   */
  getConteoTiposFromState(): Record<TipoNotificacion, number> {
    const notificaciones = this._notificaciones();
    const conteo: Record<string, number> = {};

    notificaciones.forEach((notificacion) => {
      conteo[notificacion.tipo] = (conteo[notificacion.tipo] || 0) + 1;
    });

    return conteo as Record<TipoNotificacion, number>;
  }

  /**
   * Obtiene el conteo de notificaciones por prioridad del estado local
   */
  getConteoPrioridadesFromState(): Record<PrioridadNotificacion, number> {
    const notificaciones = this._notificaciones();
    const conteo: Record<PrioridadNotificacion, number> = {
      alta: 0,
      media: 0,
      baja: 0,
    };

    notificaciones.forEach((notificacion) => {
      const prioridad = NotificacionUtils.getPrioridad(notificacion.tipo);
      conteo[prioridad]++;
    });

    return conteo;
  }

  /**
   * Actualiza el resumen de notificaciones
   */
  private updateResumen(notificaciones: Notificacion[]): void {
    const estadisticas = NotificacionUtils.calcularEstadisticas(notificaciones);
    this._resumen.set(estadisticas);
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
    console.error('Error en NotificacionService:', error);

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Utilidades del servicio (acceso a NotificacionUtils)
   */
  readonly utils = NotificacionUtils;
}
