import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ProductoGrupoAdicional,
  CreateProductoGrupoAdicionalDto,
  UpdateProductoGrupoAdicionalDto,
  FiltrosProductoGrupoAdicional,
  ProductoGrupoAdicionalResponse,
  ProductosGrupoAdicionalResponse,
  EstadisticasProductoGrupoAdicional,
  ConfiguracionOrdenProductoGrupo,
  GrupoPorProducto,
  ProductoPorGrupo,
  ConfiguracionProductoGrupo,
  ProductoDetalle,
  GrupoAdicionalDetalle,
  validarProductoGrupoAdicional,
  validarRelacionProductoGrupoExistente,
  obtenerSiguienteOrdenProducto,
  agruparPorProducto,
  agruparPorGrupoAdicional,
  ordenarPorOrden,
  filtrarPorProducto,
  filtrarPorGrupo,
  filtrarPorEstado,
  obtenerGruposDeProducto,
  obtenerProductosDeGrupo,
  calcularEstadisticas,
  reordenarRelacionesProducto,
  validarOrdenUnicoProducto,
  normalizarOrdenesProducto,
  toggleEstadoRelacion,
  formatearRelacionProductoGrupo,
  buscarRelacionesProductoGrupo,
  obtenerConfiguracionProducto,
  validarConfiguracionProducto,
  clonarConfiguracionProducto,
  compararConfiguraciones,
} from '../models/producto-grupo-adicional.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductoGrupoAdicionalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vista/producto-grupo-adicionales`;

  // Signals para gestión de estado reactivo
  private readonly _relacionesProductoGrupo = signal<ProductoGrupoAdicional[]>(
    []
  );
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtros = signal<FiltrosProductoGrupoAdicional>({});
  private readonly _estadisticas =
    signal<EstadisticasProductoGrupoAdicional | null>(null);

  // Signals computados
  readonly relacionesProductoGrupo = this._relacionesProductoGrupo.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filtros = this._filtros.asReadonly();
  readonly estadisticas = this._estadisticas.asReadonly();

  // Computed signals para datos derivados
  readonly relacionesPorProducto = computed(() =>
    agruparPorProducto(this._relacionesProductoGrupo())
  );

  readonly relacionesPorGrupo = computed(() =>
    agruparPorGrupoAdicional(this._relacionesProductoGrupo())
  );

  readonly relacionesOrdenadas = computed(() =>
    ordenarPorOrden(this._relacionesProductoGrupo())
  );

  readonly relacionesActivas = computed(() =>
    filtrarPorEstado(this._relacionesProductoGrupo(), true)
  );

  readonly relacionesInactivas = computed(() =>
    filtrarPorEstado(this._relacionesProductoGrupo(), false)
  );

  readonly totalRelaciones = computed(
    () => this._relacionesProductoGrupo().length
  );

  readonly productosConGrupos = computed(() => {
    const productos = new Set(
      this._relacionesProductoGrupo().map((rel) => rel.producto_id)
    );
    return productos.size;
  });

  readonly gruposEnProductos = computed(() => {
    const grupos = new Set(
      this._relacionesProductoGrupo().map((rel) => rel.grupo_adicional_id)
    );
    return grupos.size;
  });

  readonly hasError = computed(() => this._error() !== null);

  readonly isEmpty = computed(
    () => this._relacionesProductoGrupo().length === 0 && !this._loading()
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
   * Obtener todas las relaciones producto-grupo-adicional con filtros
   */
  obtenerRelacionesProductoGrupo(
    filtros: FiltrosProductoGrupoAdicional = {}
  ): Observable<ProductosGrupoAdicionalResponse> {
    this._loading.set(true);
    this._error.set(null);
    this._filtros.set(filtros);

    let params = new HttpParams();

    if (filtros.producto_id) {
      params = params.set('producto_id', filtros.producto_id.toString());
    }
    if (filtros.grupo_adicional_id) {
      params = params.set(
        'grupo_adicional_id',
        filtros.grupo_adicional_id.toString()
      );
    }
    if (filtros.activo !== undefined) {
      params = params.set('activo', filtros.activo.toString());
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
      .get<ProductosGrupoAdicionalResponse>(this.baseUrl, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._relacionesProductoGrupo.set(response.data);
            this.paginationSubject.next(response.meta);
          }
        }),
        catchError((error) => {
          const errorMessage =
            error.error?.message ||
            'Error al obtener relaciones producto-grupo-adicional';
          this._error.set(errorMessage);
          return throwError(() => error);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtener una relación producto-grupo-adicional por ID
   */
  obtenerRelacionProductoGrupo(
    id: number
  ): Observable<ProductoGrupoAdicionalResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .get<ProductoGrupoAdicionalResponse>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError((error) => {
          const errorMessage =
            error.error?.message ||
            'Error al obtener la relación producto-grupo-adicional';
          this._error.set(errorMessage);
          return throwError(() => error);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Crear una nueva relación producto-grupo-adicional
   */
  crearRelacionProductoGrupo(
    data: CreateProductoGrupoAdicionalDto
  ): Observable<ProductoGrupoAdicionalResponse> {
    // Validar datos antes de enviar
    const errores = validarProductoGrupoAdicional(data);
    if (errores.length > 0) {
      const error = new Error(errores.join(', '));
      this._error.set(error.message);
      return throwError(() => error);
    }

    // Verificar si la relación ya existe
    const relacionExistente = validarRelacionProductoGrupoExistente(
      this._relacionesProductoGrupo(),
      data.producto_id,
      data.grupo_adicional_id
    );

    if (relacionExistente) {
      const error = new Error(
        'La relación entre este producto y grupo ya existe'
      );
      this._error.set(error.message);
      return throwError(() => error);
    }

    this._loading.set(true);
    this._error.set(null);

    // Asignar orden automáticamente si no se proporciona
    if (!data.orden) {
      data.orden = obtenerSiguienteOrdenProducto(
        this._relacionesProductoGrupo(),
        data.producto_id
      );
    }

    // Establecer valores por defecto
    if (data.activo === undefined) {
      data.activo = true;
    }

    return this.http
      .post<ProductoGrupoAdicionalResponse>(this.baseUrl, data)
      .pipe(
        tap((response) => {
          if (response.success) {
            // Actualizar la lista local
            const relacionesActuales = this._relacionesProductoGrupo();
            this._relacionesProductoGrupo.set([
              ...relacionesActuales,
              response.data,
            ]);
          }
        }),
        catchError((error) => {
          const errorMessage =
            error.error?.message ||
            'Error al crear la relación producto-grupo-adicional';
          this._error.set(errorMessage);
          return throwError(() => error);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Actualizar una relación producto-grupo-adicional
   */
  actualizarRelacionProductoGrupo(
    id: number,
    data: UpdateProductoGrupoAdicionalDto
  ): Observable<ProductoGrupoAdicionalResponse> {
    // Validar datos antes de enviar
    const errores = validarProductoGrupoAdicional(data);
    if (errores.length > 0) {
      const error = new Error(errores.join(', '));
      this._error.set(error.message);
      return throwError(() => error);
    }

    this._loading.set(true);
    this._error.set(null);

    return this.http
      .put<ProductoGrupoAdicionalResponse>(`${this.baseUrl}/${id}`, data)
      .pipe(
        tap((response) => {
          if (response.success) {
            // Actualizar la lista local
            const relacionesActuales = this._relacionesProductoGrupo();
            const index = relacionesActuales.findIndex((r) => r.id === id);
            if (index !== -1) {
              const relacionesActualizadas = [...relacionesActuales];
              relacionesActualizadas[index] = response.data;
              this._relacionesProductoGrupo.set(relacionesActualizadas);
            }
          }
        }),
        catchError((error) => {
          const errorMessage =
            error.error?.message ||
            'Error al actualizar la relación producto-grupo-adicional';
          this._error.set(errorMessage);
          return throwError(() => error);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Eliminar una relación producto-grupo-adicional
   */
  eliminarRelacionProductoGrupo(
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
            const relacionesActuales = this._relacionesProductoGrupo();
            this._relacionesProductoGrupo.set(
              relacionesActuales.filter((r) => r.id !== id)
            );
          }
        }),
        catchError((error) => {
          const errorMessage =
            error.error?.message ||
            'Error al eliminar la relación producto-grupo-adicional';
          this._error.set(errorMessage);
          return throwError(() => error);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Obtener relaciones por producto
   */
  obtenerRelacionesPorProducto(
    productoId: number
  ): Observable<ProductoGrupoAdicional[]> {
    return this.obtenerRelacionesProductoGrupo({
      producto_id: productoId,
    }).pipe(map((response) => response.data));
  }

  /**
   * Obtener relaciones por grupo adicional
   */
  obtenerRelacionesPorGrupo(
    grupoId: number
  ): Observable<ProductoGrupoAdicional[]> {
    return this.obtenerRelacionesProductoGrupo({
      grupo_adicional_id: grupoId,
    }).pipe(map((response) => response.data));
  }

  /**
   * Obtener grupos de un producto específico
   */
  obtenerGruposDeProducto(productoId: number): GrupoAdicionalDetalle[] {
    return obtenerGruposDeProducto(this._relacionesProductoGrupo(), productoId);
  }

  /**
   * Obtener productos de un grupo específico
   */
  obtenerProductosDeGrupo(grupoId: number): ProductoDetalle[] {
    return obtenerProductosDeGrupo(this._relacionesProductoGrupo(), grupoId);
  }

  /**
   * Toggle estado de una relación
   */
  toggleEstadoRelacion(id: number): Observable<ProductoGrupoAdicionalResponse> {
    const relacion = this._relacionesProductoGrupo().find((r) => r.id === id);
    if (!relacion) {
      const error = new Error('Relación no encontrada');
      this._error.set(error.message);
      return throwError(() => error);
    }

    return this.actualizarRelacionProductoGrupo(id, {
      activo: !relacion.activo,
    }).pipe(
      tap(() => {
        // Actualizar estado local inmediatamente
        const relacionesActuales = this._relacionesProductoGrupo();
        const relacionesActualizadas = toggleEstadoRelacion(
          relacionesActuales,
          id
        );
        this._relacionesProductoGrupo.set(relacionesActualizadas);
      })
    );
  }

  /**
   * Reordenar relaciones de un producto
   */
  reordenarRelacionesProducto(
    productoId: number,
    nuevosOrdenes: Array<{ id: number; orden: number }>
  ): Observable<{ success: boolean; message: string }> {
    this._loading.set(true);
    this._error.set(null);

    const configuracion: ConfiguracionOrdenProductoGrupo = {
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
            const relacionesActuales = this._relacionesProductoGrupo();
            const relacionesActualizadas = reordenarRelacionesProducto(
              relacionesActuales,
              productoId,
              nuevosOrdenes
            );
            this._relacionesProductoGrupo.set(relacionesActualizadas);
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
   * Normalizar órdenes de un producto
   */
  normalizarOrdenesProducto(productoId: number): void {
    const relacionesActuales = this._relacionesProductoGrupo();
    const relacionesNormalizadas = normalizarOrdenesProducto(
      relacionesActuales,
      productoId
    );
    this._relacionesProductoGrupo.set(relacionesNormalizadas);
  }

  /**
   * Validar si un orden es único en un producto
   */
  validarOrdenUnicoProducto(
    productoId: number,
    orden: number,
    excludeId?: number
  ): boolean {
    return validarOrdenUnicoProducto(
      this._relacionesProductoGrupo(),
      productoId,
      orden,
      excludeId
    );
  }

  /**
   * Buscar relaciones por término
   */
  buscarRelaciones(termino: string): Observable<ProductoGrupoAdicional[]> {
    if (!termino.trim()) {
      return new Observable((observer) => {
        observer.next(this._relacionesProductoGrupo());
        observer.complete();
      });
    }

    const relacionesFiltradas = buscarRelacionesProductoGrupo(
      this._relacionesProductoGrupo(),
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
  obtenerEstadisticas(): Observable<EstadisticasProductoGrupoAdicional> {
    const estadisticas = calcularEstadisticas(this._relacionesProductoGrupo());
    this._estadisticas.set(estadisticas);

    return new Observable((observer) => {
      observer.next(estadisticas);
      observer.complete();
    });
  }

  /**
   * Obtener configuración completa de un producto
   */
  obtenerConfiguracionProducto(
    productoId: number
  ): Observable<ConfiguracionProductoGrupo> {
    const configuracion = obtenerConfiguracionProducto(
      this._relacionesProductoGrupo(),
      productoId
    );

    return new Observable((observer) => {
      observer.next(configuracion);
      observer.complete();
    });
  }

  /**
   * Aplicar configuración completa a un producto
   */
  aplicarConfiguracionProducto(
    configuracion: ConfiguracionProductoGrupo
  ): Observable<ProductoGrupoAdicionalResponse[]> {
    // Validar configuración
    const errores = validarConfiguracionProducto(configuracion);
    if (errores.length > 0) {
      const error = new Error(errores.join(', '));
      this._error.set(error.message);
      return throwError(() => error);
    }

    this._loading.set(true);
    this._error.set(null);

    // Eliminar relaciones existentes del producto
    const relacionesExistentes = filtrarPorProducto(
      this._relacionesProductoGrupo(),
      configuracion.producto_id
    );
    const eliminarPromises = relacionesExistentes.map((rel) =>
      this.http.delete(`${this.baseUrl}/${rel.id}`).toPromise()
    );

    return new Observable((observer) => {
      Promise.all(eliminarPromises)
        .then(() => {
          // Crear nuevas relaciones
          const crearPromises = configuracion.grupos_configuracion.map(
            (grupo) => {
              const data: CreateProductoGrupoAdicionalDto = {
                producto_id: configuracion.producto_id,
                grupo_adicional_id: grupo.grupo_adicional_id,
                obligatorio: grupo.obligatorio,
                minimo_selecciones: grupo.minimo_selecciones,
                maximo_selecciones: grupo.maximo_selecciones,
                orden: grupo.orden,
                activo: grupo.activo,
              };
              return this.http
                .post<ProductoGrupoAdicionalResponse>(this.baseUrl, data)
                .toPromise();
            }
          );

          return Promise.all(crearPromises);
        })
        .then((responses) => {
          const relacionesCreadas = responses
            .filter((response) => response?.success)
            .map((response) => response!.data);

          // Actualizar lista local
          const relacionesActuales = this._relacionesProductoGrupo();
          const relacionesFiltradas = relacionesActuales.filter(
            (rel) => rel.producto_id !== configuracion.producto_id
          );
          this._relacionesProductoGrupo.set([
            ...relacionesFiltradas,
            ...relacionesCreadas,
          ]);

          observer.next(
            responses.filter(
              (r) => r !== undefined
            ) as ProductoGrupoAdicionalResponse[]
          );
          observer.complete();
        })
        .catch((error) => {
          const errorMessage = 'Error al aplicar configuración del producto';
          this._error.set(errorMessage);
          observer.error(error);
        })
        .finally(() => {
          this._loading.set(false);
        });
    });
  }

  /**
   * Clonar configuración de un producto a otro
   */
  clonarConfiguracionProducto(
    productoOrigenId: number,
    productoDestinoId: number
  ): Observable<ProductoGrupoAdicionalResponse[]> {
    const configuracionOrigen = obtenerConfiguracionProducto(
      this._relacionesProductoGrupo(),
      productoOrigenId
    );

    if (configuracionOrigen.grupos_configuracion.length === 0) {
      const error = new Error(
        'El producto origen no tiene configuración de grupos'
      );
      this._error.set(error.message);
      return throwError(() => error);
    }

    const configuracionDestino = clonarConfiguracionProducto(
      configuracionOrigen,
      productoDestinoId
    );
    return this.aplicarConfiguracionProducto(configuracionDestino);
  }

  /**
   * Crear múltiples relaciones para un producto
   */
  crearRelacionesMultiples(
    productoId: number,
    gruposIds: number[]
  ): Observable<ProductoGrupoAdicionalResponse[]> {
    this._loading.set(true);
    this._error.set(null);

    const relaciones = gruposIds.map((grupoId, index) => ({
      producto_id: productoId,
      grupo_adicional_id: grupoId,
      orden:
        obtenerSiguienteOrdenProducto(
          this._relacionesProductoGrupo(),
          productoId
        ) + index,
      activo: true,
    }));

    const requests = relaciones.map((relacion) =>
      this.http.post<ProductoGrupoAdicionalResponse>(this.baseUrl, relacion)
    );

    return new Observable((observer) => {
      Promise.all(requests.map((req) => req.toPromise()))
        .then((responses) => {
          const relacionesCreadas = responses
            .filter((response) => response?.success)
            .map((response) => response!.data);

          // Actualizar lista local
          const relacionesActuales = this._relacionesProductoGrupo();
          this._relacionesProductoGrupo.set([
            ...relacionesActuales,
            ...relacionesCreadas,
          ]);

          observer.next(
            responses.filter(
              (r) => r !== undefined
            ) as ProductoGrupoAdicionalResponse[]
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
            const relacionesActuales = this._relacionesProductoGrupo();
            this._relacionesProductoGrupo.set(
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
   * Activar/Desactivar múltiples relaciones
   */
  toggleEstadoMultiple(
    ids: number[],
    activo: boolean
  ): Observable<{ success: boolean; message: string }> {
    this._loading.set(true);
    this._error.set(null);

    const requests = ids.map((id) =>
      this.http.put<ProductoGrupoAdicionalResponse>(`${this.baseUrl}/${id}`, {
        activo,
      })
    );

    return new Observable((observer) => {
      Promise.all(requests.map((req) => req.toPromise()))
        .then((responses) => {
          const exitosas = responses.filter((response) => response?.success);

          if (exitosas.length > 0) {
            // Actualizar estados en la lista local
            const relacionesActuales = this._relacionesProductoGrupo();
            const relacionesActualizadas = relacionesActuales.map((rel) => {
              if (ids.includes(rel.id)) {
                return { ...rel, activo };
              }
              return rel;
            });
            this._relacionesProductoGrupo.set(relacionesActualizadas);
          }

          const accion = activo ? 'activadas' : 'desactivadas';
          observer.next({
            success: exitosas.length === ids.length,
            message: `${exitosas.length} de ${ids.length} relaciones ${accion} correctamente`,
          });
          observer.complete();
        })
        .catch((error) => {
          const errorMessage =
            'Error al cambiar estado de relaciones múltiples';
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
  exportarCSV(filtros: FiltrosProductoGrupoAdicional = {}): Observable<Blob> {
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
          const errorMessage =
            'Error al exportar relaciones producto-grupo-adicional';
          this._error.set(errorMessage);
          return throwError(() => error);
        })
      );
  }

  /**
   * Exportar relaciones a Excel
   */
  exportarExcel(filtros: FiltrosProductoGrupoAdicional = {}): Observable<Blob> {
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
          const errorMessage =
            'Error al exportar relaciones producto-grupo-adicional';
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
  refrescar(): Observable<ProductosGrupoAdicionalResponse> {
    return this.obtenerRelacionesProductoGrupo(this._filtros());
  }

  // Métodos utilitarios públicos
  readonly utils = {
    validarProductoGrupoAdicional,
    validarRelacionProductoGrupoExistente,
    obtenerSiguienteOrdenProducto,
    agruparPorProducto,
    agruparPorGrupoAdicional,
    ordenarPorOrden,
    filtrarPorProducto,
    filtrarPorGrupo,
    filtrarPorEstado,
    obtenerGruposDeProducto,
    obtenerProductosDeGrupo,
    calcularEstadisticas,
    reordenarRelacionesProducto,
    validarOrdenUnicoProducto,
    normalizarOrdenesProducto,
    toggleEstadoRelacion,
    formatearRelacionProductoGrupo,
    buscarRelacionesProductoGrupo,
    obtenerConfiguracionProducto,
    validarConfiguracionProducto,
    clonarConfiguracionProducto,
    compararConfiguraciones,
  };
}
