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
  SeguimientoPedido,
  CreateSeguimientoPedidoDto,
  UpdateSeguimientoPedidoDto,
  FiltrosSeguimientoPedido,
  SeguimientoPedidoResponse,
  SeguimientosPedidoResponse,
  EstadisticasSeguimiento,
  EstadoPedido,
  validarCreateSeguimientoPedido,
  validarUpdateSeguimientoPedido,
  calcularEstadisticas,
  filtrarSeguimientos,
  buscarSeguimientos,
  ordenarSeguimientos,
  agruparSeguimientosPorEstado,
  agruparSeguimientosPorPedido,
  ESTADOS_PEDIDO,
  OPCIONES_ORDEN_SEGUIMIENTO,
} from '../models/seguimiento-pedido.interface';

@Injectable({
  providedIn: 'root',
})
export class SeguimientoPedidoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/seguimiento-pedidos`;

  // Signals para estado reactivo
  private readonly _seguimientosPedido = signal<SeguimientoPedido[]>([]);
  private readonly _seguimientoPedidoActual = signal<SeguimientoPedido | null>(
    null
  );
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtros = signal<FiltrosSeguimientoPedido>({});
  private readonly _paginacion = signal({
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0,
  });
  private readonly _estadisticas = signal<EstadisticasSeguimiento | null>(null);
  private readonly _terminoBusqueda = signal<string>('');

  // Computed signals para datos derivados
  readonly seguimientosPedido = computed(() => this._seguimientosPedido());
  readonly seguimientoPedidoActual = computed(() =>
    this._seguimientoPedidoActual()
  );
  readonly cargando = computed(() => this._cargando());
  readonly error = computed(() => this._error());
  readonly filtros = computed(() => this._filtros());
  readonly paginacion = computed(() => this._paginacion());
  readonly estadisticas = computed(() => this._estadisticas());
  readonly terminoBusqueda = computed(() => this._terminoBusqueda());

  // Computed signals para datos filtrados y agrupados
  readonly seguimientosFiltrados = computed(() => {
    let seguimientos = this._seguimientosPedido();
    const filtros = this._filtros();
    const termino = this._terminoBusqueda();

    // Aplicar filtros
    if (Object.keys(filtros).length > 0) {
      seguimientos = filtrarSeguimientos(seguimientos, filtros);
    }

    // Aplicar búsqueda
    if (termino.trim()) {
      seguimientos = buscarSeguimientos(seguimientos, termino);
    }

    return seguimientos;
  });

  readonly seguimientosPorEstado = computed(() => {
    return agruparSeguimientosPorEstado(this.seguimientosFiltrados());
  });

  readonly seguimientosPorPedido = computed(() => {
    return agruparSeguimientosPorPedido(this.seguimientosFiltrados());
  });

  readonly seguimientosActivos = computed(() => {
    return this.seguimientosFiltrados().filter((s) =>
      ['confirmado', 'preparando', 'listo', 'enviado'].includes(s.estado_actual)
    );
  });

  readonly seguimientosFinalizados = computed(() => {
    return this.seguimientosFiltrados().filter((s) =>
      ['entregado', 'cancelado', 'devuelto'].includes(s.estado_actual)
    );
  });

  readonly seguimientosPendientesNotificacion = computed(() => {
    return this.seguimientosFiltrados().filter((s) => !s.notificado_cliente);
  });

  readonly seguimientosConUbicacion = computed(() => {
    return this.seguimientosFiltrados().filter((s) => s.tiene_ubicacion);
  });

  readonly estadisticasCalculadas = computed(() => {
    const seguimientos = this.seguimientosFiltrados();
    return seguimientos.length > 0 ? calcularEstadisticas(seguimientos) : null;
  });

  // BehaviorSubjects para compatibilidad con observables existentes
  private readonly seguimientosPedidoSubject = new BehaviorSubject<
    SeguimientoPedido[]
  >([]);
  private readonly seguimientoPedidoActualSubject =
    new BehaviorSubject<SeguimientoPedido | null>(null);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos
  readonly seguimientosPedido$ = this.seguimientosPedidoSubject.asObservable();
  readonly seguimientoPedidoActual$ =
    this.seguimientoPedidoActualSubject.asObservable();
  readonly cargando$ = this.cargandoSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  constructor() {
    // Sincronizar signals con BehaviorSubjects
    this.sincronizarSignalsConSubjects();
  }

  private sincronizarSignalsConSubjects(): void {
    // Actualizar BehaviorSubjects cuando cambien los signals
    this._seguimientosPedido.set = ((originalSet) => {
      return (value: SeguimientoPedido[]) => {
        originalSet.call(this._seguimientosPedido, value);
        this.seguimientosPedidoSubject.next(value);
      };
    })(this._seguimientosPedido.set);

    this._seguimientoPedidoActual.set = ((originalSet) => {
      return (value: SeguimientoPedido | null) => {
        originalSet.call(this._seguimientoPedidoActual, value);
        this.seguimientoPedidoActualSubject.next(value);
      };
    })(this._seguimientoPedidoActual.set);

    this._cargando.set = ((originalSet) => {
      return (value: boolean) => {
        originalSet.call(this._cargando, value);
        this.cargandoSubject.next(value);
      };
    })(this._cargando.set);

    this._error.set = ((originalSet) => {
      return (value: string | null) => {
        originalSet.call(this._error, value);
        this.errorSubject.next(value);
      };
    })(this._error.set);
  }

  /**
   * Obtener todos los seguimientos de pedido con filtros y paginación
   */
  obtenerSeguimientos(
    filtros: FiltrosSeguimientoPedido = {}
  ): Observable<SeguimientosPedidoResponse> {
    this._cargando.set(true);
    this._error.set(null);

    let params = new HttpParams();

    // Aplicar filtros
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<SeguimientosPedidoResponse>(this.baseUrl, { params })
      .pipe(
        tap((response) => {
          this._seguimientosPedido.set(response.data);
          this._paginacion.set({
            currentPage: response.meta.current_page,
            lastPage: response.meta.last_page,
            perPage: response.meta.per_page,
            total: response.meta.total,
          });
          this._filtros.set(filtros);
        }),
        catchError((error) => {
          this._error.set('Error al cargar los seguimientos de pedido');
          console.error('Error al obtener seguimientos:', error);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Obtener un seguimiento específico por ID
   */
  obtenerSeguimiento(id: number): Observable<SeguimientoPedido> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .get<SeguimientoPedidoResponse>(`${this.baseUrl}/${id}`)
      .pipe(
        map((response) => response.data),
        tap((seguimiento) => {
          this._seguimientoPedidoActual.set(seguimiento);
        }),
        catchError((error) => {
          this._error.set('Error al cargar el seguimiento');
          console.error('Error al obtener seguimiento:', error);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Crear un nuevo seguimiento de pedido
   */
  crearSeguimiento(
    dto: CreateSeguimientoPedidoDto
  ): Observable<SeguimientoPedido> {
    // Validar datos antes de enviar
    const errores = validarCreateSeguimientoPedido(dto);
    if (errores.length > 0) {
      this._error.set(errores.join(', '));
      return throwError(() => new Error(errores.join(', ')));
    }

    this._cargando.set(true);
    this._error.set(null);

    return this.http.post<SeguimientoPedidoResponse>(this.baseUrl, dto).pipe(
      map((response) => response.data),
      tap((nuevoSeguimiento) => {
        // Agregar el nuevo seguimiento a la lista
        const seguimientosActuales = this._seguimientosPedido();
        this._seguimientosPedido.set([
          nuevoSeguimiento,
          ...seguimientosActuales,
        ]);
        this._seguimientoPedidoActual.set(nuevoSeguimiento);
      }),
      catchError((error) => {
        this._error.set('Error al crear el seguimiento');
        console.error('Error al crear seguimiento:', error);
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false))
    );
  }

  /**
   * Actualizar un seguimiento existente
   */
  actualizarSeguimiento(
    id: number,
    dto: UpdateSeguimientoPedidoDto
  ): Observable<SeguimientoPedido> {
    // Validar datos antes de enviar
    const errores = validarUpdateSeguimientoPedido(dto);
    if (errores.length > 0) {
      this._error.set(errores.join(', '));
      return throwError(() => new Error(errores.join(', ')));
    }

    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .put<SeguimientoPedidoResponse>(`${this.baseUrl}/${id}`, dto)
      .pipe(
        map((response) => response.data),
        tap((seguimientoActualizado) => {
          // Actualizar en la lista
          const seguimientos = this._seguimientosPedido();
          const index = seguimientos.findIndex((s) => s.id === id);
          if (index !== -1) {
            const nuevaLista = [...seguimientos];
            nuevaLista[index] = seguimientoActualizado;
            this._seguimientosPedido.set(nuevaLista);
          }

          // Actualizar el seguimiento actual si es el mismo
          if (this._seguimientoPedidoActual()?.id === id) {
            this._seguimientoPedidoActual.set(seguimientoActualizado);
          }
        }),
        catchError((error) => {
          this._error.set('Error al actualizar el seguimiento');
          console.error('Error al actualizar seguimiento:', error);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Eliminar un seguimiento
   */
  eliminarSeguimiento(id: number): Observable<void> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        // Remover de la lista
        const seguimientos = this._seguimientosPedido();
        this._seguimientosPedido.set(seguimientos.filter((s) => s.id !== id));

        // Limpiar seguimiento actual si es el mismo
        if (this._seguimientoPedidoActual()?.id === id) {
          this._seguimientoPedidoActual.set(null);
        }
      }),
      catchError((error) => {
        this._error.set('Error al eliminar el seguimiento');
        console.error('Error al eliminar seguimiento:', error);
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false))
    );
  }

  /**
   * Marcar seguimiento como notificado al cliente
   */
  marcarNotificado(id: number): Observable<SeguimientoPedido> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .put<SeguimientoPedidoResponse>(
        `${this.baseUrl}/${id}/marcar-notificado`,
        {}
      )
      .pipe(
        map((response) => response.data),
        tap((seguimientoActualizado) => {
          // Actualizar en la lista
          const seguimientos = this._seguimientosPedido();
          const index = seguimientos.findIndex((s) => s.id === id);
          if (index !== -1) {
            const nuevaLista = [...seguimientos];
            nuevaLista[index] = seguimientoActualizado;
            this._seguimientosPedido.set(nuevaLista);
          }

          // Actualizar el seguimiento actual si es el mismo
          if (this._seguimientoPedidoActual()?.id === id) {
            this._seguimientoPedidoActual.set(seguimientoActualizado);
          }
        }),
        catchError((error) => {
          this._error.set('Error al marcar como notificado');
          console.error('Error al marcar como notificado:', error);
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Obtener seguimientos por pedido específico
   */
  obtenerSeguimientosPorPedido(
    pedidoId: number
  ): Observable<SeguimientoPedido[]> {
    return this.obtenerSeguimientos({ pedido_id: pedidoId }).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Obtener seguimientos por estado
   */
  obtenerSeguimientosPorEstado(
    estado: EstadoPedido
  ): Observable<SeguimientoPedido[]> {
    return this.obtenerSeguimientos({ estado_actual: estado }).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Obtener seguimientos pendientes de notificación
   */
  obtenerSeguimientosPendientesNotificacion(): Observable<SeguimientoPedido[]> {
    return this.obtenerSeguimientos({ sin_notificar: true }).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Marcar múltiples seguimientos como notificados
   */
  marcarMultiplesNotificados(ids: number[]): Observable<SeguimientoPedido[]> {
    this._cargando.set(true);
    this._error.set(null);

    const requests = ids.map((id) => this.marcarNotificado(id));

    return new Observable<SeguimientoPedido[]>((observer) => {
      let completados = 0;
      const resultados: SeguimientoPedido[] = [];

      requests.forEach((request, index) => {
        request.subscribe({
          next: (seguimiento) => {
            resultados[index] = seguimiento;
            completados++;

            if (completados === requests.length) {
              observer.next(resultados.filter((r) => r !== undefined));
              observer.complete();
            }
          },
          error: (error) => {
            this._error.set('Error al marcar seguimientos como notificados');
            observer.error(error);
          },
        });
      });
    }).pipe(finalize(() => this._cargando.set(false)));
  }

  /**
   * Actualizar filtros de búsqueda
   */
  actualizarFiltros(filtros: FiltrosSeguimientoPedido): void {
    this._filtros.set(filtros);
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    this._filtros.set({});
  }

  /**
   * Actualizar término de búsqueda
   */
  actualizarTerminoBusqueda(termino: string): void {
    this._terminoBusqueda.set(termino);
  }

  /**
   * Limpiar término de búsqueda
   */
  limpiarBusqueda(): void {
    this._terminoBusqueda.set('');
  }

  /**
   * Ordenar seguimientos
   */
  ordenarSeguimientos(
    campo: keyof SeguimientoPedido,
    direccion: 'asc' | 'desc' = 'desc'
  ): void {
    const seguimientosOrdenados = ordenarSeguimientos(
      this._seguimientosPedido(),
      campo,
      direccion
    );
    this._seguimientosPedido.set(seguimientosOrdenados);
  }

  /**
   * Refrescar datos
   */
  refrescar(): Observable<SeguimientosPedidoResponse> {
    return this.obtenerSeguimientos(this._filtros());
  }

  /**
   * Limpiar estado
   */
  limpiarEstado(): void {
    this._seguimientosPedido.set([]);
    this._seguimientoPedidoActual.set(null);
    this._error.set(null);
    this._filtros.set({});
    this._terminoBusqueda.set('');
    this._estadisticas.set(null);
  }

  /**
   * Exportar seguimientos a CSV
   */
  exportarCSV(seguimientos?: SeguimientoPedido[]): string {
    const datos = seguimientos || this.seguimientosFiltrados();

    if (datos.length === 0) {
      return '';
    }

    const headers = [
      'ID',
      'Pedido ID',
      'Estado Anterior',
      'Estado Actual',
      'Observaciones',
      'Usuario Cambio',
      'Fecha Cambio',
      'Notificado Cliente',
      'Tiene Ubicación',
      'Tiempo Estimado',
    ];

    const filas = datos.map((seguimiento) => [
      seguimiento.id.toString(),
      seguimiento.pedido_id.toString(),
      seguimiento.estado_anterior_texto,
      seguimiento.estado_actual_texto,
      seguimiento.observaciones || '',
      seguimiento.usuario_cambio?.nombre || '',
      seguimiento.fecha_cambio_formateada,
      seguimiento.notificado_cliente ? 'Sí' : 'No',
      seguimiento.tiene_ubicacion ? 'Sí' : 'No',
      seguimiento.tiempo_estimado_texto || '',
    ]);

    const csvContent = [headers, ...filas]
      .map((fila) => fila.map((campo) => `"${campo}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Descargar CSV
   */
  descargarCSV(nombreArchivo: string = 'seguimientos-pedido.csv'): void {
    const csvContent = this.exportarCSV();

    if (!csvContent) {
      this._error.set('No hay datos para exportar');
      return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', nombreArchivo);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Obtener opciones para formularios
   */
  obtenerOpcionesEstado(): Array<{ value: EstadoPedido; label: string }> {
    return Object.entries(ESTADOS_PEDIDO).map(([value, label]) => ({
      value: value as EstadoPedido,
      label,
    }));
  }

  /**
   * Obtener opciones de ordenamiento
   */
  obtenerOpcionesOrdenamiento(): Array<{ value: string; label: string }> {
    return OPCIONES_ORDEN_SEGUIMIENTO;
  }

  /**
   * Validar si se puede crear un seguimiento
   */
  puedeCrearSeguimiento(dto: CreateSeguimientoPedidoDto): boolean {
    return validarCreateSeguimientoPedido(dto).length === 0;
  }

  /**
   * Validar si se puede actualizar un seguimiento
   */
  puedeActualizarSeguimiento(dto: UpdateSeguimientoPedidoDto): boolean {
    return validarUpdateSeguimientoPedido(dto).length === 0;
  }

  /**
   * Obtener errores de validación para crear
   */
  obtenerErroresCreacion(dto: CreateSeguimientoPedidoDto): string[] {
    return validarCreateSeguimientoPedido(dto);
  }

  /**
   * Obtener errores de validación para actualizar
   */
  obtenerErroresActualizacion(dto: UpdateSeguimientoPedidoDto): string[] {
    return validarUpdateSeguimientoPedido(dto);
  }
}
