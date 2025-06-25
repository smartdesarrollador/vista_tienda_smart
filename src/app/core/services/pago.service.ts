import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  PagoAvanzado,
  MetodoPagoAvanzado,
  EstadoPagoAvanzado,
  CreatePagoDto,
  UpdatePagoDto,
  PagoFilters,
  PagoEstadisticas,
  ProcesarPagoRequest,
  ProcesarPagoResponse,
  ReembolsoRequest,
  ReembolsoResponse,
  ConfiguracionMetodoPago,
  ConciliacionPago,
  NotificacionPago,
  AuditoriaPago,
  PagoPaginatedResponse,
  PAGO_CONSTANTS,
  PagoUtils,
  ApiResponse,
} from '../models';

/**
 * Servicio para gestión completa de pagos
 * Maneja la comunicación con la API Laravel para operaciones CRUD,
 * procesamiento de pagos, reembolsos y funcionalidades especializadas
 */
@Injectable({
  providedIn: 'root',
})
export class PagoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/pagos`;

  // Estado reactivo para pagos
  private pagosSubject = new BehaviorSubject<PagoAvanzado[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private processingSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos
  public readonly pagos$ = this.pagosSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();
  public readonly processing$ = this.processingSubject.asObservable();

  /**
   * Obtiene lista paginada de pagos con filtros
   */
  getPagos(filters?: PagoFilters): Observable<PagoPaginatedResponse> {
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
      .get<ApiResponse<PagoPaginatedResponse>>(this.apiUrl, { params })
      .pipe(
        map((response) => response.data),
        tap((data) => {
          if (data.data) {
            this.pagosSubject.next(data.data);
          }
        }),
        catchError((error) =>
          this.handleError('Error al obtener pagos', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Obtiene un pago específico por ID
   */
  getPago(id: number): Observable<PagoAvanzado> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .get<ApiResponse<PagoAvanzado>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError(`Error al obtener pago ${id}`, error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Crea un nuevo pago
   */
  createPago(data: CreatePagoDto): Observable<PagoAvanzado> {
    this.setLoading(true);
    this.clearError();

    // Validaciones antes de enviar
    if (!this.validarDatosCreacion(data)) {
      return throwError(() => new Error('Datos de creación inválidos'));
    }

    return this.http.post<ApiResponse<PagoAvanzado>>(this.apiUrl, data).pipe(
      map((response) => response.data),
      tap((pago) => {
        // Actualizar lista local
        const currentPagos = this.pagosSubject.value;
        this.pagosSubject.next([...currentPagos, pago]);
      }),
      catchError((error) => this.handleError('Error al crear pago', error)),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Actualiza un pago existente
   */
  updatePago(id: number, data: UpdatePagoDto): Observable<PagoAvanzado> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .put<ApiResponse<PagoAvanzado>>(`${this.apiUrl}/${id}`, data)
      .pipe(
        map((response) => response.data),
        tap((pagoActualizado) => {
          // Actualizar en lista local
          const currentPagos = this.pagosSubject.value;
          const index = currentPagos.findIndex((p) => p.id === id);
          if (index !== -1) {
            currentPagos[index] = pagoActualizado;
            this.pagosSubject.next([...currentPagos]);
          }
        }),
        catchError((error) =>
          this.handleError(`Error al actualizar pago ${id}`, error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Elimina un pago
   */
  deletePago(id: number): Observable<void> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0),
      tap(() => {
        // Remover de lista local
        const currentPagos = this.pagosSubject.value;
        const filteredPagos = currentPagos.filter((p) => p.id !== id);
        this.pagosSubject.next(filteredPagos);
      }),
      catchError((error) =>
        this.handleError(`Error al eliminar pago ${id}`, error)
      ),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Obtiene pagos de un pedido específico
   */
  getPagosByPedido(pedidoId: number): Observable<PagoAvanzado[]> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .get<ApiResponse<PagoAvanzado[]>>(`${this.apiUrl}/pedido/${pedidoId}`)
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError(
            `Error al obtener pagos del pedido ${pedidoId}`,
            error
          )
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Procesa un pago
   */
  procesarPago(request: ProcesarPagoRequest): Observable<ProcesarPagoResponse> {
    this.setProcessing(true);
    this.clearError();

    return this.http
      .post<ApiResponse<ProcesarPagoResponse>>(
        `${this.apiUrl}/procesar`,
        request
      )
      .pipe(
        map((response) => response.data),
        tap((response) => {
          if (response.success && response.pago) {
            // Actualizar pago en lista local
            const currentPagos = this.pagosSubject.value;
            const index = currentPagos.findIndex(
              (p) => p.id === response.pago.id
            );
            if (index !== -1) {
              currentPagos[index] = response.pago;
              this.pagosSubject.next([...currentPagos]);
            }
          }
        }),
        catchError((error) =>
          this.handleError('Error al procesar pago', error)
        ),
        finalize(() => this.setProcessing(false))
      );
  }

  /**
   * Cancela un pago
   */
  cancelarPago(id: number, motivo: string): Observable<PagoAvanzado> {
    this.setLoading(true);
    this.clearError();

    const data = { motivo, estado: EstadoPagoAvanzado.CANCELADO };

    return this.http
      .post<ApiResponse<PagoAvanzado>>(`${this.apiUrl}/${id}/cancelar`, data)
      .pipe(
        map((response) => response.data),
        tap((pagoCancelado) => {
          // Actualizar en lista local
          const currentPagos = this.pagosSubject.value;
          const index = currentPagos.findIndex((p) => p.id === id);
          if (index !== -1) {
            currentPagos[index] = pagoCancelado;
            this.pagosSubject.next([...currentPagos]);
          }
        }),
        catchError((error) =>
          this.handleError(`Error al cancelar pago ${id}`, error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Procesa un reembolso
   */
  reembolsarPago(request: ReembolsoRequest): Observable<ReembolsoResponse> {
    this.setProcessing(true);
    this.clearError();

    // Validar que el pago puede ser reembolsado
    if (
      request.monto_reembolso &&
      !this.validarMonto(request.monto_reembolso)
    ) {
      return throwError(() => new Error('Monto de reembolso inválido'));
    }

    return this.http
      .post<ApiResponse<ReembolsoResponse>>(
        `${this.apiUrl}/reembolsar`,
        request
      )
      .pipe(
        map((response) => response.data),
        tap((response) => {
          if (response.success) {
            // Actualizar estado del pago en lista local
            const currentPagos = this.pagosSubject.value;
            const index = currentPagos.findIndex(
              (p) => p.id === request.pago_id
            );
            if (index !== -1) {
              currentPagos[index].estado =
                request.tipo_reembolso === 'total'
                  ? EstadoPagoAvanzado.REEMBOLSADO
                  : EstadoPagoAvanzado.PARCIALMENTE_REEMBOLSADO;
              this.pagosSubject.next([...currentPagos]);
            }
          }
        }),
        catchError((error) =>
          this.handleError('Error al procesar reembolso', error)
        ),
        finalize(() => this.setProcessing(false))
      );
  }

  /**
   * Obtiene estadísticas de pagos
   */
  getEstadisticas(filters?: PagoFilters): Observable<PagoEstadisticas> {
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
      .get<ApiResponse<PagoEstadisticas>>(`${this.apiUrl}/statistics`, {
        params,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError('Error al obtener estadísticas de pagos', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Obtiene configuración de métodos de pago
   */
  getConfiguracionMetodos(): Observable<ConfiguracionMetodoPago[]> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .get<ApiResponse<ConfiguracionMetodoPago[]>>(
        `${this.apiUrl}/configuracion-metodos`
      )
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError('Error al obtener configuración de métodos', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Actualiza configuración de un método de pago
   */
  updateConfiguracionMetodo(
    metodo: MetodoPagoAvanzado,
    config: Partial<ConfiguracionMetodoPago>
  ): Observable<ConfiguracionMetodoPago> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .put<ApiResponse<ConfiguracionMetodoPago>>(
        `${this.apiUrl}/configuracion-metodos/${metodo}`,
        config
      )
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError(
            `Error al actualizar configuración de ${metodo}`,
            error
          )
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Obtiene datos de conciliación
   */
  getConciliacion(fecha: string): Observable<ConciliacionPago> {
    this.setLoading(true);
    this.clearError();

    const params = new HttpParams().set('fecha', fecha);

    return this.http
      .get<ApiResponse<ConciliacionPago>>(`${this.apiUrl}/conciliacion`, {
        params,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError('Error al obtener conciliación', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Envía notificación de pago
   */
  enviarNotificacion(notificacion: NotificacionPago): Observable<boolean> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .post<ApiResponse<{ success: boolean }>>(
        `${this.apiUrl}/notificar`,
        notificacion
      )
      .pipe(
        map((response) => response.data.success),
        catchError((error) =>
          this.handleError('Error al enviar notificación', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Obtiene auditoría de un pago
   */
  getAuditoria(pagoId: number): Observable<AuditoriaPago[]> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .get<ApiResponse<AuditoriaPago[]>>(`${this.apiUrl}/${pagoId}/auditoria`)
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError(
            `Error al obtener auditoría del pago ${pagoId}`,
            error
          )
        ),
        finalize(() => this.setLoading(false))
      );
  }

  // Métodos de utilidad

  /**
   * Obtiene lista de métodos de pago disponibles
   */
  getMetodosPago(): MetodoPagoAvanzado[] {
    return Object.values(MetodoPagoAvanzado);
  }

  /**
   * Obtiene lista de estados de pago
   */
  getEstadosPago(): EstadoPagoAvanzado[] {
    return Object.values(EstadoPagoAvanzado);
  }

  /**
   * Obtiene métodos de pago que requieren autorización
   */
  getMetodosRequierenAutorizacion(): MetodoPagoAvanzado[] {
    return this.getMetodosPago().filter((metodo) =>
      PagoUtils.requiereAutorizacion(metodo)
    );
  }

  /**
   * Obtiene métodos de pago instantáneos
   */
  getMetodosInstantaneos(): MetodoPagoAvanzado[] {
    return this.getMetodosPago().filter((metodo) =>
      PagoUtils.esInstantaneo(metodo)
    );
  }

  /**
   * Calcula comisión de un pago
   */
  calcularComision(
    monto: number,
    metodo: MetodoPagoAvanzado,
    configuracion?: ConfiguracionMetodoPago
  ): number {
    if (configuracion) {
      const porcentaje = configuracion.comision_porcentaje || 0;
      const fija = configuracion.comision_fija || 0;
      return PagoUtils.calcularComision(monto, porcentaje, fija);
    }

    // Comisiones por defecto si no hay configuración
    const comisionesPorDefecto: Record<
      MetodoPagoAvanzado,
      { porcentaje: number; fija: number }
    > = {
      [MetodoPagoAvanzado.EFECTIVO]: { porcentaje: 0, fija: 0 },
      [MetodoPagoAvanzado.TARJETA_CREDITO]: { porcentaje: 3.5, fija: 0 },
      [MetodoPagoAvanzado.TARJETA_DEBITO]: { porcentaje: 2.5, fija: 0 },
      [MetodoPagoAvanzado.TRANSFERENCIA_BANCARIA]: { porcentaje: 0.5, fija: 2 },
      [MetodoPagoAvanzado.DEPOSITO_BANCARIO]: { porcentaje: 0.3, fija: 1 },
      [MetodoPagoAvanzado.YAPE]: { porcentaje: 1.5, fija: 0 },
      [MetodoPagoAvanzado.PLIN]: { porcentaje: 1.5, fija: 0 },
      [MetodoPagoAvanzado.PAYPAL]: { porcentaje: 4.0, fija: 0.5 },
      [MetodoPagoAvanzado.MERCADO_PAGO]: { porcentaje: 3.8, fija: 0 },
      [MetodoPagoAvanzado.VISA_NET]: { porcentaje: 3.2, fija: 0 },
      [MetodoPagoAvanzado.MASTERCARD]: { porcentaje: 3.2, fija: 0 },
      [MetodoPagoAvanzado.AMERICAN_EXPRESS]: { porcentaje: 4.5, fija: 0 },
      [MetodoPagoAvanzado.DINERS_CLUB]: { porcentaje: 4.0, fija: 0 },
      [MetodoPagoAvanzado.CREDITO_TIENDA]: { porcentaje: 0, fija: 0 },
      [MetodoPagoAvanzado.BITCOIN]: { porcentaje: 2.0, fija: 0 },
      [MetodoPagoAvanzado.OTROS]: { porcentaje: 2.0, fija: 0 },
    };

    const config = comisionesPorDefecto[metodo];
    return PagoUtils.calcularComision(monto, config.porcentaje, config.fija);
  }

  /**
   * Formatea monto según la moneda
   */
  formatearMonto(monto: number, moneda: 'PEN' | 'USD' | 'EUR'): string {
    return PagoUtils.formatearMonto(monto, moneda);
  }

  /**
   * Genera referencia de transacción
   */
  generarReferencia(metodo: MetodoPagoAvanzado, pagoId?: number): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const metodoCodigo = metodo.substring(0, 3).toUpperCase();
    const id = pagoId ? pagoId.toString().padStart(6, '0') : '000000';

    return `${metodoCodigo}-${id}-${timestamp}-${random}`;
  }

  // Métodos de validación

  /**
   * Verifica si un pago puede ser reembolsado
   */
  puedeReembolsar(pago: PagoAvanzado): boolean {
    const estadosReembolsables = [
      EstadoPagoAvanzado.COMPLETADO,
      EstadoPagoAvanzado.PAGADO,
      EstadoPagoAvanzado.PARCIALMENTE_REEMBOLSADO,
    ];

    return estadosReembolsables.includes(pago.estado) && pago.monto > 0;
  }

  /**
   * Verifica si un pago puede ser cancelado
   */
  puedeCancelar(pago: PagoAvanzado): boolean {
    const estadosCancelables = [
      EstadoPagoAvanzado.PENDIENTE,
      EstadoPagoAvanzado.PROCESANDO,
      EstadoPagoAvanzado.AUTORIZADO,
    ];

    return estadosCancelables.includes(pago.estado);
  }

  /**
   * Valida los datos para crear un pago
   */
  private validarDatosCreacion(data: CreatePagoDto): boolean {
    if (!data.pedido_id || data.pedido_id <= 0) {
      this.setError('ID de pedido inválido');
      return false;
    }

    if (!Object.values(MetodoPagoAvanzado).includes(data.metodo_pago)) {
      this.setError('Método de pago inválido');
      return false;
    }

    if (!this.validarMonto(data.monto)) {
      this.setError('Monto inválido');
      return false;
    }

    if (!['PEN', 'USD', 'EUR'].includes(data.moneda)) {
      this.setError('Moneda inválida');
      return false;
    }

    return true;
  }

  /**
   * Valida un monto
   */
  validarMonto(monto: number): boolean {
    return (
      monto >= PAGO_CONSTANTS.MONTO_MINIMO &&
      monto <= PAGO_CONSTANTS.MONTO_MAXIMO &&
      monto > 0 &&
      !isNaN(monto)
    );
  }

  /**
   * Formatea referencia según el método de pago
   */
  formatearReferencia(metodo: MetodoPagoAvanzado, referencia: string): string {
    if (!referencia) return '';

    switch (metodo) {
      case MetodoPagoAvanzado.TARJETA_CREDITO:
      case MetodoPagoAvanzado.TARJETA_DEBITO:
        // Enmascarar número de tarjeta
        return referencia.replace(/(\d{4})\d{8}(\d{4})/, '$1****$2');

      case MetodoPagoAvanzado.TRANSFERENCIA_BANCARIA:
        // Formato de número de operación
        return referencia.toUpperCase();

      case MetodoPagoAvanzado.YAPE:
      case MetodoPagoAvanzado.PLIN:
        // Enmascarar número de teléfono
        return referencia.replace(/(\d{3})\d{3}(\d{3})/, '$1***$2');

      default:
        return referencia;
    }
  }

  // Métodos de gestión de estado

  /**
   * Establece el estado de carga
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Establece el estado de procesamiento
   */
  private setProcessing(processing: boolean): void {
    this.processingSubject.next(processing);
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
    this.pagosSubject.next([]);
    this.clearError();
    this.setLoading(false);
    this.setProcessing(false);
  }

  /**
   * Refresca los datos actuales
   */
  refresh(filters?: PagoFilters): Observable<PagoPaginatedResponse> {
    return this.getPagos(filters);
  }
}
