import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  catchError,
  finalize,
  map,
  tap,
  throwError,
} from 'rxjs';
import {
  MetricaNegocio,
  MetricasNegocioResponse,
  CreateMetricaNegocioDto,
  UpdateMetricaNegocioDto,
  GenerarMetricasDto,
  FiltrosMetricaNegocio,
  PaginacionMetricaNegocio,
  ResumenPeriodoResponse,
  ResumenPeriodo,
  agruparMetricasPorMes,
  obtenerEstadisticasGenerales,
  buscarMetricas,
  ordenarMetricas,
} from '../models/metrica-negocio.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MetricaNegocioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/metricas-negocio`;

  // Estados reactivos con signals
  private readonly _metricas = signal<MetricaNegocio[]>([]);
  private readonly _metricaActual = signal<MetricaNegocio | null>(null);
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtros = signal<FiltrosMetricaNegocio>({});
  private readonly _paginacion = signal<PaginacionMetricaNegocio>({
    total: 0,
    per_page: 15,
    current_page: 1,
  });
  private readonly _resumenPeriodo = signal<ResumenPeriodo | null>(null);

  // Signals públicos readonly
  readonly metricas = this._metricas.asReadonly();
  readonly metricaActual = this._metricaActual.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filtros = this._filtros.asReadonly();
  readonly paginacion = this._paginacion.asReadonly();
  readonly resumenPeriodo = this._resumenPeriodo.asReadonly();

  // Computed signals
  readonly totalMetricas = computed(() => this._paginacion().total);
  readonly hayMetricas = computed(() => this._metricas().length > 0);
  readonly metricasPaginadas = computed(() => this._metricas());
  readonly metricasDelMesActual = computed(() => {
    const ahora = new Date();
    const year = ahora.getFullYear();
    const mes = ahora.getMonth() + 1;

    return this._metricas().filter((metrica) => {
      const fecha = new Date(metrica.fecha);
      return fecha.getFullYear() === year && fecha.getMonth() + 1 === mes;
    });
  });

  readonly estadisticasGenerales = computed(() =>
    obtenerEstadisticasGenerales(this._metricas())
  );

  readonly metricasAgrupadasPorMes = computed(() =>
    agruparMetricasPorMes(this._metricas())
  );

  readonly metricasExitosas = computed(() =>
    this._metricas().filter((m) => m.comparaciones.es_dia_exitoso)
  );

  readonly promedioVentasDiarias = computed(() => {
    const metricas = this._metricas();
    if (metricas.length === 0) return 0;
    return (
      metricas.reduce((sum, m) => sum + m.ventas_totales, 0) / metricas.length
    );
  });

  // BehaviorSubjects para compatibilidad con código existente
  private readonly _metricasSubject = new BehaviorSubject<MetricaNegocio[]>([]);
  private readonly _cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly _errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos para compatibilidad
  readonly metricas$ = this._metricasSubject.asObservable();
  readonly cargando$ = this._cargandoSubject.asObservable();
  readonly error$ = this._errorSubject.asObservable();

  constructor() {
    // Sincronizar signals con BehaviorSubjects
    this.sincronizarEstados();
  }

  private sincronizarEstados(): void {
    // Sincronizar métricas
    this._metricas.set(this._metricasSubject.value);

    // Observar cambios en signals y actualizar BehaviorSubjects
    setInterval(() => {
      if (this._metricasSubject.value !== this._metricas()) {
        this._metricasSubject.next(this._metricas());
      }
      if (this._cargandoSubject.value !== this._cargando()) {
        this._cargandoSubject.next(this._cargando());
      }
      if (this._errorSubject.value !== this._error()) {
        this._errorSubject.next(this._error());
      }
    }, 100);
  }

  /**
   * Obtener métricas con filtros y paginación
   */
  obtenerMetricas(
    filtros: FiltrosMetricaNegocio = {}
  ): Observable<MetricasNegocioResponse> {
    this._cargando.set(true);
    this._error.set(null);

    let params = new HttpParams();

    if (filtros.fecha_desde)
      params = params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta)
      params = params.set('fecha_hasta', filtros.fecha_hasta);
    if (filtros.mes) params = params.set('mes', filtros.mes.toString());
    if (filtros.year) params = params.set('year', filtros.year.toString());
    if (filtros.per_page)
      params = params.set('per_page', filtros.per_page.toString());
    if (filtros.page) params = params.set('page', filtros.page.toString());

    return this.http
      .get<MetricasNegocioResponse>(this.baseUrl, { params })
      .pipe(
        tap((response) => {
          this._metricas.set(response.data);
          this._paginacion.set(response.meta);
          this._filtros.set(filtros);
        }),
        catchError((error) => {
          const mensaje =
            error.error?.message || 'Error al obtener las métricas de negocio';
          this._error.set(mensaje);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Obtener métrica por ID
   */
  obtenerMetricaPorId(id: number): Observable<MetricaNegocio> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .get<{ data: MetricaNegocio }>(`${this.baseUrl}/${id}`)
      .pipe(
        map((response) => response.data),
        tap((metrica) => this._metricaActual.set(metrica)),
        catchError((error) => {
          const mensaje =
            error.error?.message || 'Error al obtener la métrica de negocio';
          this._error.set(mensaje);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Crear nueva métrica
   */
  crearMetrica(datos: CreateMetricaNegocioDto): Observable<MetricaNegocio> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .post<{ data: MetricaNegocio; message: string }>(this.baseUrl, datos)
      .pipe(
        map((response) => response.data),
        tap((nuevaMetrica) => {
          const metricasActuales = this._metricas();
          this._metricas.set([nuevaMetrica, ...metricasActuales]);
          this._metricaActual.set(nuevaMetrica);
        }),
        catchError((error) => {
          const mensaje =
            error.error?.message || 'Error al crear la métrica de negocio';
          this._error.set(mensaje);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Actualizar métrica existente
   */
  actualizarMetrica(
    id: number,
    datos: UpdateMetricaNegocioDto
  ): Observable<MetricaNegocio> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .put<{ data: MetricaNegocio; message: string }>(
        `${this.baseUrl}/${id}`,
        datos
      )
      .pipe(
        map((response) => response.data),
        tap((metricaActualizada) => {
          const metricas = this._metricas().map((m) =>
            m.id === id ? metricaActualizada : m
          );
          this._metricas.set(metricas);
          this._metricaActual.set(metricaActualizada);
        }),
        catchError((error) => {
          const mensaje =
            error.error?.message || 'Error al actualizar la métrica de negocio';
          this._error.set(mensaje);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Eliminar métrica
   */
  eliminarMetrica(id: number): Observable<void> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`).pipe(
      map(() => void 0),
      tap(() => {
        const metricas = this._metricas().filter((m) => m.id !== id);
        this._metricas.set(metricas);

        if (this._metricaActual()?.id === id) {
          this._metricaActual.set(null);
        }
      }),
      catchError((error) => {
        const mensaje =
          error.error?.message || 'Error al eliminar la métrica de negocio';
        this._error.set(mensaje);
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false))
    );
  }

  /**
   * Obtener resumen de período
   */
  obtenerResumenPeriodo(
    fechaDesde: string,
    fechaHasta: string
  ): Observable<ResumenPeriodoResponse> {
    this._cargando.set(true);
    this._error.set(null);

    const params = new HttpParams()
      .set('fecha_desde', fechaDesde)
      .set('fecha_hasta', fechaHasta);

    return this.http
      .get<ResumenPeriodoResponse>(`${this.baseUrl}/resumen/periodo`, {
        params,
      })
      .pipe(
        tap((response) => {
          this._resumenPeriodo.set(response.resumen);
        }),
        catchError((error) => {
          const mensaje =
            error.error?.message || 'Error al obtener el resumen del período';
          this._error.set(mensaje);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Generar métricas diarias automáticamente
   */
  generarMetricasDiarias(
    datos: GenerarMetricasDto
  ): Observable<MetricaNegocio> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .post<{ data: MetricaNegocio; message: string }>(
        `${this.baseUrl}/generar/diarias`,
        datos
      )
      .pipe(
        map((response) => response.data),
        tap((nuevaMetrica) => {
          const metricasActuales = this._metricas();
          this._metricas.set([nuevaMetrica, ...metricasActuales]);
          this._metricaActual.set(nuevaMetrica);
        }),
        catchError((error) => {
          const mensaje =
            error.error?.message || 'Error al generar las métricas diarias';
          this._error.set(mensaje);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Buscar métricas por término
   */
  buscarMetricas(termino: string): void {
    const metricasOriginales = this._metricasSubject.value;
    const metricasFiltradas = buscarMetricas(metricasOriginales, termino);
    this._metricas.set(metricasFiltradas);
  }

  /**
   * Ordenar métricas
   */
  ordenarMetricas(
    campo: keyof MetricaNegocio,
    direccion: 'asc' | 'desc' = 'desc'
  ): void {
    const metricasOrdenadas = ordenarMetricas(
      this._metricas(),
      campo,
      direccion
    );
    this._metricas.set(metricasOrdenadas);
  }

  /**
   * Filtrar métricas por mes y año
   */
  filtrarPorMes(year: number, mes: number): void {
    const filtros: FiltrosMetricaNegocio = { year, mes };
    this.obtenerMetricas(filtros).subscribe();
  }

  /**
   * Filtrar métricas por rango de fechas
   */
  filtrarPorRangoFechas(fechaDesde: string, fechaHasta: string): void {
    const filtros: FiltrosMetricaNegocio = {
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
    };
    this.obtenerMetricas(filtros).subscribe();
  }

  /**
   * Cambiar página
   */
  cambiarPagina(pagina: number): void {
    const filtrosActuales = this._filtros();
    const nuevosFiltros = { ...filtrosActuales, page: pagina };
    this.obtenerMetricas(nuevosFiltros).subscribe();
  }

  /**
   * Cambiar elementos por página
   */
  cambiarElementosPorPagina(perPage: number): void {
    const filtrosActuales = this._filtros();
    const nuevosFiltros = { ...filtrosActuales, per_page: perPage, page: 1 };
    this.obtenerMetricas(nuevosFiltros).subscribe();
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    this._filtros.set({});
    this.obtenerMetricas().subscribe();
  }

  /**
   * Limpiar error
   */
  limpiarError(): void {
    this._error.set(null);
  }

  /**
   * Limpiar métrica actual
   */
  limpiarMetricaActual(): void {
    this._metricaActual.set(null);
  }

  /**
   * Refrescar métricas
   */
  refrescar(): void {
    const filtrosActuales = this._filtros();
    this.obtenerMetricas(filtrosActuales).subscribe();
  }

  /**
   * Obtener métricas del mes actual
   */
  obtenerMetricasMesActual(): Observable<MetricasNegocioResponse> {
    const ahora = new Date();
    const filtros: FiltrosMetricaNegocio = {
      year: ahora.getFullYear(),
      mes: ahora.getMonth() + 1,
    };
    return this.obtenerMetricas(filtros);
  }

  /**
   * Obtener métricas de la semana actual
   */
  obtenerMetricasSemanaActual(): Observable<MetricasNegocioResponse> {
    const ahora = new Date();
    const inicioSemana = new Date(ahora);
    inicioSemana.setDate(ahora.getDate() - ahora.getDay());

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);

    const filtros: FiltrosMetricaNegocio = {
      fecha_desde: inicioSemana.toISOString().split('T')[0],
      fecha_hasta: finSemana.toISOString().split('T')[0],
    };

    return this.obtenerMetricas(filtros);
  }

  /**
   * Verificar si existe métrica para una fecha
   */
  existeMetricaParaFecha(fecha: string): boolean {
    return this._metricas().some((m) => m.fecha === fecha);
  }

  /**
   * Obtener métrica por fecha
   */
  obtenerMetricaPorFecha(fecha: string): MetricaNegocio | null {
    return this._metricas().find((m) => m.fecha === fecha) || null;
  }

  /**
   * Obtener métricas más recientes
   */
  obtenerMetricasRecientes(limite: number = 7): MetricaNegocio[] {
    return this._metricas()
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, limite);
  }

  /**
   * Calcular tendencia de ventas
   */
  calcularTendenciaVentas(dias: number = 7): {
    tendencia: 'positiva' | 'negativa' | 'neutral';
    porcentaje: number;
    ventasActuales: number;
    ventasAnteriores: number;
  } {
    const metricasRecientes = this.obtenerMetricasRecientes(dias * 2);

    if (metricasRecientes.length < dias * 2) {
      return {
        tendencia: 'neutral',
        porcentaje: 0,
        ventasActuales: 0,
        ventasAnteriores: 0,
      };
    }

    const ventasActuales = metricasRecientes
      .slice(0, dias)
      .reduce((sum, m) => sum + m.ventas_totales, 0);

    const ventasAnteriores = metricasRecientes
      .slice(dias, dias * 2)
      .reduce((sum, m) => sum + m.ventas_totales, 0);

    const porcentaje =
      ventasAnteriores > 0
        ? ((ventasActuales - ventasAnteriores) / ventasAnteriores) * 100
        : 0;

    let tendencia: 'positiva' | 'negativa' | 'neutral' = 'neutral';
    if (porcentaje > 0) tendencia = 'positiva';
    else if (porcentaje < 0) tendencia = 'negativa';

    return {
      tendencia,
      porcentaje: Math.abs(porcentaje),
      ventasActuales,
      ventasAnteriores,
    };
  }

  /**
   * Exportar métricas a CSV
   */
  exportarCSV(metricas: MetricaNegocio[] = this._metricas()): string {
    if (metricas.length === 0) return '';

    const headers = [
      'Fecha',
      'Pedidos Totales',
      'Pedidos Entregados',
      'Pedidos Cancelados',
      'Ventas Totales',
      'Costo Envíos',
      'Nuevos Clientes',
      'Clientes Recurrentes',
      'Tiempo Promedio Entrega',
      'Productos Vendidos',
      'Ticket Promedio',
      'Tasa Entrega (%)',
      'Tasa Cancelación (%)',
      'Eficiencia Entrega',
      'Rentabilidad Día',
    ];

    const rows = metricas.map((m) => [
      m.fecha_formateada,
      m.pedidos_totales,
      m.pedidos_entregados,
      m.pedidos_cancelados,
      m.ventas_totales,
      m.costo_envios,
      m.nuevos_clientes,
      m.clientes_recurrentes,
      m.tiempo_promedio_entrega,
      m.productos_vendidos,
      m.ticket_promedio,
      m.metricas_porcentuales.tasa_entrega,
      m.metricas_porcentuales.tasa_cancelacion,
      m.kpis.eficiencia_entrega,
      m.kpis.rentabilidad_dia,
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
  }
}
