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
  Direccion,
  CreateDireccionDto,
  UpdateDireccionDto,
  DireccionFilters,
  DireccionResponse,
  DireccionSingleResponse,
  DireccionesByUsuarioResponse,
  EstadisticasDirecciones,
  DireccionOperationResponse,
  DireccionValidation,
  PaisEnum,
} from '../models/direccion.interface';

/**
 * Servicio para gestión de direcciones de usuarios
 * Implementa todas las operaciones CRUD y funcionalidades especiales
 */
@Injectable({
  providedIn: 'root',
})
export class DireccionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/direcciones`;

  // Signals para estado reactivo
  private readonly _direcciones = signal<Direccion[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _totalItems = signal<number>(0);

  // Computed signals para datos derivados
  readonly direcciones = this._direcciones.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalItems = this._totalItems.asReadonly();
  readonly isEmpty = computed(() => this._direcciones().length === 0);
  readonly hasError = computed(() => this._error() !== null);

  // BehaviorSubject para filtros actuales
  private readonly _currentFilters = new BehaviorSubject<DireccionFilters>({});
  readonly currentFilters$ = this._currentFilters.asObservable();

  /**
   * Obtiene todas las direcciones con filtros y paginación
   */
  getDirecciones(
    filters: DireccionFilters = {}
  ): Observable<DireccionResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();

    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<DireccionResponse>(this.apiUrl, { params }).pipe(
      tap((response) => {
        if (response.success) {
          this._direcciones.set(response.data);
          this._totalItems.set(response.meta.total);
          this._currentFilters.next(filters);
        }
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Obtiene una dirección específica por ID
   */
  getDireccion(id: number): Observable<DireccionSingleResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<DireccionSingleResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Crea una nueva dirección
   */
  createDireccion(
    direccionData: CreateDireccionDto
  ): Observable<DireccionOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<DireccionOperationResponse>(this.apiUrl, direccionData)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Agregar la nueva dirección al estado local
            const currentDirecciones = this._direcciones();
            this._direcciones.set([response.data, ...currentDirecciones]);
            this._totalItems.update((total) => total + 1);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Actualiza una dirección existente
   */
  updateDireccion(
    id: number,
    direccionData: UpdateDireccionDto
  ): Observable<DireccionOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<DireccionOperationResponse>(`${this.apiUrl}/${id}`, direccionData)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Actualizar la dirección en el estado local
            const currentDirecciones = this._direcciones();
            const updatedDirecciones = currentDirecciones.map((direccion) =>
              direccion.id === id ? response.data! : direccion
            );
            this._direcciones.set(updatedDirecciones);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Elimina una dirección
   */
  deleteDireccion(id: number): Observable<DireccionOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .delete<DireccionOperationResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        tap((response) => {
          if (response.success) {
            // Remover la dirección del estado local
            const currentDirecciones = this._direcciones();
            const filteredDirecciones = currentDirecciones.filter(
              (direccion) => direccion.id !== id
            );
            this._direcciones.set(filteredDirecciones);
            this._totalItems.update((total) => total - 1);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene direcciones por usuario específico
   */
  getDireccionesByUsuario(
    userId: number
  ): Observable<DireccionesByUsuarioResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<DireccionesByUsuarioResponse>(`${this.apiUrl}/usuario/${userId}`)
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Marca una dirección como predeterminada
   */
  setPredeterminada(id: number): Observable<DireccionOperationResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<DireccionOperationResponse>(
        `${this.apiUrl}/${id}/set-predeterminada`,
        {}
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Actualizar el estado local: desmarcar todas y marcar la nueva
            const currentDirecciones = this._direcciones();
            const updatedDirecciones = currentDirecciones.map((direccion) => ({
              ...direccion,
              predeterminada: direccion.id === id,
            }));
            this._direcciones.set(updatedDirecciones);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene estadísticas del sistema de direcciones
   */
  getEstadisticas(
    fechaDesde?: string,
    fechaHasta?: string
  ): Observable<EstadisticasDirecciones> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (fechaDesde) params = params.set('fecha_desde', fechaDesde);
    if (fechaHasta) params = params.set('fecha_hasta', fechaHasta);

    return this.http
      .get<EstadisticasDirecciones>(`${this.apiUrl}/statistics`, { params })
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Valida los datos de una dirección
   */
  validateDireccion(
    direccionData: Partial<CreateDireccionDto>
  ): DireccionValidation {
    const errors: string[] = [];
    const validation: DireccionValidation = {
      direccion: false,
      distrito: false,
      provincia: false,
      departamento: false,
      pais: false,
      isValid: false,
      errors,
    };

    // Validar dirección
    if (!direccionData.direccion || direccionData.direccion.trim().length < 5) {
      errors.push('La dirección debe tener al menos 5 caracteres');
    } else {
      validation.direccion = true;
    }

    // Validar distrito
    if (!direccionData.distrito || direccionData.distrito.trim().length < 2) {
      errors.push('El distrito es requerido');
    } else {
      validation.distrito = true;
    }

    // Validar provincia
    if (!direccionData.provincia || direccionData.provincia.trim().length < 2) {
      errors.push('La provincia es requerida');
    } else {
      validation.provincia = true;
    }

    // Validar departamento
    if (
      !direccionData.departamento ||
      direccionData.departamento.trim().length < 2
    ) {
      errors.push('El departamento es requerido');
    } else {
      validation.departamento = true;
    }

    // Validar país
    if (
      !direccionData.pais ||
      !Object.values(PaisEnum).includes(direccionData.pais as PaisEnum)
    ) {
      errors.push('Debe seleccionar un país válido');
    } else {
      validation.pais = true;
    }

    validation.isValid =
      validation.direccion &&
      validation.distrito &&
      validation.provincia &&
      validation.departamento &&
      validation.pais;

    return validation;
  }

  /**
   * Busca direcciones por texto
   */
  searchDirecciones(
    searchTerm: string,
    filters: Partial<DireccionFilters> = {}
  ): Observable<DireccionResponse> {
    const searchFilters: DireccionFilters = {
      ...filters,
      search: searchTerm,
      per_page: filters.per_page || 15,
    };

    return this.getDirecciones(searchFilters);
  }

  /**
   * Obtiene direcciones predeterminadas por departamento
   */
  getDireccionesPredeterminadasByDepartamento(): Observable<
    Record<string, number>
  > {
    return this.getDirecciones({ predeterminada: true }).pipe(
      map((response) => {
        const departamentos: Record<string, number> = {};
        response.data.forEach((direccion) => {
          departamentos[direccion.departamento] =
            (departamentos[direccion.departamento] || 0) + 1;
        });
        return departamentos;
      })
    );
  }

  /**
   * Refresca la lista de direcciones con los filtros actuales
   */
  refresh(): void {
    const currentFilters = this._currentFilters.value;
    this.getDirecciones(currentFilters).subscribe();
  }

  /**
   * Limpia el estado del servicio
   */
  clearState(): void {
    this._direcciones.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._totalItems.set(0);
    this._currentFilters.next({});
  }

  /**
   * Obtiene una dirección del estado local por ID
   */
  getDireccionFromState(id: number): Direccion | undefined {
    return this._direcciones().find((direccion) => direccion.id === id);
  }

  /**
   * Verifica si una dirección existe en el estado local
   */
  existsInState(id: number): boolean {
    return this._direcciones().some((direccion) => direccion.id === id);
  }

  /**
   * Obtiene direcciones filtradas del estado local
   */
  getFilteredDireccionesFromState(
    predicate: (direccion: Direccion) => boolean
  ): Direccion[] {
    return this._direcciones().filter(predicate);
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
    console.error('Error en DireccionService:', error);

    return throwError(() => new Error(errorMessage));
  }
}
