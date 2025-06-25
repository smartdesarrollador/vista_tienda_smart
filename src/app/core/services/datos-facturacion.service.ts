import { Injectable, signal, computed, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import {
  TipoDocumento,
  SortDirection,
  type DatosFacturacion,
  type CreateDatosFacturacionRequest,
  type UpdateDatosFacturacionRequest,
  type DatosFacturacionFilters,
  type DatosFacturacionByClienteFilters,
  type DatosFacturacionListResponse,
  type DatosFacturacionCollectionResponse,
  type DatosFacturacionResponse,
  type DatosFacturacionByClienteResponse,
  type DatosFacturacionStatistics,
  type DatosFacturacionStatisticsResponse,
  type ValidarDocumentoRequest,
  type ValidarDocumentoResponse,
  type ApiError,
  type DatosFacturacionSortField,
  validarDocumento,
  limpiarDocumento,
  formatearDocumento,
  esTipoEmpresa,
} from '../models/datos-facturacion.interface';

@Injectable({
  providedIn: 'root',
})
export class DatosFacturacionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vista/datos-facturacion`;

  // Signals para el estado del servicio
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _datosFacturacion = signal<DatosFacturacion[]>([]);
  private readonly _statistics = signal<DatosFacturacionStatistics | null>(
    null
  );
  private readonly _selectedDatos = signal<DatosFacturacion | null>(null);
  private readonly _datosByCliente = signal<DatosFacturacion[]>([]);

  // Observables para cuando necesites reactividad completa
  private readonly _datosFacturacionSubject = new BehaviorSubject<
    DatosFacturacion[]
  >([]);
  private readonly _loadingSubject = new BehaviorSubject<boolean>(false);

  // Getters públicos (readonly signals)
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly datosFacturacion = this._datosFacturacion.asReadonly();
  readonly statistics = this._statistics.asReadonly();
  readonly selectedDatos = this._selectedDatos.asReadonly();
  readonly datosByCliente = this._datosByCliente.asReadonly();

  // Computed signals
  readonly datosActivos = computed(() =>
    this.datosFacturacion().filter((datos) => datos.activo)
  );

  readonly datosPredeterminados = computed(() =>
    this.datosFacturacion().filter((datos) => datos.predeterminado)
  );

  readonly datosEmpresa = computed(() =>
    this.datosFacturacion().filter((datos) => datos.is_empresa)
  );

  readonly datosPersonaNatural = computed(() =>
    this.datosFacturacion().filter((datos) => datos.is_persona_natural)
  );

  readonly totalDatos = computed(() => this.datosFacturacion().length);

  // Observables públicos
  readonly datosFacturacion$ = this._datosFacturacionSubject.asObservable();
  readonly loading$ = this._loadingSubject.asObservable();

  /**
   * Obtener lista de datos de facturación con filtros y paginación
   */
  getListDatosFacturacion(
    filters?: DatosFacturacionFilters
  ): Observable<DatosFacturacionListResponse> {
    this._loading.set(true);
    this._error.set(null);
    this._loadingSubject.next(true);

    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<DatosFacturacionListResponse>(this.baseUrl, { params })
      .pipe(
        tap((response) => {
          // Actualizar signals con los datos
          if (Array.isArray(response.data)) {
            this._datosFacturacion.set(response.data);
            this._datosFacturacionSubject.next(response.data);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => {
          this._loading.set(false);
          this._loadingSubject.next(false);
        })
      );
  }

  /**
   * Obtener datos de facturación por ID
   */
  getDatosFacturacion(id: number): Observable<DatosFacturacionResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<DatosFacturacionResponse>(`${this.baseUrl}/${id}`)
      .pipe(
        tap((response) => {
          this._selectedDatos.set(response.data);
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Crear nuevos datos de facturación
   */
  createDatosFacturacion(
    data: CreateDatosFacturacionRequest
  ): Observable<DatosFacturacionResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<DatosFacturacionResponse>(this.baseUrl, data).pipe(
      tap((response) => {
        // Agregar los nuevos datos a la lista
        const currentDatos = this._datosFacturacion();
        this._datosFacturacion.set([response.data, ...currentDatos]);
        this._datosFacturacionSubject.next([response.data, ...currentDatos]);
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Actualizar datos de facturación existentes
   */
  updateDatosFacturacion(
    id: number,
    data: UpdateDatosFacturacionRequest
  ): Observable<DatosFacturacionResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<DatosFacturacionResponse>(`${this.baseUrl}/${id}`, data)
      .pipe(
        tap((response) => {
          // Actualizar en la lista
          const currentDatos = this._datosFacturacion();
          const updatedDatos = currentDatos.map((datos) =>
            datos.id === id ? response.data : datos
          );
          this._datosFacturacion.set(updatedDatos);
          this._datosFacturacionSubject.next(updatedDatos);

          // Actualizar datos seleccionados si es el mismo
          if (this._selectedDatos()?.id === id) {
            this._selectedDatos.set(response.data);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Eliminar datos de facturación
   */
  deleteDatosFacturacion(id: number): Observable<{ message: string }> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        // Remover de la lista
        const currentDatos = this._datosFacturacion();
        const filteredDatos = currentDatos.filter((datos) => datos.id !== id);
        this._datosFacturacion.set(filteredDatos);
        this._datosFacturacionSubject.next(filteredDatos);

        // Limpiar datos seleccionados si es el mismo
        if (this._selectedDatos()?.id === id) {
          this._selectedDatos.set(null);
        }
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Obtener datos de facturación por cliente
   */
  getDatosByCliente(
    clienteId: number,
    filters?: DatosFacturacionByClienteFilters
  ): Observable<DatosFacturacionByClienteResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<DatosFacturacionByClienteResponse>(
        `${this.baseUrl}/cliente/${clienteId}`,
        { params }
      )
      .pipe(
        tap((response) => {
          this._datosByCliente.set(response.data);
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Establecer como predeterminado
   */
  establecerPredeterminado(id: number): Observable<DatosFacturacionResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<DatosFacturacionResponse>(
        `${this.baseUrl}/${id}/establecer-predeterminado`,
        {}
      )
      .pipe(
        tap((response) => {
          // Actualizar en la lista
          const currentDatos = this._datosFacturacion();
          const updatedDatos = currentDatos.map((datos) =>
            datos.id === id ? response.data : datos
          );
          this._datosFacturacion.set(updatedDatos);
          this._datosFacturacionSubject.next(updatedDatos);

          // Actualizar datos seleccionados si es el mismo
          if (this._selectedDatos()?.id === id) {
            this._selectedDatos.set(response.data);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Activar datos de facturación
   */
  activarDatos(id: number): Observable<DatosFacturacionResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<DatosFacturacionResponse>(`${this.baseUrl}/${id}/activar`, {})
      .pipe(
        tap((response) => {
          // Actualizar en la lista
          const currentDatos = this._datosFacturacion();
          const updatedDatos = currentDatos.map((datos) =>
            datos.id === id ? response.data : datos
          );
          this._datosFacturacion.set(updatedDatos);
          this._datosFacturacionSubject.next(updatedDatos);

          // Actualizar datos seleccionados si es el mismo
          if (this._selectedDatos()?.id === id) {
            this._selectedDatos.set(response.data);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Desactivar datos de facturación
   */
  desactivarDatos(id: number): Observable<DatosFacturacionResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<DatosFacturacionResponse>(`${this.baseUrl}/${id}/desactivar`, {})
      .pipe(
        tap((response) => {
          // Actualizar en la lista
          const currentDatos = this._datosFacturacion();
          const updatedDatos = currentDatos.map((datos) =>
            datos.id === id ? response.data : datos
          );
          this._datosFacturacion.set(updatedDatos);
          this._datosFacturacionSubject.next(updatedDatos);

          // Actualizar datos seleccionados si es el mismo
          if (this._selectedDatos()?.id === id) {
            this._selectedDatos.set(response.data);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Validar documento
   */
  validarDocumento(
    data: ValidarDocumentoRequest
  ): Observable<ValidarDocumentoResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<ValidarDocumentoResponse>(`${this.baseUrl}/validar-documento`, data)
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtener estadísticas de datos de facturación
   */
  getStatistics(): Observable<DatosFacturacionStatisticsResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<DatosFacturacionStatisticsResponse>(`${this.baseUrl}/statistics`)
      .pipe(
        tap((response) => {
          this._statistics.set(response.data);
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Buscar datos de facturación
   */
  searchDatosFacturacion(
    query: string,
    filters?: Partial<DatosFacturacionFilters>
  ): Observable<DatosFacturacion[]> {
    const searchFilters: DatosFacturacionFilters = {
      buscar: query,
      per_page: 20,
      ...filters,
    };

    return this.getListDatosFacturacion(searchFilters).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Refrescar estadísticas
   */
  refreshStatistics(): void {
    this.getStatistics().subscribe();
  }

  /**
   * Limpiar estado del servicio
   */
  clearState(): void {
    this._datosFacturacion.set([]);
    this._selectedDatos.set(null);
    this._datosByCliente.set([]);
    this._statistics.set(null);
    this._error.set(null);
    this._loading.set(false);
    this._datosFacturacionSubject.next([]);
    this._loadingSubject.next(false);
  }

  /**
   * Seleccionar datos de facturación actuales
   */
  selectDatos(datos: DatosFacturacion | null): void {
    this._selectedDatos.set(datos);
  }

  /**
   * Validación local de documento
   */
  validarDocumentoLocal(
    tipoDocumento: TipoDocumento,
    numeroDocumento: string
  ): boolean {
    const documentoLimpio = limpiarDocumento(numeroDocumento);
    return validarDocumento(tipoDocumento, documentoLimpio);
  }

  /**
   * Formatear documento localmente
   */
  formatearDocumentoLocal(
    tipoDocumento: TipoDocumento,
    numeroDocumento: string
  ): string {
    return formatearDocumento(tipoDocumento, numeroDocumento);
  }

  /**
   * Verificar si es tipo empresa
   */
  esTipoEmpresa(tipoDocumento: TipoDocumento): boolean {
    return esTipoEmpresa(tipoDocumento);
  }

  /**
   * Obtener datos de facturación sin paginación
   */
  getAllDatosFacturacion(
    filters?: Partial<DatosFacturacionFilters>
  ): Observable<DatosFacturacion[]> {
    const allFilters: DatosFacturacionFilters = {
      sin_paginacion: true,
      ...filters,
    };

    return this.getListDatosFacturacion(allFilters).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Métodos de utilidad para filtros
   */
  buildFilters(options: {
    search?: string;
    clienteId?: number;
    tipoDocumento?: TipoDocumento;
    activo?: boolean;
    predeterminado?: boolean;
    fechaDesde?: string;
    fechaHasta?: string;
    departamentoFiscal?: string;
    provinciaFiscal?: string;
    sortBy?: DatosFacturacionSortField;
    sortDirection?: SortDirection;
    page?: number;
    perPage?: number;
  }): DatosFacturacionFilters {
    const filters: DatosFacturacionFilters = {};

    if (options.search) filters.buscar = options.search;
    if (options.clienteId) filters.cliente_id = options.clienteId;
    if (options.tipoDocumento) filters.tipo_documento = options.tipoDocumento;
    if (options.activo !== undefined) filters.activo = options.activo;
    if (options.predeterminado !== undefined)
      filters.predeterminado = options.predeterminado;
    if (options.fechaDesde) filters.fecha_desde = options.fechaDesde;
    if (options.fechaHasta) filters.fecha_hasta = options.fechaHasta;
    if (options.departamentoFiscal)
      filters.departamento_fiscal = options.departamentoFiscal;
    if (options.provinciaFiscal)
      filters.provincia_fiscal = options.provinciaFiscal;
    if (options.sortBy) filters.sort_by = options.sortBy;
    if (options.sortDirection) filters.sort_direction = options.sortDirection;
    if (options.page) filters.page = options.page;
    if (options.perPage) filters.per_page = options.perPage;

    return filters;
  }

  /**
   * Obtener datos predeterminados por cliente
   */
  getDatosPredeterminadosByCliente(
    clienteId: number
  ): Observable<DatosFacturacion | null> {
    return this.getDatosByCliente(clienteId, {
      solo_predeterminado: true,
    }).pipe(map((response) => response.data[0] || null));
  }

  /**
   * Obtener solo datos activos por cliente
   */
  getDatosActivosByCliente(clienteId: number): Observable<DatosFacturacion[]> {
    return this.getDatosByCliente(clienteId, { solo_activos: true }).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Verificar disponibilidad de documento
   */
  isDocumentoAvailable(
    tipoDocumento: TipoDocumento,
    numeroDocumento: string,
    excludeId?: number
  ): Observable<boolean> {
    const documentoLimpio = limpiarDocumento(numeroDocumento);

    return this.searchDatosFacturacion(documentoLimpio, {
      tipo_documento: tipoDocumento,
    }).pipe(
      map((datos) => {
        const encontrado = datos.find(
          (d) => d.numero_documento === documentoLimpio
        );
        if (!encontrado) return true;
        return excludeId ? encontrado.id === excludeId : false;
      })
    );
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error) {
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.errors) {
        // Errores de validación
        const validationErrors = Object.values(error.error.errors).flat();
        errorMessage = validationErrors.join(', ');
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    this._error.set(errorMessage);
    console.error('Error en DatosFacturacionService:', error);

    return throwError(() => error);
  }

  /**
   * Método para obtener el estado del error
   */
  getError(): string | null {
    return this._error();
  }

  /**
   * Método para limpiar errores
   */
  clearError(): void {
    this._error.set(null);
  }
}
