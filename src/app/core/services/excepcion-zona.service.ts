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
import { environment } from '../../../environments/environment';
import {
  ExcepcionZona,
  CreateExcepcionZonaDto,
  UpdateExcepcionZonaDto,
  FiltrosExcepcionZona,
  ExcepcionZonaResponse,
  ExcepcionesZonaResponse,
  EstadisticasExcepcionZona,
  ExcepcionesPorTipo,
  ExcepcionesPorZona,
  TipoExcepcion,
  CampoOrdenamientoExcepcion,
  DireccionOrdenamiento,
  validarExcepcionZona,
  formatearTipoExcepcion,
  formatearFechaExcepcion,
  formatearHorarioEspecial,
  formatearTiempoEspecial,
  formatearCostoEspecial,
  esExcepcionVigente,
  esExcepcionAplicableHoy,
  esExcepcionAplicableAhora,
  obtenerDiasRestantes,
  agruparPorTipo,
  agruparPorZona,
  filtrarPorTipo,
  filtrarPorZona,
  filtrarVigentes,
  filtrarAplicablesHoy,
  filtrarPorFecha,
  ordenarPorFecha,
  ordenarPorTipo,
  buscarExcepciones,
  calcularEstadisticas,
  obtenerIconoPorTipo,
  obtenerColorPorTipo,
  obtenerColorFondoPorTipo,
  TIPOS_EXCEPCION,
  OPCIONES_ORDEN_EXCEPCION,
  DIRECCIONES_ORDEN,
} from '../models/excepcion-zona.interface';

