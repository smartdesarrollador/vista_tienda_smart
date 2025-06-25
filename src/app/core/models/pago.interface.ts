import { Pedido } from './pedido.interface';
import { CuotaCredito } from './cuota-credito.interface';
import { BaseFilters, PaginatedResponse } from './common.interface';

/**
 * Interface principal para pagos
 * Gestiona todas las transacciones de pago del sistema
 */
export interface Pago {
  id: number;
  pedido_id: number;
  metodo_pago: MetodoPago;
  estado: EstadoPago;
  monto: number;
  moneda: 'PEN' | 'USD' | 'EUR';
  referencia_transaccion?: string;
  codigo_autorizacion?: string;
  fecha_pago: string;
  fecha_vencimiento?: string;
  observaciones?: string;
  datos_adicionales?: Record<string, any>;
  comision?: number;
  monto_neto?: number;
  ip_origen?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;

  // Relaciones
  pedido?: Pedido;
  cuotas_credito?: CuotaCredito[];
}

/**
 * Enum para métodos de pago disponibles
 */
export enum MetodoPago {
  EFECTIVO = 'efectivo',
  TARJETA_CREDITO = 'tarjeta_credito',
  TARJETA_DEBITO = 'tarjeta_debito',
  TRANSFERENCIA_BANCARIA = 'transferencia_bancaria',
  DEPOSITO_BANCARIO = 'deposito_bancario',
  YAPE = 'yape',
  PLIN = 'plin',
  PAYPAL = 'paypal',
  MERCADO_PAGO = 'mercado_pago',
  VISA_NET = 'visa_net',
  MASTERCARD = 'mastercard',
  AMERICAN_EXPRESS = 'american_express',
  DINERS_CLUB = 'diners_club',
  CREDITO_TIENDA = 'credito_tienda',
  BITCOIN = 'bitcoin',
  OTROS = 'otros',
}

/**
 * Enum para estados de pago
 */
export enum EstadoPago {
  PENDIENTE = 'pendiente',
  PROCESANDO = 'procesando',
  AUTORIZADO = 'autorizado',
  COMPLETADO = 'completado',
  PAGADO = 'pagado',
  FALLIDO = 'fallido',
  RECHAZADO = 'rechazado',
  CANCELADO = 'cancelado',
  REEMBOLSADO = 'reembolsado',
  PARCIALMENTE_REEMBOLSADO = 'parcialmente_reembolsado',
  EN_DISPUTA = 'en_disputa',
  EXPIRADO = 'expirado',
}

/**
 * DTO para crear un nuevo pago
 */
export interface CreatePagoDto {
  pedido_id: number;
  metodo_pago: MetodoPago;
  monto: number;
  moneda: 'PEN' | 'USD' | 'EUR';
  referencia_transaccion?: string;
  fecha_vencimiento?: string;
  observaciones?: string;
  datos_adicionales?: Record<string, any>;
  procesar_inmediatamente?: boolean;
}

/**
 * DTO para actualizar un pago existente
 */
export interface UpdatePagoDto {
  estado?: EstadoPago;
  codigo_autorizacion?: string;
  referencia_transaccion?: string;
  observaciones?: string;
  datos_adicionales?: Record<string, any>;
  fecha_pago?: string;
  monto?: number;
}

/**
 * Filtros para búsqueda y listado de pagos
 */
export interface PagoFilters extends BaseFilters {
  pedido_id?: number;
  metodo_pago?: MetodoPago;
  estado?: EstadoPago;
  monto_min?: number;
  monto_max?: number;
  moneda?: 'PEN' | 'USD' | 'EUR';
  fecha_desde?: string;
  fecha_hasta?: string;
  fecha_vencimiento_desde?: string;
  fecha_vencimiento_hasta?: string;
  referencia_transaccion?: string;
  codigo_autorizacion?: string;
  cliente_id?: number;
  cliente_nombre?: string;
  con_observaciones?: boolean;
  requiere_autorizacion?: boolean;
  es_reembolso?: boolean;
}

/**
 * Estadísticas de pagos
 */
export interface PagoEstadisticas {
  total_pagos: number;
  monto_total: number;
  monto_promedio: number;
  comision_total: number;
  monto_neto_total: number;
  tasa_exito: number;
  tiempo_promedio_procesamiento: number;

  pagos_por_metodo: Array<{
    metodo: MetodoPago;
    cantidad: number;
    monto_total: number;
    porcentaje_cantidad: number;
    porcentaje_monto: number;
    tasa_exito: number;
  }>;

