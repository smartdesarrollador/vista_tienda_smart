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
  // Tipos principales
  PeriodoDashboard,
  MonedaDashboard,
  TipoAgrupacion,
  OrdenamientoProducto,
  RolUsuario,
  TipoAlerta,
  PrioridadAlerta,
  TipoActividad,
  TipoCache,

  // Interfaces de respuesta
  DashboardResumenResponse,
  DashboardVentasResponse,
  DashboardProductosResponse,
  DashboardUsuariosResponse,
  DashboardFinancierasResponse,
  DashboardAlertasResponse,
  DashboardActividadResponse,
  LimpiarCacheResponse,
  DashboardErrorResponse,

  // Interfaces de datos
  ResumenDashboard,
  EstadisticasVentasDetalladas,
  EstadisticasProductosDetalladas,
  EstadisticasUsuariosDetalladas,
  EstadisticasFinancierasDetalladas,
  AlertaSistema,
  ActividadReciente,

  // Interfaces de filtros
  DashboardFiltros,
  VentasFiltros,
  ProductosFiltros,
  UsuariosFiltros,
  FinancierasFiltros,
  AlertasFiltros,
  ActividadFiltros,
  LimpiarCacheRequest,

  // Constantes y utilidades
  DASHBOARD_CONSTANTS,
  DashboardUtils,
} from '../models/dashboard.interface';

/**
 * Servicio para gestión del dashboard administrativo
 * Implementa todas las operaciones del DashboardController.php
 */
