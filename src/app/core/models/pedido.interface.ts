import {
  PaginationMeta,
  PaginationLinks,
  PaginatedResponse,
  BaseFilters,
} from './common.interface';

export interface Pedido {
  id: number;
  user_id: number;
  total: number;
  estado: EstadoPedido;
  tipo_pago: TipoPago;
  cuotas: number | null;
  monto_cuota: number | null;
  interes_total: number | null;
  descuento_total: number;
  observaciones: string | null;
  codigo_rastreo: string | null;
  moneda: Moneda;
  canal_venta: CanalVenta;
  created_at: string;
  updated_at: string;

  // Campos calculados
  numero_items: number;
  subtotal: number;
  total_sin_descuento: number;
  estado_detallado: EstadoDetallado;
  puede_cancelar: boolean;
  dias_desde_pedido: number;
  estimado_entrega: string | null;

  // Relaciones
  usuario: UsuarioPedido;
  detalles: DetallePedido[];
  pagos?: Pago[];
  cuotas_credito?: CuotaCredito[];
}

export interface DetallePedido {
  id: number;
  pedido_id: number;
  producto_id: number;
  variacion_id: number | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  descuento: number;
  impuesto: number;
  moneda: Moneda;
  created_at: string;

  // Campos calculados
  total_linea: number;
  precio_con_descuento: number;

  // Relaciones
  producto: ProductoPedido;
  variacion: VariacionPedido | null;
}

export interface UsuarioPedido {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  limite_credito?: number;
}

