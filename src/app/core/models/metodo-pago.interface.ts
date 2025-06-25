export interface MetodoPago {
  id: number;
  nombre: string;
  slug: string;
  tipo: TipoMetodoPago;
  descripcion?: string;
  logo?: string;
  logo_url?: string;
  activo: boolean;
  requiere_verificacion: boolean;
  comision_porcentaje: number;
  comision_fija: number;
  monto_minimo?: number;
  monto_maximo?: number;
  orden: number;
  configuracion?: Record<string, any>;
  paises_disponibles?: string[];
  proveedor?: ProveedorPago;
  moneda_soportada: string;
  permite_cuotas: boolean;
  cuotas_maximas?: number;
  instrucciones?: string;
  icono_clase?: string;
  color_primario?: string;
  tiempo_procesamiento?: number;
  tiempo_procesamiento_texto?: string;
  created_at: string;
  updated_at: string;

  // Campos calculados/adicionales
  esta_activo?: boolean;
  es_tarjeta?: boolean;
  es_billetera_digital?: boolean;
  es_transferencia?: boolean;
  es_efectivo?: boolean;
  comision_calculada?: number;
  monto_total_con_comision?: number;

  // Contadores de relaciones
  pedidos_count?: number;
  pagos_count?: number;
}

export interface CreateMetodoPagoRequest {
  nombre: string;
  tipo: TipoMetodoPago;
  descripcion?: string;
  logo?: string;
  activo?: boolean;
  requiere_verificacion?: boolean;
  comision_porcentaje?: number;
  comision_fija?: number;
  monto_minimo?: number;
  monto_maximo?: number;
  orden?: number;
  configuracion?: Record<string, any>;
  paises_disponibles?: string[];
  proveedor?: ProveedorPago;
  moneda_soportada?: string;
  permite_cuotas?: boolean;
  cuotas_maximas?: number;
  instrucciones?: string;
  icono_clase?: string;
  color_primario?: string;
  tiempo_procesamiento?: number;
}

export interface UpdateMetodoPagoRequest
  extends Partial<CreateMetodoPagoRequest> {
  id: number;
}

export interface MetodoPagoFilters {
  search?: string;
  activo?: boolean;
  tipo?: TipoMetodoPago;
  proveedor?: ProveedorPago;
  permite_cuotas?: boolean;
  pais?: string;
  moneda?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface MetodoPagoForSelect {
  id: number;
  nombre: string;
  slug: string;
  tipo: TipoMetodoPago;
  logo_url?: string;
  icono_clase?: string;
  color_primario?: string;
  permite_cuotas: boolean;
  cuotas_maximas?: number;
  comision_porcentaje: number;
  comision_fija: number;
  tiempo_procesamiento_texto: string;
}

export interface CalcularComisionRequest {
  monto: number;
}

export interface CalcularComisionResponse {
  monto_original: number;
  comision_porcentaje: number;
  comision_fija: number;
  comision_calculada: number;
  monto_total: number;
  metodo_pago: {
    id: number;
    nombre: string;
    tipo: TipoMetodoPago;
  };
}

export interface EstadisticasMetodoPago {
  id: number;
  nombre: string;
  tipo: TipoMetodoPago;
  activo: boolean;
  total_pedidos: number;
  total_pagos: number;
  total_pagos_exitosos: number;
  monto_total_procesado: number;
  comision_total_generada: number;
  tasa_exito: number;
}

export interface ValidarMetodoPagoRequest {
  metodo_pago_id: number;
  monto: number;
  pais?: string;
  moneda?: string;
}

export interface ValidarMetodoPagoResponse {
  metodo_pago: MetodoPago;
  monto_original: number;
  comision: number;
  monto_total_con_comision: number;
  tiempo_procesamiento: string;
  requiere_verificacion: boolean;
  permite_cuotas: boolean;
  cuotas_maximas?: number;
  instrucciones?: string;
}

export interface ObtenerMetodosPagoRequest {
  monto?: number;
  pais?: string;
  moneda?: string;
}

export interface ObtenerMetodosPagoResponse {
  metodos_pago: MetodoPago[];
  total_disponibles: number;
  filtros_aplicados: {
    monto?: number;
    pais: string;
    moneda: string;
  };
}

// Enums y tipos
export enum TipoMetodoPago {
  TARJETA_CREDITO = 'tarjeta_credito',
  TARJETA_DEBITO = 'tarjeta_debito',
  BILLETERA_DIGITAL = 'billetera_digital',
  TRANSFERENCIA = 'transferencia',
  EFECTIVO = 'efectivo',
  CRIPTOMONEDA = 'criptomoneda',
}

export enum ProveedorPago {
  CULQI = 'culqi',
  MERCADOPAGO = 'mercadopago',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  PAYU = 'payu',
  NIUBIZ = 'niubiz',
}

export const TIPOS_METODO_PAGO = [
  { value: TipoMetodoPago.TARJETA_CREDITO, label: 'Tarjeta de Crédito' },
  { value: TipoMetodoPago.TARJETA_DEBITO, label: 'Tarjeta de Débito' },
  { value: TipoMetodoPago.BILLETERA_DIGITAL, label: 'Billetera Digital' },
  { value: TipoMetodoPago.TRANSFERENCIA, label: 'Transferencia Bancaria' },
  { value: TipoMetodoPago.EFECTIVO, label: 'Efectivo' },
  { value: TipoMetodoPago.CRIPTOMONEDA, label: 'Criptomoneda' },
] as const;

export const PROVEEDORES_PAGO = [
  { value: ProveedorPago.CULQI, label: 'Culqi' },
  { value: ProveedorPago.MERCADOPAGO, label: 'MercadoPago' },
  { value: ProveedorPago.PAYPAL, label: 'PayPal' },
  { value: ProveedorPago.STRIPE, label: 'Stripe' },
  { value: ProveedorPago.PAYU, label: 'PayU' },
  { value: ProveedorPago.NIUBIZ, label: 'Niubiz' },
] as const;

export const MONEDAS_SOPORTADAS = [
  { value: 'PEN', label: 'Sol Peruano (PEN)' },
  { value: 'USD', label: 'Dólar Americano (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'CLP', label: 'Peso Chileno (CLP)' },
  { value: 'COP', label: 'Peso Colombiano (COP)' },
  { value: 'MXN', label: 'Peso Mexicano (MXN)' },
] as const;

export const PAISES_DISPONIBLES = [
  { value: 'PE', label: 'Perú' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'MX', label: 'México' },
  { value: 'CO', label: 'Colombia' },
  { value: 'CL', label: 'Chile' },
  { value: 'AR', label: 'Argentina' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'BO', label: 'Bolivia' },
] as const;

// Utilidades de tipo
export type MetodoPagoResponse = {
  data: MetodoPago;
  success: boolean;
  message?: string;
};

export type MetodoPagoListResponse = {
  data: MetodoPago[];
  success: boolean;
  message?: string;
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

export type MetodoPagoForSelectResponse = {
  data: MetodoPagoForSelect[];
  success: boolean;
  message?: string;
};

export type EstadisticasMetodoPagoResponse = {
  data: EstadisticasMetodoPago[];
  success: boolean;
  message?: string;
};
