import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Promocion,
  CreatePromocionDto,
  UpdatePromocionDto,
  AplicarPromocionDto,
  FiltrosPromocion,
  PromocionesResponse,
  PromocionResponse,
  CreatePromocionResponse,
  UpdatePromocionResponse,
  DeletePromocionResponse,
  ToggleActivoResponse,
  AplicarPromocionResponse,
  EstadisticasPromociones,
  TipoPromocion,
  PaginacionPromocion,
  ErrorPromocionResponse,
  calcularEstadisticasPromociones,
  obtenerPromocionesVigentes,
  obtenerPromocionesDisponibles,
  obtenerPromocionesPorTipo,
  agruparPorTipo,
  agruparPorEstado,
  buscarPromociones,
} from '../models/promocion.interface';

@Injectable({
  providedIn: 'root',
})
export class PromocionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/promociones`;

  // Estados reactivos con signals
  private readonly _promociones = signal<Promocion[]>([]);
  private readonly _promocionActual = signal<Promocion | null>(null);
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtros = signal<FiltrosPromocion>({});
  private readonly _paginacion = signal<PaginacionPromocion>({
    total: 0,
    per_page: 15,
    current_page: 1,
  });

  // Signals públicos readonly
  readonly promociones = this._promociones.asReadonly();
  readonly promocionActual = this._promocionActual.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filtros = this._filtros.asReadonly();
  readonly paginacion = this._paginacion.asReadonly();

  // Computed signals para datos derivados
  readonly totalPromociones = computed(() => this._promociones().length);
  readonly hayPromociones = computed(() => this._promociones().length > 0);
  readonly promocionesVigentes = computed(() =>
    obtenerPromocionesVigentes(this._promociones())
  );
  readonly promocionesDisponibles = computed(() =>
    obtenerPromocionesDisponibles(this._promociones())
  );
  readonly promocionesActivas = computed(() =>
    this._promociones().filter((p) => p.activo)
  );
  readonly promocionesInactivas = computed(() =>
    this._promociones().filter((p) => !p.activo)
  );
  readonly promocionesExpiradas = computed(() =>
    this._promociones().filter((p) => p.estado_promocion.expirada)
  );
  readonly promocionesAgotadas = computed(() =>
    this._promociones().filter((p) => p.estado_promocion.agotada)
  );
  readonly promocionesPorComenzar = computed(() =>
    this._promociones().filter((p) => p.estado_promocion.por_comenzar)
  );

  // Agrupaciones computed
  readonly promocionesPorTipo = computed(() =>
    agruparPorTipo(this._promociones())
  );
  readonly promocionesPorEstado = computed(() =>
    agruparPorEstado(this._promociones())
  );

  // Estadísticas computed
  readonly estadisticas = computed(() =>
    calcularEstadisticasPromociones(this._promociones())
  );

  // BehaviorSubjects para compatibilidad con observables existentes
  private readonly promocionesSubject = new BehaviorSubject<Promocion[]>([]);
  private readonly promocionActualSubject =
    new BehaviorSubject<Promocion | null>(null);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos
  readonly promociones$ = this.promocionesSubject.asObservable();
  readonly promocionActual$ = this.promocionActualSubject.asObservable();
  readonly cargando$ = this.cargandoSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  constructor() {
    // Sincronizar signals con BehaviorSubjects
    this.sincronizarEstados();
  }

  /**
   * Sincroniza los signals con los BehaviorSubjects para compatibilidad
   */
  private sincronizarEstados(): void {
    // Actualizar BehaviorSubjects cuando cambien los signals
    this._promociones.set = ((originalSet) => {
      return (value: Promocion[]) => {
        originalSet.call(this._promociones, value);
        this.promocionesSubject.next(value);
      };
    })(this._promociones.set);

    this._promocionActual.set = ((originalSet) => {
      return (value: Promocion | null) => {
        originalSet.call(this._promocionActual, value);
        this.promocionActualSubject.next(value);
      };
    })(this._promocionActual.set);

    this._cargando.set = ((originalSet) => {
      return (value: boolean) => {
        originalSet.call(this._cargando, value);
        this.cargandoSubject.next(value);
      };
    })(this._cargando.set);

    this._error.set = ((originalSet) => {
      return (value: string | null) => {
        originalSet.call(this._error, value);
        this.errorSubject.next(value);
      };
    })(this._error.set);
  }

  /**
   * Obtiene todas las promociones con filtros opcionales
   */
  obtenerPromociones(
    filtros: FiltrosPromocion = {}
  ): Observable<PromocionesResponse> {
    this._cargando.set(true);
    this._error.set(null);

    let params = new HttpParams();

    if (filtros.activo !== undefined) {
      params = params.set('activo', filtros.activo.toString());
    }
    if (filtros.tipo) {
      params = params.set('tipo', filtros.tipo);
    }
    if (filtros.vigente !== undefined) {
      params = params.set('vigente', filtros.vigente.toString());
    }
    if (filtros.search) {
      params = params.set('search', filtros.search);
    }
    if (filtros.per_page) {
      params = params.set('per_page', filtros.per_page.toString());
    }
    if (filtros.page) {
      params = params.set('page', filtros.page.toString());
    }

    return this.http.get<PromocionesResponse>(this.apiUrl, { params }).pipe(
      tap((response) => {
        this._promociones.set(response.data);
        this._paginacion.set(response.meta);
        this._filtros.set(filtros);
      }),
      catchError((error) => {
        this._error.set(this.manejarError(error));
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false))
    );
  }

  /**
   * Obtiene una promoción por ID
   */
  obtenerPromocionPorId(id: number): Observable<PromocionResponse> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http.get<PromocionResponse>(`${this.apiUrl}/${id}`).pipe(
      tap((response) => {
        this._promocionActual.set(response.data);
      }),
      catchError((error) => {
        this._error.set(this.manejarError(error));
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false))
    );
  }

  /**
   * Crea una nueva promoción
   */
  crearPromocion(
    promocion: CreatePromocionDto
  ): Observable<CreatePromocionResponse> {
    this._cargando.set(true);
    this._error.set(null);

    const formData = this.crearFormData(promocion);

    return this.http.post<CreatePromocionResponse>(this.apiUrl, formData).pipe(
      tap((response) => {
        const promocionesActuales = this._promociones();
        this._promociones.set([response.data, ...promocionesActuales]);
        this._promocionActual.set(response.data);
      }),
      catchError((error) => {
        this._error.set(this.manejarError(error));
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false))
    );
  }

  /**
   * Actualiza una promoción existente
   */
  actualizarPromocion(
    id: number,
    promocion: UpdatePromocionDto
  ): Observable<UpdatePromocionResponse> {
    this._cargando.set(true);
    this._error.set(null);

    const formData = this.crearFormData(promocion);

    return this.http
      .put<UpdatePromocionResponse>(`${this.apiUrl}/${id}`, formData)
      .pipe(
        tap((response) => {
          const promocionesActuales = this._promociones();
          const indice = promocionesActuales.findIndex((p) => p.id === id);
          if (indice !== -1) {
            const nuevasPromociones = [...promocionesActuales];
            nuevasPromociones[indice] = response.data;
            this._promociones.set(nuevasPromociones);
          }
          this._promocionActual.set(response.data);
        }),
        catchError((error) => {
          this._error.set(this.manejarError(error));
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Elimina una promoción
   */
  eliminarPromocion(id: number): Observable<DeletePromocionResponse> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .delete<DeletePromocionResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          const promocionesActuales = this._promociones();
          this._promociones.set(promocionesActuales.filter((p) => p.id !== id));

          if (this._promocionActual()?.id === id) {
            this._promocionActual.set(null);
          }
        }),
        catchError((error) => {
          this._error.set(this.manejarError(error));
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Cambia el estado activo de una promoción
   */
  toggleActivo(id: number): Observable<ToggleActivoResponse> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .post<ToggleActivoResponse>(`${this.apiUrl}/${id}/toggle-activo`, {})
      .pipe(
        tap((response) => {
          const promocionesActuales = this._promociones();
          const indice = promocionesActuales.findIndex((p) => p.id === id);
          if (indice !== -1) {
            const nuevasPromociones = [...promocionesActuales];
            nuevasPromociones[indice] = response.data;
            this._promociones.set(nuevasPromociones);
          }

          if (this._promocionActual()?.id === id) {
            this._promocionActual.set(response.data);
          }
        }),
        catchError((error) => {
          this._error.set(this.manejarError(error));
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Aplica una promoción a un pedido
   */
  aplicarPromocion(
    datos: AplicarPromocionDto
  ): Observable<AplicarPromocionResponse> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .post<AplicarPromocionResponse>(`${this.apiUrl}/aplicar`, datos)
      .pipe(
        catchError((error) => {
          this._error.set(this.manejarError(error));
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Obtiene promociones por tipo específico
   */
  obtenerPromocionesPorTipo(tipo: TipoPromocion): Promocion[] {
    return obtenerPromocionesPorTipo(this._promociones(), tipo);
  }

  /**
   * Obtiene promociones vigentes
   */
  obtenerPromocionesVigentes(): Promocion[] {
    return obtenerPromocionesVigentes(this._promociones());
  }

  /**
   * Obtiene promociones disponibles
   */
  obtenerPromocionesDisponibles(): Promocion[] {
    return obtenerPromocionesDisponibles(this._promociones());
  }

  /**
   * Busca promociones por texto
   */
  buscarPromociones(texto: string): Promocion[] {
    return buscarPromociones(this._promociones(), texto);
  }

  /**
   * Obtiene estadísticas de promociones
   */
  obtenerEstadisticas(): EstadisticasPromociones {
    return calcularEstadisticasPromociones(this._promociones());
  }

  /**
   * Refresca los datos desde el servidor
   */
  refrescar(): Observable<PromocionesResponse> {
    return this.obtenerPromociones(this._filtros());
  }

  /**
   * Cambia la página actual
   */
  cambiarPagina(pagina: number): Observable<PromocionesResponse> {
    const filtrosActuales = this._filtros();
    return this.obtenerPromociones({ ...filtrosActuales, page: pagina });
  }

  /**
   * Cambia el tamaño de página
   */
  cambiarTamanoPagina(tamanoPagina: number): Observable<PromocionesResponse> {
    const filtrosActuales = this._filtros();
    return this.obtenerPromociones({
      ...filtrosActuales,
      per_page: tamanoPagina,
      page: 1,
    });
  }

  /**
   * Aplica filtros de búsqueda
   */
  aplicarFiltros(filtros: FiltrosPromocion): Observable<PromocionesResponse> {
    return this.obtenerPromociones({ ...filtros, page: 1 });
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): Observable<PromocionesResponse> {
    return this.obtenerPromociones({});
  }

  /**
   * Limpia el estado actual
   */
  limpiarEstado(): void {
    this._promociones.set([]);
    this._promocionActual.set(null);
    this._error.set(null);
    this._filtros.set({});
    this._paginacion.set({
      total: 0,
      per_page: 15,
      current_page: 1,
    });
  }

  /**
   * Establece una promoción como actual
   */
  establecerPromocionActual(promocion: Promocion | null): void {
    this._promocionActual.set(promocion);
  }

  /**
   * Verifica si hay promociones cargadas
   */
  tienePromociones(): boolean {
    return this._promociones().length > 0;
  }

  /**
   * Obtiene una promoción por ID desde el estado local
   */
  obtenerPromocionLocal(id: number): Promocion | undefined {
    return this._promociones().find((p) => p.id === id);
  }

  /**
   * Verifica si una promoción existe en el estado local
   */
  existePromocion(id: number): boolean {
    return this._promociones().some((p) => p.id === id);
  }

  /**
   * Obtiene el total de páginas
   */
  getTotalPaginas(): number {
    const paginacion = this._paginacion();
    return Math.ceil(paginacion.total / paginacion.per_page);
  }

  /**
   * Verifica si hay página siguiente
   */
  tienePaginaSiguiente(): boolean {
    const paginacion = this._paginacion();
    return paginacion.current_page < this.getTotalPaginas();
  }

  /**
   * Verifica si hay página anterior
   */
  tienePaginaAnterior(): boolean {
    const paginacion = this._paginacion();
    return paginacion.current_page > 1;
  }

  /**
   * Crea FormData para envío de archivos
   */
  private crearFormData(
    datos: CreatePromocionDto | UpdatePromocionDto
  ): FormData {
    const formData = new FormData();

    Object.entries(datos).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === 'imagen' && value instanceof File) {
          formData.append(key, value);
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return formData;
  }

  /**
   * Maneja errores de la API
   */
  private manejarError(error: any): string {
    if (error.error && error.error.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Ha ocurrido un error inesperado';
  }
}
