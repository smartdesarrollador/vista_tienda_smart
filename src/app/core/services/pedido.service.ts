import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  map,
  tap,
  catchError,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Pedido,
  PedidoResponse,
  CreatePedidoDto,
  UpdatePedidoDto,
  CambiarEstadoDto,
  AplicarCuponDto,
  PedidoFilters,
  EstadisticasResponse,
  PedidosPorUsuarioResponse,
  AplicarCuponResponse,
  EstadoPedido,
  TipoPago,
  CanalVenta,
} from '../models/pedido.interface';

@Injectable({
  providedIn: 'root',
})
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/pedidos`;

  // Estado reactivo para la lista de pedidos
  private pedidosSubject = new BehaviorSubject<Pedido[]>([]);
  public pedidos$ = this.pedidosSubject.asObservable();

  // Estado para el pedido seleccionado
  private pedidoSeleccionadoSubject = new BehaviorSubject<Pedido | null>(null);
  public pedidoSeleccionado$ = this.pedidoSeleccionadoSubject.asObservable();

  // Estado para loading
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Estado para estadísticas
  private estadisticasSubject =
    new BehaviorSubject<EstadisticasResponse | null>(null);
  public estadisticas$ = this.estadisticasSubject.asObservable();

  /**
   * Obtener lista paginada de pedidos con filtros
   */
  obtenerPedidos(filtros?: PedidoFilters): Observable<PedidoResponse> {
    this.setLoading(true);

    let params = new HttpParams();

    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach((v) => (params = params.append(key, v.toString())));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<PedidoResponse>(this.apiUrl, { params }).pipe(
      tap((response) => {
        this.pedidosSubject.next(response.data);
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Obtener un pedido específico por ID
   */
  obtenerPedido(id: number): Observable<Pedido> {
    this.setLoading(true);

    return this.http.get<{ data: Pedido }>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response.data),
      tap((pedido) => {
        this.pedidoSeleccionadoSubject.next(pedido);
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Crear un nuevo pedido
   */
  crearPedido(pedidoData: CreatePedidoDto): Observable<Pedido> {
    this.setLoading(true);

    return this.http.post<{ data: Pedido }>(this.apiUrl, pedidoData).pipe(
      map((response) => response.data),
      tap((nuevoPedido) => {
        // Actualizar la lista de pedidos agregando el nuevo
        const pedidosActuales = this.pedidosSubject.value;
        this.pedidosSubject.next([nuevoPedido, ...pedidosActuales]);
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Actualizar un pedido existente
   */
  actualizarPedido(
    id: number,
    pedidoData: UpdatePedidoDto
  ): Observable<Pedido> {
    this.setLoading(true);

    return this.http
      .put<{ data: Pedido }>(`${this.apiUrl}/${id}`, pedidoData)
      .pipe(
        map((response) => response.data),
        tap((pedidoActualizado) => {
          // Actualizar en la lista de pedidos
          const pedidosActuales = this.pedidosSubject.value;
          const index = pedidosActuales.findIndex((p) => p.id === id);
          if (index !== -1) {
            pedidosActuales[index] = pedidoActualizado;
            this.pedidosSubject.next([...pedidosActuales]);
          }

          // Actualizar pedido seleccionado si es el mismo
          if (this.pedidoSeleccionadoSubject.value?.id === id) {
            this.pedidoSeleccionadoSubject.next(pedidoActualizado);
          }

          this.setLoading(false);
        }),
        catchError((error) => {
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Eliminar un pedido
   */
  eliminarPedido(id: number): Observable<void> {
    this.setLoading(true);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Remover de la lista de pedidos
        const pedidosActuales = this.pedidosSubject.value;
        const pedidosFiltrados = pedidosActuales.filter((p) => p.id !== id);
        this.pedidosSubject.next(pedidosFiltrados);

        // Limpiar pedido seleccionado si es el mismo
        if (this.pedidoSeleccionadoSubject.value?.id === id) {
          this.pedidoSeleccionadoSubject.next(null);
        }

        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Cambiar estado de un pedido
   */
  cambiarEstado(
    id: number,
    cambioEstado: CambiarEstadoDto
  ): Observable<Pedido> {
    this.setLoading(true);

    return this.http
      .post<{ data: Pedido }>(
        `${this.apiUrl}/${id}/cambiar-estado`,
        cambioEstado
      )
      .pipe(
        map((response) => response.data),
        tap((pedidoActualizado) => {
          // Actualizar en la lista de pedidos
          const pedidosActuales = this.pedidosSubject.value;
          const index = pedidosActuales.findIndex((p) => p.id === id);
          if (index !== -1) {
            pedidosActuales[index] = pedidoActualizado;
            this.pedidosSubject.next([...pedidosActuales]);
          }

          // Actualizar pedido seleccionado si es el mismo
          if (this.pedidoSeleccionadoSubject.value?.id === id) {
            this.pedidoSeleccionadoSubject.next(pedidoActualizado);
          }

          this.setLoading(false);
        }),
        catchError((error) => {
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Aplicar cupón a un pedido
   */
  aplicarCupon(
    id: number,
    cuponData: AplicarCuponDto
  ): Observable<AplicarCuponResponse> {
    this.setLoading(true);

    return this.http
      .post<AplicarCuponResponse>(
        `${this.apiUrl}/${id}/aplicar-cupon`,
        cuponData
      )
      .pipe(
        tap((response) => {
          // Actualizar en la lista de pedidos
          const pedidosActuales = this.pedidosSubject.value;
          const index = pedidosActuales.findIndex((p) => p.id === id);
          if (index !== -1) {
            pedidosActuales[index] = response.pedido;
            this.pedidosSubject.next([...pedidosActuales]);
          }

          // Actualizar pedido seleccionado si es el mismo
          if (this.pedidoSeleccionadoSubject.value?.id === id) {
            this.pedidoSeleccionadoSubject.next(response.pedido);
          }

          this.setLoading(false);
        }),
        catchError((error) => {
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Obtener pedidos por usuario
   */
  obtenerPedidosPorUsuario(
    usuarioId: number,
    filtros?: Partial<PedidoFilters>
  ): Observable<PedidosPorUsuarioResponse> {
    this.setLoading(true);

    let params = new HttpParams();

    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<PedidosPorUsuarioResponse>(`${this.apiUrl}/usuario/${usuarioId}`, {
        params,
      })
      .pipe(
        tap(() => this.setLoading(false)),
        catchError((error) => {
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Obtener estadísticas de pedidos
   */
  obtenerEstadisticas(
    fechaDesde?: string,
    fechaHasta?: string
  ): Observable<EstadisticasResponse> {
    this.setLoading(true);

    let params = new HttpParams();

    if (fechaDesde) {
      params = params.set('fecha_desde', fechaDesde);
    }

    if (fechaHasta) {
      params = params.set('fecha_hasta', fechaHasta);
    }

    return this.http
      .get<EstadisticasResponse>(`${this.apiUrl}/statistics`, { params })
      .pipe(
        tap((estadisticas) => {
          this.estadisticasSubject.next(estadisticas);
          this.setLoading(false);
        }),
        catchError((error) => {
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Métodos de utilidad para filtros rápidos
   */
  obtenerPedidosPorEstado(estado: EstadoPedido): Observable<PedidoResponse> {
    return this.obtenerPedidos({ estado });
  }

  obtenerPedidosPorTipoPago(tipoPago: TipoPago): Observable<PedidoResponse> {
    return this.obtenerPedidos({ tipo_pago: tipoPago });
  }

  obtenerPedidosPorCanalVenta(
    canalVenta: CanalVenta
  ): Observable<PedidoResponse> {
    return this.obtenerPedidos({ canal_venta: canalVenta });
  }

  obtenerPedidosPendientes(): Observable<PedidoResponse> {
    return this.obtenerPedidosPorEstado('pendiente');
  }

  obtenerPedidosEnProceso(): Observable<PedidoResponse> {
    return this.obtenerPedidos({
      estado: ['aprobado', 'en_proceso', 'enviado'],
    });
  }

  obtenerPedidosFinalizados(): Observable<PedidoResponse> {
    return this.obtenerPedidos({
      estado: ['entregado', 'cancelado', 'devuelto'],
    });
  }

  /**
   * Buscar pedidos por término
   */
  buscarPedidos(termino: string): Observable<PedidoResponse> {
    return this.obtenerPedidos({ search: termino });
  }

  /**
   * Obtener pedidos por rango de fechas
   */
  obtenerPedidosPorRangoFechas(
    fechaDesde: string,
    fechaHasta: string
  ): Observable<PedidoResponse> {
    return this.obtenerPedidos({
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
    });
  }

  /**
   * Obtener pedidos por rango de totales
   */
  obtenerPedidosPorRangoTotales(
    totalMin: number,
    totalMax: number
  ): Observable<PedidoResponse> {
    return this.obtenerPedidos({ total_min: totalMin, total_max: totalMax });
  }

  /**
   * Métodos para gestión de estado local
   */
  seleccionarPedido(pedido: Pedido): void {
    this.pedidoSeleccionadoSubject.next(pedido);
  }

  limpiarPedidoSeleccionado(): void {
    this.pedidoSeleccionadoSubject.next(null);
  }

  limpiarPedidos(): void {
    this.pedidosSubject.next([]);
  }

  limpiarEstadisticas(): void {
    this.estadisticasSubject.next(null);
  }

  /**
   * Métodos de utilidad para validaciones
   */
  puedeEditarPedido(pedido: Pedido): boolean {
    return !['entregado', 'cancelado', 'devuelto'].includes(pedido.estado);
  }

  puedeEliminarPedido(pedido: Pedido): boolean {
    return pedido.estado === 'pendiente';
  }

  puedeCambiarEstado(pedido: Pedido, nuevoEstado: EstadoPedido): boolean {
    const transicionesValidas: Record<EstadoPedido, EstadoPedido[]> = {
      pendiente: ['aprobado', 'rechazado', 'cancelado'],
      aprobado: ['en_proceso', 'cancelado'],
      en_proceso: ['enviado', 'cancelado'],
      enviado: ['entregado', 'devuelto'],
      entregado: ['devuelto'],
      rechazado: [],
      cancelado: [],
      devuelto: [],
    };

    return transicionesValidas[pedido.estado]?.includes(nuevoEstado) ?? false;
  }

  puedeAplicarCupon(pedido: Pedido): boolean {
    return pedido.estado === 'pendiente';
  }

  /**
   * Métodos de utilidad para cálculos
   */
  calcularSubtotal(pedido: Pedido): number {
    return pedido.detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
  }

  calcularTotalDescuentos(pedido: Pedido): number {
    const descuentosDetalles = pedido.detalles.reduce(
      (sum, detalle) => sum + (detalle.descuento || 0),
      0
    );
    return descuentosDetalles + (pedido.descuento_total || 0);
  }

  calcularTotalImpuestos(pedido: Pedido): number {
    return pedido.detalles.reduce(
      (sum, detalle) => sum + (detalle.impuesto || 0),
      0
    );
  }

  obtenerSimboloMoneda(moneda: string): string {
    const simbolos: Record<string, string> = {
      PEN: 'S/',
      USD: '$',
      EUR: '€',
    };
    return simbolos[moneda] || moneda;
  }

  /**
   * Métodos privados
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en PedidoService:', error);

    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Método para refrescar datos
   */
  refrescarDatos(): void {
    // Refrescar lista de pedidos si hay filtros aplicados
    const filtrosActuales = this.obtenerFiltrosActuales();
    if (filtrosActuales) {
      this.obtenerPedidos(filtrosActuales).subscribe();
    }

    // Refrescar estadísticas si están cargadas
    if (this.estadisticasSubject.value) {
      this.obtenerEstadisticas().subscribe();
    }
  }

  private obtenerFiltrosActuales(): PedidoFilters | null {
    // Este método podría implementarse para mantener los filtros actuales
    // Por ahora retorna null, pero se puede extender según necesidades
    return null;
  }

  /**
   * Método para exportar datos (preparación para futuras funcionalidades)
   */
  prepararDatosParaExportar(pedidos: Pedido[]): any[] {
    return pedidos.map((pedido) => ({
      id: pedido.id,
      fecha: pedido.created_at,
      cliente: pedido.usuario.nombre,
      email: pedido.usuario.email,
      estado: pedido.estado_detallado.nombre,
      tipo_pago: pedido.tipo_pago,
      canal_venta: pedido.canal_venta,
      subtotal: pedido.subtotal,
      descuentos: pedido.descuento_total,
      total: pedido.total,
      items: pedido.numero_items,
      observaciones: pedido.observaciones,
      codigo_rastreo: pedido.codigo_rastreo,
    }));
  }
}