@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/dashboard`;

  // Signals para estado reactivo del resumen principal
  private readonly _resumenDashboard = signal<ResumenDashboard | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastUpdated = signal<string | null>(null);
  private readonly _cached = signal<boolean>(false);

  // Signals para estadísticas específicas
  private readonly _estadisticasVentas =
    signal<EstadisticasVentasDetalladas | null>(null);
  private readonly _estadisticasProductos =
    signal<EstadisticasProductosDetalladas | null>(null);
  private readonly _estadisticasUsuarios =
    signal<EstadisticasUsuariosDetalladas | null>(null);
  private readonly _estadisticasFinancieras =
    signal<EstadisticasFinancierasDetalladas | null>(null);
  private readonly _alertas = signal<AlertaSistema[]>([]);
  private readonly _actividad = signal<ActividadReciente[]>([]);

  // Computed signals para datos derivados
  readonly resumenDashboard = this._resumenDashboard.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastUpdated = this._lastUpdated.asReadonly();
  readonly cached = this._cached.asReadonly();
  readonly hasError = computed(() => this._error() !== null);
  readonly hasData = computed(() => this._resumenDashboard() !== null);

  // Computed signals para estadísticas específicas
  readonly estadisticasVentas = this._estadisticasVentas.asReadonly();
  readonly estadisticasProductos = this._estadisticasProductos.asReadonly();
  readonly estadisticasUsuarios = this._estadisticasUsuarios.asReadonly();
  readonly estadisticasFinancieras = this._estadisticasFinancieras.asReadonly();
  readonly alertas = this._alertas.asReadonly();
  readonly actividad = this._actividad.asReadonly();

  // Computed signals para métricas derivadas
  readonly alertasAlta = computed(() =>
    this._alertas().filter((alerta) => alerta.prioridad === 'alta')
  );
  readonly alertasCount = computed(() => this._alertas().length);
  readonly alertasAltaCount = computed(() => this.alertasAlta().length);
  readonly actividadReciente = computed(() => this._actividad().slice(0, 10));

  // BehaviorSubject para filtros actuales
  private readonly _currentFilters = new BehaviorSubject<DashboardFiltros>({
    periodo: DASHBOARD_CONSTANTS.DEFAULT_PERIODO,
    incluir_cache: true,
  });
  readonly currentFilters$ = this._currentFilters.asObservable();

  /**
   * Obtiene el resumen general del dashboard
   */
  getResumen(
    filtros: DashboardFiltros = {}
  ): Observable<DashboardResumenResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();

    // Aplicar filtros
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<DashboardResumenResponse>(this.apiUrl, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._resumenDashboard.set(response.data);
            this._cached.set(response.cached);
            this._lastUpdated.set(response.data.ultima_actualizacion);
            this._currentFilters.next(filtros);

            // Actualizar alertas y actividad del resumen
            this._alertas.set(response.data.alertas);
            this._actividad.set(response.data.actividad_reciente);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene estadísticas detalladas de ventas
   */
  getEstadisticasVentas(
    filtros: VentasFiltros = {}
  ): Observable<DashboardVentasResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<DashboardVentasResponse>(`${this.apiUrl}/ventas`, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._estadisticasVentas.set(response.data);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene estadísticas detalladas de productos
   */
  getEstadisticasProductos(
    filtros: ProductosFiltros = {}
  ): Observable<DashboardProductosResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<DashboardProductosResponse>(`${this.apiUrl}/productos`, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._estadisticasProductos.set(response.data);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene estadísticas detalladas de usuarios
   */
  getEstadisticasUsuarios(
    filtros: UsuariosFiltros = {}
  ): Observable<DashboardUsuariosResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<DashboardUsuariosResponse>(`${this.apiUrl}/usuarios`, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._estadisticasUsuarios.set(response.data);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene estadísticas financieras detalladas
   */
  getEstadisticasFinancieras(
    filtros: FinancierasFiltros = {}
  ): Observable<DashboardFinancierasResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<DashboardFinancierasResponse>(`${this.apiUrl}/financieras`, {
        params,
      })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._estadisticasFinancieras.set(response.data);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene alertas del sistema
   */
  getAlertas(
    filtros: AlertasFiltros = {}
  ): Observable<DashboardAlertasResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<DashboardAlertasResponse>(`${this.apiUrl}/alertas`, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._alertas.set(response.data);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene actividad reciente del sistema
   */
  getActividad(
    filtros: ActividadFiltros = {}
  ): Observable<DashboardActividadResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<DashboardActividadResponse>(`${this.apiUrl}/actividad`, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._actividad.set(response.data);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Limpia el cache del dashboard
   */
  limpiarCache(
    request: LimpiarCacheRequest = {}
  ): Observable<LimpiarCacheResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .delete<LimpiarCacheResponse>(`${this.apiUrl}/cache`, {
        body: request,
      })
      .pipe(
        tap((response) => {
          if (response.success) {
            // Limpiar el estado local también
            this.clearState();
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Métodos de conveniencia para filtros comunes
   */

  /**
   * Obtiene resumen para el período actual
   */
  getResumenHoy(): Observable<DashboardResumenResponse> {
    return this.getResumen({ periodo: 'hoy' });
  }

  /**
   * Obtiene resumen para esta semana
   */
  getResumenSemana(): Observable<DashboardResumenResponse> {
    return this.getResumen({ periodo: 'semana' });
  }

  /**
   * Obtiene resumen para este mes
   */
  getResumenMes(): Observable<DashboardResumenResponse> {
    return this.getResumen({ periodo: 'mes' });
  }

  /**
   * Obtiene resumen para este trimestre
   */
  getResumenTrimestre(): Observable<DashboardResumenResponse> {
    return this.getResumen({ periodo: 'trimestre' });
  }

  /**
   * Obtiene resumen para este año
   */
  getResumenAño(): Observable<DashboardResumenResponse> {
    return this.getResumen({ periodo: 'año' });
  }

  /**
   * Obtiene ventas por período específico
   */
  getVentasPorPeriodo(
    periodo: PeriodoDashboard,
    moneda: MonedaDashboard = DASHBOARD_CONSTANTS.DEFAULT_MONEDA
  ): Observable<DashboardVentasResponse> {
    return this.getEstadisticasVentas({ periodo, moneda });
  }

  /**
   * Obtiene productos por categoría
   */
  getProductosPorCategoria(
    categoriaId: number
  ): Observable<DashboardProductosResponse> {
    return this.getEstadisticasProductos({ categoria_id: categoriaId });
  }

  /**
   * Obtiene usuarios por rol
   */
  getUsuariosPorRol(rol: RolUsuario): Observable<DashboardUsuariosResponse> {
    return this.getEstadisticasUsuarios({ rol });
  }

  /**
   * Obtiene alertas por prioridad
   */
  getAlertasPorPrioridad(
    prioridad: PrioridadAlerta
  ): Observable<DashboardAlertasResponse> {
    return this.getAlertas({ prioridad });
  }

  /**
   * Obtiene alertas de alta prioridad
   */
  getAlertasAlta(): Observable<DashboardAlertasResponse> {
    return this.getAlertasPorPrioridad('alta');
  }

  /**
   * Obtiene actividad por tipo
   */
  getActividadPorTipo(
    tipo: TipoActividad
  ): Observable<DashboardActividadResponse> {
    return this.getActividad({ tipo });
  }

  /**
   * Obtiene actividad reciente (últimas 24 horas)
   */
  getActividadReciente24h(): Observable<DashboardActividadResponse> {
    return this.getActividad({
      horas: DASHBOARD_CONSTANTS.DEFAULT_HORAS_ACTIVIDAD,
      limite: DASHBOARD_CONSTANTS.DEFAULT_LIMITE_ACTIVIDAD,
    });
  }

  /**
   * Métodos para trabajar con el estado local
   */

  /**
   * Obtiene KPIs del estado local
   */
  getKPIsFromState() {
    return computed(() => this._resumenDashboard()?.kpis);
  }

  /**
   * Obtiene estadísticas de ventas del estado local
   */
  getVentasFromState() {
    return computed(() => this._resumenDashboard()?.ventas);
  }

  /**
   * Obtiene estadísticas de productos del estado local
   */
  getProductosFromState() {
    return computed(() => this._resumenDashboard()?.productos);
  }

  /**
   * Obtiene estadísticas de usuarios del estado local
   */
  getUsuariosFromState() {
    return computed(() => this._resumenDashboard()?.usuarios);
  }

  /**
   * Obtiene estadísticas financieras del estado local
   */
  getFinancierasFromState() {
    return computed(() => this._resumenDashboard()?.financieras);
  }

  /**
   * Filtra alertas por tipo
   */
  getAlertasByTipo(tipo: TipoAlerta) {
    return computed(() =>
      this._alertas().filter((alerta) => alerta.tipo === tipo)
    );
  }

  /**
   * Filtra actividad por tipo
   */
  getActividadByTipo(tipo: string) {
    return computed(() =>
      this._actividad().filter((actividad) => actividad.tipo === tipo)
    );
  }

  /**
   * Obtiene el período actual
   */
  getCurrentPeriod(): PeriodoDashboard {
    return (
      this._currentFilters.value.periodo || DASHBOARD_CONSTANTS.DEFAULT_PERIODO
    );
  }

  /**
   * Verifica si los datos están en cache
   */
  isDataCached(): boolean {
    return this._cached();
  }

  /**
   * Obtiene la fecha de última actualización
   */
  getLastUpdateTime(): string | null {
    return this._lastUpdated();
  }

  /**
   * Refresca todos los datos del dashboard
   */
  refreshAll(): void {
    const currentFilters = this._currentFilters.value;
    this.getResumen(currentFilters).subscribe();
  }

  /**
   * Refresca solo el resumen principal
   */
  refreshResumen(): void {
    const currentFilters = this._currentFilters.value;
    this.getResumen({ ...currentFilters, incluir_cache: false }).subscribe();
  }

  /**
   * Limpia todo el estado del servicio
   */
  clearState(): void {
    this._resumenDashboard.set(null);
    this._estadisticasVentas.set(null);
    this._estadisticasProductos.set(null);
    this._estadisticasUsuarios.set(null);
    this._estadisticasFinancieras.set(null);
    this._alertas.set([]);
    this._actividad.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._lastUpdated.set(null);
    this._cached.set(false);
  }

  /**
   * Establece un período específico
   */
  setPeriod(periodo: PeriodoDashboard): void {
    const currentFilters = this._currentFilters.value;
    const newFilters = { ...currentFilters, periodo };
    this._currentFilters.next(newFilters);
    this.getResumen(newFilters).subscribe();
  }

  /**
   * Establece fechas personalizadas
   */
  setCustomDates(fechaDesde: string, fechaHasta: string): void {
    const currentFilters = this._currentFilters.value;
    const newFilters = {
      ...currentFilters,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      periodo: undefined, // Limpiar período predefinido
    };
    this._currentFilters.next(newFilters);
    this.getResumen(newFilters).subscribe();
  }

  /**
   * Exporta datos del dashboard
   */
  exportarDatos(formato: 'excel' | 'csv' | 'pdf' = 'excel'): Observable<Blob> {
    this._loading.set(true);
    this._error.set(null);

    const currentFilters = this._currentFilters.value;
    let params = new HttpParams();

    Object.entries(currentFilters).forEach(([key, value]) => {
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
   * Valida un período
   */
  validatePeriod(periodo: string): boolean {
    return DashboardUtils.isValidPeriod(periodo);
  }

  /**
   * Valida una moneda
   */
  validateCurrency(moneda: string): boolean {
    return DashboardUtils.isValidCurrency(moneda);
  }

  /**
   * Formatea un valor como moneda
   */
  formatCurrency(amount: number, currency: MonedaDashboard = 'PEN'): string {
    return DashboardUtils.formatCurrency(amount, currency);
  }

  /**
   * Formatea un porcentaje
   */
  formatPercentage(value: number, decimals: number = 1): string {
    return DashboardUtils.formatPercentage(value, decimals);
  }

  /**
   * Calcula variación porcentual
   */
  calculateVariation(current: number, previous: number): number {
    return DashboardUtils.calculateVariation(current, previous);
  }

  /**
   * Obtiene color para variación
   */
  getVariationColor(variation: number): string {
    return DashboardUtils.getVariationColor(variation);
  }

  /**
   * Formatea número de manera compacta
   */
  formatCompactNumber(num: number): string {
    return DashboardUtils.formatCompactNumber(num);
  }

  /**
   * Obtiene icono para actividad
   */
  getActivityIcon(tipo: string): string {
    return DashboardUtils.getActivityIcon(tipo);
  }

  /**
   * Obtiene color para alerta
   */
  getAlertColor(prioridad: PrioridadAlerta): string {
    return DashboardUtils.getAlertColor(prioridad);
  }

  /**
   * Genera fechas para período
   */
  generatePeriodDates(periodo: PeriodoDashboard) {
    return DashboardUtils.generatePeriodDates(periodo);
  }

  /**
   * Maneja errores HTTP de manera centralizada
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado en el dashboard';

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
    console.error('Error en DashboardService:', error);

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Utilidades del servicio (acceso a DashboardUtils)
   */
  readonly utils = DashboardUtils;
  readonly constants = DASHBOARD_CONSTANTS;
}
