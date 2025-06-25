/**
 * Interfaces para el sistema de carrito de compras
 */

export interface ItemCarrito {
  id: string;
  producto_id: number;
  variacion_id?: number;
  nombre: string;
  slug: string;
  imagen: string;
  precio: number;
  precio_oferta?: number;
  cantidad: number;
  stock_disponible: number;
  sku?: string;
  peso: number; // Peso en kilogramos

  // Información de variaciones
  variacion?: {
    color?: {
      nombre: string;
      hex: string;
    };
    talla?: string;
    [key: string]: any;
  };

  // Cálculos
  subtotal: number;
  descuento_aplicado?: number;

  // Metadatos
  agregado_en: Date;
  modificado_en: Date;
}

export interface ResumenCarrito {
  items_count: number;
  subtotal: number;
  descuentos: number;
  descuentos_aplicados: DescuentoAplicado[];
  impuestos: number;
  costo_envio: number;
  envio_gratis: boolean;
  total: number;
  peso_total?: number;
}

export interface DescuentoAplicado {
  tipo: 'cupon' | 'promocion' | 'descuento_volumen' | 'envio_gratis';
  codigo?: string;
  descripcion: string;
  monto: number;
  porcentaje?: number;
}

export interface CuponDescuento {
  id: number;
  codigo: string;
  descripcion: string;
  tipo: 'porcentaje' | 'monto_fijo' | 'envio_gratis';
  valor: number;
  monto_minimo?: number;
  monto_maximo?: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  usos_maximos?: number;
  usos_por_usuario?: number;
  productos_incluidos?: number[];
  productos_excluidos?: number[];
  categorias_incluidas?: number[];
  activo: boolean;
}

export interface ValidacionCupon {
  valido: boolean;
  mensaje: string;
  descuento_calculado?: number;
  cupon?: CuponDescuento;
}

export interface OpcionEnvio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  tiempo_entrega_min: number;
  tiempo_entrega_max: number;
  tiempo_unidad: 'horas' | 'dias' | 'semanas';
  empresa?: string;
  incluye_seguro?: boolean;
  incluye_tracking?: boolean;
  logo_empresa?: string;
  gratis_desde?: number;
  disponible?: boolean;
  transportista?: string;
  icono?: string;
}

export interface DireccionEnvio {
  id: string;
  alias: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  referencia?: string;
  codigo_postal: string;
  tipo_direccion: 'casa' | 'oficina' | 'otro';
  predeterminada: boolean;
  activa?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface CalculoEnvio {
  departamento: string;
  provincia: string;
  distrito: string;
  codigo_postal?: string;
  opciones_disponibles: OpcionEnvio[];
  opcion_seleccionada?: OpcionEnvio;
  peso_total: number;
  valor_total: number;
}

export interface EstadoCarrito {
  items: ItemCarrito[];
  resumen: ResumenCarrito;
  cupon_aplicado?: CuponDescuento;
  envio?: CalculoEnvio;

  // Estados de UI
  cargando: boolean;
  error?: string;
  guardado_en: Date;
  sincronizado: boolean;
}

export interface ConfiguracionCarrito {
  maximo_items: number;
  maximo_cantidad_por_item: number;
  tiempo_sesion_minutos: number;
  auto_limpiar_items_sin_stock: boolean;
  mostrar_productos_relacionados: boolean;
  permitir_compra_sin_cuenta: boolean;
  calcular_impuestos: boolean;
  porcentaje_igv: number;
}

// Request/Response interfaces para APIs
export interface AgregarItemRequest {
  producto_id: number;
  variacion_id?: number;
  cantidad: number;
}

export interface ActualizarCantidadRequest {
  item_id: string;
  cantidad: number;
}

export interface AplicarCuponRequest {
  codigo: string;
}

export interface CalcularEnvioRequest {
  departamento: string;
  provincia: string;
  distrito: string;
  codigo_postal?: string;
}

export interface CarritoResponse {
  success: boolean;
  message: string;
  data: EstadoCarrito;
  errors?: string[];
}

export interface ProductoRelacionado {
  id: number;
  nombre: string;
  slug: string;
  precio: number;
  precio_oferta?: number;
  imagen: string;
  stock: number;
  calificacion: number;
  categoria: string;
}

// Eventos del carrito
export interface EventoCarrito {
  tipo:
    | 'item_agregado'
    | 'item_removido'
    | 'cantidad_actualizada'
    | 'cupon_aplicado'
    | 'carrito_limpiado';
  item?: ItemCarrito;
  cantidad_anterior?: number;
  cantidad_nueva?: number;
  cupon?: string;
  timestamp: Date;
}
