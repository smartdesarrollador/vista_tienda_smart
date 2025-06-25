import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  HorarioZona,
  CreateHorarioZonaDto,
  UpdateHorarioZonaDto,
  FiltrosHorarioZona,
  HorarioZonaResponse,
  HorariosZonaResponse,
  EstadisticasHorarioZona,
  HorariosPorZona,
  HorariosPorDia,
  ResumenCoberturaSemanal,
  AnalisisDisponibilidad,
  DiaSemana,
  validarHorarioZona,
  calcularEstadisticas,
  agruparPorZona,
  agruparPorDia,
  filtrarPorZona,
  filtrarPorDia,
  filtrarActivos,
  filtrarInactivos,
  filtrarDiaCompleto,
  filtrarAbiertosAhora,
  buscarHorarios,
  ordenarPorDia,
  ordenarPorHora,
  ordenarPorDuracion,
  validarHorarioUnico,
  detectarConflictosHorarios,
  generarResumenCobertura,
  analizarDisponibilidad,
  obtenerProximoHorario,
  estaAbiertoAhora,
  DIAS_SEMANA,
} from '../models/horario-zona.interface';

@Injectable({
  providedIn: 'root',
})
export class HorarioZonaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/horarios-zona`;
  private readonly adminApiUrl = `${environment.apiUrl}/vista/horarios-zona`;

  // Estados reactivos con signals
  private readonly _horariosZona = signal<HorarioZona[]>([]);
  private readonly _horarioZonaActual = signal<HorarioZona | null>(null);
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtros = signal<FiltrosHorarioZona>({});
  private readonly _paginacion = signal<HorariosZonaResponse['meta'] | null>(
    null
  );
  private readonly _estadisticas = signal<EstadisticasHorarioZona | null>(null);

  // Computed signals para valores derivados
  readonly horariosZona = computed(() => this._horariosZona());
  readonly horarioZonaActual = computed(() => this._horarioZonaActual());
  readonly cargando = computed(() => this._cargando());
  readonly error = computed(() => this._error());
  readonly filtros = computed(() => this._filtros());
  readonly paginacion = computed(() => this._paginacion());
  readonly estadisticas = computed(() => this._estadisticas());

  // Computed signals para datos procesados
  readonly horariosActivos = computed(() =>
    filtrarActivos(this._horariosZona())
  );

  readonly horariosInactivos = computed(() =>
    filtrarInactivos(this._horariosZona())
  );

  readonly horariosDiaCompleto = computed(() =>
    filtrarDiaCompleto(this._horariosZona())
  );

  readonly horariosAbiertosAhora = computed(() =>
    filtrarAbiertosAhora(this._horariosZona())
  );

  readonly horariosPorZona = computed(() =>
    agruparPorZona(this._horariosZona())
  );

  readonly horariosPorDia = computed(() => agruparPorDia(this._horariosZona()));

  readonly conflictosHorarios = computed(() =>
    detectarConflictosHorarios(this._horariosZona())
  );

  readonly totalHorarios = computed(() => this._horariosZona().length);

  readonly hayDatos = computed(() => this._horariosZona().length > 0);

  readonly hayError = computed(() => this._error() !== null);

  readonly estadisticasCalculadas = computed(() => {
    const horarios = this._horariosZona();
    return horarios.length > 0 ? calcularEstadisticas(horarios) : null;
  });

  readonly zonasAbiertas = computed(() => {
    const abiertos = this.horariosAbiertosAhora();
    return new Set(abiertos.map((h) => h.zona_reparto_id)).size;
  });

  readonly coberturaSemanal = computed(() => {
    const porZona = this.horariosPorZona();
    return porZona.length > 0
      ? porZona.reduce((sum, z) => sum + z.cobertura_semanal, 0) /
          porZona.length
      : 0;
  });

  // BehaviorSubjects para compatibilidad con observables
  private readonly horariosZonaSubject = new BehaviorSubject<HorarioZona[]>([]);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos
  readonly horariosZona$ = this.horariosZonaSubject.asObservable();
  readonly cargando$ = this.cargandoSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  constructor() {
    // Sincronizar signals con BehaviorSubjects
    this.sincronizarEstados();
  }

  /**
   * Obtener todos los horarios de zona con filtros y paginación
   */
  obtenerHorariosZona(
    filtros: FiltrosHorarioZona = {}
  ): Observable<HorariosZonaResponse> {
    this.iniciarCarga();
    this._filtros.set(filtros);

    let params = new HttpParams();

    // Aplicar filtros
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<HorariosZonaResponse>(this.apiUrl, { params }).pipe(
      tap((response) => {
        this._horariosZona.set(response.data);
        this._paginacion.set(response.meta);
        this.horariosZonaSubject.next(response.data);
      }),
      catchError((error) =>
        this.manejarError('Error al obtener horarios de zona', error)
      ),
      finalize(() => this.finalizarCarga())
    );
  }

  /**
   * Obtener un horario de zona específico por ID
   */
  obtenerHorarioZona(id: number): Observable<HorarioZona> {
    this.iniciarCarga();

    return this.http.get<HorarioZonaResponse>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response.data),
      tap((horarioZona) => {
        this._horarioZonaActual.set(horarioZona);
      }),
      catchError((error) =>
        this.manejarError('Error al obtener horario de zona', error)
      ),
      finalize(() => this.finalizarCarga())
    );
  }

  /**
   * Crear nuevo horario de zona
   */
  crearHorarioZona(data: CreateHorarioZonaDto): Observable<HorarioZona> {
    // Validar datos antes de enviar
    const errores = validarHorarioZona(data);
    if (errores.length > 0) {
      return throwError(() => new Error(errores.join(', ')));
    }

    // Validar unicidad
    const horariosActuales = this._horariosZona();
    if (
      !validarHorarioUnico(
        horariosActuales,
        data.zona_reparto_id,
        data.dia_semana
      )
    ) {
      return throwError(
        () =>
          new Error(
            'Ya existe un horario para este día en esta zona de reparto'
          )
      );
    }

    this.iniciarCarga();

    return this.http.post<HorarioZonaResponse>(this.adminApiUrl, data).pipe(
      map((response) => response.data),
      tap((nuevoHorario) => {
        const horariosActualizados = [...this._horariosZona(), nuevoHorario];
        this._horariosZona.set(horariosActualizados);
        this._horarioZonaActual.set(nuevoHorario);
        this.horariosZonaSubject.next(horariosActualizados);
      }),
      catchError((error) =>
        this.manejarError('Error al crear horario de zona', error)
      ),
      finalize(() => this.finalizarCarga())
    );
  }

  /**
   * Actualizar horario de zona existente
   */
  actualizarHorarioZona(
    id: number,
    data: UpdateHorarioZonaDto
  ): Observable<HorarioZona> {
    // Validar datos antes de enviar
    const errores = validarHorarioZona(data);
    if (errores.length > 0) {
      return throwError(() => new Error(errores.join(', ')));
    }

    this.iniciarCarga();

    return this.http
      .put<HorarioZonaResponse>(`${this.adminApiUrl}/${id}`, data)
      .pipe(
        map((response) => response.data),
        tap((horarioActualizado) => {
          const horarios = this._horariosZona();
          const indice = horarios.findIndex((h) => h.id === id);

          if (indice !== -1) {
            const horariosActualizados = [...horarios];
            horariosActualizados[indice] = horarioActualizado;
            this._horariosZona.set(horariosActualizados);
            this.horariosZonaSubject.next(horariosActualizados);
          }

          this._horarioZonaActual.set(horarioActualizado);
        }),
        catchError((error) =>
          this.manejarError('Error al actualizar horario de zona', error)
        ),
        finalize(() => this.finalizarCarga())
      );
  }

  /**
   * Eliminar horario de zona
   */
  eliminarHorarioZona(id: number): Observable<void> {
    this.iniciarCarga();

    return this.http.delete<void>(`${this.adminApiUrl}/${id}`).pipe(
      tap(() => {
        const horariosFiltrados = this._horariosZona().filter(
          (h) => h.id !== id
        );
        this._horariosZona.set(horariosFiltrados);
        this.horariosZonaSubject.next(horariosFiltrados);

        // Limpiar horario actual si es el que se eliminó
        if (this._horarioZonaActual()?.id === id) {
          this._horarioZonaActual.set(null);
        }
      }),
      catchError((error) =>
        this.manejarError('Error al eliminar horario de zona', error)
      ),
      finalize(() => this.finalizarCarga())
    );
  }

  /**
   * Obtener horarios por zona de reparto
   */
  obtenerPorZonaReparto(zonaRepartoId: number): Observable<HorarioZona[]> {
    const filtros: FiltrosHorarioZona = { zona_reparto_id: zonaRepartoId };

    return this.obtenerHorariosZona(filtros).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Obtener horarios por día de la semana
   */
  obtenerPorDia(diaSemana: DiaSemana): Observable<HorarioZona[]> {
    const filtros: FiltrosHorarioZona = { dia_semana: diaSemana };

    return this.obtenerHorariosZona(filtros).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Obtener horarios activos abiertos ahora
   */
  obtenerAbiertosAhora(): Observable<HorarioZona[]> {
    const filtros: FiltrosHorarioZona = { activo: true, abierto_ahora: true };

    return this.obtenerHorariosZona(filtros).pipe(
      map((response) => response.data.filter((h) => estaAbiertoAhora(h)))
    );
  }

  /**
   * Obtener estadísticas de horarios
   */
  obtenerEstadisticas(): Observable<EstadisticasHorarioZona> {
    // Si ya tenemos datos cargados, calcular estadísticas localmente
    const horarios = this._horariosZona();
    if (horarios.length > 0) {
      const estadisticas = calcularEstadisticas(horarios);
      this._estadisticas.set(estadisticas);
      return of(estadisticas);
    }

    // Si no hay datos, cargar primero
    return this.obtenerHorariosZona().pipe(
      map((response) => {
        const estadisticas = calcularEstadisticas(response.data);
        this._estadisticas.set(estadisticas);
        return estadisticas;
      })
    );
  }

  /**
   * Buscar horarios por término
   */
  buscar(termino: string): Observable<HorarioZona[]> {
    if (!termino.trim()) {
      return of(this._horariosZona());
    }

    const resultados = buscarHorarios(this._horariosZona(), termino);
    return of(resultados);
  }

  /**
   * Filtrar horarios localmente
   */
  filtrarLocal(filtros: Partial<FiltrosHorarioZona>): HorarioZona[] {
    let horarios = this._horariosZona();

    if (filtros.zona_reparto_id) {
      horarios = filtrarPorZona(horarios, filtros.zona_reparto_id);
    }

    if (filtros.dia_semana) {
      horarios = filtrarPorDia(horarios, filtros.dia_semana);
    }

    if (filtros.activo !== undefined) {
      horarios = filtros.activo
        ? filtrarActivos(horarios)
        : filtrarInactivos(horarios);
    }

    if (filtros.dia_completo !== undefined) {
      horarios = filtros.dia_completo
        ? filtrarDiaCompleto(horarios)
        : horarios.filter((h) => !h.dia_completo);
    }

    if (filtros.abierto_ahora) {
      horarios = filtrarAbiertosAhora(horarios);
    }

    return horarios;
  }

  /**
   * Ordenar horarios localmente
   */
  ordenarLocal(
    horarios: HorarioZona[],
    campo: string,
    direccion: 'asc' | 'desc' = 'asc'
  ): HorarioZona[] {
    switch (campo) {
      case 'dia_semana':
        return ordenarPorDia(horarios, direccion);
      case 'hora_inicio':
        return ordenarPorHora(horarios, direccion);
      case 'duracion_horas':
        return ordenarPorDuracion(horarios, direccion);
      default:
        return horarios;
    }
  }

  /**
   * Crear horarios para toda la semana
   */
  crearHorariosSemana(
    zonaRepartoId: number,
    horarioBase: Omit<CreateHorarioZonaDto, 'zona_reparto_id' | 'dia_semana'>
  ): Observable<HorarioZona[]> {
    this.iniciarCarga();

    const creaciones = DIAS_SEMANA.map((dia) => {
      const horarioCompleto: CreateHorarioZonaDto = {
        zona_reparto_id: zonaRepartoId,
        dia_semana: dia.value,
        ...horarioBase,
      };

      return this.http.post<HorarioZonaResponse>(
        this.adminApiUrl,
        horarioCompleto
      );
    });

    return new Observable<HorarioZona[]>((observer) => {
      Promise.all(creaciones.map((obs) => obs.toPromise()))
        .then((responses) => {
          const nuevosHorarios = responses.map((response) => response!.data);

          // Actualizar estado local
          const horariosActualizados = [
            ...this._horariosZona(),
            ...nuevosHorarios,
          ];
          this._horariosZona.set(horariosActualizados);
          this.horariosZonaSubject.next(horariosActualizados);

          observer.next(nuevosHorarios);
          observer.complete();
        })
        .catch((error) => {
          this.manejarError('Error al crear horarios de la semana', error);
          observer.error(error);
        })
        .finally(() => {
          this.finalizarCarga();
        });
    });
  }

  /**
   * Operaciones múltiples
   */
  eliminarMultiples(ids: number[]): Observable<void> {
    this.iniciarCarga();

    const eliminaciones = ids.map((id) =>
      this.http.delete<void>(`${this.adminApiUrl}/${id}`)
    );

    return new Observable<void>((observer) => {
      Promise.all(eliminaciones.map((obs) => obs.toPromise()))
        .then(() => {
          const horariosFiltrados = this._horariosZona().filter(
            (h) => !ids.includes(h.id)
          );
          this._horariosZona.set(horariosFiltrados);
          this.horariosZonaSubject.next(horariosFiltrados);
          observer.next();
          observer.complete();
        })
        .catch((error) => {
          this.manejarError('Error al eliminar múltiples horarios', error);
          observer.error(error);
        })
        .finally(() => {
          this.finalizarCarga();
        });
    });
  }

  /**
   * Activar/desactivar múltiples horarios
   */
  cambiarEstadoMultiples(
    ids: number[],
    activo: boolean
  ): Observable<HorarioZona[]> {
    this.iniciarCarga();

    const actualizaciones = ids.map((id) =>
      this.http.put<HorarioZonaResponse>(`${this.adminApiUrl}/${id}`, {
        activo,
      })
    );

    return new Observable<HorarioZona[]>((observer) => {
      Promise.all(actualizaciones.map((obs) => obs.toPromise()))
        .then((responses) => {
          const horariosActualizados = responses.map(
            (response) => response!.data
          );

          // Actualizar estado local
          const horarios = this._horariosZona();
          const nuevosHorarios = horarios.map((horario) => {
            const actualizado = horariosActualizados.find(
              (h) => h.id === horario.id
            );
            return actualizado || horario;
          });

          this._horariosZona.set(nuevosHorarios);
          this.horariosZonaSubject.next(nuevosHorarios);

          observer.next(horariosActualizados);
          observer.complete();
        })
        .catch((error) => {
          this.manejarError('Error al cambiar estado múltiple', error);
          observer.error(error);
        })
        .finally(() => {
          this.finalizarCarga();
        });
    });
  }

  /**
   * Clonar horarios de una zona a otra
   */
  clonarHorarios(
    zonaOrigenId: number,
    zonaDestinoId: number
  ): Observable<HorarioZona[]> {
    const horariosOrigen = filtrarPorZona(this._horariosZona(), zonaOrigenId);

    if (horariosOrigen.length === 0) {
      return throwError(
        () => new Error('No hay horarios para clonar en la zona origen')
      );
    }

    this.iniciarCarga();

    const clonaciones = horariosOrigen.map((horario) => {
      const nuevoHorario: CreateHorarioZonaDto = {
        zona_reparto_id: zonaDestinoId,
        dia_semana: horario.dia_semana,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
        activo: horario.activo,
        dia_completo: horario.dia_completo,
        observaciones: horario.observaciones,
      };

      return this.http.post<HorarioZonaResponse>(
        this.adminApiUrl,
        nuevoHorario
      );
    });

    return new Observable<HorarioZona[]>((observer) => {
      Promise.all(clonaciones.map((obs) => obs.toPromise()))
        .then((responses) => {
          const horariosClonados = responses.map((response) => response!.data);

          // Actualizar estado local
          const horariosActualizados = [
            ...this._horariosZona(),
            ...horariosClonados,
          ];
          this._horariosZona.set(horariosActualizados);
          this.horariosZonaSubject.next(horariosActualizados);

          observer.next(horariosClonados);
          observer.complete();
        })
        .catch((error) => {
          this.manejarError('Error al clonar horarios', error);
          observer.error(error);
        })
        .finally(() => {
          this.finalizarCarga();
        });
    });
  }

  /**
   * Obtener resumen de cobertura semanal
   */
  obtenerResumenCobertura(
    totalZonas: number
  ): Observable<ResumenCoberturaSemanal> {
    const horarios = this._horariosZona();
    const resumen = generarResumenCobertura(horarios, totalZonas);
    return of(resumen);
  }

  /**
   * Analizar disponibilidad actual
   */
  analizarDisponibilidad(): Observable<AnalisisDisponibilidad> {
    const horarios = this._horariosZona();
    const analisis = analizarDisponibilidad(horarios);
    return of(analisis);
  }

  /**
   * Obtener próximo horario de una zona
   */
  obtenerProximoHorarioZona(
    zonaRepartoId: number
  ): Observable<HorarioZona | null> {
    const horarios = this._horariosZona();
    const proximoHorario = obtenerProximoHorario(horarios, zonaRepartoId);
    return of(proximoHorario);
  }

  /**
   * Exportar datos a CSV
   */
  exportarCSV(filtros: FiltrosHorarioZona = {}): Observable<Blob> {
    return this.obtenerHorariosZona(filtros).pipe(
      map((response) => {
        const headers = [
          'ID',
          'Zona de Reparto',
          'Día de la Semana',
          'Hora Inicio',
          'Hora Fin',
          'Duración (horas)',
          'Activo',
          'Día Completo',
          'Observaciones',
          'Estado Actual',
          'Fecha Creación',
        ];

        const rows = response.data.map((horario) => [
          horario.id.toString(),
          horario.zona_reparto?.nombre || '',
          horario.dia_semana,
          horario.hora_inicio || '',
          horario.hora_fin || '',
          horario.duracion_horas?.toString() || '',
          horario.activo ? 'Sí' : 'No',
          horario.dia_completo ? 'Sí' : 'No',
          horario.observaciones || '',
          horario.estado_actual?.esta_abierto_ahora ? 'Abierto' : 'Cerrado',
          new Date(horario.created_at).toLocaleDateString(),
        ]);

        const csvContent = [headers, ...rows]
          .map((row) => row.map((cell) => `"${cell}"`).join(','))
          .join('\n');

        return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      })
    );
  }

  /**
   * Exportar datos a Excel
   */
  exportarExcel(filtros: FiltrosHorarioZona = {}): Observable<Blob> {
    return this.obtenerHorariosZona(filtros).pipe(
      map((response) => {
        // Implementación básica - en producción usar una librería como xlsx
        const data = response.data.map((horario) => ({
          ID: horario.id,
          'Zona de Reparto': horario.zona_reparto?.nombre || '',
          'Día de la Semana': horario.dia_semana,
          'Hora Inicio': horario.hora_inicio || '',
          'Hora Fin': horario.hora_fin || '',
          'Duración (horas)': horario.duracion_horas || '',
          Activo: horario.activo ? 'Sí' : 'No',
          'Día Completo': horario.dia_completo ? 'Sí' : 'No',
          Observaciones: horario.observaciones || '',
          'Estado Actual': horario.estado_actual?.esta_abierto_ahora
            ? 'Abierto'
            : 'Cerrado',
          'Fecha Creación': new Date(horario.created_at).toLocaleDateString(),
        }));

        const jsonString = JSON.stringify(data, null, 2);
        return new Blob([jsonString], { type: 'application/json' });
      })
    );
  }

  /**
   * Limpiar estado del servicio
   */
  limpiarEstado(): void {
    this._horariosZona.set([]);
    this._horarioZonaActual.set(null);
    this._error.set(null);
    this._filtros.set({});
    this._paginacion.set(null);
    this._estadisticas.set(null);

    this.horariosZonaSubject.next([]);
    this.errorSubject.next(null);
  }

  /**
   * Recargar datos
   */
  recargar(): Observable<HorariosZonaResponse> {
    const filtrosActuales = this._filtros();
    return this.obtenerHorariosZona(filtrosActuales);
  }

  /**
   * Validar si un horario es único
   */
  validarUnicidad(
    zonaRepartoId: number,
    diaSemana: DiaSemana,
    excludeId?: number
  ): boolean {
    return validarHorarioUnico(
      this._horariosZona(),
      zonaRepartoId,
      diaSemana,
      excludeId
    );
  }

  /**
   * Detectar conflictos en horarios
   */
  detectarConflictos(): Array<{
    zona_reparto_id: number;
    zona_nombre: string;
    dia_semana: DiaSemana;
    conflictos: string[];
  }> {
    return detectarConflictosHorarios(this._horariosZona());
  }

  /**
   * Obtener horarios por franja horaria
   */
  obtenerPorFranja(
    franja: 'madrugada' | 'mañana' | 'tarde' | 'noche'
  ): HorarioZona[] {
    const horarios = this._horariosZona();

    const rangos = {
      madrugada: { inicio: 0, fin: 6 },
      mañana: { inicio: 6, fin: 12 },
      tarde: { inicio: 12, fin: 18 },
      noche: { inicio: 18, fin: 24 },
    };

    const rango = rangos[franja];

    return horarios.filter((h) => {
      if (!h.hora_inicio) return false;
      const hora = parseInt(h.hora_inicio.split(':')[0]);
      return hora >= rango.inicio && hora < rango.fin;
    });
  }

  /**
   * Verificar disponibilidad de zona en tiempo específico
   */
  verificarDisponibilidad(
    zonaRepartoId: number,
    diaSemana: DiaSemana,
    hora: string
  ): boolean {
    const horariosZona = filtrarPorZona(
      filtrarActivos(this._horariosZona()),
      zonaRepartoId
    );
    const horarioDia = horariosZona.find((h) => h.dia_semana === diaSemana);

    if (!horarioDia || !horarioDia.activo) return false;
    if (horarioDia.dia_completo) return true;
    if (!horarioDia.hora_inicio || !horarioDia.hora_fin) return false;

    const inicio = horarioDia.hora_inicio;
    const fin = horarioDia.hora_fin;

    // Horario normal (no cruza medianoche)
    if (inicio <= fin) {
      return hora >= inicio && hora <= fin;
    }

    // Horario que cruza medianoche
    return hora >= inicio || hora <= fin;
  }

  // Métodos privados
  private sincronizarEstados(): void {
    // Sincronizar signals con BehaviorSubjects para compatibilidad
    this.horariosZonaSubject.next(this._horariosZona());
    this.cargandoSubject.next(this._cargando());
    this.errorSubject.next(this._error());
  }

  private iniciarCarga(): void {
    this._cargando.set(true);
    this._error.set(null);
    this.cargandoSubject.next(true);
    this.errorSubject.next(null);
  }

  private finalizarCarga(): void {
    this._cargando.set(false);
    this.cargandoSubject.next(false);
  }

  private manejarError(mensaje: string, error: any): Observable<never> {
    console.error(mensaje, error);

    let mensajeError = mensaje;
    if (error?.error?.message) {
      mensajeError += `: ${error.error.message}`;
    } else if (error?.message) {
      mensajeError += `: ${error.message}`;
    }

    this._error.set(mensajeError);
    this.errorSubject.next(mensajeError);

    return throwError(() => new Error(mensajeError));
  }
}
