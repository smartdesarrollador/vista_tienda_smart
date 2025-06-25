import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CostoEnvioDinamico,
  CreateCostoEnvioDinamicoDto,
  UpdateCostoEnvioDinamicoDto,
  FiltrosCostoEnvioDinamico,
  CostoEnvioDinamicoResponse,
  CostosEnvioDinamicoResponse,
  EstadisticasCostoEnvioDinamico,
  CostosPorZona,
  AnalisisCobertura,
  CalculoCosto,
  OptimizacionRangos,
  validarCostoEnvioDinamico,
  calcularEstadisticas,
  agruparPorZona,
  filtrarPorZona,
  filtrarActivos,
  filtrarInactivos,
  filtrarPorRangoCosto,
  filtrarPorRangoDistancia,
  buscarCostos,
  ordenarPorDistancia,
  ordenarPorCosto,
  ordenarPorAmplitud,
  validarRangoUnico,
  calcularCostoParaDistancia,
  analizarCobertura,
  generarSugerenciasOptimizacion,
  obtenerCostoMasEconomico,
  obtenerCostoMasRapido,
  encontrarGaps,
  encontrarSolapamientos,
} from '../models/costo-envio-dinamico.interface';

@Injectable({
  providedIn: 'root',
})
export class CostoEnvioDinamicoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/costos-envio-dinamicos`;

  // Estados reactivos con signals
  private readonly _costosEnvioDinamico = signal<CostoEnvioDinamico[]>([]);
  private readonly _costoEnvioDinamicoActual =
    signal<CostoEnvioDinamico | null>(null);
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtros = signal<FiltrosCostoEnvioDinamico>({});
  private readonly _paginacion = signal<
    CostosEnvioDinamicoResponse['meta'] | null
  >(null);
  private readonly _estadisticas =
    signal<EstadisticasCostoEnvioDinamico | null>(null);

  // Computed signals para valores derivados
  readonly costosEnvioDinamico = computed(() => this._costosEnvioDinamico());
  readonly costoEnvioDinamicoActual = computed(() =>
    this._costoEnvioDinamicoActual()
  );
  readonly cargando = computed(() => this._cargando());
  readonly error = computed(() => this._error());
  readonly filtros = computed(() => this._filtros());
  readonly paginacion = computed(() => this._paginacion());
  readonly estadisticas = computed(() => this._estadisticas());

  // Computed signals para datos procesados
  readonly costosActivos = computed(() =>
    filtrarActivos(this._costosEnvioDinamico())
  );

  readonly costosInactivos = computed(() =>
    filtrarInactivos(this._costosEnvioDinamico())
  );

  readonly costosPorZona = computed(() =>
    agruparPorZona(this._costosEnvioDinamico())
  );

  readonly zonasConCobertura = computed(
    () => this.costosPorZona().filter((z) => z.cobertura_completa).length
  );

  readonly zonasConGaps = computed(
    () => this.costosPorZona().filter((z) => z.gaps_cobertura.length > 0).length
  );

  readonly totalCostos = computed(() => this._costosEnvioDinamico().length);

  readonly hayDatos = computed(() => this._costosEnvioDinamico().length > 0);

  readonly hayError = computed(() => this._error() !== null);

  readonly estadisticasCalculadas = computed(() => {
    const costos = this._costosEnvioDinamico();
    return costos.length > 0 ? calcularEstadisticas(costos) : null;
  });

  readonly analisisCobertura = computed(() => {
    const costos = this._costosEnvioDinamico();
    return costos.length > 0 ? analizarCobertura(costos) : null;
  });

  readonly costoPromedio = computed(() => {
    const activos = this.costosActivos();
    return activos.length > 0
      ? activos.reduce((sum, c) => sum + c.costo_envio, 0) / activos.length
      : 0;
  });

  readonly distanciaMaximaCubierta = computed(() => {
    const costos = this._costosEnvioDinamico();
    return costos.length > 0
      ? Math.max(...costos.map((c) => c.distancia_hasta_km))
      : 0;
  });

  // BehaviorSubjects para compatibilidad con observables
  private readonly costosEnvioDinamicoSubject = new BehaviorSubject<
    CostoEnvioDinamico[]
  >([]);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos
  readonly costosEnvioDinamico$ =
    this.costosEnvioDinamicoSubject.asObservable();
  readonly cargando$ = this.cargandoSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  constructor() {
    // Sincronizar signals con BehaviorSubjects
    this.sincronizarEstados();
  }

  /**
   * Obtener todos los costos de envío dinámicos con filtros y paginación
   */
  obtenerCostosEnvioDinamico(
    filtros: FiltrosCostoEnvioDinamico = {}
  ): Observable<CostosEnvioDinamicoResponse> {
    this.iniciarCarga();
    this._filtros.set(filtros);

    let params = new HttpParams();

    // Aplicar filtros
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<CostosEnvioDinamicoResponse>(this.apiUrl, { params })
      .pipe(
        tap((response) => {
          this._costosEnvioDinamico.set(response.data);
          this._paginacion.set(response.meta);
          this.costosEnvioDinamicoSubject.next(response.data);
        }),
        catchError((error) =>
          this.manejarError('Error al obtener costos de envío dinámicos', error)
        ),
        finalize(() => this.finalizarCarga())
      );
  }

  /**
   * Obtener un costo de envío dinámico específico por ID
   */
  obtenerCostoEnvioDinamico(id: number): Observable<CostoEnvioDinamico> {
    this.iniciarCarga();

    return this.http
      .get<CostoEnvioDinamicoResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => response.data),
        tap((costoEnvioDinamico) => {
          this._costoEnvioDinamicoActual.set(costoEnvioDinamico);
        }),
        catchError((error) =>
          this.manejarError('Error al obtener costo de envío dinámico', error)
        ),
        finalize(() => this.finalizarCarga())
      );
  }

  /**
   * Crear nuevo costo de envío dinámico
   */
  crearCostoEnvioDinamico(
    data: CreateCostoEnvioDinamicoDto
  ): Observable<CostoEnvioDinamico> {
    // Validar datos antes de enviar
    const errores = validarCostoEnvioDinamico(data);
    if (errores.length > 0) {
      return throwError(() => new Error(errores.join(', ')));
    }

    // Validar que no haya solapamiento
    const costosActuales = this._costosEnvioDinamico();
    if (
      !validarRangoUnico(
        costosActuales,
        data.zona_reparto_id,
        data.distancia_desde_km,
        data.distancia_hasta_km
      )
    ) {
      return throwError(
        () => new Error('El rango de distancia se solapa con otro existente')
      );
    }

    this.iniciarCarga();

    return this.http.post<CostoEnvioDinamicoResponse>(this.apiUrl, data).pipe(
      map((response) => response.data),
      tap((nuevoCosto) => {
        const costosActualizados = [...this._costosEnvioDinamico(), nuevoCosto];
        this._costosEnvioDinamico.set(costosActualizados);
        this._costoEnvioDinamicoActual.set(nuevoCosto);
        this.costosEnvioDinamicoSubject.next(costosActualizados);
      }),
      catchError((error) =>
        this.manejarError('Error al crear costo de envío dinámico', error)
      ),
      finalize(() => this.finalizarCarga())
    );
  }

  /**
   * Actualizar costo de envío dinámico existente
   */
  actualizarCostoEnvioDinamico(
    id: number,
    data: UpdateCostoEnvioDinamicoDto
  ): Observable<CostoEnvioDinamico> {
    // Validar datos antes de enviar
    const errores = validarCostoEnvioDinamico(data);
    if (errores.length > 0) {
      return throwError(() => new Error(errores.join(', ')));
    }

    // Validar solapamiento si se modifican las distancias
    if (
      data.distancia_desde_km !== undefined ||
      data.distancia_hasta_km !== undefined
    ) {
      const costoActual = this._costosEnvioDinamico().find((c) => c.id === id);
      if (costoActual) {
        const desde = data.distancia_desde_km ?? costoActual.distancia_desde_km;
        const hasta = data.distancia_hasta_km ?? costoActual.distancia_hasta_km;

        if (
          !validarRangoUnico(
            this._costosEnvioDinamico(),
            costoActual.zona_reparto_id,
            desde,
            hasta,
            id
          )
        ) {
          return throwError(
            () =>
              new Error('El rango de distancia se solapa con otro existente')
          );
        }
      }
    }

    this.iniciarCarga();

    return this.http
      .put<CostoEnvioDinamicoResponse>(`${this.apiUrl}/${id}`, data)
      .pipe(
        map((response) => response.data),
        tap((costoActualizado) => {
          const costos = this._costosEnvioDinamico();
          const indice = costos.findIndex((c) => c.id === id);

          if (indice !== -1) {
            const costosActualizados = [...costos];
            costosActualizados[indice] = costoActualizado;
            this._costosEnvioDinamico.set(costosActualizados);
            this.costosEnvioDinamicoSubject.next(costosActualizados);
          }

          this._costoEnvioDinamicoActual.set(costoActualizado);
        }),
        catchError((error) =>
          this.manejarError(
            'Error al actualizar costo de envío dinámico',
            error
          )
        ),
        finalize(() => this.finalizarCarga())
      );
  }

  /**
   * Eliminar costo de envío dinámico
   */
  eliminarCostoEnvioDinamico(id: number): Observable<void> {
    this.iniciarCarga();

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const costosFiltrados = this._costosEnvioDinamico().filter(
          (c) => c.id !== id
        );
        this._costosEnvioDinamico.set(costosFiltrados);
        this.costosEnvioDinamicoSubject.next(costosFiltrados);

        // Limpiar costo actual si es el que se eliminó
        if (this._costoEnvioDinamicoActual()?.id === id) {
          this._costoEnvioDinamicoActual.set(null);
        }
      }),
      catchError((error) =>
        this.manejarError('Error al eliminar costo de envío dinámico', error)
      ),
      finalize(() => this.finalizarCarga())
    );
  }

  /**
   * Obtener costos por zona de reparto
   */
  obtenerPorZonaReparto(
    zonaRepartoId: number
  ): Observable<CostoEnvioDinamico[]> {
    const filtros: FiltrosCostoEnvioDinamico = {
      zona_reparto_id: zonaRepartoId,
    };

    return this.obtenerCostosEnvioDinamico(filtros).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Calcular costo para una distancia específica
   */
  calcularCostoParaDistancia(
    zonaRepartoId: number,
    distancia: number
  ): Observable<CalculoCosto | null> {
    const costosZona = filtrarPorZona(this.costosActivos(), zonaRepartoId);
    const calculo = calcularCostoParaDistancia(costosZona, distancia);
    return of(calculo);
  }

  /**
   * Obtener estadísticas de costos
   */
  obtenerEstadisticas(): Observable<EstadisticasCostoEnvioDinamico> {
    // Si ya tenemos datos cargados, calcular estadísticas localmente
    const costos = this._costosEnvioDinamico();
    if (costos.length > 0) {
      const estadisticas = calcularEstadisticas(costos);
      this._estadisticas.set(estadisticas);
      return of(estadisticas);
    }

    // Si no hay datos, cargar primero
    return this.obtenerCostosEnvioDinamico().pipe(
      map((response) => {
        const estadisticas = calcularEstadisticas(response.data);
        this._estadisticas.set(estadisticas);
        return estadisticas;
      })
    );
  }

  /**
   * Buscar costos por término
   */
  buscar(termino: string): Observable<CostoEnvioDinamico[]> {
    if (!termino.trim()) {
      return of(this._costosEnvioDinamico());
    }

    const resultados = buscarCostos(this._costosEnvioDinamico(), termino);
    return of(resultados);
  }

  /**
   * Filtrar costos localmente
   */
  filtrarLocal(
    filtros: Partial<FiltrosCostoEnvioDinamico>
  ): CostoEnvioDinamico[] {
    let costos = this._costosEnvioDinamico();

    if (filtros.zona_reparto_id) {
      costos = filtrarPorZona(costos, filtros.zona_reparto_id);
    }

    if (filtros.activo !== undefined) {
      costos = filtros.activo
        ? filtrarActivos(costos)
        : filtrarInactivos(costos);
    }

    if (filtros.costo_min !== undefined || filtros.costo_max !== undefined) {
      const min = filtros.costo_min ?? 0;
      const max = filtros.costo_max ?? Number.MAX_VALUE;
      costos = filtrarPorRangoCosto(costos, min, max);
    }

    if (filtros.distancia !== undefined) {
      costos = costos.filter(
        (c) =>
          c.distancia_desde_km <= filtros.distancia! &&
          c.distancia_hasta_km > filtros.distancia!
      );
    }

    return costos;
  }

  /**
   * Ordenar costos localmente
   */
  ordenarLocal(
    costos: CostoEnvioDinamico[],
    campo: string,
    direccion: 'asc' | 'desc' = 'asc'
  ): CostoEnvioDinamico[] {
    switch (campo) {
      case 'distancia_desde_km':
      case 'distancia_hasta_km':
        return ordenarPorDistancia(costos, direccion);
      case 'costo_envio':
        return ordenarPorCosto(costos, direccion);
      case 'amplitud_rango':
        return ordenarPorAmplitud(costos, direccion);
      default:
        return costos;
    }
  }

  /**
   * Operaciones múltiples
   */
  eliminarMultiples(ids: number[]): Observable<void> {
    this.iniciarCarga();

    const eliminaciones = ids.map((id) =>
      this.http.delete<void>(`${this.apiUrl}/${id}`)
    );

    return new Observable<void>((observer) => {
      Promise.all(eliminaciones.map((obs) => obs.toPromise()))
        .then(() => {
          const costosFiltrados = this._costosEnvioDinamico().filter(
            (c) => !ids.includes(c.id)
          );
          this._costosEnvioDinamico.set(costosFiltrados);
          this.costosEnvioDinamicoSubject.next(costosFiltrados);
          observer.next();
          observer.complete();
        })
        .catch((error) => {
          this.manejarError('Error al eliminar múltiples costos', error);
          observer.error(error);
        })
        .finally(() => {
          this.finalizarCarga();
        });
    });
  }

  /**
   * Activar/desactivar múltiples costos
   */
  cambiarEstadoMultiples(
    ids: number[],
    activo: boolean
  ): Observable<CostoEnvioDinamico[]> {
    this.iniciarCarga();

    const actualizaciones = ids.map((id) =>
      this.http.put<CostoEnvioDinamicoResponse>(`${this.apiUrl}/${id}`, {
        activo,
      })
    );

    return new Observable<CostoEnvioDinamico[]>((observer) => {
      Promise.all(actualizaciones.map((obs) => obs.toPromise()))
        .then((responses) => {
          const costosActualizados = responses.map(
            (response) => response!.data
          );

          // Actualizar estado local
          const costos = this._costosEnvioDinamico();
          const nuevosCostos = costos.map((costo) => {
            const actualizado = costosActualizados.find(
              (c) => c.id === costo.id
            );
            return actualizado || costo;
          });

          this._costosEnvioDinamico.set(nuevosCostos);
          this.costosEnvioDinamicoSubject.next(nuevosCostos);

          observer.next(costosActualizados);
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
   * Crear rangos automáticos para una zona
   */
  crearRangosAutomaticos(
    zonaRepartoId: number,
    configuracion: {
      distanciaMaxima: number;
      incrementoDistancia: number;
      costoBase: number;
      incrementoCosto: number;
      tiempoAdicionalBase?: number;
      incrementoTiempo?: number;
    }
  ): Observable<CostoEnvioDinamico[]> {
    this.iniciarCarga();

    const rangos: CreateCostoEnvioDinamicoDto[] = [];
    let distanciaActual = 0;
    let costoActual = configuracion.costoBase;
    let tiempoActual = configuracion.tiempoAdicionalBase || 0;

    while (distanciaActual < configuracion.distanciaMaxima) {
      const distanciaHasta = Math.min(
        distanciaActual + configuracion.incrementoDistancia,
        configuracion.distanciaMaxima
      );

      rangos.push({
        zona_reparto_id: zonaRepartoId,
        distancia_desde_km: distanciaActual,
        distancia_hasta_km: distanciaHasta,
        costo_envio: costoActual,
        tiempo_adicional: tiempoActual,
        activo: true,
      });

      distanciaActual = distanciaHasta;
      costoActual += configuracion.incrementoCosto;
      tiempoActual += configuracion.incrementoTiempo || 0;
    }

    const creaciones = rangos.map((rango) =>
      this.http.post<CostoEnvioDinamicoResponse>(this.apiUrl, rango)
    );

    return new Observable<CostoEnvioDinamico[]>((observer) => {
      Promise.all(creaciones.map((obs) => obs.toPromise()))
        .then((responses) => {
          const nuevosCostos = responses.map((response) => response!.data);

          // Actualizar estado local
          const costosActualizados = [
            ...this._costosEnvioDinamico(),
            ...nuevosCostos,
          ];
          this._costosEnvioDinamico.set(costosActualizados);
          this.costosEnvioDinamicoSubject.next(costosActualizados);

          observer.next(nuevosCostos);
          observer.complete();
        })
        .catch((error) => {
          this.manejarError('Error al crear rangos automáticos', error);
          observer.error(error);
        })
        .finally(() => {
          this.finalizarCarga();
        });
    });
  }

  /**
   * Clonar costos de una zona a otra
   */
  clonarCostos(
    zonaOrigenId: number,
    zonaDestinoId: number,
    factor: number = 1
  ): Observable<CostoEnvioDinamico[]> {
    const costosOrigen = filtrarPorZona(
      this._costosEnvioDinamico(),
      zonaOrigenId
    );

    if (costosOrigen.length === 0) {
      return throwError(
        () => new Error('No hay costos para clonar en la zona origen')
      );
    }

    this.iniciarCarga();

    const clonaciones = costosOrigen.map((costo) => {
      const nuevoCosto: CreateCostoEnvioDinamicoDto = {
        zona_reparto_id: zonaDestinoId,
        distancia_desde_km: costo.distancia_desde_km,
        distancia_hasta_km: costo.distancia_hasta_km,
        costo_envio: costo.costo_envio * factor,
        tiempo_adicional: costo.tiempo_adicional,
        activo: costo.activo,
      };

      return this.http.post<CostoEnvioDinamicoResponse>(
        this.apiUrl,
        nuevoCosto
      );
    });

    return new Observable<CostoEnvioDinamico[]>((observer) => {
      Promise.all(clonaciones.map((obs) => obs.toPromise()))
        .then((responses) => {
          const costosClonados = responses.map((response) => response!.data);

          // Actualizar estado local
          const costosActualizados = [
            ...this._costosEnvioDinamico(),
            ...costosClonados,
          ];
          this._costosEnvioDinamico.set(costosActualizados);
          this.costosEnvioDinamicoSubject.next(costosActualizados);

          observer.next(costosClonados);
          observer.complete();
        })
        .catch((error) => {
          this.manejarError('Error al clonar costos', error);
          observer.error(error);
        })
        .finally(() => {
          this.finalizarCarga();
        });
    });
  }

  /**
   * Obtener análisis de cobertura
   */
  obtenerAnalisisCobertura(): Observable<AnalisisCobertura> {
    const costos = this._costosEnvioDinamico();
    const analisis = analizarCobertura(costos);
    return of(analisis);
  }

  /**
   * Obtener sugerencias de optimización para una zona
   */
  obtenerSugerenciasOptimizacion(
    zonaRepartoId: number
  ): Observable<OptimizacionRangos> {
    const costos = this._costosEnvioDinamico();
    const sugerencias = generarSugerenciasOptimizacion(costos, zonaRepartoId);
    return of(sugerencias);
  }

  /**
   * Obtener costo más económico para una distancia
   */
  obtenerCostoMasEconomico(
    distancia: number,
    zonaRepartoId?: number
  ): Observable<CostoEnvioDinamico | null> {
    let costos = this.costosActivos();

    if (zonaRepartoId) {
      costos = filtrarPorZona(costos, zonaRepartoId);
    }

    const costoEconomico = obtenerCostoMasEconomico(costos, distancia);
    return of(costoEconomico);
  }

  /**
   * Obtener costo más rápido para una distancia
   */
  obtenerCostoMasRapido(
    distancia: number,
    zonaRepartoId?: number
  ): Observable<CostoEnvioDinamico | null> {
    let costos = this.costosActivos();

    if (zonaRepartoId) {
      costos = filtrarPorZona(costos, zonaRepartoId);
    }

    const costoRapido = obtenerCostoMasRapido(costos, distancia);
    return of(costoRapido);
  }

  /**
   * Detectar gaps de cobertura en una zona
   */
  detectarGapsCobertura(
    zonaRepartoId: number
  ): Observable<Array<{ desde: number; hasta: number; amplitud: number }>> {
    const costosZona = filtrarPorZona(this.costosActivos(), zonaRepartoId);
    const gaps = encontrarGaps(costosZona);
    return of(gaps);
  }

  /**
   * Detectar solapamientos en una zona
   */
  detectarSolapamientos(zonaRepartoId: number): Observable<
    Array<{
      costo1_id: number;
      costo2_id: number;
      rango_solapado: string;
    }>
  > {
    const costosZona = filtrarPorZona(
      this._costosEnvioDinamico(),
      zonaRepartoId
    );
    const solapamientos = encontrarSolapamientos(costosZona);
    return of(solapamientos);
  }

  /**
   * Exportar datos a CSV
   */
  exportarCSV(filtros: FiltrosCostoEnvioDinamico = {}): Observable<Blob> {
    return this.obtenerCostosEnvioDinamico(filtros).pipe(
      map((response) => {
        const headers = [
          'ID',
          'Zona de Reparto',
          'Distancia Desde (km)',
          'Distancia Hasta (km)',
          'Rango',
          'Costo de Envío',
          'Tiempo Adicional (min)',
          'Amplitud Rango (km)',
          'Activo',
          'Fecha Creación',
        ];

        const rows = response.data.map((costo) => [
          costo.id.toString(),
          costo.zona_reparto?.nombre || '',
          costo.distancia_desde_km.toString(),
          costo.distancia_hasta_km.toString(),
          costo.rango_distancia_texto,
          costo.costo_envio_formateado,
          costo.tiempo_adicional.toString(),
          costo.amplitud_rango.toString(),
          costo.activo ? 'Sí' : 'No',
          new Date(costo.created_at).toLocaleDateString(),
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
  exportarExcel(filtros: FiltrosCostoEnvioDinamico = {}): Observable<Blob> {
    return this.obtenerCostosEnvioDinamico(filtros).pipe(
      map((response) => {
        // Implementación básica - en producción usar una librería como xlsx
        const data = response.data.map((costo) => ({
          ID: costo.id,
          'Zona de Reparto': costo.zona_reparto?.nombre || '',
          'Distancia Desde (km)': costo.distancia_desde_km,
          'Distancia Hasta (km)': costo.distancia_hasta_km,
          Rango: costo.rango_distancia_texto,
          'Costo de Envío': costo.costo_envio_formateado,
          'Tiempo Adicional (min)': costo.tiempo_adicional,
          'Amplitud Rango (km)': costo.amplitud_rango,
          Activo: costo.activo ? 'Sí' : 'No',
          'Fecha Creación': new Date(costo.created_at).toLocaleDateString(),
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
    this._costosEnvioDinamico.set([]);
    this._costoEnvioDinamicoActual.set(null);
    this._error.set(null);
    this._filtros.set({});
    this._paginacion.set(null);
    this._estadisticas.set(null);

    this.costosEnvioDinamicoSubject.next([]);
    this.errorSubject.next(null);
  }

  /**
   * Recargar datos
   */
  recargar(): Observable<CostosEnvioDinamicoResponse> {
    const filtrosActuales = this._filtros();
    return this.obtenerCostosEnvioDinamico(filtrosActuales);
  }

  /**
   * Validar si un rango es único
   */
  validarUnicidad(
    zonaRepartoId: number,
    desde: number,
    hasta: number,
    excludeId?: number
  ): boolean {
    return validarRangoUnico(
      this._costosEnvioDinamico(),
      zonaRepartoId,
      desde,
      hasta,
      excludeId
    );
  }

  /**
   * Obtener costos por rango de distancia
   */
  obtenerPorRangoDistancia(
    distanciaMin: number,
    distanciaMax: number
  ): CostoEnvioDinamico[] {
    return filtrarPorRangoDistancia(
      this._costosEnvioDinamico(),
      distanciaMin,
      distanciaMax
    );
  }

  /**
   * Obtener costos por rango de costo
   */
  obtenerPorRangoCosto(
    costoMin: number,
    costoMax: number
  ): CostoEnvioDinamico[] {
    return filtrarPorRangoCosto(
      this._costosEnvioDinamico(),
      costoMin,
      costoMax
    );
  }

  /**
   * Verificar cobertura para distancia específica
   */
  verificarCobertura(zonaRepartoId: number, distancia: number): boolean {
    const costosZona = filtrarPorZona(this.costosActivos(), zonaRepartoId);
    return costosZona.some(
      (c) =>
        c.distancia_desde_km <= distancia && c.distancia_hasta_km > distancia
    );
  }

  /**
   * Obtener rango de costos para una zona
   */
  obtenerRangoCostos(zonaRepartoId: number): {
    minimo: number;
    maximo: number;
    promedio: number;
  } {
    const costosZona = filtrarPorZona(this.costosActivos(), zonaRepartoId);

    if (costosZona.length === 0) {
      return { minimo: 0, maximo: 0, promedio: 0 };
    }

    const costos = costosZona.map((c) => c.costo_envio);
    const minimo = Math.min(...costos);
    const maximo = Math.max(...costos);
    const promedio = costos.reduce((sum, c) => sum + c, 0) / costos.length;

    return { minimo, maximo, promedio };
  }

  // Métodos privados
  private sincronizarEstados(): void {
    // Sincronizar signals con BehaviorSubjects para compatibilidad
    this.costosEnvioDinamicoSubject.next(this._costosEnvioDinamico());
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
