import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  DetallePedidoAvanzado,
  CreateDetallePedidoAvanzadoDto,
  UpdateDetallePedidoDto,
  DetallePedidoFilters,
  DetallePedidoEstadisticas,
  DetallePedidoPaginatedResponse,
  DetallePedidoCalculos,
  ValidacionStock,
  UpdateMasivoDetallePedido,
  ResumenDetallePedido,
  ExportacionDetalles,
  DETALLE_PEDIDO_CONSTANTS,
  ApiResponse,
} from '../models';

/**
 * Servicio para gestión completa de detalles de pedidos
 * Maneja la comunicación con la API Laravel para operaciones CRUD
 * y funcionalidades especializadas de detalles de pedidos
 */
@Injectable({
  providedIn: 'root',
})
export class DetallePedidoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/detalles-pedido`;

  // Estado reactivo para detalles de pedidos
  private detallesSubject = new BehaviorSubject<DetallePedidoAvanzado[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos
  public readonly detalles$ = this.detallesSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();

  /**
   * Obtiene lista paginada de detalles de pedidos con filtros
   */
  getDetalles(
    filters?: DetallePedidoFilters
  ): Observable<DetallePedidoPaginatedResponse> {
    this.setLoading(true);
    this.clearError();

    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(
              (v) => (params = params.append(`${key}[]`, v.toString()))
            );
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http
      .get<ApiResponse<DetallePedidoPaginatedResponse>>(this.apiUrl, { params })
      .pipe(
        map((response) => response.data),
        tap((data) => {
          if (data.data) {
            this.detallesSubject.next(data.data);
          }
        }),
        catchError((error) =>
          this.handleError('Error al obtener detalles de pedidos', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Obtiene un detalle de pedido específico por ID
   */
  getDetalle(id: number): Observable<DetallePedidoAvanzado> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .get<ApiResponse<DetallePedidoAvanzado>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError(`Error al obtener detalle de pedido ${id}`, error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Crea un nuevo detalle de pedido
   */
  createDetalle(
    data: CreateDetallePedidoAvanzadoDto
  ): Observable<DetallePedidoAvanzado> {
    this.setLoading(true);
    this.clearError();

    // Validaciones antes de enviar
    if (!this.validarDatosCreacion(data)) {
      return throwError(() => new Error('Datos de creación inválidos'));
    }

    return this.http
      .post<ApiResponse<DetallePedidoAvanzado>>(this.apiUrl, data)
      .pipe(
        map((response) => response.data),
        tap((detalle) => {
          // Actualizar lista local
          const currentDetalles = this.detallesSubject.value;
          this.detallesSubject.next([...currentDetalles, detalle]);
        }),
        catchError((error) =>
          this.handleError('Error al crear detalle de pedido', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Actualiza un detalle de pedido existente
   */
  updateDetalle(
    id: number,
    data: UpdateDetallePedidoDto
  ): Observable<DetallePedidoAvanzado> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .put<ApiResponse<DetallePedidoAvanzado>>(`${this.apiUrl}/${id}`, data)
      .pipe(
        map((response) => response.data),
        tap((detalleActualizado) => {
          // Actualizar en lista local
          const currentDetalles = this.detallesSubject.value;
          const index = currentDetalles.findIndex((d) => d.id === id);
          if (index !== -1) {
            currentDetalles[index] = detalleActualizado;
            this.detallesSubject.next([...currentDetalles]);
          }
        }),
        catchError((error) =>
          this.handleError(`Error al actualizar detalle ${id}`, error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Elimina un detalle de pedido
   */
  deleteDetalle(id: number): Observable<void> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0),
      tap(() => {
        // Remover de lista local
        const currentDetalles = this.detallesSubject.value;
        const filteredDetalles = currentDetalles.filter((d) => d.id !== id);
        this.detallesSubject.next(filteredDetalles);
      }),
      catchError((error) =>
        this.handleError(`Error al eliminar detalle ${id}`, error)
      ),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Obtiene detalles de un pedido específico
   */
  getDetallesByPedido(pedidoId: number): Observable<DetallePedidoAvanzado[]> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .get<ApiResponse<DetallePedidoAvanzado[]>>(
        `${this.apiUrl}/pedido/${pedidoId}`
      )
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError(
            `Error al obtener detalles del pedido ${pedidoId}`,
            error
          )
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Actualiza la cantidad de un detalle específico
   */
  updateCantidad(
    id: number,
    cantidad: number
  ): Observable<DetallePedidoAvanzado> {
    this.setLoading(true);
    this.clearError();

    // Validar cantidad
    if (!this.validarCantidad(cantidad)) {
      return throwError(() => new Error('Cantidad inválida'));
    }

    const data = { cantidad };

    return this.http
      .post<ApiResponse<DetallePedidoAvanzado>>(
        `${this.apiUrl}/${id}/update-cantidad`,
        data
      )
      .pipe(
        map((response) => response.data),
        tap((detalleActualizado) => {
          // Actualizar en lista local
          const currentDetalles = this.detallesSubject.value;
          const index = currentDetalles.findIndex((d) => d.id === id);
          if (index !== -1) {
            currentDetalles[index] = detalleActualizado;
            this.detallesSubject.next([...currentDetalles]);
          }
        }),
        catchError((error) =>
          this.handleError(
            `Error al actualizar cantidad del detalle ${id}`,
            error
          )
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Actualización masiva de detalles
   */
  updateMasivo(
    data: UpdateMasivoDetallePedido
  ): Observable<DetallePedidoAvanzado[]> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .put<ApiResponse<DetallePedidoAvanzado[]>>(
        `${this.apiUrl}/update-masivo`,
        data
      )
      .pipe(
        map((response) => response.data),
        tap((detallesActualizados) => {
          // Actualizar lista local
          const currentDetalles = this.detallesSubject.value;
          detallesActualizados.forEach((detalleActualizado) => {
            const index = currentDetalles.findIndex(
              (d) => d.id === detalleActualizado.id
            );
            if (index !== -1) {
              currentDetalles[index] = detalleActualizado;
            }
          });
          this.detallesSubject.next([...currentDetalles]);
        }),
        catchError((error) =>
          this.handleError('Error en actualización masiva', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Obtiene estadísticas de detalles de pedidos
   */
  getEstadisticas(
    filters?: DetallePedidoFilters
  ): Observable<DetallePedidoEstadisticas> {
    this.setLoading(true);
    this.clearError();

    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<ApiResponse<DetallePedidoEstadisticas>>(
        `${this.apiUrl}/statistics`,
        { params }
      )
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError('Error al obtener estadísticas', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Valida stock disponible para un producto/variación
   */
  validarStock(
    productoId: number,
    variacionId: number | null,
    cantidad: number
  ): Observable<ValidacionStock> {
    this.setLoading(true);
    this.clearError();

    const data = {
      producto_id: productoId,
      variacion_producto_id: variacionId,
      cantidad_solicitada: cantidad,
    };

    return this.http
      .post<ApiResponse<ValidacionStock>>(`${this.apiUrl}/validar-stock`, data)
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError('Error al validar stock', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Exporta detalles en el formato especificado
   */
  exportarDetalles(config: ExportacionDetalles): Observable<Blob> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .post(`${this.apiUrl}/exportar`, config, {
        responseType: 'blob',
        observe: 'body',
      })
      .pipe(
        catchError((error) =>
          this.handleError('Error al exportar detalles', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  // Métodos de utilidad

  /**
   * Calcula el subtotal de un detalle
   */
  calcularSubtotal(cantidad: number, precioUnitario: number): number {
    if (
      !this.validarCantidad(cantidad) ||
      !this.validarPrecio(precioUnitario)
    ) {
      return 0;
    }
    return Number(
      (cantidad * precioUnitario).toFixed(
        DETALLE_PEDIDO_CONSTANTS.DECIMALES_PRECIO
      )
    );
  }

  /**
   * Calcula el impuesto de un detalle
   */
  calcularImpuesto(subtotal: number, descuento: number = 0): number {
    const base = subtotal - descuento;
    const impuesto = base * (DETALLE_PEDIDO_CONSTANTS.IMPUESTO_IGV_PERU / 100);
    return Number(impuesto.toFixed(DETALLE_PEDIDO_CONSTANTS.DECIMALES_PRECIO));
  }

  /**
   * Calcula el total de un detalle
   */
  calcularTotal(
    subtotal: number,
    descuento: number = 0,
    impuesto: number = 0
  ): number {
    const total = subtotal - descuento + impuesto;
    return Number(total.toFixed(DETALLE_PEDIDO_CONSTANTS.DECIMALES_PRECIO));
  }

  /**
   * Calcula todos los valores de un detalle
   */
  calcularDetalle(
    cantidad: number,
    precioUnitario: number,
    descuento: number = 0
  ): DetallePedidoCalculos {
    const subtotal = this.calcularSubtotal(cantidad, precioUnitario);
    const impuesto = this.calcularImpuesto(subtotal, descuento);
    const total = this.calcularTotal(subtotal, descuento, impuesto);

    const porcentajeDescuento = subtotal > 0 ? (descuento / subtotal) * 100 : 0;
    const porcentajeImpuesto = DETALLE_PEDIDO_CONSTANTS.IMPUESTO_IGV_PERU;

    return {
      subtotal,
      descuento,
      impuesto,
      total,
      porcentaje_descuento: Number(porcentajeDescuento.toFixed(2)),
      porcentaje_impuesto: porcentajeImpuesto,
    };
  }

  /**
   * Calcula resumen de múltiples detalles
   */
  calcularResumen(detalles: DetallePedidoAvanzado[]): ResumenDetallePedido {
    const resumen = detalles.reduce(
      (acc, detalle) => {
        acc.total_items += 1;
        acc.cantidad_total += detalle.cantidad;
        acc.subtotal_total += detalle.subtotal;
        acc.descuento_total += detalle.descuento;
        acc.impuesto_total += detalle.impuesto;
        acc.total_general += detalle.total;

        // Contar productos únicos
        if (
          detalle.producto_id &&
          !acc.productos_unicos_set.has(detalle.producto_id)
        ) {
          acc.productos_unicos_set.add(detalle.producto_id);
          acc.productos_unicos += 1;
        }

        // Contar variaciones únicas
        if (
          detalle.variacion_producto_id &&
          !acc.variaciones_unicas_set.has(detalle.variacion_producto_id)
        ) {
          acc.variaciones_unicas_set.add(detalle.variacion_producto_id);
          acc.variaciones_unicas += 1;
        }

        return acc;
      },
      {
        total_items: 0,
        cantidad_total: 0,
        subtotal_total: 0,
        descuento_total: 0,
        impuesto_total: 0,
        total_general: 0,
        productos_unicos: 0,
        variaciones_unicas: 0,
        productos_unicos_set: new Set<number>(),
        variaciones_unicas_set: new Set<number>(),
      }
    );

    // Remover sets auxiliares del resultado
    const { productos_unicos_set, variaciones_unicas_set, ...resultado } =
      resumen;

    return resultado;
  }

  // Métodos de validación

  /**
   * Valida los datos para crear un detalle
   */
  private validarDatosCreacion(data: CreateDetallePedidoAvanzadoDto): boolean {
    if (!data.pedido_id || data.pedido_id <= 0) {
      this.setError('ID de pedido inválido');
      return false;
    }

    if (!data.producto_id && !data.variacion_producto_id) {
      this.setError('Debe especificar un producto o variación');
      return false;
    }

    if (!this.validarCantidad(data.cantidad)) {
      this.setError('Cantidad inválida');
      return false;
    }

    if (
      data.precio_unitario !== undefined &&
      !this.validarPrecio(data.precio_unitario)
    ) {
      this.setError('Precio unitario inválido');
      return false;
    }

    return true;
  }

  /**
   * Valida una cantidad
   */
  validarCantidad(cantidad: number): boolean {
    return (
      cantidad >= DETALLE_PEDIDO_CONSTANTS.CANTIDAD_MINIMA &&
      cantidad <= DETALLE_PEDIDO_CONSTANTS.CANTIDAD_MAXIMA &&
      Number.isInteger(cantidad)
    );
  }

  /**
   * Valida un precio
   */
  validarPrecio(precio: number): boolean {
    return (
      precio >= DETALLE_PEDIDO_CONSTANTS.PRECIO_MINIMO &&
      precio <= DETALLE_PEDIDO_CONSTANTS.PRECIO_MAXIMO &&
      precio > 0
    );
  }

  // Métodos de gestión de estado

  /**
   * Establece el estado de carga
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Establece un error
   */
  private setError(error: string): void {
    this.errorSubject.next(error);
  }

  /**
   * Limpia el error actual
   */
  private clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Maneja errores de HTTP
   */
  private handleError(message: string, error: any): Observable<never> {
    console.error(message, error);

    let errorMessage = message;
    if (error?.error?.message) {
      errorMessage = `${message}: ${error.error.message}`;
    } else if (error?.message) {
      errorMessage = `${message}: ${error.message}`;
    }

    this.setError(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Limpia el estado del servicio
   */
  clearState(): void {
    this.detallesSubject.next([]);
    this.clearError();
    this.setLoading(false);
  }

  /**
   * Refresca los datos actuales
   */
  refresh(
    filters?: DetallePedidoFilters
  ): Observable<DetallePedidoPaginatedResponse> {
    return this.getDetalles(filters);
  }
}
