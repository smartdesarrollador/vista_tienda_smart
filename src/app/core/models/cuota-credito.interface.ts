import { Pedido } from './pedido.interface';
import { Pago } from './pago.interface';
import { BaseFilters, PaginatedResponse } from './common.interface';

/**
 * Interface principal para cuotas de crédito
 * Gestiona el sistema de crédito y financiamiento de pedidos
 */
export interface CuotaCredito {
  id: number;
  pedido_id: number;
  pago_id?: number;
  numero_cuota: number;
  monto_cuota: number;
  monto_interes: number;
  monto_capital: number;
  monto_mora?: number;
  monto_pagado?: number;
  saldo_pendiente?: number;
  fecha_vencimiento: string;
  fecha_pago?: string;
  estado: EstadoCuota;
  dias_mora?: number;
  tasa_interes: number;
  tasa_mora?: number;
  observaciones?: string;
  metodo_calculo: 'frances' | 'aleman' | 'americano' | 'personalizado';
  created_at: string;
  updated_at: string;

  // Relaciones
  pedido?: Pedido;
  pago?: Pago;
}

/**
 * Enum para estados de cuota de crédito
 */
export enum EstadoCuota {
  PENDIENTE = 'pendiente',
  PAGADA = 'pagada',
  PAGADA_PARCIAL = 'pagada_parcial',
  VENCIDA = 'vencida',
  EN_MORA = 'en_mora',
  CANCELADA = 'cancelada',
  REFINANCIADA = 'refinanciada',
  CONDONADA = 'condonada',
}

/**
 * DTO para crear una nueva cuota de crédito
 */
export interface CreateCuotaCreditoDto {
  pedido_id: number;
  numero_cuota: number;
  monto_cuota: number;
  monto_interes: number;
  monto_capital: number;
  fecha_vencimiento: string;
  tasa_interes: number;
  metodo_calculo?: 'frances' | 'aleman' | 'americano' | 'personalizado';
  observaciones?: string;
}

/**
 * DTO para actualizar una cuota de crédito existente
 */
export interface UpdateCuotaCreditoDto {
  monto_mora?: number;
  monto_pagado?: number;
  fecha_pago?: string;
  estado?: EstadoCuota;
  observaciones?: string;
  tasa_mora?: number;
}

/**
 * Filtros para búsqueda y listado de cuotas de crédito
 */
export interface CuotaCreditoFilters extends BaseFilters {
  pedido_id?: number;
  pago_id?: number;
  estado?: EstadoCuota;
  numero_cuota?: number;
  fecha_vencimiento_desde?: string;
  fecha_vencimiento_hasta?: string;
  fecha_pago_desde?: string;
  fecha_pago_hasta?: string;
  monto_min?: number;
  monto_max?: number;
  dias_mora_min?: number;
  dias_mora_max?: number;
  con_mora?: boolean;
  cliente_id?: number;
  cliente_nombre?: string;
  metodo_calculo?: 'frances' | 'aleman' | 'americano' | 'personalizado';
  tasa_interes_min?: number;
  tasa_interes_max?: number;
  solo_vencidas?: boolean;
  solo_pendientes?: boolean;
}

/**
 * Estadísticas de cuotas de crédito
 */
export interface CuotaCreditoEstadisticas {
  total_cuotas: number;
  monto_total_credito: number;
  monto_total_pendiente: number;
  monto_total_pagado: number;
  monto_total_mora: number;
  monto_total_interes: number;
  tasa_morosidad: number;
  tiempo_promedio_pago: number;

  cuotas_por_estado: Array<{
    estado: EstadoCuota;
    cantidad: number;
    monto_total: number;
    porcentaje_cantidad: number;
    porcentaje_monto: number;
  }>;

  distribucion_por_numero_cuota: Array<{
    numero_cuota: number;
    cantidad: number;
    monto_promedio: number;
    tasa_pago_puntual: number;
  }>;

