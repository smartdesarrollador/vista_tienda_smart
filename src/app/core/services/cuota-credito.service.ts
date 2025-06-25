import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  CuotaCreditoAvanzada,
  EstadoCuotaAvanzada,
  CreateCuotaCreditoDto,
  UpdateCuotaCreditoDto,
  CuotaCreditoFilters,
  CuotaCreditoEstadisticas,
  CronogramaPagos,
  SimulacionCredito,
  PagoCuotaRequest,
  PagoCuotaResponse,
  RefinanciamientoRequest,
  CondonacionRequest,
  CalculoMora,
  ConfiguracionCredito,
  EvaluacionCrediticia,
  NotificacionCuota,
  ReporteCartera,
  CuotaCreditoPaginatedResponse,
  CUOTA_CREDITO_CONSTANTS,
  CuotaCreditoUtils,
  ApiResponse,
} from '../models';

/**
 * Servicio para gestión completa de cuotas de crédito
 * Maneja la comunicación con la API Laravel para operaciones CRUD,
 * cálculos financieros, cronogramas de pago y funcionalidades especializadas
 */
@Injectable({
  providedIn: 'root',
})
export class CuotaCreditoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vista/cuotas-credito`;

  // Estado reactivo para cuotas de crédito
  private cuotasSubject = new BehaviorSubject<CuotaCreditoAvanzada[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private processingSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos
  public readonly cuotas$ = this.cuotasSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();
  public readonly processing$ = this.processingSubject.asObservable();

  /**
   * Obtiene lista paginada de cuotas de crédito con filtros
   */
  getCuotas(
    filters?: CuotaCreditoFilters
  ): Observable<CuotaCreditoPaginatedResponse> {
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
      .get<ApiResponse<CuotaCreditoPaginatedResponse>>(this.apiUrl, { params })
      .pipe(
        map((response) => response.data),
        tap((data) => {
          if (data.data) {
            this.cuotasSubject.next(data.data);
          }
        }),
        catchError((error) =>
          this.handleError('Error al obtener cuotas de crédito', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Obtiene una cuota de crédito específica por ID
   */
  getCuota(id: number): Observable<CuotaCreditoAvanzada> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .get<ApiResponse<CuotaCreditoAvanzada>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError(`Error al obtener cuota de crédito ${id}`, error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Crea una nueva cuota de crédito
   */
  createCuota(data: CreateCuotaCreditoDto): Observable<CuotaCreditoAvanzada> {
    this.setLoading(true);
    this.clearError();

    // Validaciones antes de enviar
    if (!this.validarDatosCreacion(data)) {
      return throwError(() => new Error('Datos de creación inválidos'));
    }

    return this.http
      .post<ApiResponse<CuotaCreditoAvanzada>>(this.apiUrl, data)
      .pipe(
        map((response) => response.data),
        tap((cuota) => {
          // Actualizar lista local
          const currentCuotas = this.cuotasSubject.value;
          this.cuotasSubject.next([...currentCuotas, cuota]);
        }),
        catchError((error) =>
          this.handleError('Error al crear cuota de crédito', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Actualiza una cuota de crédito existente
   */
  updateCuota(
    id: number,
    data: UpdateCuotaCreditoDto
  ): Observable<CuotaCreditoAvanzada> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .put<ApiResponse<CuotaCreditoAvanzada>>(`${this.apiUrl}/${id}`, data)
      .pipe(
        map((response) => response.data),
        tap((cuotaActualizada) => {
          // Actualizar en lista local
          const currentCuotas = this.cuotasSubject.value;
          const index = currentCuotas.findIndex((c) => c.id === id);
          if (index !== -1) {
            currentCuotas[index] = cuotaActualizada;
            this.cuotasSubject.next([...currentCuotas]);
          }
        }),
        catchError((error) =>
          this.handleError(`Error al actualizar cuota ${id}`, error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Elimina una cuota de crédito
   */
  deleteCuota(id: number): Observable<void> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0),
      tap(() => {
        // Remover de lista local
        const currentCuotas = this.cuotasSubject.value;
        const filteredCuotas = currentCuotas.filter((c) => c.id !== id);
        this.cuotasSubject.next(filteredCuotas);
      }),
      catchError((error) =>
        this.handleError(`Error al eliminar cuota ${id}`, error)
      ),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Obtiene cuotas de un pedido específico
   */
  getCuotasByPedido(pedidoId: number): Observable<CuotaCreditoAvanzada[]> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .get<ApiResponse<CuotaCreditoAvanzada[]>>(
        `${this.apiUrl}/pedido/${pedidoId}`
      )
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError(
            `Error al obtener cuotas del pedido ${pedidoId}`,
            error
          )
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Procesa el pago de una cuota
   */
  pagarCuota(request: PagoCuotaRequest): Observable<PagoCuotaResponse> {
    this.setProcessing(true);
    this.clearError();

    // Validaciones antes de procesar
    if (!this.validarMonto(request.monto_pago)) {
      return throwError(() => new Error('Monto de pago inválido'));
    }

    return this.http
      .post<ApiResponse<PagoCuotaResponse>>(`${this.apiUrl}/pagar`, request)
      .pipe(
        map((response) => response.data),
        tap((response) => {
          if (response.success && response.cuota) {
            // Actualizar cuota en lista local
            const currentCuotas = this.cuotasSubject.value;
            const index = currentCuotas.findIndex(
              (c) => c.id === response.cuota.id
            );
            if (index !== -1) {
              currentCuotas[index] = response.cuota;
              this.cuotasSubject.next([...currentCuotas]);
            }
          }
        }),
        catchError((error) =>
          this.handleError('Error al procesar pago de cuota', error)
        ),
        finalize(() => this.setProcessing(false))
      );
  }

  /**
   * Calcula la mora de una cuota
   */
  calcularMora(id: number): Observable<CalculoMora> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .post<ApiResponse<CalculoMora>>(`${this.apiUrl}/${id}/calcular-mora`, {})
      .pipe(
        map((response) => response.data),
        tap((calculoMora) => {
          // Actualizar cuota con nueva mora en lista local
          const currentCuotas = this.cuotasSubject.value;
          const index = currentCuotas.findIndex((c) => c.id === id);
          if (index !== -1) {
            currentCuotas[index].monto_mora = calculoMora.monto_mora_acumulado;
            currentCuotas[index].dias_mora = calculoMora.dias_mora;
            this.cuotasSubject.next([...currentCuotas]);
          }
        }),
        catchError((error) =>
          this.handleError(`Error al calcular mora de cuota ${id}`, error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Obtiene cuotas vencidas
   */
  getCuotasVencidas(): Observable<CuotaCreditoAvanzada[]> {
    this.setLoading(true);
    this.clearError();

    const filters: CuotaCreditoFilters = {
      solo_vencidas: true,
      estado: EstadoCuotaAvanzada.VENCIDA,
    };

    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<ApiResponse<CuotaCreditoAvanzada[]>>(`${this.apiUrl}/vencidas`, {
        params,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError('Error al obtener cuotas vencidas', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Obtiene estadísticas de cuotas de crédito
   */
  getEstadisticas(
    filters?: CuotaCreditoFilters
  ): Observable<CuotaCreditoEstadisticas> {
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
      .get<ApiResponse<CuotaCreditoEstadisticas>>(`${this.apiUrl}/statistics`, {
        params,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError('Error al obtener estadísticas de cuotas', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Genera cronograma de pagos
   */
  generarCronograma(
    simulacion: Omit<SimulacionCredito, 'resultado'>
  ): Observable<CronogramaPagos> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .post<ApiResponse<CronogramaPagos>>(
        `${this.apiUrl}/cronograma`,
        simulacion
      )
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError('Error al generar cronograma', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Simula un crédito
   */
  simularCredito(
    simulacion: Omit<SimulacionCredito, 'resultado'>
  ): Observable<SimulacionCredito> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .post<ApiResponse<SimulacionCredito>>(
        `${this.apiUrl}/simular`,
        simulacion
      )
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError('Error al simular crédito', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Procesa refinanciamiento de cuotas
   */
  refinanciar(
    request: RefinanciamientoRequest
  ): Observable<CuotaCreditoAvanzada[]> {
    this.setProcessing(true);
    this.clearError();

    return this.http
      .post<ApiResponse<CuotaCreditoAvanzada[]>>(
        `${this.apiUrl}/refinanciar`,
        request
      )
      .pipe(
        map((response) => response.data),
        tap((cuotasRefinanciadas) => {
          // Actualizar cuotas refinanciadas en lista local
          const currentCuotas = this.cuotasSubject.value;
          cuotasRefinanciadas.forEach((cuotaRefinanciada) => {
            const index = currentCuotas.findIndex(
              (c) => c.id === cuotaRefinanciada.id
            );
            if (index !== -1) {
              currentCuotas[index] = cuotaRefinanciada;
            }
          });
          this.cuotasSubject.next([...currentCuotas]);
        }),
        catchError((error) =>
          this.handleError('Error al refinanciar cuotas', error)
        ),
        finalize(() => this.setProcessing(false))
      );
  }

  /**
   * Procesa condonación de deuda
   */
  condonar(request: CondonacionRequest): Observable<CuotaCreditoAvanzada[]> {
    this.setProcessing(true);
    this.clearError();

    return this.http
      .post<ApiResponse<CuotaCreditoAvanzada[]>>(
        `${this.apiUrl}/condonar`,
        request
      )
      .pipe(
        map((response) => response.data),
        tap((cuotasCondonadas) => {
          // Actualizar cuotas condonadas en lista local
          const currentCuotas = this.cuotasSubject.value;
          cuotasCondonadas.forEach((cuotaCondonada) => {
            const index = currentCuotas.findIndex(
              (c) => c.id === cuotaCondonada.id
            );
            if (index !== -1) {
              currentCuotas[index] = cuotaCondonada;
            }
          });
          this.cuotasSubject.next([...currentCuotas]);
        }),
        catchError((error) =>
          this.handleError('Error al condonar cuotas', error)
        ),
        finalize(() => this.setProcessing(false))
      );
  }

  /**
   * Obtiene configuración de crédito
   */
  getConfiguracion(): Observable<ConfiguracionCredito> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .get<ApiResponse<ConfiguracionCredito>>(`${this.apiUrl}/configuracion`)
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError('Error al obtener configuración de crédito', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Actualiza configuración de crédito
   */
  updateConfiguracion(
    config: Partial<ConfiguracionCredito>
  ): Observable<ConfiguracionCredito> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .put<ApiResponse<ConfiguracionCredito>>(
        `${this.apiUrl}/configuracion`,
        config
      )
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError('Error al actualizar configuración', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Evalúa capacidad crediticia de un usuario
   */
  evaluarCredito(
    usuarioId: number,
    montoSolicitado: number,
    numeroCuotas: number
  ): Observable<EvaluacionCrediticia> {
    this.setLoading(true);
    this.clearError();

    const data = {
      usuario_id: usuarioId,
      monto_solicitado: montoSolicitado,
      numero_cuotas: numeroCuotas,
    };

    return this.http
      .post<ApiResponse<EvaluacionCrediticia>>(
        `${this.apiUrl}/evaluar-credito`,
        data
      )
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError('Error al evaluar crédito', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Programa notificación de cuota
   */
  programarNotificacion(notificacion: NotificacionCuota): Observable<boolean> {
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
          this.handleError('Error al programar notificación', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  /**
   * Obtiene reporte de cartera
   */
  getReporteCartera(fechaCorte: string): Observable<ReporteCartera> {
    this.setLoading(true);
    this.clearError();

    const params = new HttpParams().set('fecha_corte', fechaCorte);

    return this.http
      .get<ApiResponse<ReporteCartera>>(`${this.apiUrl}/reporte-cartera`, {
        params,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          this.handleError('Error al obtener reporte de cartera', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  // Métodos de utilidad

  /**
   * Calcula días de mora entre fechas
   */
  calcularDiasMora(fechaVencimiento: string, fechaActual?: string): number {
    return CuotaCreditoUtils.calcularDiasMora(fechaVencimiento, fechaActual);
  }

  /**
   * Calcula monto de mora
   */
  calcularMontoMora(
    montoBase: number,
    diasMora: number,
    tasaMoraDiaria: number = CUOTA_CREDITO_CONSTANTS.TASA_MORA_DIARIA_DEFAULT
  ): number {
    return CuotaCreditoUtils.calcularMontoMora(
      montoBase,
      diasMora,
      tasaMoraDiaria
    );
  }

  /**
   * Calcula cuota mensual usando método francés
   */
  calcularCuotaFrances(
    monto: number,
    tasaAnual: number,
    numeroCuotas: number
  ): number {
    const tasaMensual = tasaAnual / 100 / 12;
    return CuotaCreditoUtils.calcularCuotaFrances(
      monto,
      tasaMensual,
      numeroCuotas
    );
  }

  /**
   * Genera cronograma de pagos local
   */
  generarCronogramaPagos(
    monto: number,
    cuotas: number,
    tasaAnual: number,
    fechaInicio: string = new Date().toISOString()
  ): CronogramaPagos {
    const tasaMensual = tasaAnual / 100 / 12;
    const cuotaMensual = this.calcularCuotaFrances(monto, tasaAnual, cuotas);

    const cronograma: CronogramaPagos = {
      pedido_id: 0, // Se asignará cuando se use
      monto_total: monto,
      numero_cuotas: cuotas,
      tasa_interes_anual: tasaAnual,
      tasa_interes_mensual: tasaMensual * 100,
      metodo_calculo: 'frances',
      fecha_primer_vencimiento: fechaInicio,
      cuotas: [],
      resumen: {
        total_a_pagar: cuotaMensual * cuotas,
        total_intereses: cuotaMensual * cuotas - monto,
        cuota_promedio: cuotaMensual,
        tasa_efectiva_anual: Math.pow(1 + tasaMensual, 12) - 1,
      },
    };

    let saldoPendiente = monto;
    const fechaBase = new Date(fechaInicio);

    for (let i = 1; i <= cuotas; i++) {
      const montoInteres = saldoPendiente * tasaMensual;
      const montoCapital = cuotaMensual - montoInteres;
      saldoPendiente -= montoCapital;

      const fechaVencimiento = new Date(fechaBase);
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);

      cronograma.cuotas.push({
        numero: i,
        fecha_vencimiento: fechaVencimiento.toISOString(),
        monto_cuota: Number(cuotaMensual.toFixed(2)),
        monto_capital: Number(montoCapital.toFixed(2)),
        monto_interes: Number(montoInteres.toFixed(2)),
        saldo_pendiente: Number(Math.max(0, saldoPendiente).toFixed(2)),
      });
    }

    return cronograma;
  }

  /**
   * Formatea monto de cuota
   */
  formatearMonto(monto: number): string {
    return CuotaCreditoUtils.formatearMonto(monto);
  }

  /**
   * Formatea tasa de interés
   */
  formatearTasa(tasa: number): string {
    return CuotaCreditoUtils.formatearTasa(tasa);
  }

  /**
   * Determina el estado de una cuota
   */
  determinarEstado(cuota: Partial<CuotaCreditoAvanzada>): EstadoCuotaAvanzada {
    return CuotaCreditoUtils.determinarEstado(cuota);
  }

  // Métodos de validación

  /**
   * Verifica si una cuota puede ser modificada
   */
  puedeModificar(cuota: CuotaCreditoAvanzada): boolean {
    const estadosModificables = [
      EstadoCuotaAvanzada.PENDIENTE,
      EstadoCuotaAvanzada.VENCIDA,
      EstadoCuotaAvanzada.EN_MORA,
      EstadoCuotaAvanzada.PAGADA_PARCIAL,
    ];

    return estadosModificables.includes(cuota.estado);
  }

  /**
   * Verifica si una cuota puede ser refinanciada
   */
  puedeRefinanciar(cuota: CuotaCreditoAvanzada): boolean {
    return CuotaCreditoUtils.esEstadoActivo(cuota.estado);
  }

  /**
   * Verifica si una cuota puede ser condonada
   */
  puedeCondonar(cuota: CuotaCreditoAvanzada): boolean {
    const estadosCondonables = [
      EstadoCuotaAvanzada.VENCIDA,
      EstadoCuotaAvanzada.EN_MORA,
      EstadoCuotaAvanzada.PAGADA_PARCIAL,
    ];

    return estadosCondonables.includes(cuota.estado);
  }

  /**
   * Valida los datos para crear una cuota
   */
  private validarDatosCreacion(data: CreateCuotaCreditoDto): boolean {
    if (!data.pedido_id || data.pedido_id <= 0) {
      this.setError('ID de pedido inválido');
      return false;
    }

    if (!data.numero_cuota || data.numero_cuota <= 0) {
      this.setError('Número de cuota inválido');
      return false;
    }

    if (!this.validarMonto(data.monto_cuota)) {
      this.setError('Monto de cuota inválido');
      return false;
    }

    if (!this.validarTasa(data.tasa_interes)) {
      this.setError('Tasa de interés inválida');
      return false;
    }

    if (!this.validarFecha(data.fecha_vencimiento)) {
      this.setError('Fecha de vencimiento inválida');
      return false;
    }

    return true;
  }

  /**
   * Valida un monto
   */
  private validarMonto(monto: number): boolean {
    return (
      monto >= CUOTA_CREDITO_CONSTANTS.MONTO_MINIMO_CREDITO &&
      monto <= CUOTA_CREDITO_CONSTANTS.MONTO_MAXIMO_CREDITO &&
      monto > 0 &&
      !isNaN(monto)
    );
  }

  /**
   * Valida una tasa de interés
   */
  private validarTasa(tasa: number): boolean {
    return (
      tasa >= CUOTA_CREDITO_CONSTANTS.TASA_INTERES_MINIMA &&
      tasa <= CUOTA_CREDITO_CONSTANTS.TASA_INTERES_MAXIMA &&
      tasa >= 0 &&
      !isNaN(tasa)
    );
  }

  /**
   * Valida una fecha
   */
  private validarFecha(fecha: string): boolean {
    const fechaObj = new Date(fecha);
    return !isNaN(fechaObj.getTime()) && fechaObj > new Date();
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
    this.cuotasSubject.next([]);
    this.clearError();
    this.setLoading(false);
    this.setProcessing(false);
  }

  /**
   * Refresca los datos actuales
   */
  refresh(
    filters?: CuotaCreditoFilters
  ): Observable<CuotaCreditoPaginatedResponse> {
    return this.getCuotas(filters);
  }
}