  pagos_por_estado: Array<{
    estado: EstadoPago;
    cantidad: number;
    monto_total: number;
    porcentaje_cantidad: number;
    porcentaje_monto: number;
  }>;

  pagos_por_moneda: Array<{
    moneda: 'PEN' | 'USD' | 'EUR';
    cantidad: number;
    monto_total: number;
    porcentaje: number;
  }>;

  tendencia_mensual: Array<{
    mes: string;
    cantidad: number;
    monto: number;
    tasa_exito: number;
    metodo_mas_usado: MetodoPago;
  }>;

  comparativa_periodo_anterior: {
    crecimiento_cantidad: number;
    crecimiento_monto: number;
    cambio_tasa_exito: number;
  };
}

/**
 * Interface para procesamiento de pagos
 */
export interface ProcesarPagoRequest {
  pago_id: number;
  datos_tarjeta?: DatosTarjeta;
  datos_transferencia?: DatosTransferencia;
  datos_billetera_digital?: DatosBilleteraDigital;
  confirmar_procesamiento?: boolean;
  notificar_cliente?: boolean;
}

/**
 * Interface para datos de tarjeta
 */
export interface DatosTarjeta {
  numero_tarjeta: string;
  mes_expiracion: string;
  año_expiracion: string;
  cvv: string;
  nombre_titular: string;
  tipo_documento?: string;
  numero_documento?: string;
  direccion_facturacion?: DireccionFacturacion;
}

/**
 * Interface para datos de transferencia bancaria
 */
export interface DatosTransferencia {
  banco_origen: string;
  numero_cuenta_origen?: string;
  banco_destino: string;
  numero_cuenta_destino: string;
  numero_operacion: string;
  fecha_operacion: string;
  comprobante_url?: string;
}

/**
 * Interface para billeteras digitales
 */
export interface DatosBilleteraDigital {
  numero_telefono?: string;
  email?: string;
  codigo_qr?: string;
  token_autorizacion?: string;
  app_utilizada: 'yape' | 'plin' | 'paypal' | 'mercado_pago' | 'otros';
}

/**
 * Interface para dirección de facturación
 */
export interface DireccionFacturacion {
  direccion: string;
  ciudad: string;
  estado_provincia: string;
  codigo_postal: string;
  pais: string;
}

/**
 * Interface para respuesta de procesamiento
 */
export interface ProcesarPagoResponse {
  success: boolean;
  pago: Pago;
  codigo_autorizacion?: string;
  referencia_transaccion?: string;
  mensaje: string;
  requiere_accion_adicional?: boolean;
  url_redireccion?: string;
  tiempo_expiracion?: string;
  datos_adicionales?: Record<string, any>;
}

/**
 * Interface para reembolsos
 */
export interface ReembolsoRequest {
  pago_id: number;
  monto_reembolso?: number;
  motivo: string;
  tipo_reembolso: 'total' | 'parcial';
  notificar_cliente?: boolean;
  procesar_inmediatamente?: boolean;
}

/**
 * Interface para reembolso response
 */
export interface ReembolsoResponse {
  success: boolean;
  reembolso_id: number;
  monto_reembolsado: number;
  referencia_reembolso: string;
  fecha_procesamiento: string;
  estado: 'procesando' | 'completado' | 'fallido';
  mensaje: string;
}

/**
 * Interface para configuración de métodos de pago
 */
export interface ConfiguracionMetodoPago {
  metodo: MetodoPago;
  activo: boolean;
  nombre_mostrar: string;
  descripcion?: string;
  icono?: string;
  comision_porcentaje?: number;
  comision_fija?: number;
  monto_minimo?: number;
  monto_maximo?: number;
  monedas_soportadas: Array<'PEN' | 'USD' | 'EUR'>;
  requiere_autorizacion: boolean;
  tiempo_expiracion_minutos?: number;
  configuracion_adicional?: Record<string, any>;
}

/**
 * Interface para conciliación de pagos
 */
export interface ConciliacionPago {
  fecha_conciliacion: string;
  total_pagos_sistema: number;
  total_pagos_banco: number;
  diferencia: number;
  pagos_conciliados: number;
  pagos_pendientes: number;
  pagos_con_diferencias: Array<{
    pago_id: number;
    monto_sistema: number;
    monto_banco: number;
    diferencia: number;
    estado_conciliacion: 'pendiente' | 'resuelto' | 'en_revision';
  }>;
}

/**
 * Interface para notificaciones de pago
 */
