import { Injectable, signal, computed, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, BehaviorSubject, EMPTY, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import {
  EstadoCliente,
  GeneroCliente,
  SortDirection,
  type Cliente,
  type ClienteSimple,
  type CreateClienteRequest,
  type UpdateClienteRequest,
  type ClienteFilters,
  type ClienteListResponse,
  type ClienteCollectionResponse,
  type ClienteResponse,
  type ClienteStatistics,
  type ClienteStatisticsResponse,
  type CambiarEstadoRequest,
  type ApiError,
  type ClienteSortField,
} from '../models/cliente.interface';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vista/clientes`;

  // Signals para el estado del servicio
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _clientes = signal<Cliente[]>([]);
  private readonly _statistics = signal<ClienteStatistics | null>(null);
  private readonly _selectedCliente = signal<Cliente | null>(null);

  // Observables para cuando necesites reactividad completa
  private readonly _clientesSubject = new BehaviorSubject<Cliente[]>([]);
  private readonly _loadingSubject = new BehaviorSubject<boolean>(false);

  // Getters públicos (readonly signals)
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly clientes = this._clientes.asReadonly();
  readonly statistics = this._statistics.asReadonly();
  readonly selectedCliente = this._selectedCliente.asReadonly();

  // Computed signals
  readonly clientesActivos = computed(() =>
    this.clientes().filter((cliente) => cliente.estado === EstadoCliente.ACTIVO)
  );

  readonly clientesVerificados = computed(() =>
    this.clientes().filter((cliente) => cliente.verificado)
  );

  readonly clientesConCredito = computed(() =>
    this.clientes().filter((cliente) => cliente.tiene_credito)
  );

  readonly totalClientes = computed(() => this.clientes().length);

  // Observables públicos
  readonly clientes$ = this._clientesSubject.asObservable();
  readonly loading$ = this._loadingSubject.asObservable();

  /**
   * Obtener lista de clientes con filtros y paginación
   */
  getClientes(filters?: ClienteFilters): Observable<ClienteListResponse> {
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

    return this.http.get<ClienteListResponse>(this.baseUrl, { params }).pipe(
      tap((response) => {
        // Actualizar signals con los datos
        if (Array.isArray(response.data)) {
          this._clientes.set(response.data as Cliente[]);
          this._clientesSubject.next(response.data as Cliente[]);
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
   * Obtener un cliente por ID
   */
  getCliente(
    id: number,
    options?: { incluir_datos_completos?: boolean }
  ): Observable<ClienteResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (options?.incluir_datos_completos) {
      params = params.set('incluir_datos_completos', 'true');
    }

    return this.http
      .get<ClienteResponse>(`${this.baseUrl}/${id}`, { params })
      .pipe(
        tap((response) => {
          this._selectedCliente.set(response.data);
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Crear nuevo cliente
   */
  createCliente(data: CreateClienteRequest): Observable<ClienteResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<ClienteResponse>(this.baseUrl, data).pipe(
      tap((response) => {
        // Agregar el nuevo cliente a la lista
        const currentClientes = this._clientes();
        this._clientes.set([response.data, ...currentClientes]);
        this._clientesSubject.next([response.data, ...currentClientes]);
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Actualizar cliente existente
   */
  updateCliente(
    id: number,
    data: UpdateClienteRequest
  ): Observable<ClienteResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.put<ClienteResponse>(`${this.baseUrl}/${id}`, data).pipe(
      tap((response) => {
        // Actualizar en la lista
        const currentClientes = this._clientes();
        const updatedClientes = currentClientes.map((cliente) =>
          cliente.id === id ? response.data : cliente
        );
        this._clientes.set(updatedClientes);
        this._clientesSubject.next(updatedClientes);

        // Actualizar cliente seleccionado si es el mismo
        if (this._selectedCliente()?.id === id) {
          this._selectedCliente.set(response.data);
        }
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Eliminar cliente
   */
  deleteCliente(id: number): Observable<{ message: string }> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        // Remover de la lista
        const currentClientes = this._clientes();
        const filteredClientes = currentClientes.filter(
          (cliente) => cliente.id !== id
        );
        this._clientes.set(filteredClientes);
        this._clientesSubject.next(filteredClientes);

        // Limpiar cliente seleccionado si es el mismo
        if (this._selectedCliente()?.id === id) {
          this._selectedCliente.set(null);
        }
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Obtener estadísticas de clientes
   */
  getStatistics(): Observable<ClienteStatisticsResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<ClienteStatisticsResponse>(`${this.baseUrl}/statistics`)
      .pipe(
        tap((response) => {
          this._statistics.set(response.data);
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Cambiar estado del cliente
   */
  cambiarEstado(
    id: number,
    data: CambiarEstadoRequest
  ): Observable<ClienteResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<ClienteResponse>(`${this.baseUrl}/${id}/cambiar-estado`, data)
      .pipe(
        tap((response) => {
          // Actualizar en la lista
          const currentClientes = this._clientes();
          const updatedClientes = currentClientes.map((cliente) =>
            cliente.id === id ? response.data : cliente
          );
          this._clientes.set(updatedClientes);
          this._clientesSubject.next(updatedClientes);

          // Actualizar cliente seleccionado si es el mismo
          if (this._selectedCliente()?.id === id) {
            this._selectedCliente.set(response.data);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Verificar cliente
   */
  verificarCliente(id: number): Observable<ClienteResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<ClienteResponse>(`${this.baseUrl}/${id}/verificar`, {})
      .pipe(
        tap((response) => {
          // Actualizar en la lista
          const currentClientes = this._clientes();
          const updatedClientes = currentClientes.map((cliente) =>
            cliente.id === id ? response.data : cliente
          );
          this._clientes.set(updatedClientes);
          this._clientesSubject.next(updatedClientes);

          // Actualizar cliente seleccionado si es el mismo
          if (this._selectedCliente()?.id === id) {
            this._selectedCliente.set(response.data);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtener clientes simples (para listas y selects)
   */
  getClientesSimples(
    filters?: Partial<ClienteFilters>
  ): Observable<ClienteSimple[]> {
    this._loading.set(true);

    let params = new HttpParams().set('simple', 'true');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ClienteListResponse>(this.baseUrl, { params }).pipe(
      map((response) => response.data as ClienteSimple[]),
      catchError((error) => this.handleError(error)),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Buscar clientes
   */
  searchClientes(
    query: string,
    filters?: Partial<ClienteFilters>
  ): Observable<Cliente[]> {
    const searchFilters: ClienteFilters = {
      buscar: query,
      per_page: 20,
      ...filters,
    };

    return this.getClientes(searchFilters).pipe(
      map((response) => response.data as Cliente[])
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
    this._clientes.set([]);
    this._selectedCliente.set(null);
    this._statistics.set(null);
    this._error.set(null);
    this._loading.set(false);
    this._clientesSubject.next([]);
    this._loadingSubject.next(false);
  }

  /**
   * Seleccionar cliente actual
   */
  selectCliente(cliente: Cliente | null): void {
    this._selectedCliente.set(cliente);
  }

  /**
   * Obtener cliente por DNI
   */
  getClienteByDni(dni: string): Observable<Cliente | null> {
    return this.searchClientes(dni, { per_page: 1 }).pipe(
      map((clientes) => clientes.find((c) => c.dni === dni) || null)
    );
  }

  /**
   * Validar disponibilidad de DNI
   */
  isDniAvailable(dni: string, excludeId?: number): Observable<boolean> {
    return this.getClienteByDni(dni).pipe(
      map((cliente) => {
        if (!cliente) return true;
        return excludeId ? cliente.id === excludeId : false;
      })
    );
  }

  /**
   * Métodos de utilidad para filtros
   */
  buildFilters(options: {
    search?: string;
    estado?: EstadoCliente;
    verificado?: boolean;
    conCredito?: boolean;
    genero?: GeneroCliente;
    fechaDesde?: string;
    fechaHasta?: string;
    edadMin?: number;
    edadMax?: number;
    sortBy?: ClienteSortField;
    sortDirection?: SortDirection;
    page?: number;
    perPage?: number;
  }): ClienteFilters {
    const filters: ClienteFilters = {};

    if (options.search) filters.buscar = options.search;
    if (options.estado) filters.estado = options.estado;
    if (options.verificado !== undefined)
      filters.verificado = options.verificado;
    if (options.conCredito !== undefined)
      filters.con_credito = options.conCredito;
    if (options.genero) filters.genero = options.genero;
    if (options.fechaDesde) filters.fecha_desde = options.fechaDesde;
    if (options.fechaHasta) filters.fecha_hasta = options.fechaHasta;
    if (options.edadMin) filters.edad_min = options.edadMin;
    if (options.edadMax) filters.edad_max = options.edadMax;
    if (options.sortBy) filters.sort_by = options.sortBy;
    if (options.sortDirection) filters.sort_direction = options.sortDirection;
    if (options.page) filters.page = options.page;
    if (options.perPage) filters.per_page = options.perPage;

    return filters;
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
    console.error('Error en ClienteService:', error);

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
