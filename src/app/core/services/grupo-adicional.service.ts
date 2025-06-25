import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  GrupoAdicional,
  CreateGrupoAdicionalDto,
  UpdateGrupoAdicionalDto,
  FiltrosGrupoAdicional,
  GrupoAdicionalResponse,
  GruposAdicionalesResponse,
  EstadisticasGrupoAdicional,
  ConfiguracionOrdenGrupo,
  TipoSeleccion,
  esGrupoObligatorio,
  esSeleccionMultiple,
  obtenerTipoSeleccion,
  obtenerTextoSeleccion,
  validarGrupoAdicional,
  validarSeleccionGrupo,
  calcularTotalAdicionalesGrupo,
  agruparPorTipo,
  ordenarPorOrden,
  filtrarGruposActivos,
  filtrarGruposObligatorios,
  obtenerGruposConAdicionales,
  generarSlugDesdeNombre,
  formatearReglasSeleccion,
} from '../models/grupo-adicional.interface';

@Injectable({
  providedIn: 'root',
})
export class GrupoAdicionalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vista/grupos-adicionales`;

  // Signals para gestión de estado reactivo
  private readonly _gruposAdicionales = signal<GrupoAdicional[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtros = signal<FiltrosGrupoAdicional>({});
  private readonly _estadisticas = signal<EstadisticasGrupoAdicional | null>(
    null
  );

  // Signals computados
  readonly gruposAdicionales = this._gruposAdicionales.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filtros = this._filtros.asReadonly();
  readonly estadisticas = this._estadisticas.asReadonly();

  // Computed signals para datos derivados
  readonly gruposActivos = computed(() =>
    filtrarGruposActivos(this._gruposAdicionales())
  );

  readonly gruposObligatorios = computed(() =>
    filtrarGruposObligatorios(this._gruposAdicionales())
  );

  readonly gruposConAdicionales = computed(() =>
    obtenerGruposConAdicionales(this._gruposAdicionales())
  );

  readonly gruposPorTipo = computed(() =>
    agruparPorTipo(this._gruposAdicionales())
  );

  readonly totalGrupos = computed(() => this._gruposAdicionales().length);

  readonly totalAdicionalesEnGrupos = computed(() =>
    calcularTotalAdicionalesGrupo(this._gruposAdicionales())
  );

  readonly hasError = computed(() => this._error() !== null);

  readonly isEmpty = computed(
    () => this._gruposAdicionales().length === 0 && !this._loading()
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
   * Obtener todos los grupos adicionales con filtros
   */
  obtenerGruposAdicionales(
    filtros: FiltrosGrupoAdicional = {}
  ): Observable<GruposAdicionalesResponse> {
    this._loading.set(true);
    this._error.set(null);
    this._filtros.set(filtros);

    let params = new HttpParams();

    if (filtros.search) {
      params = params.set('search', filtros.search);
    }
    if (filtros.activo !== undefined) {
      params = params.set('activo', filtros.activo.toString());
    }
    if (filtros.obligatorio !== undefined) {
      params = params.set('obligatorio', filtros.obligatorio.toString());
    }
    if (filtros.multiple_seleccion !== undefined) {
      params = params.set(
        'multiple_seleccion',
        filtros.multiple_seleccion.toString()
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
      .get<GruposAdicionalesResponse>(this.baseUrl, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._gruposAdicionales.set(response.data);
            this.paginationSubject.next(response.meta);
          }
        }),
        catchError((error) => {
          const errorMessage =
            error.error?.message || 'Error al obtener grupos adicionales';
          this._error.set(errorMessage);
          return throwError(() => error);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtener un grupo adicional por ID
   */
  obtenerGrupoAdicional(id: number): Observable<GrupoAdicionalResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<GrupoAdicionalResponse>(`${this.baseUrl}/${id}`).pipe(
      catchError((error) => {
        const errorMessage =
          error.error?.message || 'Error al obtener el grupo adicional';
        this._error.set(errorMessage);
        return throwError(() => error);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Crear un nuevo grupo adicional
   */
  crearGrupoAdicional(
    data: CreateGrupoAdicionalDto
  ): Observable<GrupoAdicionalResponse> {
    // Validar datos antes de enviar
    const errores = validarGrupoAdicional(data);
    if (errores.length > 0) {
      const error = new Error(errores.join(', '));
      this._error.set(error.message);
      return throwError(() => error);
    }

    this._loading.set(true);
    this._error.set(null);

    // Generar slug automáticamente si no se proporciona
    if (!data.slug && data.nombre) {
      data.slug = generarSlugDesdeNombre(data.nombre);
    }

    return this.http.post<GrupoAdicionalResponse>(this.baseUrl, data).pipe(
      tap((response) => {
        if (response.success) {
          // Actualizar la lista local
          const gruposActuales = this._gruposAdicionales();
          this._gruposAdicionales.set([...gruposActuales, response.data]);
        }
      }),
      catchError((error) => {
        const errorMessage =
          error.error?.message || 'Error al crear el grupo adicional';
        this._error.set(errorMessage);
        return throwError(() => error);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Actualizar un grupo adicional
   */
  actualizarGrupoAdicional(
    id: number,
    data: UpdateGrupoAdicionalDto
  ): Observable<GrupoAdicionalResponse> {
    // Validar datos antes de enviar
    const errores = validarGrupoAdicional(data);
    if (errores.length > 0) {
      const error = new Error(errores.join(', '));
      this._error.set(error.message);
      return throwError(() => error);
    }

    this._loading.set(true);
    this._error.set(null);

    // Generar slug automáticamente si se actualiza el nombre y no se proporciona slug
    if (!data.slug && data.nombre) {
      data.slug = generarSlugDesdeNombre(data.nombre);
    }

    return this.http
      .put<GrupoAdicionalResponse>(`${this.baseUrl}/${id}`, data)
      .pipe(
        tap((response) => {
          if (response.success) {
            // Actualizar la lista local
            const gruposActuales = this._gruposAdicionales();
            const index = gruposActuales.findIndex((g) => g.id === id);
            if (index !== -1) {
              const gruposActualizados = [...gruposActuales];
              gruposActualizados[index] = response.data;
              this._gruposAdicionales.set(gruposActualizados);
            }
          }
        }),
        catchError((error) => {
          const errorMessage =
            error.error?.message || 'Error al actualizar el grupo adicional';
          this._error.set(errorMessage);
          return throwError(() => error);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Eliminar un grupo adicional
   */
  eliminarGrupoAdicional(
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
            const gruposActuales = this._gruposAdicionales();
            this._gruposAdicionales.set(
              gruposActuales.filter((g) => g.id !== id)
            );
          }
        }),
        catchError((error) => {
          const errorMessage =
            error.error?.message || 'Error al eliminar el grupo adicional';
          this._error.set(errorMessage);
          return throwError(() => error);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Cambiar estado activo de un grupo adicional
   */
  toggleEstado(id: number): Observable<GrupoAdicionalResponse> {
    const grupo = this._gruposAdicionales().find((g) => g.id === id);
    if (!grupo) {
      const error = new Error('Grupo adicional no encontrado');
      this._error.set(error.message);
      return throwError(() => error);
    }

    return this.actualizarGrupoAdicional(id, { activo: !grupo.activo });
  }

  /**
   * Actualizar orden de múltiples grupos
   */
  actualizarOrden(
    configuracion: ConfiguracionOrdenGrupo
  ): Observable<{ success: boolean; message: string }> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<{ success: boolean; message: string }>(
        `${this.baseUrl}/orden`,
        configuracion
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            // Actualizar orden local
            const gruposActuales = this._gruposAdicionales();
            const gruposActualizados = gruposActuales.map((grupo) => {
              const nuevoOrden = configuracion.grupos_orden.find(
                (o) => o.grupo_id === grupo.id
              );
              return nuevoOrden ? { ...grupo, orden: nuevoOrden.orden } : grupo;
            });
            this._gruposAdicionales.set(ordenarPorOrden(gruposActualizados));
          }
        }),
        catchError((error) => {
          const errorMessage =
            error.error?.message || 'Error al actualizar el orden';
          this._error.set(errorMessage);
          return throwError(() => error);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtener estadísticas de grupos adicionales
   */
  obtenerEstadisticas(): Observable<EstadisticasGrupoAdicional> {
    return this.http
      .get<{ success: boolean; data: EstadisticasGrupoAdicional }>(
        `${this.baseUrl}/estadisticas`
      )
      .pipe(
        map((response) => response.data),
        tap((estadisticas) => this._estadisticas.set(estadisticas)),
        catchError((error) => {
          const errorMessage =
            error.error?.message || 'Error al obtener estadísticas';
          this._error.set(errorMessage);
          return throwError(() => error);
        })
      );
  }

  /**
   * Buscar grupos adicionales
   */
  buscarGrupos(termino: string): Observable<GrupoAdicional[]> {
    if (!termino.trim()) {
      return new Observable((observer) => {
        observer.next(this._gruposAdicionales());
        observer.complete();
      });
    }

    return this.obtenerGruposAdicionales({ search: termino }).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Filtrar grupos por tipo de selección
   */
  filtrarPorTipo(tipo: TipoSeleccion): Observable<GrupoAdicional[]> {
    return this.obtenerGruposAdicionales({ tipo_seleccion: tipo }).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Obtener grupos activos para selección
   */
  obtenerGruposParaSeleccion(): Observable<GrupoAdicional[]> {
    return this.obtenerGruposAdicionales({ activo: true }).pipe(
      map((response) => ordenarPorOrden(response.data))
    );
  }

  /**
   * Validar selección de adicionales en un grupo
   */
  validarSeleccion(
    grupoId: number,
    seleccionados: number[]
  ): { valido: boolean; errores: string[] } {
    const grupo = this._gruposAdicionales().find((g) => g.id === grupoId);
    if (!grupo) {
      return {
        valido: false,
        errores: ['Grupo adicional no encontrado'],
      };
    }

    return validarSeleccionGrupo(grupo, seleccionados);
  }

  /**
   * Exportar grupos adicionales a CSV
   */
  exportarCSV(filtros: FiltrosGrupoAdicional = {}): Observable<Blob> {
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
          const errorMessage = 'Error al exportar grupos adicionales';
          this._error.set(errorMessage);
          return throwError(() => error);
        })
      );
  }

  /**
   * Exportar grupos adicionales a Excel
   */
  exportarExcel(filtros: FiltrosGrupoAdicional = {}): Observable<Blob> {
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
          const errorMessage = 'Error al exportar grupos adicionales';
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
  refrescar(): Observable<GruposAdicionalesResponse> {
    return this.obtenerGruposAdicionales(this._filtros());
  }

  // Métodos utilitarios públicos
  readonly utils = {
    esGrupoObligatorio,
    esSeleccionMultiple,
    obtenerTipoSeleccion,
    obtenerTextoSeleccion,
    validarGrupoAdicional,
    validarSeleccionGrupo,
    calcularTotalAdicionalesGrupo,
    agruparPorTipo,
    ordenarPorOrden,
    filtrarGruposActivos,
    filtrarGruposObligatorios,
    obtenerGruposConAdicionales,
    generarSlugDesdeNombre,
    formatearReglasSeleccion,
  };
}