@Injectable({
  providedIn: 'root',
})
export class ExcepcionZonaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/excepciones-zona`;

  // Estados reactivos con signals
  private readonly _excepcionesZona = signal<ExcepcionZona[]>([]);
  private readonly _excepcionZonaActual = signal<ExcepcionZona | null>(null);
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtros = signal<FiltrosExcepcionZona>({});
  private readonly _paginacion = signal({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  private readonly _estadisticas = signal<EstadisticasExcepcionZona | null>(
    null
  );

  // Computed signals para datos derivados
  readonly excepcionesZona = this._excepcionesZona.asReadonly();
  readonly excepcionZonaActual = this._excepcionZonaActual.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filtros = this._filtros.asReadonly();
  readonly paginacion = this._paginacion.asReadonly();
  readonly estadisticas = this._estadisticas.asReadonly();

  // Computed signals para filtros y agrupaciones
  readonly excepcionesActivas = computed(() =>
    this._excepcionesZona().filter((excepcion) => excepcion.activo)
  );

  readonly excepcionesInactivas = computed(() =>
    this._excepcionesZona().filter((excepcion) => !excepcion.activo)
  );

  readonly excepcionesVigentes = computed(() =>
    this._excepcionesZona().filter((excepcion) => esExcepcionVigente(excepcion))
  );

  readonly excepcionesHoy = computed(() =>
    this._excepcionesZona().filter((excepcion) =>
      esExcepcionAplicableHoy(excepcion)
    )
  );

  readonly excepcionesPorTipo = computed(() =>
    agruparPorTipo(this._excepcionesZona())
  );

  readonly excepcionesPorZona = computed(() =>
    agruparPorZona(this._excepcionesZona())
  );

  readonly estadisticasCalculadas = computed(() =>
    calcularEstadisticas(this._excepcionesZona())
  );

  readonly proximasExcepciones = computed(() =>
    this._excepcionesZona()
      .filter((e) => e.es_fecha_futura && e.activo)
      .sort(
        (a, b) =>
          new Date(a.fecha_excepcion).getTime() -
          new Date(b.fecha_excepcion).getTime()
      )
      .slice(0, 5)
  );

  readonly totalExcepciones = computed(() => this._excepcionesZona().length);

  readonly hayExcepciones = computed(() => this._excepcionesZona().length > 0);

  // BehaviorSubjects para compatibilidad con observables existentes
  private readonly _excepcionesZona$ = new BehaviorSubject<ExcepcionZona[]>([]);
  private readonly _excepcionZonaActual$ =
    new BehaviorSubject<ExcepcionZona | null>(null);
  private readonly _cargando$ = new BehaviorSubject<boolean>(false);
  private readonly _error$ = new BehaviorSubject<string | null>(null);

  // Observables públicos
  readonly excepcionesZona$ = this._excepcionesZona$.asObservable();
  readonly excepcionZonaActual$ = this._excepcionZonaActual$.asObservable();
  readonly cargando$ = this._cargando$.asObservable();
  readonly error$ = this._error$.asObservable();

  constructor() {
    // Sincronizar signals con BehaviorSubjects
    this._excepcionesZona.set = (value: ExcepcionZona[]) => {
      this._excepcionesZona.update(() => value);
      this._excepcionesZona$.next(value);
      return value;
    };

    this._excepcionZonaActual.set = (value: ExcepcionZona | null) => {
      this._excepcionZonaActual.update(() => value);
      this._excepcionZonaActual$.next(value);
      return value;
    };

    this._cargando.set = (value: boolean) => {
      this._cargando.update(() => value);
      this._cargando$.next(value);
      return value;
    };

    this._error.set = (value: string | null) => {
      this._error.update(() => value);
      this._error$.next(value);
      return value;
    };
  }

  /**
   * Obtener listado de excepciones de zona con filtros
   */
  obtenerExcepciones(
    filtros: FiltrosExcepcionZona = {}
  ): Observable<ExcepcionesZonaResponse> {
    this._cargando.set(true);
    this._error.set(null);
    this._filtros.set(filtros);

    let params = new HttpParams();

    if (filtros.zona_reparto_id) {
      params = params.set(
        'zona_reparto_id',
        filtros.zona_reparto_id.toString()
      );
    }
    if (filtros.tipo) {
      params = params.set('tipo', filtros.tipo);
    }
    if (filtros.fecha_desde) {
      params = params.set('fecha_desde', filtros.fecha_desde);
    }
    if (filtros.fecha_hasta) {
      params = params.set('fecha_hasta', filtros.fecha_hasta);
    }
    if (filtros.activo !== undefined) {
      params = params.set('activo', filtros.activo.toString());
    }
    if (filtros.vigentes !== undefined) {
      params = params.set('vigentes', filtros.vigentes.toString());
    }
    if (filtros.per_page) {
      params = params.set('per_page', filtros.per_page.toString());
    }
    if (filtros.page) {
      params = params.set('page', filtros.page.toString());
    }
    if (filtros.search) {
      params = params.set('search', filtros.search);
    }
    if (filtros.sort_by) {
      params = params.set('sort_by', filtros.sort_by);
    }
    if (filtros.sort_direction) {
      params = params.set('sort_direction', filtros.sort_direction);
    }

    return this.http.get<ExcepcionesZonaResponse>(this.apiUrl, { params }).pipe(
      tap((response) => {
        this._excepcionesZona.set(response.data);
        this._paginacion.set(response.meta);
      }),
      catchError((error) => {
        this._error.set('Error al obtener excepciones de zona');
        console.error('Error al obtener excepciones de zona:', error);
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false))
    );
  }

  /**
   * Obtener una excepción de zona por ID
   */
  obtenerExcepcionPorId(id: number): Observable<ExcepcionZonaResponse> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http.get<ExcepcionZonaResponse>(`${this.apiUrl}/${id}`).pipe(
      tap((response) => {
        this._excepcionZonaActual.set(response.data);
      }),
      catchError((error) => {
        this._error.set('Error al obtener la excepción de zona');
        console.error('Error al obtener excepción de zona:', error);
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false))
    );
  }

  /**
   * Crear nueva excepción de zona
   */
  crearExcepcion(
    datos: CreateExcepcionZonaDto
  ): Observable<ExcepcionZonaResponse> {
    // Validar datos antes de enviar
    const errores = validarExcepcionZona(datos);
    if (errores.length > 0) {
      this._error.set(errores.join(', '));
      return throwError(() => new Error(errores.join(', ')));
    }

    this._cargando.set(true);
    this._error.set(null);

    return this.http.post<ExcepcionZonaResponse>(this.apiUrl, datos).pipe(
      tap((response) => {
        // Agregar la nueva excepción a la lista
        this._excepcionesZona.update((excepciones) => [
          ...excepciones,
          response.data,
        ]);
        this._excepcionZonaActual.set(response.data);
      }),
      catchError((error) => {
        this._error.set('Error al crear la excepción de zona');
        console.error('Error al crear excepción de zona:', error);
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false))
    );
  }

  /**
   * Actualizar excepción de zona
   */
  actualizarExcepcion(
    id: number,
    datos: UpdateExcepcionZonaDto
  ): Observable<ExcepcionZonaResponse> {
    // Validar datos antes de enviar
    const errores = validarExcepcionZona(datos);
    if (errores.length > 0) {
      this._error.set(errores.join(', '));
      return throwError(() => new Error(errores.join(', ')));
    }

    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .put<ExcepcionZonaResponse>(`${this.apiUrl}/${id}`, datos)
      .pipe(
        tap((response) => {
          // Actualizar la excepción en la lista
          this._excepcionesZona.update((excepciones) =>
            excepciones.map((excepcion) =>
              excepcion.id === id ? response.data : excepcion
            )
          );
          this._excepcionZonaActual.set(response.data);
        }),
        catchError((error) => {
          this._error.set('Error al actualizar la excepción de zona');
          console.error('Error al actualizar excepción de zona:', error);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Eliminar excepción de zona
   */
  eliminarExcepcion(id: number): Observable<void> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Remover la excepción de la lista
        this._excepcionesZona.update((excepciones) =>
          excepciones.filter((excepcion) => excepcion.id !== id)
        );

        // Si era la excepción actual, limpiarla
        if (this._excepcionZonaActual()?.id === id) {
          this._excepcionZonaActual.set(null);
        }
      }),
      catchError((error) => {
        this._error.set('Error al eliminar la excepción de zona');
        console.error('Error al eliminar excepción de zona:', error);
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false))
    );
  }

  /**
   * Cambiar estado de una excepción (activar/desactivar)
   */
  cambiarEstado(
    id: number,
    activo: boolean
  ): Observable<ExcepcionZonaResponse> {
    return this.actualizarExcepcion(id, { activo });
  }

  /**
   * Obtener excepciones por zona de reparto
   */
  obtenerExcepcionesPorZona(
    zonaRepartoId: number
  ): Observable<ExcepcionesZonaResponse> {
    return this.obtenerExcepciones({ zona_reparto_id: zonaRepartoId });
  }

  /**
   * Obtener excepciones por tipo
   */
  obtenerExcepcionesPorTipo(
    tipo: TipoExcepcion
  ): Observable<ExcepcionesZonaResponse> {
    return this.obtenerExcepciones({ tipo });
  }

  /**
   * Obtener excepciones vigentes
   */
  obtenerExcepcionesVigentes(): Observable<ExcepcionesZonaResponse> {
    return this.obtenerExcepciones({ vigentes: true });
  }

  /**
   * Buscar excepciones por término
   */
  buscarExcepciones(termino: string): Observable<ExcepcionesZonaResponse> {
    return this.obtenerExcepciones({ search: termino });
  }

  /**
   * Filtrar excepciones localmente
   */
  filtrarExcepcionesLocal(
    filtros: Partial<FiltrosExcepcionZona>
  ): ExcepcionZona[] {
    let excepciones = this._excepcionesZona();

    if (filtros.tipo) {
      excepciones = filtrarPorTipo(excepciones, filtros.tipo);
    }

    if (filtros.zona_reparto_id) {
      excepciones = filtrarPorZona(excepciones, filtros.zona_reparto_id);
    }

    if (filtros.activo !== undefined) {
      excepciones = excepciones.filter((e) => e.activo === filtros.activo);
    }

    if (filtros.vigentes) {
      excepciones = filtrarVigentes(excepciones);
    }

    if (filtros.fecha_desde || filtros.fecha_hasta) {
      excepciones = filtrarPorFecha(
        excepciones,
        filtros.fecha_desde,
        filtros.fecha_hasta
      );
    }

    if (filtros.search) {
      excepciones = buscarExcepciones(excepciones, filtros.search);
    }

    return excepciones;
  }

  /**
   * Ordenar excepciones localmente
   */
  ordenarExcepcionesLocal(
    campo: CampoOrdenamientoExcepcion,
    direccion: DireccionOrdenamiento = 'asc'
  ): ExcepcionZona[] {
    const excepciones = this._excepcionesZona();

    switch (campo) {
      case 'fecha_excepcion':
        return ordenarPorFecha(excepciones, direccion);
      case 'tipo':
        return ordenarPorTipo(excepciones, direccion);
      case 'zona_reparto_id':
        return [...excepciones].sort((a, b) => {
          const comparacion = a.zona_reparto_id - b.zona_reparto_id;
          return direccion === 'asc' ? comparacion : -comparacion;
        });
      case 'created_at':
        return [...excepciones].sort((a, b) => {
          const fechaA = new Date(a.created_at).getTime();
          const fechaB = new Date(b.created_at).getTime();
          return direccion === 'asc' ? fechaA - fechaB : fechaB - fechaA;
        });
      case 'activo':
        return [...excepciones].sort((a, b) => {
          const comparacion = Number(b.activo) - Number(a.activo);
          return direccion === 'asc' ? comparacion : -comparacion;
        });
      default:
        return excepciones;
    }
  }

  /**
   * Obtener estadísticas de excepciones
   */
  obtenerEstadisticas(): EstadisticasExcepcionZona {
    return this.estadisticasCalculadas();
  }

  /**
   * Limpiar estado del servicio
   */
  limpiarEstado(): void {
    this._excepcionesZona.set([]);
    this._excepcionZonaActual.set(null);
    this._error.set(null);
    this._filtros.set({});
    this._paginacion.set({
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    });
    this._estadisticas.set(null);
  }

  /**
   * Establecer excepción actual
   */
  establecerExcepcionActual(excepcion: ExcepcionZona | null): void {
    this._excepcionZonaActual.set(excepcion);
  }

  /**
   * Obtener constantes y opciones
   */
  obtenerTiposExcepcion() {
    return TIPOS_EXCEPCION;
  }

  obtenerOpcionesOrden() {
    return OPCIONES_ORDEN_EXCEPCION;
  }

  obtenerDireccionesOrden() {
    return DIRECCIONES_ORDEN;
  }

  /**
   * Funciones utilitarias expuestas
   */
  formatearTipo = formatearTipoExcepcion;
  formatearFecha = formatearFechaExcepcion;
  formatearHorario = formatearHorarioEspecial;
  formatearTiempo = formatearTiempoEspecial;
  formatearCosto = formatearCostoEspecial;
  esVigente = esExcepcionVigente;
  esAplicableHoy = esExcepcionAplicableHoy;
  esAplicableAhora = esExcepcionAplicableAhora;
  obtenerDias = obtenerDiasRestantes;
  obtenerIcono = obtenerIconoPorTipo;
  obtenerColor = obtenerColorPorTipo;
  obtenerColorFondo = obtenerColorFondoPorTipo;
  validar = validarExcepcionZona;

  /**
   * Operaciones múltiples
   */
  eliminarMultiples(ids: number[]): Observable<void[]> {
    this._cargando.set(true);
    this._error.set(null);

    const eliminaciones = ids.map((id) => this.eliminarExcepcion(id));

    return new Observable((observer) => {
      Promise.all(eliminaciones.map((obs) => obs.toPromise()))
        .then((resultados) => {
          observer.next(resultados as void[]);
          observer.complete();
        })
        .catch((error) => {
          this._error.set('Error al eliminar excepciones múltiples');
          observer.error(error);
        })
        .finally(() => this._cargando.set(false));
    });
  }

  /**
   * Cambiar estado múltiple
   */
  cambiarEstadoMultiple(
    ids: number[],
    activo: boolean
  ): Observable<ExcepcionZonaResponse[]> {
    this._cargando.set(true);
    this._error.set(null);

    const cambios = ids.map((id) => this.cambiarEstado(id, activo));

    return new Observable((observer) => {
      Promise.all(cambios.map((obs) => obs.toPromise()))
        .then((resultados) => {
          observer.next(resultados as ExcepcionZonaResponse[]);
          observer.complete();
        })
        .catch((error) => {
          this._error.set('Error al cambiar estado de excepciones múltiples');
          observer.error(error);
        })
        .finally(() => this._cargando.set(false));
    });
  }

  /**
   * Duplicar excepción para otra zona
   */
  duplicarExcepcion(
    excepcionId: number,
    nuevaZonaId: number
  ): Observable<ExcepcionZonaResponse> {
    const excepcionOriginal = this._excepcionesZona().find(
      (e) => e.id === excepcionId
    );

    if (!excepcionOriginal) {
      this._error.set('Excepción no encontrada');
      return throwError(() => new Error('Excepción no encontrada'));
    }

    const nuevaExcepcion: CreateExcepcionZonaDto = {
      zona_reparto_id: nuevaZonaId,
      fecha_excepcion: excepcionOriginal.fecha_excepcion,
      tipo: excepcionOriginal.tipo,
      hora_inicio: excepcionOriginal.hora_inicio || undefined,
      hora_fin: excepcionOriginal.hora_fin || undefined,
      costo_especial: excepcionOriginal.costo_especial || undefined,
      tiempo_especial_min: excepcionOriginal.tiempo_especial_min || undefined,
      tiempo_especial_max: excepcionOriginal.tiempo_especial_max || undefined,
      motivo: `${excepcionOriginal.motivo} (Duplicada)`,
      activo: excepcionOriginal.activo,
    };

    return this.crearExcepcion(nuevaExcepcion);
  }

  /**
   * Exportar excepciones a CSV
   */
  exportarCSV(excepciones?: ExcepcionZona[]): string {
    const datos = excepciones || this._excepcionesZona();

    const headers = [
      'ID',
      'Zona de Reparto',
      'Fecha',
      'Tipo',
      'Hora Inicio',
      'Hora Fin',
      'Costo Especial',
      'Tiempo Min',
      'Tiempo Max',
      'Motivo',
      'Estado',
      'Vigente',
    ];

    const filas = datos.map((excepcion) => [
      excepcion.id.toString(),
      excepcion.zona_reparto.nombre,
      excepcion.fecha_excepcion_formateada,
      excepcion.tipo_texto,
      excepcion.hora_inicio || '',
      excepcion.hora_fin || '',
      excepcion.costo_especial_formateado || '',
      excepcion.tiempo_especial_min?.toString() || '',
      excepcion.tiempo_especial_max?.toString() || '',
      excepcion.motivo,
      excepcion.activo ? 'Activo' : 'Inactivo',
      excepcion.estado_excepcion.vigente ? 'Sí' : 'No',
    ]);

    return [headers, ...filas]
      .map((fila) => fila.map((campo) => `"${campo}"`).join(','))
      .join('\n');
  }
}
