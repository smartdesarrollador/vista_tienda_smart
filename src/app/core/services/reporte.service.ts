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
  TipoReporte,
  CategoriaReporte,
  FormatoExportacion,
  PeriodoReporte,
  MonedaReporte,
  AgrupacionReporte,
  EstadoPedidoReporte,
  CanalVentaReporte,
  SegmentacionCliente,
  ModuloPersonalizado,

  // Interfaces de respuesta
  ListaReportesResponse,
  ReporteVentasResponse,
  ReporteInventarioResponse,
  ReporteClientesResponse,
  ReporteFinancieroResponse,
  ReportePersonalizadoResponse,
  EstadisticasReportesResponse,
  ExportacionResponse,
  ReporteErrorResponse,

  // Interfaces de datos
  ReporteDisponible,
  DatosReporteVentas,
  DatosReporteInventario,
  DatosReporteClientes,
  DatosReporteFinanciero,
  DatosReportePersonalizado,
  DatosEstadisticasReportes,

  // Interfaces de filtros y parámetros
  ListaReportesFiltros,
  ParametrosReporteVentas,
  ParametrosReporteInventario,
  ParametrosReporteClientes,
  ParametrosReporteFinanciero,
  ParametrosReportePersonalizado,
  ParametrosEstadisticasReportes,

  // Constantes y utilidades
  REPORTE_CONSTANTS,
  CATEGORIAS_REPORTES,
  ICONOS_REPORTES,
  COLORES_REPORTES,
  ReporteUtils,
} from '../models/reporte.interface';

/**
 * Servicio para gestión del sistema de reportes
 * Implementa todas las operaciones del ReporteController.php
 */