export interface ProductoPedido {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;
  precio_oferta: number | null;
  stock: number;
  sku: string;
  codigo_barras: string;
  imagen_principal: string;
  destacado: boolean;
  activo: boolean;
  categoria_id: number;
  marca: string;
  modelo: string;
  garantia: string;
  meta_title: string;
  meta_description: string;
  idioma: string;
  moneda: Moneda;
  atributos_extra: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface VariacionPedido {
  id: number;
  producto_id: number;
  sku: string;
  precio: number;
  precio_oferta: number | null;
  stock: number;
  activo: boolean;
  atributos: Record<string, any>;
  created_at: string;
  updated_at: string;
  disponible: boolean;
  estado_stock: EstadoStock;
  descuento_porcentaje?: number;
}

export interface EstadoDetallado {
  codigo: EstadoPedido;
  nombre: string;
  descripcion: string;
}

export interface Pago {
  id: number;
  pedido_id: number;
  monto: number;
  numero_cuota: number | null;
  fecha_pago: string;
  estado: EstadoPago;
  metodo: MetodoPago;
  referencia: string | null;
  moneda: Moneda;
  created_at: string;
  updated_at: string;
}

export interface CuotaCredito {
  id: number;
  pedido_id: number;
  numero_cuota: number;
  monto: number;
  fecha_vencimiento: string;
  fecha_pago: string | null;
  estado: EstadoCuota;
  created_at: string;
  updated_at: string;
}

// Enums y tipos
export type EstadoPedido =
  | 'pendiente'
  | 'aprobado'
  | 'rechazado'
  | 'en_proceso'
  | 'enviado'
  | 'entregado'
  | 'cancelado'
  | 'devuelto';

export type TipoPago =
  | 'contado'
  | 'credito'
  | 'transferencia'
  | 'tarjeta'
  | 'yape'
  | 'plin'
  | 'paypal';

export type CanalVenta =
  | 'web'
  | 'app'
  | 'tienda_fisica'
  | 'telefono'
  | 'whatsapp';

export type Moneda = 'PEN' | 'USD' | 'EUR';

export type EstadoStock = 'disponible' | 'stock_limitado' | 'sin_stock';

export type EstadoPago = 'pendiente' | 'pagado' | 'atrasado' | 'cancelado';

export type MetodoPago =
  | 'efectivo'
  | 'tarjeta'
  | 'transferencia'
  | 'yape'
  | 'plin'
  | 'paypal';

export type EstadoCuota = 'pendiente' | 'pagada' | 'atrasada' | 'cancelada';

// DTOs para formularios
export interface CreatePedidoDto {
  user_id: number;
  tipo_pago: TipoPago;
  cuotas?: number;
  observaciones?: string;
  canal_venta?: CanalVenta;
  moneda?: Moneda;
  cupon_codigo?: string;
  items: CreateDetallePedidoDto[];
}

export interface CreateDetallePedidoDto {
  producto_id: number;
  variacion_id?: number;
  cantidad: number;
  descuento?: number;
}

export interface UpdatePedidoDto {
  observaciones?: string;
  canal_venta?: CanalVenta;
  codigo_rastreo?: string;
}

export interface CambiarEstadoDto {
  estado: EstadoPedido;
  observaciones?: string;
  codigo_rastreo?: string;
}

export interface AplicarCuponDto {
  codigo_cupon: string;
}

// Interfaces para filtros y búsqueda
export interface PedidoFilters extends BaseFilters {
  user_id?: number;
  estado?: EstadoPedido | EstadoPedido[];
  tipo_pago?: TipoPago | TipoPago[];
  fecha_desde?: string;
  fecha_hasta?: string;
  total_min?: number;
  total_max?: number;
  canal_venta?: CanalVenta;
  codigo_rastreo?: string;
  sort_by?:
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'total'
    | 'estado'
    | 'tipo_pago';
}

// Interfaces para respuestas paginadas usando las comunes
export interface PedidoResponse extends PaginatedResponse<Pedido> {}

// Interfaces para estadísticas
export interface EstadisticasPedidos {
  resumen: ResumenEstadisticas;
  por_estado: EstadisticaPorEstado[];
  por_tipo_pago: EstadisticaPorTipoPago[];
  por_canal_venta: EstadisticaPorCanalVenta[];
  ventas_diarias: VentaDiaria[];
  top_clientes: TopCliente[];
  productos_mas_vendidos: ProductoMasVendido[];
}

export interface ResumenEstadisticas {
  total_pedidos: number;
  total_ventas: number;
  ticket_promedio: number;
  pedidos_pendientes: number;
  pedidos_entregados: number;
}

export interface EstadisticaPorEstado {
  estado: EstadoPedido;
  cantidad: number;
  total_ventas: number;
}

export interface EstadisticaPorTipoPago {
  tipo_pago: TipoPago;
  cantidad: number;
  total_ventas: number;
}

export interface EstadisticaPorCanalVenta {
  canal_venta: CanalVenta;
  cantidad: number;
  total_ventas: number;
}

export interface VentaDiaria {
  fecha: string;
  pedidos: number;
  ventas: number;
}

export interface TopCliente {
  id: number;
  nombre: string;
  email: string;
  pedidos_count: number;
  pedidos_sum_total: number;
}

export interface ProductoMasVendido {
  producto_id: number;
  total_vendido: number;
  total_ingresos: number;
  producto: {
    id: number;
    nombre: string;
    sku: string;
  };
}

export interface EstadisticasResponse {
  estadisticas: EstadisticasPedidos;
  periodo: {
    desde: string;
    hasta: string;
    dias: number;
  };
}

// Interfaces para respuestas específicas
export interface PedidosPorUsuarioResponse {
  data: Pedido[];
  meta: PaginationMeta;
  usuario: UsuarioPedido;
}

export interface AplicarCuponResponse {
  message: string;
  descuento_aplicado: number;
  total_anterior: number;
  nuevo_total: number;
  pedido: Pedido;
}

// Constantes para opciones de formularios
export const ESTADOS_PEDIDO: {
  value: EstadoPedido;
  label: string;
  color: string;
}[] = [
  { value: 'pendiente', label: 'Pendiente', color: 'warning' },
  { value: 'aprobado', label: 'Aprobado', color: 'info' },
  { value: 'rechazado', label: 'Rechazado', color: 'danger' },
  { value: 'en_proceso', label: 'En Proceso', color: 'primary' },
  { value: 'enviado', label: 'Enviado', color: 'secondary' },
  { value: 'entregado', label: 'Entregado', color: 'success' },
  { value: 'cancelado', label: 'Cancelado', color: 'dark' },
  { value: 'devuelto', label: 'Devuelto', color: 'warning' },
];

export const TIPOS_PAGO: { value: TipoPago; label: string; icon: string }[] = [
  { value: 'contado', label: 'Contado', icon: 'fas fa-money-bill' },
  { value: 'credito', label: 'Crédito', icon: 'fas fa-credit-card' },
  {
    value: 'transferencia',
    label: 'Transferencia',
    icon: 'fas fa-exchange-alt',
  },
  { value: 'tarjeta', label: 'Tarjeta', icon: 'fas fa-credit-card' },
  { value: 'yape', label: 'Yape', icon: 'fas fa-mobile-alt' },
  { value: 'plin', label: 'Plin', icon: 'fas fa-mobile-alt' },
  { value: 'paypal', label: 'PayPal', icon: 'fab fa-paypal' },
];

export const CANALES_VENTA: {
  value: CanalVenta;
  label: string;
  icon: string;
}[] = [
  { value: 'web', label: 'Sitio Web', icon: 'fas fa-globe' },
  { value: 'app', label: 'App Móvil', icon: 'fas fa-mobile-alt' },
  { value: 'tienda_fisica', label: 'Tienda Física', icon: 'fas fa-store' },
  { value: 'telefono', label: 'Teléfono', icon: 'fas fa-phone' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'fab fa-whatsapp' },
];

export const MONEDAS: { value: Moneda; label: string; symbol: string }[] = [
  { value: 'PEN', label: 'Soles Peruanos', symbol: 'S/' },
  { value: 'USD', label: 'Dólares Americanos', symbol: '$' },
  { value: 'EUR', label: 'Euros', symbol: '€' },
];

// Transiciones válidas de estado
export const TRANSICIONES_ESTADO: Record<EstadoPedido, EstadoPedido[]> = {
  pendiente: ['aprobado', 'rechazado', 'cancelado'],
  aprobado: ['en_proceso', 'cancelado'],
  en_proceso: ['enviado', 'cancelado'],
  enviado: ['entregado', 'devuelto'],
  entregado: ['devuelto'],
  rechazado: [],
  cancelado: [],
  devuelto: [],
};
