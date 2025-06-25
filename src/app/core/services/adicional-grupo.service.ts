import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AdicionalGrupo,
  CreateAdicionalGrupoDto,
  UpdateAdicionalGrupoDto,
  FiltrosAdicionalGrupo,
  AdicionalGrupoResponse,
  AdicionalesGrupoResponse,
  EstadisticasAdicionalGrupo,
  ConfiguracionOrdenAdicionalGrupo,
  AdicionalPorGrupo,
  GrupoPorAdicional,
  AdicionalDetalle,
  GrupoAdicionalDetalle,
  validarAdicionalGrupo,
  validarRelacionExistente,
  obtenerSiguienteOrden,
  agruparPorGrupoAdicional,
  agruparPorAdicional,
  ordenarPorOrden,
  filtrarPorGrupo,
  filtrarPorAdicional,
  obtenerAdicionalesDeGrupo,
  obtenerGruposDeAdicional,
  calcularEstadisticas,
  reordenarRelaciones,
  validarOrdenUnico,
  normalizarOrdenes,
  formatearRelacion,
  buscarRelaciones,
} from '../models/adicional-grupo.interface';

@Injectable({
  providedIn: 'root',
})
export class AdicionalGrupoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vista/adicional-grupos`;

  // Signals para gestión de estado reactivo
  private readonly _relacionesAdicionalGrupo = signal<AdicionalGrupo[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtros = signal<FiltrosAdicionalGrupo>({});
  private readonly _estadisticas = signal<EstadisticasAdicionalGrupo | null>(
    null
  );

  // Signals computados
  readonly relacionesAdicionalGrupo =
    this._relacionesAdicionalGrupo.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filtros = this._filtros.asReadonly();
  readonly estadisticas = this._estadisticas.asReadonly();

  // Computed signals para datos derivados
  readonly relacionesPorGrupo = computed(() =>
    agruparPorGrupoAdicional(this._relacionesAdicionalGrupo())
  );

  readonly relacionesPorAdicional = computed(() =>
    agruparPorAdicional(this._relacionesAdicionalGrupo())
  );

  readonly relacionesOrdenadas = computed(() =>
    ordenarPorOrden(this._relacionesAdicionalGrupo())
  );

  readonly totalRelaciones = computed(
    () => this._relacionesAdicionalGrupo().length
  );

  readonly gruposConAdicionales = computed(() => {
    const grupos = new Set(
      this._relacionesAdicionalGrupo().map((rel) => rel.grupo_adicional_id)
    );
    return grupos.size;
  });

  readonly adicionalesEnGrupos = computed(() => {
    const adicionales = new Set(
      this._relacionesAdicionalGrupo().map((rel) => rel.adicional_id)
    );
    return adicionales.size;
  });

  readonly hasError = computed(() => this._error() !== null);

  readonly isEmpty = computed(
    () => this._relacionesAdicionalGrupo().length === 0 && !this._loading()
  );

  // Subject para paginación
  private readonly paginationSubject = new BehaviorSubject<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  }>({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
    from: 0,
    to: 0,
  });

  readonly pagination$ = this.paginationSubject.asObservable();

  /**
   * Obtener todas las relaciones adicional-grupo con filtros
   */
  obtenerRelacionesAdicionalGrupo(
    filtros: FiltrosAdicionalGrupo = {}
  ): Observable<AdicionalesGrupoResponse> {
    this._loading.set(true);
    this._error.set(null);
    this._filtros.set(filtros);

    let params = new HttpParams();

    if (filtros.adicional_id) {
      params = params.set('adicional_id', filtros.adicional_id.toString());
    }
    if (filtros.grupo_adicional_id) {
      params = params.set(
        'grupo_adicional_id',
        filtros.grupo_adicional_id.toString()
      );
    }
    if (filtros.page) {
      params = params.set('page', filtros.page.toString());
    }
    if (filtros.per_page) {
      params = params.set('per_page', filtros.per_page.toString());
    }
    if (filtros.sort_by) {
      params = params.set('sort_by', filtros.sort_by);
    }
    if (filtros.sort_direction) {
      params = params.set('sort_direction', filtros.sort_direction);
    }

    return this.http
      .get<AdicionalesGrupoResponse>(this.baseUrl, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._relacionesAdicionalGrupo.set(response.data);
            this.paginationSubject.next(response.meta);
          }
        }),
        catchError((error) => {
          const errorMessage =
            error.error?.message ||
            'Error al obtener relaciones adicional-grupo';
          this._error.set(errorMessage);
          return throwError(() => error);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtener una relación adicional-grupo por ID
   */
  obtenerRelacionAdicionalGrupo(
    id: number
  ): Observable<AdicionalGrupoResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<AdicionalGrupoResponse>(`${this.baseUrl}/${id}`).pipe(
      catchError((error) => {
        const errorMessage =
          error.error?.message ||
          'Error al obtener la relación adicional-grupo';
        this._error.set(errorMessage);
        return throwError(() => error);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Crear una nueva relación adicional-grupo
   */
  crearRelacionAdicionalGrupo(
    data: CreateAdicionalGrupoDto
  ): Observable<AdicionalGrupoResponse> {
    // Validar datos antes de enviar
    const errores = validarAdicionalGrupo(data);
    if (errores.length > 0) {
      const error = new Error(errores.join(', '));
      this._error.set(error.message);
      return throwError(() => error);
    }

    // Verificar si la relación ya existe
    const relacionExistente = validarRelacionExistente(
      this._relacionesAdicionalGrupo(),
      data.adicional_id,
      data.grupo_adicional_id
    );

    if (relacionExistente) {
      const error = new Error(
        'La relación entre este adicional y grupo ya existe'
      );
      this._error.set(error.message);
      return throwError(() => error);
    }

    this._loading.set(true);
    this._error.set(null);

    // Asignar orden automáticamente si no se proporciona
    if (!data.orden) {
      data.orden = obtenerSiguienteOrden(
        this._relacionesAdicionalGrupo(),
        data.grupo_adicional_id
      );
    }

    return this.http.post<AdicionalGrupoResponse>(this.baseUrl, data).pipe(
      tap((response) => {
        if (response.success) {
          // Actualizar la lista local
          const relacionesActuales = this._relacionesAdicionalGrupo();
          this._relacionesAdicionalGrupo.set([
            ...relacionesActuales,
            response.data,
          ]);
        }
      }),
      catchError((error) => {
        const errorMessage =
          error.error?.message || 'Error al crear la relación adicional-grupo';
        this._error.set(errorMessage);
        return throwError(() => error);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Actualizar una relación adicional-grupo
   */
  actualizarRelacionAdicionalGrupo(
    id: number,
    data: UpdateAdicionalGrupoDto
  ): Observable<AdicionalGrupoResponse> {
    // Validar datos antes de enviar
    const errores = validarAdicionalGrupo(data);
    if (errores.length > 0) {
      const error = new Error(errores.join(', '));
      this._error.set(error.message);
      return throwError(() => error);
    }

    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<AdicionalGrupoResponse>(`${this.baseUrl}/${id}`, data)
      .pipe(
        tap((response) => {
          if (response.success) {
            // Actualizar la lista local
            const relacionesActuales = this._relacionesAdicionalGrupo();
            const index = relacionesActuales.findIndex((r) => r.id === id);
            if (index !== -1) {
              const relacionesActualizadas = [...relacionesActuales];
              relacionesActualizadas[index] = response.data;
              this._relacionesAdicionalGrupo.set(relacionesActualizadas);
            }
          }
        }),
        catchError((error) => {
          const errorMessage =
            error.error?.message ||
            'Error al actualizar la relación adicional-grupo';
          this._error.set(errorMessage);
          return throwError(() => error);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Eliminar una relación adicional-grupo
   */
  eliminarRelacionAdicionalGrupo(
    id: number
  ): Observable<{ success: boolean; message: string }> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .delete<{ success: boolean; message: string }>(`${this.baseUrl}/${id}`)
      .pipe(
        tap((response) => {
          if (response.success) {
            // Remover de la lista local
            const relacionesActuales = this._relacionesAdicionalGrupo();
            this._relacionesAdicionalGrupo.set(
              relacionesActuales.filter((r) => r.id !== id)
            );
          }
        }),
        catchError((error) => {
          const errorMessage =
            error.error?.message ||
            'Error al eliminar la relación adicional-grupo';
          this._error.set(errorMessage);
          return throwError(() => error);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtener relaciones por grupo adicional
   */
  obtenerRelacionesPorGrupo(grupoId: number): Observable<AdicionalGrupo[]> {
    return this.obtenerRelacionesAdicionalGrupo({
      grupo_adicional_id: grupoId,
    }).pipe(map((response) => response.data));
  }

  /**
   * Obtener relaciones por adicional
   */
  obtenerRelacionesPorAdicional(
    adicionalId: number
  ): Observable<AdicionalGrupo[]> {
    return this.obtenerRelacionesAdicionalGrupo({
      adicional_id: adicionalId,
    }).pipe(map((response) => response.data));
  }

  /**
   * Obtener adicionales de un grupo específico
   */
  obtenerAdicionalesDeGrupo(grupoId: number): AdicionalDetalle[] {
    return obtenerAdicionalesDeGrupo(this._relacionesAdicionalGrupo(), grupoId);
  }

  /**
   * Obtener grupos de un adicional específico
   */
  obtenerGruposDeAdicional(adicionalId: number): GrupoAdicionalDetalle[] {
    return obtenerGruposDeAdicional(
      this._relacionesAdicionalGrupo(),
      adicionalId
    );
  }

  /**
   * Reordenar relaciones de un grupo
   */
  reordenarRelacionesGrupo(
    grupoId: number,
    nuevosOrdenes: Array<{ id: number; orden: number }>
  ): Observable<{ success: boolean; message: string }> {
    this._loading.set(true);
    this._error.set(null);

    const configuracion: ConfiguracionOrdenAdicionalGrupo = {
      relaciones_orden: nuevosOrdenes,
    };

    return this.http
      .put<{ success: boolean; message: string }>(
        `${this.baseUrl}/reordenar`,
        configuracion
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            // Actualizar orden local
            const relacionesActuales = this._relacionesAdicionalGrupo();
            const relacionesActualizadas = reordenarRelaciones(
              relacionesActuales,
              grupoId,
              nuevosOrdenes
            );
            this._relacionesAdicionalGrupo.set(relacionesActualizadas);
          }
        }),
        catchError((error) => {
          const errorMessage =
            error.error?.message || 'Error al reordenar las relaciones';
          this._error.set(errorMessage);
          return throwError(() => error);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Normalizar órdenes de un grupo
   */
  normalizarOrdenesGrupo(grupoId: number): void {
    const relacionesActuales = this._relacionesAdicionalGrupo();
    const relacionesNormalizadas = normalizarOrdenes(
      relacionesActuales,
      grupoId
    );
    this._relacionesAdicionalGrupo.set(relacionesNormalizadas);
  }

  /**
   * Validar si un orden es único en un grupo
   */
  validarOrdenUnico(
    grupoId: number,
    orden: number,
    excludeId?: number
  ): boolean {
    return validarOrdenUnico(
      this._relacionesAdicionalGrupo(),
      grupoId,
      orden,
      excludeId
    );
  }

  /**
   * Buscar relaciones por término
   */
  buscarRelaciones(termino: string): Observable<AdicionalGrupo[]> {
    if (!termino.trim()) {
      return new Observable((observer) => {
        observer.next(this._relacionesAdicionalGrupo());
        observer.complete();
      });
    }

    const relacionesFiltradas = buscarRelaciones(
      this._relacionesAdicionalGrupo(),
      termino
    );
    return new Observable((observer) => {
      observer.next(relacionesFiltradas);
      observer.complete();
    });
  }

  /**
   * Obtener estadísticas de relaciones
   */
  obtenerEstadisticas(): Observable<EstadisticasAdicionalGrupo> {
    const estadisticas = calcularEstadisticas(this._relacionesAdicionalGrupo());
    this._estadisticas.set(estadisticas);

    return new Observable((observer) => {
      observer.next(estadisticas);
      observer.complete();
    });
  }

  /**
   * Crear múltiples relaciones para un grupo
   */
  crearRelacionesMultiples(
    grupoId: number,
    adicionalesIds: number[]
  ): Observable<AdicionalGrupoResponse[]> {
    this._loading.set(true);
    this._error.set(null);

    const relaciones = adicionalesIds.map((adicionalId, index) => ({
      adicional_id: adicionalId,
      grupo_adicional_id: grupoId,
      orden:
        obtenerSiguienteOrden(this._relacionesAdicionalGrupo(), grupoId) +
        index,
    }));

    const requests = relaciones.map((relacion) =>
      this.http.post<AdicionalGrupoResponse>(this.baseUrl, relacion)
    );

    return new Observable((observer) => {
      Promise.all(requests.map((req) => req.toPromise()))
        .then((responses) => {
          const relacionesCreadas = responses
            .filter((response) => response?.success)
            .map((response) => response!.data);

          // Actualizar lista local
          const relacionesActuales = this._relacionesAdicionalGrupo();
          this._relacionesAdicionalGrupo.set([
            ...relacionesActuales,
            ...relacionesCreadas,
          ]);

          observer.next(
            responses.filter((r) => r !== undefined) as AdicionalGrupoResponse[]
          );
          observer.complete();
        })
        .catch((error) => {
          const errorMessage = 'Error al crear relaciones múltiples';
          this._error.set(errorMessage);
          observer.error(error);
        })
        .finally(() => {
          this._loading.set(false);
        });
    });
  }

  /**
   * Eliminar múltiples relaciones
   */
  eliminarRelacionesMultiples(
    ids: number[]
  ): Observable<{ success: boolean; message: string }> {
    this._loading.set(true);
    this._error.set(null);

    const requests = ids.map((id) =>
      this.http.delete<{ success: boolean; message: string }>(
        `${this.baseUrl}/${id}`
      )
    );

    return new Observable((observer) => {
      Promise.all(requests.map((req) => req.toPromise()))
        .then((responses) => {
          const exitosas = responses.filter((response) => response?.success);

          if (exitosas.length > 0) {
            // Remover de la lista local
            const relacionesActuales = this._relacionesAdicionalGrupo();
            this._relacionesAdicionalGrupo.set(
              relacionesActuales.filter((r) => !ids.includes(r.id))
            );
          }

          observer.next({
            success: exitosas.length === ids.length,
            message: `${exitosas.length} de ${ids.length} relaciones eliminadas correctamente`,
          });
          observer.complete();
        })
        .catch((error) => {
          const errorMessage = 'Error al eliminar relaciones múltiples';
          this._error.set(errorMessage);
          observer.error(error);
        })
        .finally(() => {
          this._loading.set(false);
        });
    });
  }

  /**
   * Exportar relaciones a CSV
   */
  exportarCSV(filtros: FiltrosAdicionalGrupo = {}): Observable<Blob> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });
    params = params.set('export', 'csv');

    return this.http
      .get(`${this.baseUrl}/export`, {
        params,
        responseType: 'blob',
      })
      .pipe(
        catchError((error) => {
          const errorMessage = 'Error al exportar relaciones adicional-grupo';
          this._error.set(errorMessage);
          return throwError(() => error);
        })
      );
  }

  /**
   * Exportar relaciones a Excel
   */
  exportarExcel(filtros: FiltrosAdicionalGrupo = {}): Observable<Blob> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });
    params = params.set('export', 'excel');

    return this.http
      .get(`${this.baseUrl}/export`, {
        params,
        responseType: 'blob',
      })
      .pipe(
        catchError((error) => {
          const errorMessage = 'Error al exportar relaciones adicional-grupo';
          this._error.set(errorMessage);
          return throwError(() => error);
        })
      );
  }

  /**
   * Limpiar errores
   */
  limpiarError(): void {
    this._error.set(null);
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    this._filtros.set({});
  }

  /**
   * Refrescar datos
   */
  refrescar(): Observable<AdicionalesGrupoResponse> {
    return this.obtenerRelacionesAdicionalGrupo(this._filtros());
  }

  // Métodos utilitarios públicos
  readonly utils = {
    validarAdicionalGrupo,
    validarRelacionExistente,
    obtenerSiguienteOrden,
    agruparPorGrupoAdicional,
    agruparPorAdicional,
    ordenarPorOrden,
    filtrarPorGrupo,
    filtrarPorAdicional,
    obtenerAdicionalesDeGrupo,
    obtenerGruposDeAdicional,
    calcularEstadisticas,
    reordenarRelaciones,
    validarOrdenUnico,
    normalizarOrdenes,
    formatearRelacion,
    buscarRelaciones,
  };
}
