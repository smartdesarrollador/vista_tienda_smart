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
  Comentario,
  CreateComentarioDto,
  UpdateComentarioDto,
  ComentarioFilters,
  ComentarioResponse,
  ComentarioSingleResponse,
  ComentariosByProductoResponse,
  EstadisticasComentarios,
  ComentarioOperationResponse,
  ResponderComentarioDto,
  ComentarioValidation,
  ResumenComentarios,
  FiltrosRapidos,
  AccionMasivaComentarios,
  AccionMasivaResponse,
  CalificacionEnum,
  EstadoAprobacion,
  COMENTARIO_CONSTANTS,
  ComentarioUtils,
} from '../models/comentario.interface';

/**
 * Servicio para gestión de comentarios de productos
 * Implementa todas las operaciones CRUD y funcionalidades especiales
 */
@Injectable({
  providedIn: 'root',
})
export class ComentarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/comentarios`;

  // Signals para estado reactivo
  private readonly _comentarios = signal<Comentario[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _totalItems = signal<number>(0);
  private readonly _resumen = signal<ResumenComentarios | null>(null);

  // Computed signals para datos derivados
  readonly comentarios = this._comentarios.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalItems = this._totalItems.asReadonly();
  readonly resumen = this._resumen.asReadonly();
  readonly isEmpty = computed(() => this._comentarios().length === 0);
  readonly hasError = computed(() => this._error() !== null);
  readonly comentariosPendientes = computed(
    () => this._comentarios().filter((c) => !c.aprobado).length
  );
  readonly comentariosAprobados = computed(
    () => this._comentarios().filter((c) => c.aprobado).length
  );

  // BehaviorSubject para filtros actuales
  private readonly _currentFilters = new BehaviorSubject<ComentarioFilters>({});
  readonly currentFilters$ = this._currentFilters.asObservable();

  // Filtros rápidos predefinidos
  readonly filtrosRapidos: FiltrosRapidos = {
    todos: {},
    pendientes: { aprobado: false },
    aprobados: { aprobado: true },
    alta_calificacion: { calificacion_min: 4 },
    baja_calificacion: { calificacion_max: 2 },
    con_respuesta: { con_respuesta: true },
    sin_respuesta: { con_respuesta: false },
    recientes: { sort_field: 'created_at', sort_direction: 'desc' },
  };

  /**
   * Obtiene todos los comentarios con filtros y paginación
   */
  getComentarios(
    filters: ComentarioFilters = {}
  ): Observable<ComentarioResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();

    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ComentarioResponse>(this.apiUrl, { params }).pipe(
      tap((response) => {
        if (response.success) {
          this._comentarios.set(response.data);
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
   * Obtiene un comentario específico por ID
   */
  getComentario(id: number): Observable<ComentarioSingleResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<ComentarioSingleResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Crea un nuevo comentario
   */
  createComentario(
    comentarioData: CreateComentarioDto
  ): Observable<ComentarioOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<ComentarioOperationResponse>(this.apiUrl, comentarioData)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Agregar el nuevo comentario al estado local
            const currentComentarios = this._comentarios();
            this._comentarios.set([response.data, ...currentComentarios]);
            this._totalItems.update((total) => total + 1);
            this.updateResumen([response.data, ...currentComentarios]);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Actualiza un comentario existente
   */
  updateComentario(
    id: number,
    comentarioData: UpdateComentarioDto
  ): Observable<ComentarioOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<ComentarioOperationResponse>(`${this.apiUrl}/${id}`, comentarioData)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Actualizar el comentario en el estado local
            const currentComentarios = this._comentarios();
            const updatedComentarios = currentComentarios.map((comentario) =>
              comentario.id === id ? response.data! : comentario
            );
            this._comentarios.set(updatedComentarios);
            this.updateResumen(updatedComentarios);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Elimina un comentario
   */
  deleteComentario(id: number): Observable<ComentarioOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .delete<ComentarioOperationResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        tap((response) => {
          if (response.success) {
            // Remover el comentario del estado local
            const currentComentarios = this._comentarios();
            const filteredComentarios = currentComentarios.filter(
              (comentario) => comentario.id !== id
            );
            this._comentarios.set(filteredComentarios);
            this._totalItems.update((total) => total - 1);
            this.updateResumen(filteredComentarios);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene comentarios por producto específico
   */
  getComentariosByProducto(
    productoId: number,
    filters: Partial<ComentarioFilters> = {}
  ): Observable<ComentariosByProductoResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<ComentariosByProductoResponse>(
        `${this.apiUrl}/producto/${productoId}`,
        { params }
      )
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Aprueba un comentario
   */
  aprobarComentario(id: number): Observable<ComentarioOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<ComentarioOperationResponse>(`${this.apiUrl}/${id}/aprobar`, {})
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Actualizar el comentario en el estado local
            const currentComentarios = this._comentarios();
            const updatedComentarios = currentComentarios.map((comentario) =>
              comentario.id === id
                ? { ...comentario, aprobado: true }
                : comentario
            );
            this._comentarios.set(updatedComentarios);
            this.updateResumen(updatedComentarios);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Rechaza un comentario
   */
  rechazarComentario(id: number): Observable<ComentarioOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<ComentarioOperationResponse>(`${this.apiUrl}/${id}/rechazar`, {})
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Actualizar el comentario en el estado local
            const currentComentarios = this._comentarios();
            const updatedComentarios = currentComentarios.map((comentario) =>
              comentario.id === id
                ? { ...comentario, aprobado: false }
                : comentario
            );
            this._comentarios.set(updatedComentarios);
            this.updateResumen(updatedComentarios);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Responde a un comentario
   */
  responderComentario(
    id: number,
    respuestaData: ResponderComentarioDto
  ): Observable<ComentarioOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<ComentarioOperationResponse>(
        `${this.apiUrl}/${id}/responder`,
        respuestaData
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Actualizar el comentario en el estado local
            const currentComentarios = this._comentarios();
            const updatedComentarios = currentComentarios.map((comentario) =>
              comentario.id === id ? response.data! : comentario
            );
            this._comentarios.set(updatedComentarios);
            this.updateResumen(updatedComentarios);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene estadísticas completas del sistema de comentarios
   */
  getEstadisticas(
    fechaDesde?: string,
    fechaHasta?: string
  ): Observable<EstadisticasComentarios> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (fechaDesde) params = params.set('fecha_desde', fechaDesde);
    if (fechaHasta) params = params.set('fecha_hasta', fechaHasta);

    return this.http
      .get<EstadisticasComentarios>(`${this.apiUrl}/statistics`, { params })
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Valida los datos de un comentario
   */
  validateComentario(
    comentarioData: Partial<CreateComentarioDto>
  ): ComentarioValidation {
    const errors: string[] = [];
    const validation: ComentarioValidation = {
      comentario: false,
      titulo: false,
      calificacion: false,
      user_id: false,
      producto_id: false,
      isValid: false,
      errors,
    };

    // Validar comentario
    if (
      !comentarioData.comentario ||
      comentarioData.comentario.trim().length <
        COMENTARIO_CONSTANTS.MIN_COMENTARIO_LENGTH ||
      comentarioData.comentario.trim().length >
        COMENTARIO_CONSTANTS.MAX_COMENTARIO_LENGTH
    ) {
      errors.push(
        `El comentario debe tener entre ${COMENTARIO_CONSTANTS.MIN_COMENTARIO_LENGTH} y ${COMENTARIO_CONSTANTS.MAX_COMENTARIO_LENGTH} caracteres`
      );
    } else {
      validation.comentario = true;
    }

    // Validar título
    if (
      !comentarioData.titulo ||
      comentarioData.titulo.trim().length <
        COMENTARIO_CONSTANTS.MIN_TITULO_LENGTH ||
      comentarioData.titulo.trim().length >
        COMENTARIO_CONSTANTS.MAX_TITULO_LENGTH
    ) {
      errors.push(
        `El título debe tener entre ${COMENTARIO_CONSTANTS.MIN_TITULO_LENGTH} y ${COMENTARIO_CONSTANTS.MAX_TITULO_LENGTH} caracteres`
      );
    } else {
      validation.titulo = true;
    }

    // Validar calificación
    if (
      !comentarioData.calificacion ||
      comentarioData.calificacion < COMENTARIO_CONSTANTS.CALIFICACION_MIN ||
      comentarioData.calificacion > COMENTARIO_CONSTANTS.CALIFICACION_MAX
    ) {
      errors.push(
        `La calificación debe estar entre ${COMENTARIO_CONSTANTS.CALIFICACION_MIN} y ${COMENTARIO_CONSTANTS.CALIFICACION_MAX} estrellas`
      );
    } else {
      validation.calificacion = true;
    }

    // Validar user_id
    if (!comentarioData.user_id || comentarioData.user_id <= 0) {
      errors.push('Debe especificar un usuario válido');
    } else {
      validation.user_id = true;
    }

    // Validar producto_id
    if (!comentarioData.producto_id || comentarioData.producto_id <= 0) {
      errors.push('Debe especificar un producto válido');
    } else {
      validation.producto_id = true;
    }

    validation.isValid =
      validation.comentario &&
      validation.titulo &&
      validation.calificacion &&
      validation.user_id &&
      validation.producto_id;

    return validation;
  }

  /**
   * Busca comentarios por texto
   */
  searchComentarios(
    searchTerm: string,
    filters: Partial<ComentarioFilters> = {}
  ): Observable<ComentarioResponse> {
    const searchFilters: ComentarioFilters = {
      ...filters,
      search: searchTerm,
      per_page: filters.per_page || COMENTARIO_CONSTANTS.DEFAULT_PER_PAGE,
    };

    return this.getComentarios(searchFilters);
  }

  /**
   * Aplica un filtro rápido predefinido
   */
  aplicarFiltroRapido(
    filtro: keyof FiltrosRapidos
  ): Observable<ComentarioResponse> {
    const filtroConfig = this.filtrosRapidos[filtro];
    return this.getComentarios(filtroConfig);
  }

  /**
   * Obtiene comentarios por calificación específica
   */
  getComentariosByCalificacion(
    calificacion: CalificacionEnum
  ): Observable<ComentarioResponse> {
    return this.getComentarios({ calificacion });
  }

  /**
   * Obtiene comentarios por estado de aprobación
   */
  getComentariosByEstado(aprobado: boolean): Observable<ComentarioResponse> {
    return this.getComentarios({ aprobado });
  }

  /**
   * Realiza acciones masivas en comentarios
   */
  accionMasiva(
    accionData: AccionMasivaComentarios
  ): Observable<AccionMasivaResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<AccionMasivaResponse>(`${this.apiUrl}/accion-masiva`, accionData)
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
   * Obtiene comentarios recientes (últimos 7 días)
   */
  getComentariosRecientes(): Observable<ComentarioResponse> {
    const fechaDesde = new Date();
    fechaDesde.setDate(fechaDesde.getDate() - 7);

    return this.getComentarios({
      fecha_desde: fechaDesde.toISOString().split('T')[0],
      sort_field: 'created_at',
      sort_direction: 'desc',
    });
  }

  /**
   * Obtiene comentarios sin respuesta del administrador
   */
  getComentariosSinRespuesta(): Observable<ComentarioResponse> {
    return this.getComentarios({ con_respuesta: false, aprobado: true });
  }

  /**
   * Refresca la lista de comentarios con los filtros actuales
   */
  refresh(): void {
    const currentFilters = this._currentFilters.value;
    this.getComentarios(currentFilters).subscribe();
  }

  /**
   * Limpia el estado del servicio
   */
  clearState(): void {
    this._comentarios.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._totalItems.set(0);
    this._resumen.set(null);
    this._currentFilters.next({});
  }

  /**
   * Obtiene un comentario del estado local por ID
   */
  getComentarioFromState(id: number): Comentario | undefined {
    return this._comentarios().find((comentario) => comentario.id === id);
  }

  /**
   * Verifica si un comentario existe en el estado local
   */
  existsInState(id: number): boolean {
    return this._comentarios().some((comentario) => comentario.id === id);
  }

  /**
   * Obtiene comentarios filtrados del estado local
   */
  getFilteredComentariosFromState(
    predicate: (comentario: Comentario) => boolean
  ): Comentario[] {
    return this._comentarios().filter(predicate);
  }

  /**
   * Obtiene el promedio de calificación de los comentarios actuales
   */
  getPromedioCalificacion(): number {
    const comentarios = this._comentarios();
    if (comentarios.length === 0) return 0;

    const suma = comentarios.reduce(
      (acc, comentario) => acc + comentario.calificacion,
      0
    );
    return Math.round((suma / comentarios.length) * 100) / 100;
  }

  /**
   * Obtiene la distribución de calificaciones
   */
  getDistribucionCalificaciones(): Record<string, number> {
    const comentarios = this._comentarios();
    const distribucion: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };

    comentarios.forEach((comentario) => {
      const calificacionStr = comentario.calificacion.toString();
      if (calificacionStr in distribucion) {
        distribucion[calificacionStr]++;
      }
    });

    return distribucion;
  }

  /**
   * Actualiza el resumen de comentarios
   */
  private updateResumen(comentarios: Comentario[]): void {
    const total = comentarios.length;
    const aprobados = comentarios.filter((c) => c.aprobado).length;
    const pendientes = total - aprobados;
    const conRespuesta = comentarios.filter((c) => c.tiene_respuesta).length;
    const sinRespuesta = total - conRespuesta;
    const promedioCalificacion =
      total > 0
        ? comentarios.reduce((acc, c) => acc + c.calificacion, 0) / total
        : 0;

    this._resumen.set({
      total,
      aprobados,
      pendientes,
      con_respuesta: conRespuesta,
      sin_respuesta: sinRespuesta,
      promedio_calificacion: Math.round(promedioCalificacion * 100) / 100,
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
    console.error('Error en ComentarioService:', error);

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Utilidades del servicio (acceso a ComentarioUtils)
   */
  readonly utils = ComentarioUtils;
}
