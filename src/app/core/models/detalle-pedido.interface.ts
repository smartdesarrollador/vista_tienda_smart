import { Pedido } from './pedido.interface';
import { Producto } from './producto.interface';
import { VariacionProducto } from './variacion-producto.interface';
import { BaseFilters, PaginatedResponse } from './common.interface';

/**
 * Interface principal para detalles de pedidos
 * Representa cada item individual dentro de un pedido
 */
export interface DetallePedido {
  id: number;
  pedido_id: number;
  producto_id: number | null;
  variacion_producto_id: number | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  moneda: 'PEN' | 'USD' | 'EUR';
  created_at: string;
  updated_at: string;

  // Relaciones
  pedido?: Pedido;
  producto?: Producto;
  variacion_producto?: VariacionProducto;
}

/**
 * DTO para crear un nuevo detalle de pedido
 */
export interface CreateDetallePedidoDto {
  pedido_id: number;
  producto_id?: number;
  variacion_producto_id?: number;
  cantidad: number;
  precio_unitario?: number;
  descuento?: number;
}

/**
 * DTO para actualizar un detalle de pedido existente
 */
export interface UpdateDetallePedidoDto {
  cantidad?: number;
  precio_unitario?: number;
  descuento?: number;
}

/**
 * Filtros para búsqueda y listado de detalles de pedido
 */
export interface DetallePedidoFilters extends BaseFilters {
  pedido_id?: number;
  producto_id?: number;
  variacion_producto_id?: number;
  cantidad_min?: number;
  cantidad_max?: number;
  precio_min?: number;
  precio_max?: number;
  subtotal_min?: number;
  subtotal_max?: number;
  total_min?: number;
  total_max?: number;
  moneda?: 'PEN' | 'USD' | 'EUR';
  fecha_desde?: string;
  fecha_hasta?: string;
  con_descuento?: boolean;
  producto_nombre?: string;
  sku?: string;
}

/**
 * Estadísticas de detalles de pedidos
 */
export interface DetallePedidoEstadisticas {
  total_items: number;
  cantidad_total_vendida: number;
  valor_total_vendido: number;
  ticket_promedio_item: number;
  descuento_total_aplicado: number;
  impuesto_total_generado: number;

  productos_mas_vendidos: Array<{
    producto_id: number;
    nombre: string;
    sku: string;
    cantidad_total: number;
    ingresos_total: number;
    veces_vendido: number;
    precio_promedio: number;
  }>;

  variaciones_mas_vendidas: Array<{
    variacion_id: number;
    nombre: string;
    sku: string;
    cantidad_total: number;
    ingresos_total: number;
    veces_vendido: number;
    precio_promedio: number;
  }>;

  metricas_por_moneda: Array<{
    moneda: 'PEN' | 'USD' | 'EUR';
    total_items: number;
    cantidad_total: number;
    ingresos_total: number;
    descuento_total: number;
    impuesto_total: number;
  }>;

  distribucion_por_cantidad: Array<{
    rango_cantidad: string;
    total_items: number;
    porcentaje: number;
  }>;

  tendencia_mensual: Array<{
    mes: string;
    total_items: number;
    cantidad_vendida: number;
    ingresos: number;
  }>;
}

/**
 * Respuesta paginada para detalles de pedido
 */
export interface DetallePedidoPaginatedResponse
  extends PaginatedResponse<DetallePedido> {
  estadisticas_resumen?: {
    total_items_pagina: number;
    cantidad_total_pagina: number;
    valor_total_pagina: number;
    descuento_total_pagina: number;
  };
}

/**
 * Interface para cálculos de detalles de pedido
 */
export interface DetallePedidoCalculos {
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  porcentaje_descuento: number;
  porcentaje_impuesto: number;
}

/**
 * Interface para validación de stock
 */
export interface ValidacionStock {
  producto_id: number;
  variacion_producto_id?: number;
  cantidad_solicitada: number;
  stock_disponible: number;
  es_valido: boolean;
  mensaje?: string;
}

/**
 * Interface para actualización masiva de detalles
 */
export interface UpdateMasivoDetallePedido {
  detalles: Array<{
    id: number;
    cantidad?: number;
    precio_unitario?: number;
    descuento?: number;
  }>;
  recalcular_totales?: boolean;
}

/**
 * Interface para resumen de detalle de pedido
 */
export interface ResumenDetallePedido {
  total_items: number;
  cantidad_total: number;
  subtotal_total: number;
  descuento_total: number;
  impuesto_total: number;
  total_general: number;
  productos_unicos: number;
  variaciones_unicas: number;
}

/**
 * Enums relacionados con detalles de pedido
 */
export enum TipoDescuentoDetalle {
  PORCENTAJE = 'porcentaje',
  MONTO_FIJO = 'monto_fijo',
  CUPON = 'cupon',
  PROMOCION = 'promocion',
}

export enum EstadoDetallePedido {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  EN_PREPARACION = 'en_preparacion',
  LISTO = 'listo',
  ENVIADO = 'enviado',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado',
  DEVUELTO = 'devuelto',
}

/**
 * Interface para configuración de impuestos
 */
export interface ConfiguracionImpuesto {
  tipo: 'IGV' | 'ISC' | 'OTROS';
  porcentaje: number;
  incluido_en_precio: boolean;
  aplicar_a_descuento: boolean;
}

/**
 * Interface para historial de cambios en detalles
 */
export interface HistorialDetallePedido {
  id: number;
  detalle_pedido_id: number;
  campo_modificado: string;
  valor_anterior: any;
  valor_nuevo: any;
  usuario_modificacion: string;
  fecha_modificacion: string;
  motivo?: string;
}

/**
 * Interface para exportación de detalles
 */
export interface ExportacionDetalles {
  formato: 'excel' | 'csv' | 'pdf';
  incluir_productos: boolean;
  incluir_variaciones: boolean;
  incluir_calculos: boolean;
  incluir_estadisticas: boolean;
  filtros?: DetallePedidoFilters;
}

/**
 * Constantes para detalles de pedido
 */
export const DETALLE_PEDIDO_CONSTANTS = {
  CANTIDAD_MINIMA: 1,
  CANTIDAD_MAXIMA: 9999,
  PRECIO_MINIMO: 0.01,
  PRECIO_MAXIMO: 999999.99,
  DESCUENTO_MAXIMO_PORCENTAJE: 100,
  IMPUESTO_IGV_PERU: 18,
  MONEDAS_SOPORTADAS: ['PEN', 'USD', 'EUR'] as const,
  DECIMALES_PRECIO: 2,
  DECIMALES_CANTIDAD: 0,
} as const;

/**
 * Tipos de utilidad para detalles de pedido
 */
export type MonedaDetalle =
  (typeof DETALLE_PEDIDO_CONSTANTS.MONEDAS_SOPORTADAS)[number];
export type CampoOrdenamiento =
  | 'cantidad'
  | 'precio_unitario'
  | 'subtotal'
  | 'total'
  | 'created_at';
export type DireccionOrdenamiento = 'asc' | 'desc';
