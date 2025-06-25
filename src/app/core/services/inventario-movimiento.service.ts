import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  InventarioMovimiento,
  InventarioMovimientosResponse,
  InventarioMovimientoResponse,
  CreateInventarioMovimientoResponse,
  CreateInventarioMovimientoDto,
  UpdateInventarioMovimientoDto,
  FiltrosInventarioMovimiento,
  PaginacionInventarioMovimiento,
  ReporteInventarioResponse,
  FiltrosReporteInventario,
  EstadisticasInventarioResponse,
  FiltrosEstadisticasInventario,
  TipoMovimiento,
  ErrorInventarioResponse,
  validarMovimiento,
  agruparPorFecha,
  agruparPorTipo,
  calcularTotalUnidades,
  obtenerMovimientosCriticos,
  obtenerMovimientosAtencion,
} from '../models/inventario-movimiento.interface';

@Injectable({
  providedIn: 'root',
})
export class InventarioMovimientoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/inventario`;

  // Signals privados para el estado interno
  private readonly _movimientos = signal<InventarioMovimiento[]>([]);
  private readonly _movimientoActual = signal<InventarioMovimiento | null>(
    null
  );
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtros = signal<FiltrosInventarioMovimiento>({});
  private readonly _paginacion = signal<PaginacionInventarioMovimiento>({
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1,
    from: null,
    to: null,
  });

  // Signals públicos readonly
  public readonly movimientos = this._movimientos.asReadonly();
  public readonly movimientoActual = this._movimientoActual.asReadonly();
  public readonly cargando = this._cargando.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly filtros = this._filtros.asReadonly();
  public readonly paginacion = this._paginacion.asReadonly();

  // Computed signals para datos derivados
  public readonly totalMovimientos = computed(() => this._paginacion().total);
  public readonly hayMovimientos = computed(
    () => this._movimientos().length > 0
  );
  public readonly movimientosPorFecha = computed(() =>
    agruparPorFecha(this._movimientos())
  );
  public readonly movimientosPorTipo = computed(() =>
    agruparPorTipo(this._movimientos())
  );
  public readonly movimientosCriticos = computed(() =>
    obtenerMovimientosCriticos(this._movimientos())
  );
  public readonly movimientosAtencion = computed(() =>
    obtenerMovimientosAtencion(this._movimientos())
  );

  // Computed para estadísticas rápidas
  public readonly totalEntradas = computed(() =>
    calcularTotalUnidades(this._movimientos(), 'entrada')
  );
  public readonly totalSalidas = computed(() =>
    calcularTotalUnidades(this._movimientos(), 'salida')
  );
  public readonly totalAjustes = computed(() =>
    calcularTotalUnidades(this._movimientos(), 'ajuste')
  );

  // BehaviorSubjects para compatibilidad con observables existentes
  private readonly movimientosSubject = new BehaviorSubject<
    InventarioMovimiento[]
  >([]);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos
  public readonly movimientos$ = this.movimientosSubject.asObservable();
  public readonly cargando$ = this.cargandoSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();

  constructor() {
    // Sincronizar signals con BehaviorSubjects
    this.sincronizarEstado();
  }

  /**
   * Sincroniza el estado de signals con BehaviorSubjects
   */
  private sincronizarEstado(): void {
    // Efecto para sincronizar movimientos
    this._movimientos.set = ((originalSet) => {
      return (value: InventarioMovimiento[]) => {
        originalSet.call(this._movimientos, value);
        this.movimientosSubject.next(value);
      };
    })(this._movimientos.set);

    // Efecto para sincronizar cargando
    this._cargando.set = ((originalSet) => {
      return (value: boolean) => {
        originalSet.call(this._cargando, value);
        this.cargandoSubject.next(value);
      };
    })(this._cargando.set);

    // Efecto para sincronizar error
    this._error.set = ((originalSet) => {
      return (value: string | null) => {
        originalSet.call(this._error, value);
        this.errorSubject.next(value);
      };
    })(this._error.set);
  }

  /**
   * Obtiene la lista de movimientos de inventario con filtros y paginación
   */
  obtenerMovimientos(
    filtros: FiltrosInventarioMovimiento = {}
  ): Observable<InventarioMovimientosResponse> {
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
      .get<InventarioMovimientosResponse>(`${this.baseUrl}/movimientos`, {
        params,
      })
      .pipe(
        tap((response) => {
          this._movimientos.set(response.data);
          this._paginacion.set(response.meta);
          this._filtros.set(filtros);
        }),
        catchError((error) =>
          this.manejarError('Error al obtener movimientos de inventario', error)
        ),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Obtiene un movimiento específico por ID
   */
  obtenerMovimientoPorId(id: number): Observable<InventarioMovimientoResponse> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .get<InventarioMovimientoResponse>(`${this.baseUrl}/movimientos/${id}`)
      .pipe(
        tap((response) => {
          this._movimientoActual.set(response.data);
        }),
        catchError((error) =>
          this.manejarError(
            'Error al obtener el movimiento de inventario',
            error
          )
        ),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Crea un nuevo movimiento de inventario
   */
  crearMovimiento(
    movimiento: CreateInventarioMovimientoDto
  ): Observable<CreateInventarioMovimientoResponse> {
    // Validar datos antes de enviar
    const erroresValidacion = validarMovimiento(movimiento);
    if (erroresValidacion.length > 0) {
      const error = `Errores de validación: ${erroresValidacion.join(', ')}`;
      this._error.set(error);
      return throwError(() => new Error(error));
    }

    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .post<CreateInventarioMovimientoResponse>(
        `${this.baseUrl}/movimientos`,
        movimiento
      )
      .pipe(
        tap((response) => {
          // Agregar el nuevo movimiento a la lista actual
          const movimientosActuales = this._movimientos();
          this._movimientos.set([response.data, ...movimientosActuales]);
          this._movimientoActual.set(response.data);
        }),
        catchError((error) =>
          this.manejarError('Error al crear el movimiento de inventario', error)
        ),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Actualiza un movimiento de inventario (solo campos editables)
   */
  actualizarMovimiento(
    id: number,
    movimiento: UpdateInventarioMovimientoDto
  ): Observable<InventarioMovimientoResponse> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .put<InventarioMovimientoResponse>(
        `${this.baseUrl}/movimientos/${id}`,
        movimiento
      )
      .pipe(
        tap((response) => {
          // Actualizar en la lista
          const movimientos = this._movimientos();
          const index = movimientos.findIndex((m) => m.id === id);
          if (index !== -1) {
            const nuevosMovimientos = [...movimientos];
            nuevosMovimientos[index] = response.data;
            this._movimientos.set(nuevosMovimientos);
          }
          this._movimientoActual.set(response.data);
        }),
        catchError((error) =>
          this.manejarError(
            'Error al actualizar el movimiento de inventario',
            error
          )
        ),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Obtiene reporte de movimientos de inventario
   */
  obtenerReporte(
    filtros: FiltrosReporteInventario
  ): Observable<ReporteInventarioResponse> {
    this._cargando.set(true);
    this._error.set(null);

    let params = new HttpParams();

    // Aplicar filtros del reporte
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<ReporteInventarioResponse>(`${this.baseUrl}/reporte`, { params })
      .pipe(
        catchError((error) =>
          this.manejarError('Error al generar el reporte de inventario', error)
        ),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Obtiene estadísticas de movimientos de inventario
   */
  obtenerEstadisticas(
    filtros: FiltrosEstadisticasInventario = {}
  ): Observable<EstadisticasInventarioResponse> {
    this._cargando.set(true);
    this._error.set(null);

    let params = new HttpParams();

    // Aplicar filtros de estadísticas
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<EstadisticasInventarioResponse>(`${this.baseUrl}/estadisticas`, {
        params,
      })
      .pipe(
        catchError((error) =>
          this.manejarError(
            'Error al obtener estadísticas de inventario',
            error
          )
        ),
        finalize(() => this._cargando.set(false))
      );
  }

  /**
   * Obtiene movimientos por producto
   */
  obtenerMovimientosPorProducto(
    productoId: number,
    filtros: Partial<FiltrosInventarioMovimiento> = {}
  ): Observable<InventarioMovimientosResponse> {
    const filtrosCompletos: FiltrosInventarioMovimiento = {
      ...filtros,
      producto_id: productoId,
    };

    return this.obtenerMovimientos(filtrosCompletos);
  }

  /**
   * Obtiene movimientos por variación
   */
  obtenerMovimientosPorVariacion(
    variacionId: number,
    filtros: Partial<FiltrosInventarioMovimiento> = {}
  ): Observable<InventarioMovimientosResponse> {
    const filtrosCompletos: FiltrosInventarioMovimiento = {
      ...filtros,
      variacion_id: variacionId,
    };

    return this.obtenerMovimientos(filtrosCompletos);
  }

  /**
   * Obtiene movimientos por tipo
   */
  obtenerMovimientosPorTipo(
    tipo: TipoMovimiento,
    filtros: Partial<FiltrosInventarioMovimiento> = {}
  ): Observable<InventarioMovimientosResponse> {
    const filtrosCompletos: FiltrosInventarioMovimiento = {
      ...filtros,
      tipo_movimiento: tipo,
    };

    return this.obtenerMovimientos(filtrosCompletos);
  }

  /**
   * Obtiene movimientos por usuario
   */
  obtenerMovimientosPorUsuario(
    usuarioId: number,
    filtros: Partial<FiltrosInventarioMovimiento> = {}
  ): Observable<InventarioMovimientosResponse> {
    const filtrosCompletos: FiltrosInventarioMovimiento = {
      ...filtros,
      usuario_id: usuarioId,
    };

    return this.obtenerMovimientos(filtrosCompletos);
  }

  /**
   * Obtiene movimientos por rango de fechas
   */
  obtenerMovimientosPorFechas(
    fechaDesde: string,
    fechaHasta: string,
    filtros: Partial<FiltrosInventarioMovimiento> = {}
  ): Observable<InventarioMovimientosResponse> {
    const filtrosCompletos: FiltrosInventarioMovimiento = {
      ...filtros,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
    };

    return this.obtenerMovimientos(filtrosCompletos);
  }

  /**
   * Refresca la lista de movimientos con los filtros actuales
   */
  refrescar(): Observable<InventarioMovimientosResponse> {
    return this.obtenerMovimientos(this._filtros());
  }

  /**
   * Cambia la página actual
   */
  cambiarPagina(pagina: number): Observable<InventarioMovimientosResponse> {
    const filtrosConPagina: FiltrosInventarioMovimiento = {
      ...this._filtros(),
      page: pagina,
    };

    return this.obtenerMovimientos(filtrosConPagina);
  }

  /**
   * Cambia el tamaño de página
   */
  cambiarTamanoPagina(
    tamaño: number
  ): Observable<InventarioMovimientosResponse> {
    const filtrosConTamaño: FiltrosInventarioMovimiento = {
      ...this._filtros(),
      per_page: tamaño,
      page: 1, // Resetear a la primera página
    };

    return this.obtenerMovimientos(filtrosConTamaño);
  }

  /**
   * Aplica filtros de búsqueda
   */
  aplicarFiltros(
    filtros: FiltrosInventarioMovimiento
  ): Observable<InventarioMovimientosResponse> {
    const filtrosConPagina: FiltrosInventarioMovimiento = {
      ...filtros,
      page: 1, // Resetear a la primera página al aplicar filtros
    };

    return this.obtenerMovimientos(filtrosConPagina);
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): Observable<InventarioMovimientosResponse> {
    return this.obtenerMovimientos({});
  }

  /**
   * Limpia el estado del servicio
   */
  limpiarEstado(): void {
    this._movimientos.set([]);
    this._movimientoActual.set(null);
    this._error.set(null);
    this._filtros.set({});
    this._paginacion.set({
      total: 0,
      per_page: 15,
      current_page: 1,
      last_page: 1,
      from: null,
      to: null,
    });
  }

  /**
   * Obtiene estadísticas rápidas de los movimientos actuales
   */
  obtenerEstadisticasRapidas(): {
    total: number;
    entradas: number;
    salidas: number;
    ajustes: number;
    criticos: number;
    atencion: number;
  } {
    const movimientos = this._movimientos();

    return {
      total: movimientos.length,
      entradas: this.totalEntradas(),
      salidas: this.totalSalidas(),
      ajustes: this.totalAjustes(),
      criticos: this.movimientosCriticos().length,
      atencion: this.movimientosAtencion().length,
    };
  }

  /**
   * Verifica si hay movimientos críticos
   */
  hayMovimientosCriticos(): boolean {
    return this.movimientosCriticos().length > 0;
  }

  /**
   * Verifica si hay movimientos que requieren atención
   */
  hayMovimientosAtencion(): boolean {
    return this.movimientosAtencion().length > 0;
  }

  /**
   * Obtiene el último movimiento registrado
   */
  obtenerUltimoMovimiento(): InventarioMovimiento | null {
    const movimientos = this._movimientos();
    return movimientos.length > 0 ? movimientos[0] : null;
  }

  /**
   * Busca movimientos por texto en motivo o referencia
   */
  buscarMovimientos(texto: string): InventarioMovimiento[] {
    const movimientos = this._movimientos();
    const textoBusqueda = texto.toLowerCase().trim();

    if (!textoBusqueda) {
      return movimientos;
    }

    return movimientos.filter(
      (movimiento) =>
        movimiento.motivo.toLowerCase().includes(textoBusqueda) ||
        (movimiento.referencia &&
          movimiento.referencia.toLowerCase().includes(textoBusqueda)) ||
        movimiento.tipo_movimiento_texto.toLowerCase().includes(textoBusqueda)
    );
  }

  /**
   * Maneja errores de las peticiones HTTP
   */
  private manejarError(mensaje: string, error: any): Observable<never> {
    console.error(`${mensaje}:`, error);

    let mensajeError = mensaje;

    if (error?.error?.message) {
      mensajeError = error.error.message;
    } else if (error?.message) {
      mensajeError = error.message;
    } else if (typeof error === 'string') {
      mensajeError = error;
    }

    this._error.set(mensajeError);
    return throwError(() => error);
  }

  /**
   * Obtiene la configuración actual del servicio
   */
  obtenerConfiguracion(): {
    filtros: FiltrosInventarioMovimiento;
    paginacion: PaginacionInventarioMovimiento;
    totalMovimientos: number;
    hayMovimientos: boolean;
  } {
    return {
      filtros: this._filtros(),
      paginacion: this._paginacion(),
      totalMovimientos: this.totalMovimientos(),
      hayMovimientos: this.hayMovimientos(),
    };
  }

  /**
   * Exporta los movimientos actuales (preparación para funcionalidad de exportación)
   */
  prepararExportacion(): {
    movimientos: InventarioMovimiento[];
    filtros: FiltrosInventarioMovimiento;
    estadisticas: any;
  } {
    return {
      movimientos: this._movimientos(),
      filtros: this._filtros(),
      estadisticas: this.obtenerEstadisticasRapidas(),
    };
  }
}