  clientes_con_mora: Array<{
    usuario_id: number;
    nombre: string;
    email: string;
    cuotas_vencidas: number;
    monto_mora_total: number;
    dias_mora_promedio: number;
    ultimo_pago: string;
  }>;

  tendencia_mensual: Array<{
    mes: string;
    cuotas_generadas: number;
    cuotas_pagadas: number;
    monto_generado: number;
    monto_pagado: number;
    tasa_morosidad: number;
  }>;

  analisis_riesgo: {
    clientes_alto_riesgo: number;
    clientes_medio_riesgo: number;
    clientes_bajo_riesgo: number;
    provision_requerida: number;
  };
}

/**
 * Interface para cronograma de pagos
 */
export interface CronogramaPagos {
  pedido_id: number;
  monto_total: number;
  numero_cuotas: number;
  tasa_interes_anual: number;
  tasa_interes_mensual: number;
  metodo_calculo: 'frances' | 'aleman' | 'americano' | 'personalizado';
  fecha_primer_vencimiento: string;

  cuotas: Array<{
    numero: number;
    fecha_vencimiento: string;
    monto_cuota: number;
    monto_capital: number;
    monto_interes: number;
    saldo_pendiente: number;
  }>;

  resumen: {
    total_a_pagar: number;
    total_intereses: number;
    cuota_promedio: number;
    tasa_efectiva_anual: number;
  };
}

/**
 * Interface para simulación de crédito
 */
export interface SimulacionCredito {
  monto_solicitado: number;
  numero_cuotas: number;
  tasa_interes_anual: number;
  metodo_calculo: 'frances' | 'aleman' | 'americano' | 'personalizado';
  fecha_inicio: string;
  incluir_seguro?: boolean;
  monto_seguro?: number;

  resultado: {
    cuota_mensual: number;
    total_a_pagar: number;
    total_intereses: number;
    tasa_efectiva_anual: number;
    cronograma: CronogramaPagos;
  };
}

/**
 * Interface para pago de cuota
 */
export interface PagoCuotaRequest {
  cuota_id: number;
  monto_pago: number;
  metodo_pago: string;
  fecha_pago?: string;
  incluir_mora?: boolean;
  observaciones?: string;
  generar_comprobante?: boolean;
}

/**
 * Interface para respuesta de pago de cuota
 */
export interface PagoCuotaResponse {
  success: boolean;
  cuota: CuotaCredito;
  pago_id?: number;
  monto_aplicado_capital: number;
  monto_aplicado_interes: number;
  monto_aplicado_mora: number;
  saldo_restante: number;
  siguiente_cuota?: CuotaCredito;
  comprobante_url?: string;
  mensaje: string;
}

/**
 * Interface para refinanciamiento
 */
export interface RefinanciamientoRequest {
  cuotas_ids: number[];
  nuevo_numero_cuotas: number;
  nueva_tasa_interes?: number;
  nueva_fecha_inicio?: string;
  motivo: string;
  observaciones?: string;
}

/**
 * Interface para condonación de deuda
 */
export interface CondonacionRequest {
  cuotas_ids: number[];
  tipo_condonacion: 'total' | 'parcial' | 'solo_mora' | 'solo_interes';
  monto_condonado?: number;
  motivo: string;
  autorizado_por: string;
  observaciones?: string;
}

/**
 * Interface para cálculo de mora
 */
export interface CalculoMora {
  cuota_id: number;
  fecha_calculo: string;
  dias_mora: number;
  monto_base: number;
  tasa_mora_diaria: number;
  monto_mora_calculado: number;
  monto_mora_acumulado: number;
  exento_mora?: boolean;
  motivo_exencion?: string;
}

/**
 * Interface para configuración de crédito
 */
