import { Injectable, signal, computed } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import {
  ApiResponse,
  EstadoCheckout,
  SolicitudIniciarCheckout,
  RespuestaIniciarCheckout,
  DatosPersonales,
  DireccionEnvio,
  SolicitudCalcularEnvio,
  MetodoEnvio,
  SolicitudAplicarCupon,
  RespuestaAplicarCupon,
  SolicitudProcesarPedido,
  RespuestaProcesarPedido,
  ResumenCheckout,
  ConfiguracionCheckout,
  MetodoPago,
  FiltrosMetodosPago,
  RespuestaMetodosPago,
  SolicitudValidarMetodoPago,
  RespuestaValidarMetodoPago,
  SolicitudFormTokenIzipay,
  RespuestaFormTokenIzipay,
  SolicitudValidarPagoIzipay,
  RespuestaValidarPagoIzipay,
  ConfiguracionIzipay,
  ItemCheckout,
} from '../models/checkout.interface';

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private readonly apiUrl = `${environment.apiUrl}/checkout`;

  // Estado reactivo del checkout usando signals
  private estadoCheckoutSubject = new BehaviorSubject<EstadoCheckout>({
    paso_actual: 1,
    items: [],
    en_proceso: false,
  });

  // Signal para el estado del checkout
  private estadoCheckoutSignal = signal<EstadoCheckout>({
    paso_actual: 1,
    items: [],
    en_proceso: false,
  });

  // Getters para acceder al estado
  public readonly estadoCheckout$ = this.estadoCheckoutSubject.asObservable();
  public readonly estadoCheckout = this.estadoCheckoutSignal.asReadonly();

  // Computed signals para valores derivados
  public readonly pasoActual = computed(
    () => this.estadoCheckout().paso_actual
  );
  public readonly datosCompletos = computed(() => {
    const estado = this.estadoCheckout();
    return !!(
      estado.datos_personales &&
      estado.direccion_envio &&
      estado.metodo_pago
    );
  });
  public readonly totalItems = computed(
    () => this.estadoCheckout().items.length
  );
  public readonly totalMonto = computed(
    () => this.estadoCheckout().resumen?.total || 0
  );

  // Cache para configuración
  private configuracionCache$?: Observable<ConfiguracionCheckout>;

  constructor(private http: HttpClient) {
    // Sincronizar subject con signal
    this.estadoCheckoutSubject.subscribe((estado) => {
      this.estadoCheckoutSignal.set(estado);
    });
  }

  /**
   * Obtener métodos de pago disponibles
   */
  obtenerMetodosPago(
    filtros?: FiltrosMetodosPago
  ): Observable<RespuestaMetodosPago> {
    let params = new HttpParams();

    if (filtros?.monto) {
      params = params.set('monto', filtros.monto.toString());
    }
    if (filtros?.pais) {
      params = params.set('pais', filtros.pais);
    }
    if (filtros?.moneda) {
      params = params.set('moneda', filtros.moneda);
    }

    return this.http
      .get<ApiResponse<RespuestaMetodosPago>>(`${this.apiUrl}/metodos-pago`, {
        params,
      })
      .pipe(
        map((response) => this.extraerDatos(response)),
        catchError(this.manejarError)
      );
  }

  /**
   * Validar método de pago específico
   */
  validarMetodoPago(
    solicitud: SolicitudValidarMetodoPago
  ): Observable<RespuestaValidarMetodoPago> {
    return this.http
      .post<ApiResponse<RespuestaValidarMetodoPago>>(
        `${this.apiUrl}/validar-metodo-pago`,
        solicitud
      )
      .pipe(
        map((response) => this.extraerDatos(response)),
        catchError(this.manejarError)
      );
  }

  /**
   * Iniciar proceso de checkout
   */
  iniciarCheckout(
    solicitud: SolicitudIniciarCheckout
  ): Observable<RespuestaIniciarCheckout> {
    this.actualizarEstado({ en_proceso: true });

    return this.http
      .post<ApiResponse<RespuestaIniciarCheckout>>(
        `${this.apiUrl}/iniciar`,
        solicitud
      )
      .pipe(
        map((response) => this.extraerDatos(response)),
        tap((data) => {
          this.actualizarEstado({
            items: data.items,
            checkout_token: data.checkout_token,
            en_proceso: false,
          });
        }),
        catchError((error) => {
          this.actualizarEstado({ en_proceso: false });
          return this.manejarError(error);
        })
      );
  }

  /**
   * Validar datos personales
   */
  validarDatosPersonales(datos: DatosPersonales): Observable<DatosPersonales> {
    return this.http
      .post<ApiResponse<DatosPersonales>>(
        `${this.apiUrl}/validar-datos-personales`,
        datos
      )
      .pipe(
        map((response) => this.extraerDatos(response)),
        tap((datosValidados) => {
          this.actualizarEstado({
            datos_personales: datosValidados,
            paso_actual: 2,
          });
        }),
        catchError(this.manejarError)
      );
  }

  /**
   * Validar dirección de envío
   */
  validarDireccionEnvio(direccion: DireccionEnvio): Observable<DireccionEnvio> {
    return this.http
      .post<ApiResponse<DireccionEnvio>>(
        `${this.apiUrl}/validar-direccion-envio`,
        direccion
      )
      .pipe(
        map((response) => this.extraerDatos(response)),
        tap((direccionValidada) => {
          this.actualizarEstado({
            direccion_envio: direccionValidada,
          });
        }),
        catchError(this.manejarError)
      );
  }

  /**
   * Calcular costos de envío
   */
  calcularEnvio(solicitud: SolicitudCalcularEnvio): Observable<{
    metodos_envio: MetodoEnvio[];
    envio_gratis_disponible: boolean;
  }> {
    return this.http
      .post<
        ApiResponse<{
          metodos_envio: MetodoEnvio[];
          envio_gratis_disponible: boolean;
        }>
      >(`${this.apiUrl}/calcular-envio`, solicitud)
      .pipe(
        map((response) => this.extraerDatos(response)),
        catchError(this.manejarError)
      );
  }

  /**
   * Aplicar cupón de descuento
   */
  aplicarCupon(
    solicitud: SolicitudAplicarCupon
  ): Observable<RespuestaAplicarCupon> {
    return this.http
      .post<ApiResponse<RespuestaAplicarCupon>>(
        `${this.apiUrl}/aplicar-cupon`,
        solicitud
      )
      .pipe(
        map((response) => this.extraerDatos(response)),
        catchError(this.manejarError)
      );
  }

  /**
   * Procesar pedido y crear orden
   */
  procesarPedido(
    solicitud: SolicitudProcesarPedido
  ): Observable<RespuestaProcesarPedido> {
    this.actualizarEstado({ en_proceso: true });

    return this.http
      .post<ApiResponse<RespuestaProcesarPedido>>(
        `${this.apiUrl}/procesar-pedido`,
        solicitud
      )
      .pipe(
        map((response) => this.extraerDatos(response)),
        tap((resultado) => {
          this.actualizarEstado({
            paso_actual: 4,
            en_proceso: false,
          });
        }),
        catchError((error) => {
          this.actualizarEstado({ en_proceso: false });
          return this.manejarError(error);
        })
      );
  }

  /**
   * Obtener resumen del checkout
   */
  obtenerResumen(
    items: { producto_id: number; cantidad: number }[],
    cuponCodigo?: string,
    distrito?: string,
    metodoEnvio?: string
  ): Observable<ResumenCheckout> {
    const params = {
      items,
      cupon_codigo: cuponCodigo,
      distrito,
      metodo_envio: metodoEnvio,
    };

    return this.http
      .get<ApiResponse<ResumenCheckout>>(`${this.apiUrl}/resumen`, {
        params: this.convertirAHttpParams(params),
      })
      .pipe(
        map((response) => this.extraerDatos(response)),
        tap((resumen) => {
          this.actualizarEstado({ resumen });
        }),
        catchError(this.manejarError)
      );
  }

  /**
   * Obtener configuración del checkout
   */
  obtenerConfiguracion(): Observable<ConfiguracionCheckout> {
    if (!this.configuracionCache$) {
      this.configuracionCache$ = this.http
        .get<ApiResponse<ConfiguracionCheckout>>(`${this.apiUrl}/configuracion`)
        .pipe(
          map((response) => this.extraerDatos(response)),
          shareReplay(1),
          catchError(this.manejarError)
        );
    }

    return this.configuracionCache$;
  }

  // ===== MÉTODOS DE IZIPAY =====

  /**
   * Generar formToken para Izipay
   */
  generarFormTokenIzipay(
    solicitud: SolicitudFormTokenIzipay
  ): Observable<RespuestaFormTokenIzipay> {
    return this.http
      .post<ApiResponse<RespuestaFormTokenIzipay>>(
        `${this.apiUrl}/izipay/generar-formtoken`,
        solicitud
      )
      .pipe(
        map((response) => this.extraerDatos(response)),
        catchError(this.manejarError)
      );
  }

  /**
   * Validar pago de Izipay
   */
  validarPagoIzipay(
    solicitud: SolicitudValidarPagoIzipay
  ): Observable<RespuestaValidarPagoIzipay> {
    return this.http
      .post<ApiResponse<RespuestaValidarPagoIzipay>>(
        `${this.apiUrl}/izipay/validar-pago`,
        solicitud
      )
      .pipe(
        map((response) => this.extraerDatos(response)),
        catchError(this.manejarError)
      );
  }

  /**
   * Verificar configuración de Izipay
   */
  verificarConfiguracionIzipay(): Observable<ConfiguracionIzipay> {
    return this.http
      .get<ApiResponse<ConfiguracionIzipay>>(
        `${this.apiUrl}/izipay/configuracion`
      )
      .pipe(
        map((response) => this.extraerDatos(response)),
        catchError(this.manejarError)
      );
  }

  // ===== MÉTODOS DE GESTIÓN DE ESTADO =====

  /**
   * Actualizar estado del checkout
   */
  actualizarEstado(cambios: Partial<EstadoCheckout>): void {
    const estadoActual = this.estadoCheckoutSubject.value;
    const nuevoEstado = { ...estadoActual, ...cambios };
    this.estadoCheckoutSubject.next(nuevoEstado);
  }

  /**
   * Avanzar al siguiente paso
   */
  avanzarPaso(): void {
    const pasoActual = this.estadoCheckoutSubject.value.paso_actual;
    if (pasoActual < 4) {
      this.actualizarEstado({ paso_actual: (pasoActual + 1) as 1 | 2 | 3 | 4 });
    }
  }

  /**
   * Retroceder al paso anterior
   */
  retrocederPaso(): void {
    const pasoActual = this.estadoCheckoutSubject.value.paso_actual;
    if (pasoActual > 1) {
      this.actualizarEstado({ paso_actual: (pasoActual - 1) as 1 | 2 | 3 | 4 });
    }
  }

  /**
   * Ir a un paso específico
   */
  irAPaso(paso: 1 | 2 | 3 | 4): void {
    this.actualizarEstado({ paso_actual: paso });
  }

  /**
   * Limpiar estado del checkout
   */
  limpiarEstado(): void {
    const estadoInicial: EstadoCheckout = {
      paso_actual: 1,
      items: [],
      en_proceso: false,
    };
    this.estadoCheckoutSubject.next(estadoInicial);
  }

  /**
   * Establecer items del checkout
   */
  establecerItems(items: ItemCheckout[]): void {
    this.actualizarEstado({ items });
  }

  /**
   * Agregar error al estado
   */
  agregarError(campo: string, mensaje: string): void {
    const estadoActual = this.estadoCheckoutSubject.value;
    const errores = { ...estadoActual.errores, [campo]: mensaje };
    this.actualizarEstado({ errores });
  }

  /**
   * Limpiar errores
   */
  limpiarErrores(): void {
    this.actualizarEstado({ errores: {} });
  }

  /**
   * Establecer método de pago seleccionado
   */
  establecerMetodoPago(metodoPago: MetodoPago): void {
    this.actualizarEstado({
      metodo_pago: metodoPago,
      paso_actual: 3,
    });
  }

  /**
   * Establecer método de envío seleccionado
   */
  establecerMetodoEnvio(metodoEnvio: MetodoEnvio): void {
    this.actualizarEstado({ metodo_envio: metodoEnvio });
  }

  // ===== MÉTODOS UTILITARIOS PRIVADOS =====

  /**
   * Extraer datos de la respuesta de la API
   */
  private extraerDatos<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.message || 'Error en la respuesta de la API');
    }
    if (!response.data) {
      throw new Error('No se recibieron datos en la respuesta');
    }
    return response.data;
  }

  /**
   * Manejar errores de HTTP
   */
  private manejarError = (error: HttpErrorResponse): Observable<never> => {
    let mensajeError = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      mensajeError = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.status === 422 && error.error?.errors) {
        // Errores de validación
        const errores = Object.values(error.error.errors).flat();
        mensajeError = errores.join(', ');
      } else if (error.error?.message) {
        mensajeError = error.error.message;
      } else {
        mensajeError = `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('Error en CheckoutService:', error);
    return throwError(() => new Error(mensajeError));
  };

  /**
   * Convertir objeto a HttpParams
   */
  private convertirAHttpParams(obj: any): HttpParams {
    let params = new HttpParams();

    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'object') {
              Object.keys(item).forEach((subKey) => {
                params = params.append(
                  `${key}[${index}][${subKey}]`,
                  item[subKey]
                );
              });
            } else {
              params = params.append(`${key}[${index}]`, item);
            }
          });
        } else if (typeof value === 'object') {
          Object.keys(value).forEach((subKey) => {
            params = params.append(`${key}[${subKey}]`, value[subKey]);
          });
        } else {
          params = params.append(key, value.toString());
        }
      }
    });

    return params;
  }

  /**
   * Validar si se puede proceder al siguiente paso
   */
  puedeAvanzar(): boolean {
    const estado = this.estadoCheckoutSubject.value;

    switch (estado.paso_actual) {
      case 1:
        return estado.items.length > 0;
      case 2:
        return !!(estado.datos_personales && estado.direccion_envio);
      case 3:
        return !!(estado.metodo_pago && estado.metodo_envio);
      default:
        return false;
    }
  }

  /**
   * Obtener progreso del checkout (0-100%)
   */
  obtenerProgreso(): number {
    const estado = this.estadoCheckoutSubject.value;
    return ((estado.paso_actual - 1) / 3) * 100;
  }

  /**
   * Verificar si el checkout está completo
   */
  esCheckoutCompleto(): boolean {
    const estado = this.estadoCheckoutSubject.value;
    return estado.paso_actual === 4;
  }

  /**
   * Restablecer checkout para nueva compra
   */
  reiniciarCheckout(): void {
    this.limpiarEstado();
    // Limpiar cache de configuración si es necesario
    this.configuracionCache$ = undefined;
  }
}