export interface NotificacionPago {
  tipo: 'webhook' | 'email' | 'sms' | 'push';
  evento:
    | 'pago_creado'
    | 'pago_completado'
    | 'pago_fallido'
    | 'reembolso_procesado';
  destinatario: string;
  datos_pago: Partial<Pago>;
  plantilla?: string;
  programada_para?: string;
}

/**
 * Interface para auditoria de pagos
 */
export interface AuditoriaPago {
  id: number;
  pago_id: number;
  accion: string;
  usuario_id: number;
  usuario_nombre: string;
  datos_anteriores?: Record<string, any>;
  datos_nuevos?: Record<string, any>;
  ip_origen: string;
  user_agent: string;
  fecha_accion: string;
  observaciones?: string;
}

/**
 * Respuesta paginada para pagos
 */
export interface PagoPaginatedResponse extends PaginatedResponse<Pago> {
  estadisticas_resumen?: {
    total_monto_pagina: number;
    pagos_exitosos_pagina: number;
    pagos_pendientes_pagina: number;
    pagos_fallidos_pagina: number;
  };
}

/**
 * Constantes para pagos
 */
export const PAGO_CONSTANTS = {
  MONTO_MINIMO: 0.01,
  MONTO_MAXIMO: 999999.99,
  COMISION_MAXIMA_PORCENTAJE: 10,
  TIEMPO_EXPIRACION_DEFAULT_MINUTOS: 30,
  INTENTOS_MAXIMOS_PROCESAMIENTO: 3,
  MONEDAS_SOPORTADAS: ['PEN', 'USD', 'EUR'] as const,
  DECIMALES_MONTO: 2,

  METODOS_REQUIEREN_AUTORIZACION: [
    MetodoPago.TARJETA_CREDITO,
    MetodoPago.TARJETA_DEBITO,
    MetodoPago.PAYPAL,
    MetodoPago.MERCADO_PAGO,
  ] as const,

  METODOS_INSTANTANEOS: [
    MetodoPago.EFECTIVO,
    MetodoPago.YAPE,
    MetodoPago.PLIN,
  ] as const,

  ESTADOS_FINALES: [
    EstadoPago.COMPLETADO,
    EstadoPago.PAGADO,
    EstadoPago.CANCELADO,
    EstadoPago.REEMBOLSADO,
    EstadoPago.EXPIRADO,
  ] as const,
} as const;

/**
 * Tipos de utilidad para pagos
 */
export type MonedaPago = (typeof PAGO_CONSTANTS.MONEDAS_SOPORTADAS)[number];
export type MetodoRequiereAutorizacion =
  (typeof PAGO_CONSTANTS.METODOS_REQUIEREN_AUTORIZACION)[number];
export type MetodoInstantaneo =
  (typeof PAGO_CONSTANTS.METODOS_INSTANTANEOS)[number];
export type EstadoFinal = (typeof PAGO_CONSTANTS.ESTADOS_FINALES)[number];
export type CampoOrdenamientoPago =
  | 'monto'
  | 'fecha_pago'
  | 'created_at'
  | 'estado'
  | 'metodo_pago';

/**
 * Funciones de utilidad para pagos
 */
export const PagoUtils = {
  /**
   * Verifica si un método de pago requiere autorización
   */
  requiereAutorizacion: (metodo: MetodoPago): boolean => {
    return PAGO_CONSTANTS.METODOS_REQUIEREN_AUTORIZACION.includes(
      metodo as any
    );
  },

  /**
   * Verifica si un método de pago es instantáneo
   */
  esInstantaneo: (metodo: MetodoPago): boolean => {
    return PAGO_CONSTANTS.METODOS_INSTANTANEOS.includes(metodo as any);
  },

  /**
   * Verifica si un estado es final
   */
  esEstadoFinal: (estado: EstadoPago): boolean => {
    return PAGO_CONSTANTS.ESTADOS_FINALES.includes(estado as any);
  },

  /**
   * Calcula la comisión de un pago
   */
  calcularComision: (
    monto: number,
    porcentaje: number,
    fija: number = 0
  ): number => {
    return (monto * porcentaje) / 100 + fija;
  },

  /**
   * Formatea el monto según la moneda
   */
  formatearMonto: (monto: number, moneda: MonedaPago): string => {
    const simbolos = { PEN: 'S/', USD: '$', EUR: '€' };
    return `${simbolos[moneda]} ${monto.toFixed(
      PAGO_CONSTANTS.DECIMALES_MONTO
    )}`;
  },
};