export interface ConfiguracionCredito {
  tasa_interes_minima: number;
  tasa_interes_maxima: number;
  tasa_mora_diaria: number;
  numero_cuotas_minimo: number;
  numero_cuotas_maximo: number;
  monto_minimo_credito: number;
  monto_maximo_credito: number;
  dias_gracia_mora: number;
  porcentaje_enganche_minimo: number;
  requiere_aval: boolean;
  requiere_garantia: boolean;
  metodos_calculo_permitidos: Array<
    'frances' | 'aleman' | 'americano' | 'personalizado'
  >;
}

/**
 * Interface para evaluación crediticia
 */
export interface EvaluacionCrediticia {
  usuario_id: number;
  monto_solicitado: number;
  numero_cuotas: number;

  resultado: {
    aprobado: boolean;
    monto_aprobado: number;
    tasa_interes_sugerida: number;
    numero_cuotas_sugerido: number;
    requiere_aval: boolean;
    requiere_garantia: boolean;
    observaciones: string;
  };

  factores_evaluacion: {
    historial_crediticio: number;
    ingresos_declarados: number;
    antiguedad_cliente: number;
    comportamiento_pagos: number;
    score_final: number;
  };
}

/**
 * Interface para notificaciones de cuotas
 */
export interface NotificacionCuota {
  tipo: 'recordatorio' | 'vencimiento' | 'mora' | 'pago_recibido';
  cuota_id: number;
  dias_anticipacion?: number;
  canal: 'email' | 'sms' | 'whatsapp' | 'push';
  plantilla: string;
  programada_para: string;
  enviada: boolean;
  fecha_envio?: string;
}

/**
 * Interface para reporte de cartera
 */
export interface ReporteCartera {
  fecha_corte: string;
  total_cartera: number;
  cartera_vigente: number;
  cartera_vencida: number;
  provision_requerida: number;

  clasificacion_riesgo: Array<{
    categoria:
      | 'normal'
      | 'con_problemas_potenciales'
      | 'deficiente'
      | 'dudoso'
      | 'perdida';
    cantidad_clientes: number;
    monto_cartera: number;
    porcentaje_provision: number;
    provision_constituida: number;
  }>;

  antiguedad_vencimiento: Array<{
    rango_dias: string;
    cantidad_cuotas: number;
    monto_vencido: number;
    porcentaje: number;
  }>;
}

/**
 * Respuesta paginada para cuotas de crédito
 */
export interface CuotaCreditoPaginatedResponse
  extends PaginatedResponse<CuotaCredito> {
  estadisticas_resumen?: {
    total_monto_pagina: number;
    cuotas_vencidas_pagina: number;
    cuotas_pendientes_pagina: number;
    monto_mora_pagina: number;
  };
}

/**
 * Constantes para cuotas de crédito
 */
export const CUOTA_CREDITO_CONSTANTS = {
  TASA_INTERES_MINIMA: 0.01,
  TASA_INTERES_MAXIMA: 50.0,
  TASA_MORA_DIARIA_DEFAULT: 0.1,
  NUMERO_CUOTAS_MINIMO: 1,
  NUMERO_CUOTAS_MAXIMO: 60,
  MONTO_MINIMO_CREDITO: 100.0,
  MONTO_MAXIMO_CREDITO: 100000.0,
  DIAS_GRACIA_MORA_DEFAULT: 3,
  DECIMALES_MONTO: 2,
  DECIMALES_TASA: 4,

  ESTADOS_ACTIVOS: [
    EstadoCuota.PENDIENTE,
    EstadoCuota.VENCIDA,
    EstadoCuota.EN_MORA,
    EstadoCuota.PAGADA_PARCIAL,
  ] as const,

  ESTADOS_FINALES: [
    EstadoCuota.PAGADA,
    EstadoCuota.CANCELADA,
    EstadoCuota.REFINANCIADA,
    EstadoCuota.CONDONADA,
  ] as const,

  METODOS_CALCULO: ['frances', 'aleman', 'americano', 'personalizado'] as const,
} as const;

/**
 * Tipos de utilidad para cuotas de crédito
 */