@Injectable({
  providedIn: 'root',
})
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/reportes`;

  // Signals para estado reactivo
  private readonly _reportesDisponibles = signal<ReporteDisponible[]>([]);
  private readonly _reporteVentas = signal<DatosReporteVentas | null>(null);
  private readonly _reporteInventario = signal<DatosReporteInventario | null>(
    null
  );
  private readonly _reporteClientes = signal<DatosReporteClientes | null>(null);
  private readonly _reporteFinanciero = signal<DatosReporteFinanciero | null>(
    null
  );
  private readonly _reportePersonalizado =
    signal<DatosReportePersonalizado | null>(null);
  private readonly _estadisticasReportes =
    signal<DatosEstadisticasReportes | null>(null);

  // Signals de estado
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastUpdated = signal<string | null>(null);
  private readonly _cached = signal<boolean>(false);

  // Computed signals para datos derivados
  readonly reportesDisponibles = this._reportesDisponibles.asReadonly();
  readonly reporteVentas = this._reporteVentas.asReadonly();
  readonly reporteInventario = this._reporteInventario.asReadonly();
  readonly reporteClientes = this._reporteClientes.asReadonly();
  readonly reporteFinanciero = this._reporteFinanciero.asReadonly();
  readonly reportePersonalizado = this._reportePersonalizado.asReadonly();
  readonly estadisticasReportes = this._estadisticasReportes.asReadonly();

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastUpdated = this._lastUpdated.asReadonly();
  readonly cached = this._cached.asReadonly();
  readonly hasError = computed(() => this._error() !== null);
  readonly hasReportes = computed(() => this._reportesDisponibles().length > 0);

  // Computed signals para filtros y agrupaciones
  readonly reportesPorCategoria = computed(() => {
    const reportes = this._reportesDisponibles();
    const agrupados: Record<CategoriaReporte, ReporteDisponible[]> = {
      ventas: [],
      productos: [],
      usuarios: [],
      financieros: [],
      inventario: [],
      marketing: [],
    };

    reportes.forEach((reporte) => {
      if (agrupados[reporte.categoria]) {
        agrupados[reporte.categoria].push(reporte);
      }
    });

    return agrupados;
  });

  readonly totalReportes = computed(() => this._reportesDisponibles().length);

  // BehaviorSubject para filtros actuales
  private readonly _currentFilters = new BehaviorSubject<ListaReportesFiltros>({
    incluir_metadatos: true,
  });
  readonly currentFilters$ = this._currentFilters.asObservable();

  /**
   * Obtiene la lista de reportes disponibles
   */
  getReportesDisponibles(
    filtros: ListaReportesFiltros = {}
  ): Observable<ListaReportesResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();

    // Aplicar filtros
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ListaReportesResponse>(this.apiUrl, { params }).pipe(
      tap((response) => {
        if (response.success) {
          this._reportesDisponibles.set(response.data.reportes_disponibles);
          this._lastUpdated.set(new Date().toISOString());
          this._currentFilters.next(filtros);
        }
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Genera reporte de ventas
   */
  generarReporteVentas(
    parametros: ParametrosReporteVentas
  ): Observable<ReporteVentasResponse | Blob> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    Object.entries(parametros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    // Si el formato no es JSON, devolver blob para descarga
    if (parametros.formato && parametros.formato !== 'json') {
      return this.http
        .get(`${this.apiUrl}/ventas`, {
          params,
          responseType: 'blob',
        })
        .pipe(
          catchError((error) => this.handleError(error)),
          finalize(() => this._loading.set(false))
        );
    }

    return this.http
      .get<ReporteVentasResponse>(`${this.apiUrl}/ventas`, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._reporteVentas.set(response.data);
            this._lastUpdated.set(response.data.generado_en);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Genera reporte de inventario
   */
  generarReporteInventario(
    parametros: ParametrosReporteInventario = {}
  ): Observable<ReporteInventarioResponse | Blob> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    Object.entries(parametros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    // Si el formato no es JSON, devolver blob para descarga
    if (parametros.formato && parametros.formato !== 'json') {
      return this.http
        .get(`${this.apiUrl}/inventario`, {
          params,
          responseType: 'blob',
        })
        .pipe(
          catchError((error) => this.handleError(error)),
          finalize(() => this._loading.set(false))
        );
    }

    return this.http
      .get<ReporteInventarioResponse>(`${this.apiUrl}/inventario`, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._reporteInventario.set(response.data);
            this._lastUpdated.set(response.data.generado_en);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Genera reporte de clientes
   */
  generarReporteClientes(
    parametros: ParametrosReporteClientes = {}
  ): Observable<ReporteClientesResponse | Blob> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    Object.entries(parametros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    // Si el formato no es JSON, devolver blob para descarga
    if (parametros.formato && parametros.formato !== 'json') {
      return this.http
        .get(`${this.apiUrl}/clientes`, {
          params,
          responseType: 'blob',
        })
        .pipe(
          catchError((error) => this.handleError(error)),
          finalize(() => this._loading.set(false))
        );
    }

    return this.http
      .get<ReporteClientesResponse>(`${this.apiUrl}/clientes`, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._reporteClientes.set(response.data);
            this._lastUpdated.set(response.data.generado_en);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Genera reporte financiero
   */
  generarReporteFinanciero(
    parametros: ParametrosReporteFinanciero
  ): Observable<ReporteFinancieroResponse | Blob> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    Object.entries(parametros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    // Si el formato no es JSON, devolver blob para descarga
    if (parametros.formato && parametros.formato !== 'json') {
      return this.http
        .get(`${this.apiUrl}/financiero`, {
          params,
          responseType: 'blob',
        })
        .pipe(
          catchError((error) => this.handleError(error)),
          finalize(() => this._loading.set(false))
        );
    }

    return this.http
      .get<ReporteFinancieroResponse>(`${this.apiUrl}/financiero`, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._reporteFinanciero.set(response.data);
            this._lastUpdated.set(response.data.generado_en);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Genera reporte personalizado
   */
  generarReportePersonalizado(
    parametros: ParametrosReportePersonalizado
  ): Observable<ReportePersonalizadoResponse | Blob> {
    this._loading.set(true);
    this._error.set(null);

    // Si el formato no es JSON, devolver blob para descarga
    if (parametros.formato && parametros.formato !== 'json') {
      return this.http
        .post(`${this.apiUrl}/personalizado`, parametros, {
          responseType: 'blob',
        })
        .pipe(
          catchError((error) => this.handleError(error)),
          finalize(() => this._loading.set(false))
        );
    }

    return this.http
      .post<ReportePersonalizadoResponse>(
        `${this.apiUrl}/personalizado`,
        parametros
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this._reportePersonalizado.set(response.data);
            this._lastUpdated.set(response.data.generado_en);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtiene estadísticas generales de reportes
   */
  getEstadisticasReportes(
    parametros: ParametrosEstadisticasReportes = {}
  ): Observable<EstadisticasReportesResponse> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    Object.entries(parametros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<EstadisticasReportesResponse>(`${this.apiUrl}/estadisticas`, {
        params,
      })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._estadisticasReportes.set(response.data);
            this._cached.set(response.cached || false);
            this._lastUpdated.set(response.data.ultima_actualizacion);
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Métodos de conveniencia para reportes específicos
   */

  /**
   * Genera reporte de ventas por período
   */
  getReporteVentasPorPeriodo(
    periodo: PeriodoReporte,
    moneda: MonedaReporte = REPORTE_CONSTANTS.DEFAULT_MONEDA
  ): Observable<ReporteVentasResponse> {
    const fechas = ReporteUtils.generatePeriodDates(periodo);
    return this.generarReporteVentas({
      fecha_inicio: fechas.desde,
      fecha_fin: fechas.hasta,
      moneda,
    }) as Observable<ReporteVentasResponse>;
  }

  /**
   * Genera reporte de inventario por categoría
   */
  getReporteInventarioPorCategoria(
    categoriaId: number
  ): Observable<ReporteInventarioResponse> {
    return this.generarReporteInventario({
      categoria_id: categoriaId,
      incluir_variaciones: true,
      incluir_valoracion: true,
    }) as Observable<ReporteInventarioResponse>;
  }

  /**
   * Genera reporte de clientes por segmentación
   */
  getReporteClientesPorSegmentacion(
    segmentacion: SegmentacionCliente
  ): Observable<ReporteClientesResponse> {
    return this.generarReporteClientes({
      segmentacion,
      incluir_geografico: true,
      incluir_comportamiento: true,
    }) as Observable<ReporteClientesResponse>;
  }

  /**
   * Genera reporte financiero con proyecciones
   */
  getReporteFinancieroConProyecciones(
    fechaInicio: string,
    fechaFin: string,
    moneda: MonedaReporte = REPORTE_CONSTANTS.DEFAULT_MONEDA
  ): Observable<ReporteFinancieroResponse> {
    return this.generarReporteFinanciero({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      moneda,
      incluir_proyecciones: true,
      incluir_creditos: true,
      incluir_cupones: true,
    }) as Observable<ReporteFinancieroResponse>;
  }

  /**
   * Métodos para trabajar con el estado local
   */

  /**
   * Obtiene reportes por categoría específica
   */
  getReportesPorCategoria(categoria: CategoriaReporte) {
    return computed(() =>
      this._reportesDisponibles().filter(
        (reporte) => reporte.categoria === categoria
      )
    );
  }

  /**
   * Busca reportes por nombre o descripción
   */
  buscarReportes(termino: string) {
    return computed(() => {
      const reportes = this._reportesDisponibles();
      if (!termino.trim()) return reportes;

      const terminoLower = termino.toLowerCase();
      return reportes.filter(
        (reporte) =>
          reporte.nombre.toLowerCase().includes(terminoLower) ||
          reporte.descripcion.toLowerCase().includes(terminoLower)
      );
    });
  }

  /**
   * Obtiene reportes que soportan un formato específico
   */
  getReportesPorFormato(formato: FormatoExportacion) {
    return computed(() =>
      this._reportesDisponibles().filter((reporte) =>
        reporte.formatos_soportados.includes(formato)
      )
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
   * Limpia todo el estado del servicio
   */
  clearState(): void {
    this._reportesDisponibles.set([]);
    this._reporteVentas.set(null);
    this._reporteInventario.set(null);
    this._reporteClientes.set(null);
    this._reporteFinanciero.set(null);
    this._reportePersonalizado.set(null);
    this._estadisticasReportes.set(null);
    this._loading.set(false);
    this._error.set(null);
    this._lastUpdated.set(null);
    this._cached.set(false);
  }

  /**
   * Refresca la lista de reportes disponibles
   */
  refreshReportes(): void {
    const currentFilters = this._currentFilters.value;
    this.getReportesDisponibles(currentFilters).subscribe();
  }

  /**
   * Descarga un archivo de reporte
   */
  descargarReporte(
    tipo: TipoReporte,
    parametros: any,
    formato: FormatoExportacion
  ): Observable<Blob> {
    this._loading.set(true);
    this._error.set(null);

    const parametrosConFormato = { ...parametros, formato };
    let request: Observable<Blob>;

    switch (tipo) {
      case 'ventas':
        request = this.generarReporteVentas(
          parametrosConFormato
        ) as Observable<Blob>;
        break;
      case 'inventario':
        request = this.generarReporteInventario(
          parametrosConFormato
        ) as Observable<Blob>;
        break;
      case 'clientes':
        request = this.generarReporteClientes(
          parametrosConFormato
        ) as Observable<Blob>;
        break;
      case 'financiero':
        request = this.generarReporteFinanciero(
          parametrosConFormato
        ) as Observable<Blob>;
        break;
      case 'personalizado':
        request = this.generarReportePersonalizado(
          parametrosConFormato
        ) as Observable<Blob>;
        break;
      default:
        return throwError(() => new Error('Tipo de reporte no válido'));
    }

    return request.pipe(finalize(() => this._loading.set(false)));
  }

  /**
   * Procesa la descarga de un blob
   */
  procesarDescargaBlob(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Valida parámetros de reporte
   */
  validarParametrosReporte(tipo: TipoReporte, parametros: any): boolean {
    const reporte = this._reportesDisponibles().find((r) => r.codigo === tipo);
    if (!reporte) return false;

    // Verificar parámetros requeridos
    return reporte.parametros_requeridos.every(
      (param) =>
        parametros[param] !== undefined &&
        parametros[param] !== null &&
        parametros[param] !== ''
    );
  }

  /**
   * Obtiene la configuración de un reporte
   */
  getConfiguracionReporte(tipo: TipoReporte): ReporteDisponible | null {
    return this._reportesDisponibles().find((r) => r.codigo === tipo) || null;
  }

  /**
   * Valida un tipo de reporte
   */
  validateTipoReporte(tipo: string): boolean {
    return ReporteUtils.isValidTipoReporte(tipo);
  }

  /**
   * Valida un formato de exportación
   */
  validateFormato(formato: string): boolean {
    return ReporteUtils.isValidFormato(formato);
  }

  /**
   * Valida una moneda
   */
  validateMoneda(moneda: string): boolean {
    return ReporteUtils.isValidMoneda(moneda);
  }

  /**
   * Obtiene el icono para un tipo de reporte
   */
  getIconoReporte(tipo: TipoReporte): string {
    return ReporteUtils.getIconoReporte(tipo);
  }

  /**
   * Obtiene el color para un tipo de reporte
   */
  getColorReporte(tipo: TipoReporte): string {
    return ReporteUtils.getColorReporte(tipo);
  }

  /**
   * Formatea el tamaño de archivo
   */
  formatFileSize(bytes: number): string {
    return ReporteUtils.formatFileSize(bytes);
  }

  /**
   * Genera nombre de archivo
   */
  generateFileName(tipo: TipoReporte, formato: FormatoExportacion): string {
    return ReporteUtils.generateFileName(tipo, formato);
  }

  /**
   * Valida rango de fechas
   */
  validateDateRange(fechaInicio: string, fechaFin: string): boolean {
    return ReporteUtils.validateDateRange(fechaInicio, fechaFin);
  }

  /**
   * Calcula días del período
   */
  calculatePeriodDays(fechaInicio: string, fechaFin: string): number {
    return ReporteUtils.calculatePeriodDays(fechaInicio, fechaFin);
  }

  /**
   * Genera fechas para período
   */
  generatePeriodDates(periodo: PeriodoReporte) {
    return ReporteUtils.generatePeriodDates(periodo);
  }

  /**
   * Maneja errores HTTP de manera centralizada
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage =
      'Ha ocurrido un error inesperado en el sistema de reportes';

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
    console.error('Error en ReporteService:', error);

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Utilidades del servicio (acceso a ReporteUtils)
   */
  readonly utils = ReporteUtils;
  readonly constants = REPORTE_CONSTANTS;
  readonly categorias = CATEGORIAS_REPORTES;
  readonly iconos = ICONOS_REPORTES;
  readonly colores = COLORES_REPORTES;
}
