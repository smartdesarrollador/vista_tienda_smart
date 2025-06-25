import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { signal, computed } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  MetodoPago,
  CreateMetodoPagoRequest,
  UpdateMetodoPagoRequest,
  MetodoPagoFilters,
  MetodoPagoForSelect,
  CalcularComisionRequest,
  CalcularComisionResponse,
  EstadisticasMetodoPago,
  ValidarMetodoPagoRequest,
  ValidarMetodoPagoResponse,
  ObtenerMetodosPagoRequest,
  ObtenerMetodosPagoResponse,
  MetodoPagoResponse,
  MetodoPagoListResponse,
  MetodoPagoForSelectResponse,
  EstadisticasMetodoPagoResponse,
  TipoMetodoPago,
  ProveedorPago,
} from '../models/metodo-pago.interface';

@Injectable({
  providedIn: 'root',
})
export class MetodoPagoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vista/metodos-pago`;
  private readonly publicUrl = `${environment.apiUrl}/metodos-pago-publicos`;
  private readonly checkoutUrl = `${environment.apiUrl}/checkout`;

  // Signals para gestión del estado
  private readonly _metodosPago = signal<MetodoPago[]>([]);
  private readonly _metodoPagoActual = signal<MetodoPago | null>(null);
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtros = signal<MetodoPagoFilters>({});
  private readonly _estadisticas = signal<EstadisticasMetodoPago[]>([]);

  // Computed signals
  readonly metodosPago = computed(() => this._metodosPago());
  readonly metodoPagoActual = computed(() => this._metodoPagoActual());
  readonly cargando = computed(() => this._cargando());
  readonly error = computed(() => this._error());
  readonly filtros = computed(() => this._filtros());
  readonly estadisticas = computed(() => this._estadisticas());

  // Computed para estadísticas calculadas
  readonly totalMetodosPago = computed(() => this._metodosPago().length);
  readonly metodosActivos = computed(
    () => this._metodosPago().filter((metodo) => metodo.activo).length
  );
  readonly metodosInactivos = computed(
    () => this._metodosPago().filter((metodo) => !metodo.activo).length
  );
  readonly metodosPorTipo = computed(() => {
    const metodos = this._metodosPago();
    const tipos = Object.values(TipoMetodoPago);
    return tipos.map((tipo) => ({
      tipo,
      cantidad: metodos.filter((m) => m.tipo === tipo).length,
    }));
  });

  /**
   * Obtener lista de métodos de pago con filtros y paginación
   */
  obtenerMetodosPago(
    filtros?: MetodoPagoFilters
  ): Observable<MetodoPagoListResponse> {
    this._cargando.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (filtros) {
      this._filtros.set(filtros);

      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'boolean') {
            params = params.set(key, value.toString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<MetodoPagoListResponse>(this.baseUrl, { params }).pipe(
      map((response) => {
        if (response.success && response.data) {
          this._metodosPago.set(response.data);
        }
        this._cargando.set(false);
        return response;
      }),
      catchError((error) => {
        this._cargando.set(false);
        this._error.set(this.extraerMensajeError(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener un método de pago específico por ID
   */
  obtenerMetodoPago(
    id: number,
    withRelations = false
  ): Observable<MetodoPagoResponse> {
    this._cargando.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (withRelations) {
      params = params.set('with_relations', 'true');
    }

    return this.http
      .get<MetodoPagoResponse>(`${this.baseUrl}/${id}`, { params })
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            this._metodoPagoActual.set(response.data);
          }
          this._cargando.set(false);
          return response;
        }),
        catchError((error) => {
          this._cargando.set(false);
          this._error.set(this.extraerMensajeError(error));
          return throwError(() => error);
        })
      );
  }

  /**
   * Crear un nuevo método de pago
   */
  crearMetodoPago(
    datos: CreateMetodoPagoRequest
  ): Observable<MetodoPagoResponse> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http.post<MetodoPagoResponse>(this.baseUrl, datos).pipe(
      map((response) => {
        if (response.success && response.data) {
          // Agregar el nuevo método a la lista actual
          const metodosActuales = this._metodosPago();
          this._metodosPago.set([...metodosActuales, response.data]);
          this._metodoPagoActual.set(response.data);
        }
        this._cargando.set(false);
        return response;
      }),
      catchError((error) => {
        this._cargando.set(false);
        this._error.set(this.extraerMensajeError(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar un método de pago existente
   */
  actualizarMetodoPago(
    id: number,
    datos: UpdateMetodoPagoRequest
  ): Observable<MetodoPagoResponse> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .put<MetodoPagoResponse>(`${this.baseUrl}/${id}`, datos)
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            // Actualizar en la lista actual
            const metodosActuales = this._metodosPago();
            const indice = metodosActuales.findIndex((m) => m.id === id);
            if (indice >= 0) {
              const metodosActualizados = [...metodosActuales];
              metodosActualizados[indice] = response.data;
              this._metodosPago.set(metodosActualizados);
            }
            this._metodoPagoActual.set(response.data);
          }
          this._cargando.set(false);
          return response;
        }),
        catchError((error) => {
          this._cargando.set(false);
          this._error.set(this.extraerMensajeError(error));
          return throwError(() => error);
        })
      );
  }

  /**
   * Eliminar un método de pago
   */
  eliminarMetodoPago(
    id: number
  ): Observable<{ success: boolean; message: string }> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .delete<{ success: boolean; message: string }>(`${this.baseUrl}/${id}`)
      .pipe(
        map((response) => {
          if (response.success) {
            // Remover de la lista actual
            const metodosActuales = this._metodosPago();
            this._metodosPago.set(metodosActuales.filter((m) => m.id !== id));

            // Limpiar el método actual si es el que se eliminó
            if (this._metodoPagoActual()?.id === id) {
              this._metodoPagoActual.set(null);
            }
          }
          this._cargando.set(false);
          return response;
        }),
        catchError((error) => {
          this._cargando.set(false);
          this._error.set(this.extraerMensajeError(error));
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener métodos de pago para formularios de selección
   */
  obtenerParaSeleccion(filtros?: {
    tipo?: TipoMetodoPago;
    pais?: string;
    moneda?: string;
    monto?: number;
  }): Observable<MetodoPagoForSelectResponse> {
    let params = new HttpParams();

    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<MetodoPagoForSelectResponse>(`${this.baseUrl}/for-select`, {
        params,
      })
      .pipe(
        catchError((error) => {
          this._error.set(this.extraerMensajeError(error));
          return throwError(() => error);
        })
      );
  }

  /**
   * Calcular comisión para un método y monto específico
   */
  calcularComision(
    metodoPagoId: number,
    datos: CalcularComisionRequest
  ): Observable<{
    data: CalcularComisionResponse;
    success: boolean;
    message?: string;
  }> {
    return this.http
      .post<{
        data: CalcularComisionResponse;
        success: boolean;
        message?: string;
      }>(`${this.baseUrl}/${metodoPagoId}/calcular-comision`, datos)
      .pipe(
        catchError((error) => {
          this._error.set(this.extraerMensajeError(error));
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener estadísticas de uso de métodos de pago
   */
  obtenerEstadisticas(): Observable<EstadisticasMetodoPagoResponse> {
    this._cargando.set(true);
    this._error.set(null);

    return this.http
      .get<EstadisticasMetodoPagoResponse>(`${this.baseUrl}/estadisticas`)
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            this._estadisticas.set(response.data);
          }
          this._cargando.set(false);
          return response;
        }),
        catchError((error) => {
          this._cargando.set(false);
          this._error.set(this.extraerMensajeError(error));
          return throwError(() => error);
        })
      );
  }

  /**
   * MÉTODOS PÚBLICOS PARA CHECKOUT
   */

  /**
   * Obtener métodos de pago públicos activos
   */
  obtenerMetodosPublicos(filtros?: {
    tipo?: TipoMetodoPago;
    pais?: string;
    moneda?: string;
    monto?: number;
  }): Observable<MetodoPagoForSelectResponse> {
    let params = new HttpParams();

    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<MetodoPagoForSelectResponse>(`${this.publicUrl}/activos`, { params })
      .pipe(
        catchError((error) => {
          this._error.set(this.extraerMensajeError(error));
          return throwError(() => error);
        })
      );
  }

  /**
   * Calcular comisión pública (para checkout)
   */
  calcularComisionPublica(
    metodoPagoId: number,
    datos: CalcularComisionRequest
  ): Observable<{
    data: CalcularComisionResponse;
    success: boolean;
    message?: string;
  }> {
    return this.http
      .post<{
        data: CalcularComisionResponse;
        success: boolean;
        message?: string;
      }>(`${this.publicUrl}/${metodoPagoId}/calcular-comision`, datos)
      .pipe(
        catchError((error) => {
          this._error.set(this.extraerMensajeError(error));
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener métodos de pago para checkout
   */
  obtenerMetodosCheckout(datos: ObtenerMetodosPagoRequest): Observable<{
    data: ObtenerMetodosPagoResponse;
    success: boolean;
    message?: string;
  }> {
    let params = new HttpParams();

    Object.entries(datos).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<{
        data: ObtenerMetodosPagoResponse;
        success: boolean;
        message?: string;
      }>(`${this.checkoutUrl}/metodos-pago`, { params })
      .pipe(
        catchError((error) => {
          this._error.set(this.extraerMensajeError(error));
          return throwError(() => error);
        })
      );
  }

  /**
   * Validar método de pago para checkout
   */
  validarMetodoCheckout(datos: ValidarMetodoPagoRequest): Observable<{
    data: ValidarMetodoPagoResponse;
    success: boolean;
    message?: string;
  }> {
    return this.http
      .post<{
        data: ValidarMetodoPagoResponse;
        success: boolean;
        message?: string;
      }>(`${this.checkoutUrl}/validar-metodo-pago`, datos)
      .pipe(
        catchError((error) => {
          this._error.set(this.extraerMensajeError(error));
          return throwError(() => error);
        })
      );
  }

  /**
   * MÉTODOS UTILITARIOS
   */

  /**
   * Limpiar estado del servicio
   */
  limpiarEstado(): void {
    this._metodosPago.set([]);
    this._metodoPagoActual.set(null);
    this._error.set(null);
    this._filtros.set({});
    this._estadisticas.set([]);
  }

  /**
   * Establecer método de pago actual
   */
  establecerMetodoActual(metodo: MetodoPago | null): void {
    this._metodoPagoActual.set(metodo);
  }

  /**
   * Limpiar errores
   */
  limpiarError(): void {
    this._error.set(null);
  }

  /**
   * Verificar si un método de pago está activo
   */
  estaActivo(metodoPago: MetodoPago): boolean {
    return metodoPago.activo;
  }

  /**
   * Obtener tipos de métodos de pago disponibles
   */
  obtenerTiposDisponibles(): Array<{ value: TipoMetodoPago; label: string }> {
    return [
      { value: TipoMetodoPago.TARJETA_CREDITO, label: 'Tarjeta de Crédito' },
      { value: TipoMetodoPago.TARJETA_DEBITO, label: 'Tarjeta de Débito' },
      { value: TipoMetodoPago.BILLETERA_DIGITAL, label: 'Billetera Digital' },
      { value: TipoMetodoPago.TRANSFERENCIA, label: 'Transferencia Bancaria' },
      { value: TipoMetodoPago.EFECTIVO, label: 'Efectivo' },
      { value: TipoMetodoPago.CRIPTOMONEDA, label: 'Criptomoneda' },
    ];
  }

  /**
   * Obtener proveedores de pago disponibles
   */
  obtenerProveedoresDisponibles(): Array<{
    value: ProveedorPago;
    label: string;
  }> {
    return [
      { value: ProveedorPago.CULQI, label: 'Culqi' },
      { value: ProveedorPago.MERCADOPAGO, label: 'MercadoPago' },
      { value: ProveedorPago.PAYPAL, label: 'PayPal' },
      { value: ProveedorPago.STRIPE, label: 'Stripe' },
      { value: ProveedorPago.PAYU, label: 'PayU' },
      { value: ProveedorPago.NIUBIZ, label: 'Niubiz' },
    ];
  }

  /**
   * Formatear comisión para mostrar
   */
  formatearComision(metodoPago: MetodoPago): string {
    const porcentaje = metodoPago.comision_porcentaje || 0;
    const fija = metodoPago.comision_fija || 0;

    if (porcentaje > 0 && fija > 0) {
      return `${porcentaje}% + S/${fija.toFixed(2)}`;
    } else if (porcentaje > 0) {
      return `${porcentaje}%`;
    } else if (fija > 0) {
      return `S/${fija.toFixed(2)}`;
    }

    return 'Gratis';
  }

  /**
   * Obtener color del badge según el tipo
   */
  obtenerColorTipo(tipo: TipoMetodoPago): string {
    const colores = {
      [TipoMetodoPago.TARJETA_CREDITO]: 'bg-blue-100 text-blue-800',
      [TipoMetodoPago.TARJETA_DEBITO]: 'bg-green-100 text-green-800',
      [TipoMetodoPago.BILLETERA_DIGITAL]: 'bg-purple-100 text-purple-800',
      [TipoMetodoPago.TRANSFERENCIA]: 'bg-orange-100 text-orange-800',
      [TipoMetodoPago.EFECTIVO]: 'bg-gray-100 text-gray-800',
      [TipoMetodoPago.CRIPTOMONEDA]: 'bg-yellow-100 text-yellow-800',
    };

    return colores[tipo] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Extraer mensaje de error de la respuesta HTTP
   */
  private extraerMensajeError(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }

    if (error.error?.errors) {
      const errores = Object.values(error.error.errors).flat();
      return errores.join(', ');
    }

    if (error.message) {
      return error.message;
    }

    return 'Ha ocurrido un error inesperado';
  }
}