export type EstadoActivo =
  (typeof CUOTA_CREDITO_CONSTANTS.ESTADOS_ACTIVOS)[number];
export type EstadoFinalCuota =
  (typeof CUOTA_CREDITO_CONSTANTS.ESTADOS_FINALES)[number];
export type MetodoCalculo =
  (typeof CUOTA_CREDITO_CONSTANTS.METODOS_CALCULO)[number];
export type CampoOrdenamientoCuota =
  | 'numero_cuota'
  | 'monto_cuota'
  | 'fecha_vencimiento'
  | 'estado'
  | 'dias_mora';

/**
 * Funciones de utilidad para cuotas de crédito
 */
export const CuotaCreditoUtils = {
  /**
   * Calcula los días de mora entre dos fechas
   */
  calcularDiasMora: (
    fechaVencimiento: string,
    fechaActual: string = new Date().toISOString()
  ): number => {
    const vencimiento = new Date(fechaVencimiento);
    const actual = new Date(fechaActual);
    const diferencia = actual.getTime() - vencimiento.getTime();
    return Math.max(0, Math.floor(diferencia / (1000 * 60 * 60 * 24)));
  },

  /**
   * Calcula el monto de mora
   */
  calcularMontoMora: (
    montoBase: number,
    diasMora: number,
    tasaMoraDiaria: number
  ): number => {
    return montoBase * (tasaMoraDiaria / 100) * diasMora;
  },

  /**
   * Verifica si una cuota está en estado activo
   */
  esEstadoActivo: (estado: EstadoCuota): boolean => {
    return CUOTA_CREDITO_CONSTANTS.ESTADOS_ACTIVOS.includes(estado as any);
  },

  /**
   * Verifica si una cuota está en estado final
   */
  esEstadoFinal: (estado: EstadoCuota): boolean => {
    return CUOTA_CREDITO_CONSTANTS.ESTADOS_FINALES.includes(estado as any);
  },

  /**
   * Calcula la cuota mensual usando el método francés
   */
  calcularCuotaFrances: (
    monto: number,
    tasaMensual: number,
    numeroCuotas: number
  ): number => {
    if (tasaMensual === 0) return monto / numeroCuotas;
    const factor = Math.pow(1 + tasaMensual, numeroCuotas);
    return (monto * (tasaMensual * factor)) / (factor - 1);
  },

  /**
   * Formatea el monto de la cuota
   */
  formatearMonto: (monto: number): string => {
    return `S/ ${monto.toFixed(CUOTA_CREDITO_CONSTANTS.DECIMALES_MONTO)}`;
  },

  /**
   * Formatea la tasa de interés
   */
  formatearTasa: (tasa: number): string => {
    return `${tasa.toFixed(CUOTA_CREDITO_CONSTANTS.DECIMALES_TASA)}%`;
  },

  /**
   * Determina el estado de una cuota basado en fechas y pagos
   */
  determinarEstado: (cuota: Partial<CuotaCredito>): EstadoCuota => {
    if (cuota.fecha_pago && cuota.monto_pagado === cuota.monto_cuota) {
      return EstadoCuota.PAGADA;
    }

    if (
      cuota.fecha_pago &&
      cuota.monto_pagado &&
      cuota.monto_pagado < cuota.monto_cuota!
    ) {
      return EstadoCuota.PAGADA_PARCIAL;
    }

    const hoy = new Date();
    const vencimiento = new Date(cuota.fecha_vencimiento!);

    if (hoy > vencimiento) {
      const diasMora = CuotaCreditoUtils.calcularDiasMora(
        cuota.fecha_vencimiento!
      );
      return diasMora > CUOTA_CREDITO_CONSTANTS.DIAS_GRACIA_MORA_DEFAULT
        ? EstadoCuota.EN_MORA
        : EstadoCuota.VENCIDA;
    }

    return EstadoCuota.PENDIENTE;
  },
};
