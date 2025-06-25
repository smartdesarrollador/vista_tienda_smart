import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ZonaDistrito,
  CreateZonaDistritoDto,
  UpdateZonaDistritoDto,
  FiltrosZonaDistrito,
  ZonaDistritoResponse,
  ZonasDistritosResponse,
  EstadisticasZonaDistrito,
  AsignacionesPorZona,
  AsignacionesPorDistrito,
  ResumenCobertura,
  validarZonaDistrito,
  calcularEstadisticas,
  agruparPorZonaReparto,
  agruparPorDistrito,
  filtrarPorZonaReparto,
  filtrarPorDistrito,
  filtrarPorPrioridad,
  filtrarActivas,
  filtrarInactivas,
  buscarAsignaciones,
  ordenarPorPrioridad,
  ordenarPorCosto,
  validarAsignacionUnica,
  obtenerConflictosAsignacion,
} from '../models/zona-distrito.interface';

@Injectable({
  providedIn: 'root',
})
export class ZonaDistritoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/zonas-distrito`;
  private readonly adminApiUrl = `${environment.apiUrl}/vista/zonas-distrito`;

  // Estados reactivos con signals
  private readonly _zonasDistritos = signal<ZonaDistrito[]>([]);
  private readonly _zonaDistritoActual = signal<ZonaDistrito | null>(null);
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtros = signal<FiltrosZonaDistrito>({});
  private readonly _paginacion = signal<ZonasDistritosResponse['meta'] | null>(
    null
  );
  private readonly _estadisticas = signal<EstadisticasZonaDistrito | null>(
    null
  );

  // Computed signals para valores derivados
  readonly zonasDistritos = computed(() => this._zonasDistritos());
  readonly zonaDistritoActual = computed(() => this._zonaDistritoActual());
  readonly cargando = computed(() => this._cargando());
  readonly error = computed(() => this._error());
  readonly filtros = computed(() => this._filtros());
  readonly paginacion = computed(() => this._paginacion());
  readonly estadisticas = computed(() => this._estadisticas());

  // Computed signals para datos procesados
  readonly zonasDistritosActivas = computed(() =>
    filtrarActivas(this._zonasDistritos())
  );

  readonly zonasDistritosInactivas = computed(() =>
    filtrarInactivas(this._zonasDistritos())
  );

  readonly asignacionesPorZona = computed(() =>
    agruparPorZonaReparto(this._zonasDistritos())
  );

  readonly asignacionesPorDistrito = computed(() =>
    agruparPorDistrito(this._zonasDistritos())
  );

  readonly conflictosAsignacion = computed(() =>
    obtenerConflictosAsignacion(this._zonasDistritos())
  );

  readonly totalAsignaciones = computed(() => this._zonasDistritos().length);

  readonly hayDatos = computed(() => this._zonasDistritos().length > 0);

  readonly hayError = computed(() => this._error() !== null);

  readonly estadisticasCalculadas = computed(() => {
    const asignaciones = this._zonasDistritos();
    return asignaciones.length > 0 ? calcularEstadisticas(asignaciones) : null;
  });

  // BehaviorSubjects para compatibilidad con observables
  private readonly zonasDistritosSubject = new BehaviorSubject<ZonaDistrito[]>(
    []
  );
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos
  readonly zonasDistritos$ = this.zonasDistritosSubject.asObservable();
  readonly cargando$ = this.cargandoSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  constructor() {
    // Sincronizar signals con BehaviorSubjects
    this.sincronizarEstados();
  }

  /**
   * Obtener todas las asignaciones zona-distrito con filtros y paginación
   */
  obtenerZonasDistritos(
    filtros: FiltrosZonaDistrito = {}
  ): Observable<ZonasDistritosResponse> {
    this.iniciarCarga();
    this._filtros.set(filtros);

    let params = new HttpParams();

    // Aplicar filtros
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ZonasDistritosResponse>(this.apiUrl, { params }).pipe(
      tap((response) => {
        this._zonasDistritos.set(response.data);
        this._paginacion.set(response.meta);
        this.zonasDistritosSubject.next(response.data);
      }),
      catchError((error) =>
        this.manejarError('Error al obtener zonas-distrito', error)
      ),
      finalize(() => this.finalizarCarga())
    );
  }

  /**
   * Obtener una asignación zona-distrito específica por ID
   */
  obtenerZonaDistrito(id: number): Observable<ZonaDistrito> {
    this.iniciarCarga();

    return this.http.get<ZonaDistritoResponse>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response.data),
      tap((zonaDistrito) => {
        this._zonaDistritoActual.set(zonaDistrito);
      }),
      catchError((error) =>
        this.manejarError('Error al obtener zona-distrito', error)
      ),
      finalize(() => this.finalizarCarga())
    );
  }

  /**
   * Crear nueva asignación zona-distrito
   */
  crearZonaDistrito(data: CreateZonaDistritoDto): Observable<ZonaDistrito> {
    // Validar datos antes de enviar
    const errores = validarZonaDistrito(data);
    if (errores.length > 0) {
      return throwError(() => new Error(errores.join(', ')));
    }

    // Validar unicidad
    const asignacionesActuales = this._zonasDistritos();
    if (
      !validarAsignacionUnica(
        asignacionesActuales,
        data.zona_reparto_id,
        data.distrito_id
      )
    ) {
      return throwError(
        () =>
          new Error(
            'Ya existe una asignación para esta zona de reparto y distrito'
          )
      );
    }

    this.iniciarCarga();

    return this.http.post<ZonaDistritoResponse>(this.adminApiUrl, data).pipe(
      map((response) => response.data),
      tap((nuevaZonaDistrito) => {
        const asignacionesActualizadas = [
          ...this._zonasDistritos(),
          nuevaZonaDistrito,
        ];
        this._zonasDistritos.set(asignacionesActualizadas);
        this._zonaDistritoActual.set(nuevaZonaDistrito);
        this.zonasDistritosSubject.next(asignacionesActualizadas);
      }),
      catchError((error) =>
        this.manejarError('Error al crear zona-distrito', error)
      ),
      finalize(() => this.finalizarCarga())
    );
  }

  /**
   * Actualizar asignación zona-distrito existente
   */
  actualizarZonaDistrito(
    id: number,
    data: UpdateZonaDistritoDto
  ): Observable<ZonaDistrito> {
    // Validar datos antes de enviar
    const errores = validarZonaDistrito(data);
    if (errores.length > 0) {
      return throwError(() => new Error(errores.join(', ')));
    }

    this.iniciarCarga();

    return this.http
      .put<ZonaDistritoResponse>(`${this.adminApiUrl}/${id}`, data)
      .pipe(
        map((response) => response.data),
        tap((zonaDistritoActualizada) => {
          const asignaciones = this._zonasDistritos();
          const indice = asignaciones.findIndex((z) => z.id === id);

          if (indice !== -1) {
            const asignacionesActualizadas = [...asignaciones];
            asignacionesActualizadas[indice] = zonaDistritoActualizada;
            this._zonasDistritos.set(asignacionesActualizadas);
            this.zonasDistritosSubject.next(asignacionesActualizadas);
          }

          this._zonaDistritoActual.set(zonaDistritoActualizada);
        }),
        catchError((error) =>
          this.manejarError('Error al actualizar zona-distrito', error)
        ),
        finalize(() => this.finalizarCarga())
      );
  }

  /**
   * Eliminar asignación zona-distrito
   */
  eliminarZonaDistrito(id: number): Observable<void> {
    this.iniciarCarga();

    return this.http.delete<void>(`${this.adminApiUrl}/${id}`).pipe(
      tap(() => {
        const asignacionesFiltradas = this._zonasDistritos().filter(
          (z) => z.id !== id
        );
        this._zonasDistritos.set(asignacionesFiltradas);
        this.zonasDistritosSubject.next(asignacionesFiltradas);

        // Limpiar zona actual si es la que se eliminó
        if (this._zonaDistritoActual()?.id === id) {
          this._zonaDistritoActual.set(null);
        }
      }),
      catchError((error) =>
        this.manejarError('Error al eliminar zona-distrito', error)
      ),
      finalize(() => this.finalizarCarga())
    );
  }

  /**
   * Obtener asignaciones por zona de reparto
   */
  obtenerPorZonaReparto(zonaRepartoId: number): Observable<ZonaDistrito[]> {
    const filtros: FiltrosZonaDistrito = { zona_reparto_id: zonaRepartoId };

    return this.obtenerZonasDistritos(filtros).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Obtener asignaciones por distrito
   */
  obtenerPorDistrito(distritoId: number): Observable<ZonaDistrito[]> {
    const filtros: FiltrosZonaDistrito = { distrito_id: distritoId };

    return this.obtenerZonasDistritos(filtros).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Obtener estadísticas de asignaciones
   */
  obtenerEstadisticas(): Observable<EstadisticasZonaDistrito> {
    // Si ya tenemos datos cargados, calcular estadísticas localmente
    const asignaciones = this._zonasDistritos();
    if (asignaciones.length > 0) {
      const estadisticas = calcularEstadisticas(asignaciones);
      this._estadisticas.set(estadisticas);
      return of(estadisticas);
    }

    // Si no hay datos, cargar primero
    return this.obtenerZonasDistritos().pipe(
      map((response) => {
        const estadisticas = calcularEstadisticas(response.data);
        this._estadisticas.set(estadisticas);
        return estadisticas;
      })
    );
  }

  /**
   * Buscar asignaciones por término
   */
  buscar(termino: string): Observable<ZonaDistrito[]> {
    if (!termino.trim()) {
      return of(this._zonasDistritos());
    }

    const resultados = buscarAsignaciones(this._zonasDistritos(), termino);
    return of(resultados);
  }

  /**
   * Filtrar asignaciones localmente
   */
  filtrarLocal(filtros: Partial<FiltrosZonaDistrito>): ZonaDistrito[] {
    let asignaciones = this._zonasDistritos();

    if (filtros.zona_reparto_id) {
      asignaciones = filtrarPorZonaReparto(
        asignaciones,
        filtros.zona_reparto_id
      );
    }

    if (filtros.distrito_id) {
      asignaciones = filtrarPorDistrito(asignaciones, filtros.distrito_id);
    }

    if (filtros.prioridad) {
      asignaciones = filtrarPorPrioridad(asignaciones, filtros.prioridad);
    }

    if (filtros.activo !== undefined) {
      asignaciones = filtros.activo
        ? filtrarActivas(asignaciones)
        : filtrarInactivas(asignaciones);
    }

    return asignaciones;
  }

  /**
   * Ordenar asignaciones localmente
   */
  ordenarLocal(
    asignaciones: ZonaDistrito[],
    campo: string,
    direccion: 'asc' | 'desc' = 'asc'
  ): ZonaDistrito[] {
    switch (campo) {
      case 'prioridad':
        return ordenarPorPrioridad(asignaciones, direccion);
      case 'costo_envio_efectivo':
        return ordenarPorCosto(asignaciones, direccion);
      default:
        return asignaciones;
    }
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
          const asignacionesFiltradas = this._zonasDistritos().filter(
            (z) => !ids.includes(z.id)
          );
          this._zonasDistritos.set(asignacionesFiltradas);
          this.zonasDistritosSubject.next(asignacionesFiltradas);
          observer.next();
          observer.complete();
        })
        .catch((error) => {
          this.manejarError(
            'Error al eliminar múltiples zonas-distrito',
            error
          );
          observer.error(error);
        })
        .finally(() => {
          this.finalizarCarga();
        });
    });
  }

  /**
   * Activar/desactivar múltiples asignaciones
   */
  cambiarEstadoMultiples(
    ids: number[],
    activo: boolean
  ): Observable<ZonaDistrito[]> {
    this.iniciarCarga();

    const actualizaciones = ids.map((id) =>
      this.http.put<ZonaDistritoResponse>(`${this.adminApiUrl}/${id}`, {
        activo,
      })
    );

    return new Observable<ZonaDistrito[]>((observer) => {
      Promise.all(actualizaciones.map((obs) => obs.toPromise()))
        .then((responses) => {
          const asignacionesActualizadas = responses.map(
            (response) => response!.data
          );

          // Actualizar estado local
          const asignaciones = this._zonasDistritos();
          const nuevasAsignaciones = asignaciones.map((asignacion) => {
            const actualizada = asignacionesActualizadas.find(
              (a) => a.id === asignacion.id
            );
            return actualizada || asignacion;
          });

          this._zonasDistritos.set(nuevasAsignaciones);
          this.zonasDistritosSubject.next(nuevasAsignaciones);

          observer.next(asignacionesActualizadas);
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
   * Exportar datos a CSV
   */
  exportarCSV(filtros: FiltrosZonaDistrito = {}): Observable<Blob> {
    return this.obtenerZonasDistritos(filtros).pipe(
      map((response) => {
        const headers = [
          'ID',
          'Zona de Reparto',
          'Distrito',
          'Provincia',
          'Departamento',
          'Costo Personalizado',
          'Tiempo Adicional',
          'Activo',
          'Prioridad',
          'Costo Efectivo',
          'Fecha Creación',
        ];

        const rows = response.data.map((asignacion) => [
          asignacion.id.toString(),
          asignacion.zona_reparto?.nombre || '',
          asignacion.distrito?.nombre || '',
          asignacion.distrito?.provincia?.nombre || '',
          asignacion.distrito?.provincia?.departamento?.nombre || '',
          asignacion.costo_envio_personalizado?.toString() || '',
          asignacion.tiempo_adicional.toString(),
          asignacion.activo ? 'Sí' : 'No',
          asignacion.prioridad_texto,
          asignacion.costo_envio_efectivo.toString(),
          new Date(asignacion.created_at).toLocaleDateString(),
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
  exportarExcel(filtros: FiltrosZonaDistrito = {}): Observable<Blob> {
    return this.obtenerZonasDistritos(filtros).pipe(
      map((response) => {
        // Implementación básica - en producción usar una librería como xlsx
        const data = response.data.map((asignacion) => ({
          ID: asignacion.id,
          'Zona de Reparto': asignacion.zona_reparto?.nombre || '',
          Distrito: asignacion.distrito?.nombre || '',
          Provincia: asignacion.distrito?.provincia?.nombre || '',
          Departamento:
            asignacion.distrito?.provincia?.departamento?.nombre || '',
          'Costo Personalizado': asignacion.costo_envio_personalizado || '',
          'Tiempo Adicional': asignacion.tiempo_adicional,
          Activo: asignacion.activo ? 'Sí' : 'No',
          Prioridad: asignacion.prioridad_texto,
          'Costo Efectivo': asignacion.costo_envio_efectivo,
          'Fecha Creación': new Date(
            asignacion.created_at
          ).toLocaleDateString(),
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
    this._zonasDistritos.set([]);
    this._zonaDistritoActual.set(null);
    this._error.set(null);
    this._filtros.set({});
    this._paginacion.set(null);
    this._estadisticas.set(null);

    this.zonasDistritosSubject.next([]);
    this.errorSubject.next(null);
  }

  /**
   * Recargar datos
   */
  recargar(): Observable<ZonasDistritosResponse> {
    const filtrosActuales = this._filtros();
    return this.obtenerZonasDistritos(filtrosActuales);
  }

  /**
   * Validar si una asignación es única
   */
  validarUnicidad(
    zonaRepartoId: number,
    distritoId: number,
    excludeId?: number
  ): boolean {
    return validarAsignacionUnica(
      this._zonasDistritos(),
      zonaRepartoId,
      distritoId,
      excludeId
    );
  }

  /**
   * Obtener resumen de cobertura
   */
  obtenerResumenCobertura(
    totalZonas: number,
    totalDistritos: number
  ): ResumenCobertura {
    const asignaciones = this._zonasDistritos();
    const zonasConAsignaciones = new Set(
      asignaciones.map((a) => a.zona_reparto_id)
    );
    const distritosConAsignaciones = new Set(
      asignaciones.map((a) => a.distrito_id)
    );

    const coberturaZonas =
      totalZonas > 0 ? (zonasConAsignaciones.size / totalZonas) * 100 : 0;
    const coberturaDistritos =
      totalDistritos > 0
        ? (distritosConAsignaciones.size / totalDistritos) * 100
        : 0;
    const coberturaPromedio = (coberturaZonas + coberturaDistritos) / 2;

    return {
      total_zonas_reparto: totalZonas,
      total_distritos: totalDistritos,
      total_asignaciones: asignaciones.length,
      cobertura_porcentaje: coberturaPromedio,
      zonas_sin_asignaciones: [],
      distritos_sin_asignaciones: [],
    };
  }

  // Métodos privados
  private sincronizarEstados(): void {
    // Sincronizar signals con BehaviorSubjects para compatibilidad
    this.zonasDistritosSubject.next(this._zonasDistritos());
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
