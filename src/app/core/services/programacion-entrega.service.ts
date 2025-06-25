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
  ProgramacionEntrega,
  ProgramacionEntregaResponse,
  CreateProgramacionEntregaDto,
  UpdateProgramacionEntregaDto,
  CambiarEstadoDto,
  ReprogramarEntregaDto,
  RutaRepartidorDto,
  RutaRepartidorResponse,
  FiltrosProgramacionEntrega,
  PaginacionProgramacionEntrega,
  EstadoProgramacion,
  agruparPorEstado,
  agruparPorRepartidor,
  agruparPorFecha,
  filtrarPorEstado,
  filtrarQueRequierenAtencion,
  filtrarEntregasHoy,
  filtrarEntregasPendientes,
  ordenarPorRuta,
  ordenarPorFecha,
  buscarProgramaciones,
  obtenerEstadisticasRuta,
  validarVentanaEntrega,
  validarFechaProgramacion,
} from '../models/programacion-entrega.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProgramacionEntregaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/programacion-entregas`;

  // Estados reactivos con signals
  private readonly _programaciones = signal<ProgramacionEntrega[]>([]);
  private readonly _programacionActual = signal<ProgramacionEntrega | null>(
    null
  );
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtros = signal<FiltrosProgramacionEntrega>({});
  private readonly _paginacion = signal<PaginacionProgramacionEntrega>({
    total: 0,
    per_page: 15,
    current_page: 1,
  });
  private readonly _rutaRepartidor = signal<RutaRepartidorResponse | null>(
    null
  );

  // Signals públicos readonly
  readonly programaciones = this._programaciones.asReadonly();
  readonly programacionActual = this._programacionActual.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filtros = this._filtros.asReadonly();
  readonly paginacion = this._paginacion.asReadonly();
  readonly rutaRepartidor = this._rutaRepartidor.asReadonly();

  // Computed signals
  readonly totalProgramaciones = computed(() => this._paginacion().total);
  readonly hayProgramaciones = computed(
    () => this._programaciones().length > 0
  );
  readonly programacionesPaginadas = computed(() => this._programaciones());

  readonly programacionesHoy = computed(() =>
    filtrarEntregasHoy(this._programaciones())
  );

  readonly programacionesPendientes = computed(() =>
    filtrarEntregasPendientes(this._programaciones())
  );

  readonly programacionesQueRequierenAtencion = computed(() =>
    filtrarQueRequierenAtencion(this._programaciones())
  );

  readonly programacionesPorEstado = computed(() =>
    agruparPorEstado(this._programaciones())
  );

  readonly programacionesPorRepartidor = computed(() =>
    agruparPorRepartidor(this._programaciones())
  );

  readonly programacionesPorFecha = computed(() =>
    agruparPorFecha(this._programaciones())
  );

  readonly estadisticasGenerales = computed(() =>
    obtenerEstadisticasRuta(this._programaciones())
  );

  readonly programacionesOrdenadas = computed(() =>
    ordenarPorRuta(this._programaciones())
  );

  readonly programacionesProgramadas = computed(() =>
    filtrarPorEstado(this._programaciones(), 'programado')
  );

  readonly programacionesEnRuta = computed(() =>
    filtrarPorEstado(this._programaciones(), 'en_ruta')
  );

  readonly programacionesEntregadas = computed(() =>
    filtrarPorEstado(this._programaciones(), 'entregado')
  );

  readonly programacionesFallidas = computed(() =>
    filtrarPorEstado(this._programaciones(), 'fallido')
  );

  readonly programacionesReprogramadas = computed(() =>
    filtrarPorEstado(this._programaciones(), 'reprogramado')
  );

  // BehaviorSubjects para compatibilidad con código existente
  private readonly _programacionesSubject = new BehaviorSubject<
    ProgramacionEntrega[]
  >([]);
  private readonly _cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly _errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos para compatibilidad
  readonly programaciones$ = this._programacionesSubject.asObservable();
  readonly cargando$ = this._cargandoSubject.asObservable();
  readonly error$ = this._errorSubject.asObservable();

  constructor() {
    // Sincronizar signals con BehaviorSubjects
    this.sincronizarEstados();
  }

  private sincronizarEstados(): void {
    // Sincronizar programaciones
    this._programaciones.set(this._programacionesSubject.value);

    // Observar cambios en signals y actualizar BehaviorSubjects
    setInterval(() => {
      if (this._programacionesSubject.value !== this._programaciones()) {
        this._programacionesSubject.next(this._programaciones());
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
   * Obtener programaciones con filtros y paginación
   */
  obtenerProgramaciones(
    filtros: FiltrosProgramacionEntrega = {}
  ): Observable<ProgramacionEntregaResponse> {
    this._cargando.set(true);
    this._error.set(null);

    let params = new HttpParams();

    if (filtros.pedido_id)
      params = params.set('pedido_id', filtros.pedido_id.toString());
    if (filtros.repartidor_id)
      params = params.set('repartidor_id', filtros.repartidor_id.toString());
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.fecha_programada)
      params = params.set('fecha_programada', filtros.fecha_programada);
    if (filtros.fecha_desde)
      params = params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta)
      params = params.set('fecha_hasta', filtros.fecha_hasta);
    if (filtros.hoy) params = params.set('hoy', 'true');
    if (filtros.per_page)
      params = params.set('per_page', filtros.per_page.toString());
    if (filtros.page) params = params.set('page', filtros.page.toString());

    return this.http
      .get<ProgramacionEntregaResponse>(this.baseUrl, { params })
      .pipe(
        tap((response) => {
          this._programaciones.set(response.data);
          this._paginacion.set(response.meta);
          this._filtros.set(filtros);
        }),
        catchError((error) => {
          const mensaje =
            error.error?.message ||
            'Error al obtener las programaciones de entrega';
          this._error.set(mensaje);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Obtener programación por ID
   */
  obtenerProgramacionPorId(id: number): Observable<ProgramacionEntrega> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .get<{ data: ProgramacionEntrega }>(`${this.baseUrl}/${id}`)
      .pipe(
        map((response) => response.data),
        tap((programacion) => this._programacionActual.set(programacion)),
        catchError((error) => {
          const mensaje =
            error.error?.message ||
            'Error al obtener la programación de entrega';
          this._error.set(mensaje);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Crear nueva programación
   */
  crearProgramacion(
    datos: CreateProgramacionEntregaDto
  ): Observable<ProgramacionEntrega> {
    this._cargando.set(true);
    this._error.set(null);

    // Validar datos antes de enviar
    const validacionFecha = validarFechaProgramacion(datos.fecha_programada);
    if (!validacionFecha.valida) {
      this._error.set(validacionFecha.errores.join(', '));
      this._cargando.set(false);
      return throwError(() => new Error(validacionFecha.errores.join(', ')));
    }

    const validacionVentana = validarVentanaEntrega(
      datos.hora_inicio_ventana,
      datos.hora_fin_ventana
    );
    if (!validacionVentana.valida) {
      this._error.set(validacionVentana.errores.join(', '));
      this._cargando.set(false);
      return throwError(() => new Error(validacionVentana.errores.join(', ')));
    }

    return this.http
      .post<{ data: ProgramacionEntrega; message: string }>(this.baseUrl, datos)
      .pipe(
        map((response) => response.data),
        tap((nuevaProgramacion) => {
          const programacionesActuales = this._programaciones();
          this._programaciones.set([
            nuevaProgramacion,
            ...programacionesActuales,
          ]);
          this._programacionActual.set(nuevaProgramacion);
        }),
        catchError((error) => {
          const mensaje =
            error.error?.message || 'Error al crear la programación de entrega';
          this._error.set(mensaje);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Actualizar programación existente
   */
  actualizarProgramacion(
    id: number,
    datos: UpdateProgramacionEntregaDto
  ): Observable<ProgramacionEntrega> {
    this._cargando.set(true);
    this._error.set(null);

    // Validar datos si se proporcionan
    if (datos.fecha_programada) {
      const validacionFecha = validarFechaProgramacion(datos.fecha_programada);
      if (!validacionFecha.valida) {
        this._error.set(validacionFecha.errores.join(', '));
        this._cargando.set(false);
        return throwError(() => new Error(validacionFecha.errores.join(', ')));
      }
    }

    if (datos.hora_inicio_ventana && datos.hora_fin_ventana) {
      const validacionVentana = validarVentanaEntrega(
        datos.hora_inicio_ventana,
        datos.hora_fin_ventana
      );
      if (!validacionVentana.valida) {
        this._error.set(validacionVentana.errores.join(', '));
        this._cargando.set(false);
        return throwError(
          () => new Error(validacionVentana.errores.join(', '))
        );
      }
    }

    return this.http
      .put<{ data: ProgramacionEntrega; message: string }>(
        `${this.baseUrl}/${id}`,
        datos
      )
      .pipe(
        map((response) => response.data),
        tap((programacionActualizada) => {
          const programaciones = this._programaciones().map((p) =>
            p.id === id ? programacionActualizada : p
          );
          this._programaciones.set(programaciones);
          this._programacionActual.set(programacionActualizada);
        }),
        catchError((error) => {
          const mensaje =
            error.error?.message ||
            'Error al actualizar la programación de entrega';
          this._error.set(mensaje);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Eliminar programación
   */
  eliminarProgramacion(id: number): Observable<void> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`).pipe(
      map(() => void 0),
      tap(() => {
        const programaciones = this._programaciones().filter(
          (p) => p.id !== id
        );
        this._programaciones.set(programaciones);

        if (this._programacionActual()?.id === id) {
          this._programacionActual.set(null);
        }
      }),
      catchError((error) => {
        const mensaje =
          error.error?.message ||
          'Error al eliminar la programación de entrega';
        this._error.set(mensaje);
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false))
    );
  }

  /**
   * Cambiar estado de programación
   */
  cambiarEstado(
    id: number,
    datos: CambiarEstadoDto
  ): Observable<ProgramacionEntrega> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .post<{ data: ProgramacionEntrega; message: string }>(
        `${this.baseUrl}/${id}/cambiar-estado`,
        datos
      )
      .pipe(
        map((response) => response.data),
        tap((programacionActualizada) => {
          const programaciones = this._programaciones().map((p) =>
            p.id === id ? programacionActualizada : p
          );
          this._programaciones.set(programaciones);
          this._programacionActual.set(programacionActualizada);
        }),
        catchError((error) => {
          const mensaje =
            error.error?.message ||
            'Error al cambiar el estado de la programación';
          this._error.set(mensaje);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Obtener ruta del repartidor
   */
  obtenerRutaRepartidor(
    datos: RutaRepartidorDto
  ): Observable<RutaRepartidorResponse> {
    this._cargando.set(true);
    this._error.set(null);

    const params = new HttpParams()
      .set('repartidor_id', datos.repartidor_id.toString())
      .set('fecha', datos.fecha);

    return this.http
      .get<RutaRepartidorResponse>(`${this.baseUrl}/repartidor/ruta`, {
        params,
      })
      .pipe(
        tap((response) => {
          this._rutaRepartidor.set(response);
        }),
        catchError((error) => {
          const mensaje =
            error.error?.message || 'Error al obtener la ruta del repartidor';
          this._error.set(mensaje);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Reprogramar entrega
   */
  reprogramarEntrega(
    id: number,
    datos: ReprogramarEntregaDto
  ): Observable<ProgramacionEntrega> {
    this._cargando.set(true);
    this._error.set(null);

    // Validar datos de reprogramación
    const validacionFecha = validarFechaProgramacion(datos.nueva_fecha);
    if (!validacionFecha.valida) {
      this._error.set(validacionFecha.errores.join(', '));
      this._cargando.set(false);
      return throwError(() => new Error(validacionFecha.errores.join(', ')));
    }

    const validacionVentana = validarVentanaEntrega(
      datos.nueva_hora_inicio,
      datos.nueva_hora_fin
    );
    if (!validacionVentana.valida) {
      this._error.set(validacionVentana.errores.join(', '));
      this._cargando.set(false);
      return throwError(() => new Error(validacionVentana.errores.join(', ')));
    }

    return this.http
      .post<{ data: ProgramacionEntrega; message: string }>(
        `${this.baseUrl}/${id}/reprogramar`,
        datos
      )
      .pipe(
        map((response) => response.data),
        tap((programacionReprogramada) => {
          const programaciones = this._programaciones().map((p) =>
            p.id === id ? programacionReprogramada : p
          );
          this._programaciones.set(programaciones);
          this._programacionActual.set(programacionReprogramada);
        }),
        catchError((error) => {
          const mensaje =
            error.error?.message || 'Error al reprogramar la entrega';
          this._error.set(mensaje);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Buscar programaciones por término
   */
  buscarProgramaciones(termino: string): void {
    const programacionesOriginales = this._programacionesSubject.value;
    const programacionesFiltradas = buscarProgramaciones(
      programacionesOriginales,
      termino
    );
    this._programaciones.set(programacionesFiltradas);
  }

  /**
   * Ordenar programaciones
   */
  ordenarProgramaciones(
    tipo: 'ruta' | 'fecha',
    direccion: 'asc' | 'desc' = 'asc'
  ): void {
    let programacionesOrdenadas: ProgramacionEntrega[];

    if (tipo === 'ruta') {
      programacionesOrdenadas = ordenarPorRuta(this._programaciones());
    } else {
      programacionesOrdenadas = ordenarPorFecha(
        this._programaciones(),
        direccion
      );
    }

    this._programaciones.set(programacionesOrdenadas);
  }

  /**
   * Filtrar programaciones por estado
   */
  filtrarPorEstado(estado: EstadoProgramacion): void {
    const filtros: FiltrosProgramacionEntrega = { estado };
    this.obtenerProgramaciones(filtros).subscribe();
  }

  /**
   * Filtrar programaciones por repartidor
   */
  filtrarPorRepartidor(repartidorId: number): void {
    const filtros: FiltrosProgramacionEntrega = { repartidor_id: repartidorId };
    this.obtenerProgramaciones(filtros).subscribe();
  }

  /**
   * Filtrar programaciones por fecha
   */
  filtrarPorFecha(fecha: string): void {
    const filtros: FiltrosProgramacionEntrega = { fecha_programada: fecha };
    this.obtenerProgramaciones(filtros).subscribe();
  }

  /**
   * Filtrar programaciones de hoy
   */
  filtrarProgramacionesHoy(): void {
    const filtros: FiltrosProgramacionEntrega = { hoy: true };
    this.obtenerProgramaciones(filtros).subscribe();
  }

  /**
   * Filtrar por rango de fechas
   */
  filtrarPorRangoFechas(fechaDesde: string, fechaHasta: string): void {
    const filtros: FiltrosProgramacionEntrega = {
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
    };
    this.obtenerProgramaciones(filtros).subscribe();
  }

  /**
   * Cambiar página
   */
  cambiarPagina(pagina: number): void {
    const filtrosActuales = this._filtros();
    const nuevosFiltros = { ...filtrosActuales, page: pagina };
    this.obtenerProgramaciones(nuevosFiltros).subscribe();
  }

  /**
   * Cambiar elementos por página
   */
  cambiarElementosPorPagina(perPage: number): void {
    const filtrosActuales = this._filtros();
    const nuevosFiltros = { ...filtrosActuales, per_page: perPage, page: 1 };
    this.obtenerProgramaciones(nuevosFiltros).subscribe();
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    this._filtros.set({});
    this.obtenerProgramaciones().subscribe();
  }

  /**
   * Limpiar error
   */
  limpiarError(): void {
    this._error.set(null);
  }

  /**
   * Limpiar programación actual
   */
  limpiarProgramacionActual(): void {
    this._programacionActual.set(null);
  }

  /**
   * Limpiar ruta del repartidor
   */
  limpiarRutaRepartidor(): void {
    this._rutaRepartidor.set(null);
  }

  /**
   * Refrescar programaciones
   */
  refrescar(): void {
    const filtrosActuales = this._filtros();
    this.obtenerProgramaciones(filtrosActuales).subscribe();
  }

  /**
   * Obtener programaciones pendientes de hoy
   */
  obtenerProgramacionesPendientesHoy(): Observable<ProgramacionEntregaResponse> {
    const filtros: FiltrosProgramacionEntrega = { hoy: true };
    return this.obtenerProgramaciones(filtros).pipe(
      map((response) => ({
        ...response,
        data: filtrarEntregasPendientes(response.data),
      }))
    );
  }

  /**
   * Obtener programaciones que requieren atención
   */
  obtenerProgramacionesQueRequierenAtencion(): Observable<ProgramacionEntregaResponse> {
    return this.obtenerProgramaciones().pipe(
      map((response) => ({
        ...response,
        data: filtrarQueRequierenAtencion(response.data),
      }))
    );
  }

  /**
   * Marcar como en ruta
   */
  marcarEnRuta(id: number, notas?: string): Observable<ProgramacionEntrega> {
    return this.cambiarEstado(id, {
      estado: 'en_ruta',
      notas_repartidor: notas,
    });
  }

  /**
   * Marcar como entregado
   */
  marcarEntregado(id: number, notas?: string): Observable<ProgramacionEntrega> {
    return this.cambiarEstado(id, {
      estado: 'entregado',
      notas_repartidor: notas,
    });
  }

  /**
   * Marcar como fallido
   */
  marcarFallido(
    id: number,
    motivo: string,
    notas?: string
  ): Observable<ProgramacionEntrega> {
    return this.cambiarEstado(id, {
      estado: 'fallido',
      motivo_fallo: motivo,
      notas_repartidor: notas,
    });
  }

  /**
   * Verificar si se puede cambiar estado
   */
  puedecambiarEstado(
    programacion: ProgramacionEntrega,
    nuevoEstado: EstadoProgramacion
  ): boolean {
    const transicionesValidas: Record<
      EstadoProgramacion,
      EstadoProgramacion[]
    > = {
      programado: ['en_ruta', 'fallido', 'reprogramado'],
      en_ruta: ['entregado', 'fallido'],
      entregado: [],
      fallido: ['reprogramado'],
      reprogramado: ['programado', 'en_ruta'],
    };

    return (
      transicionesValidas[programacion.estado]?.includes(nuevoEstado) || false
    );
  }

  /**
   * Obtener estadísticas del día
   */
  obtenerEstadisticasDelDia(fecha?: string): {
    total: number;
    completadas: number;
    pendientes: number;
    fallidas: number;
    tasa_exito: number;
  } {
    const programacionesDelDia = fecha
      ? this._programaciones().filter(
          (p) => p.fecha_programada_formateada === fecha
        )
      : filtrarEntregasHoy(this._programaciones());

    const total = programacionesDelDia.length;
    const completadas = programacionesDelDia.filter(
      (p) => p.estado === 'entregado'
    ).length;
    const pendientes = programacionesDelDia.filter((p) =>
      ['programado', 'en_ruta'].includes(p.estado)
    ).length;
    const fallidas = programacionesDelDia.filter(
      (p) => p.estado === 'fallido'
    ).length;
    const tasa_exito = total > 0 ? (completadas / total) * 100 : 0;

    return {
      total,
      completadas,
      pendientes,
      fallidas,
      tasa_exito,
    };
  }

  /**
   * Obtener próximas entregas
   */
  obtenerProximasEntregas(limite: number = 5): ProgramacionEntrega[] {
    return this._programaciones()
      .filter((p) => ['programado', 'en_ruta'].includes(p.estado))
      .sort((a, b) => {
        const fechaA = new Date(
          `${a.fecha_programada}T${a.hora_inicio_ventana}`
        );
        const fechaB = new Date(
          `${b.fecha_programada}T${b.hora_inicio_ventana}`
        );
        return fechaA.getTime() - fechaB.getTime();
      })
      .slice(0, limite);
  }

  /**
   * Exportar programaciones a CSV
   */
  exportarCSV(
    programaciones: ProgramacionEntrega[] = this._programaciones()
  ): string {
    if (programaciones.length === 0) return '';

    const headers = [
      'ID',
      'Número Pedido',
      'Repartidor',
      'Fecha Programada',
      'Ventana de Entrega',
      'Estado',
      'Orden Ruta',
      'Hora Salida',
      'Hora Llegada',
      'Tiempo Total',
      'Puntualidad',
      'Notas',
    ];

    const rows = programaciones.map((p) => [
      p.id,
      p.pedido?.numero_pedido || '',
      p.repartidor?.nombre || '',
      p.fecha_programada_formateada,
      p.ventana_entrega_texto,
      p.estado_texto,
      p.orden_ruta_texto,
      p.tiempos_entrega.hora_salida_formateada || '',
      p.tiempos_entrega.hora_llegada_formateada || '',
      p.tiempos_entrega.tiempo_total_texto || '',
      p.tiempos_entrega.puntualidad || '',
      p.notas_repartidor || '',
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
  }

  /**
   * Validar datos de programación
   */
  validarDatosProgramacion(
    datos: CreateProgramacionEntregaDto | UpdateProgramacionEntregaDto
  ): {
    valida: boolean;
    errores: string[];
  } {
    const errores: string[] = [];

    if ('fecha_programada' in datos && datos.fecha_programada) {
      const validacionFecha = validarFechaProgramacion(datos.fecha_programada);
      if (!validacionFecha.valida) {
        errores.push(...validacionFecha.errores);
      }
    }

    if (datos.hora_inicio_ventana && datos.hora_fin_ventana) {
      const validacionVentana = validarVentanaEntrega(
        datos.hora_inicio_ventana,
        datos.hora_fin_ventana
      );
      if (!validacionVentana.valida) {
        errores.push(...validacionVentana.errores);
      }
    }

    return {
      valida: errores.length === 0,
      errores,
    };
  }
}
