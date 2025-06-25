export interface CarritoTemporal {
  id: number;
  user_id: number | null;
  session_id: string | null;
  producto_id: number;
  variacion_id: number | null;
  cantidad: number;
  precio_unitario: number;
  adicionales_seleccionados: AdicionalSeleccionado[] | null;
  observaciones: string | null;
  fecha_expiracion: string | null;
  created_at: string;
  updated_at: string;

  // Información calculada
  subtotal: number;
  subtotal_formateado: string;
  precio_unitario_formateado: string;
  total_adicionales: number;
  cantidad_adicionales: number;
  esta_expirado: boolean;
  minutos_para_expiracion: number | null;

  // Relaciones
  usuario?: UsuarioCarrito;
  producto?: ProductoCarrito;
  variacion?: VariacionCarrito;
  adicionales_detalle: AdicionalDetalle[];

  // Validaciones
  validaciones: ValidacionesCarrito;
}

export interface UsuarioCarrito {
  id: number;
  nombre: string;
  email: string;
}

export interface ProductoCarrito {
  id: number;
  nombre: string;
  sku: string;
  precio: number;
  imagen_principal: string | null;
  activo: boolean;
  disponible: boolean;
  stock: number | null;
}

export interface VariacionCarrito {
  id: number;
  nombre: string;
  sku: string;
  precio: number;
  precio_oferta: number | null;
  stock: number | null;
  disponible: boolean;
}

export interface AdicionalSeleccionado {
  [key: string]: {
    cantidad: number;
    precio: number;
    nombre: string;
  };
}

export interface AdicionalDetalle {
  adicional_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  nombre: string;
}

export interface ValidacionesCarrito {
  producto_disponible: boolean;
  stock_suficiente: boolean;
  precio_actualizado: boolean;
  carrito_valido: boolean;
}

// DTOs para operaciones
export interface CreateCarritoTemporalDto {
  user_id?: number;
  session_id?: string;
  producto_id: number;
  variacion_id?: number;
  cantidad: number;
  adicionales_seleccionados?: AdicionalSeleccionado[];
  observaciones?: string;
}

export interface UpdateCarritoTemporalDto {
  cantidad?: number;
  adicionales_seleccionados?: AdicionalSeleccionado[];
  observaciones?: string;
}

export interface LimpiarCarritoDto {
  user_id?: number;
  session_id?: string;
}

// Filtros para consultas
export interface FiltrosCarritoTemporal {
  user_id?: number;
  session_id?: string;
  per_page?: number;
  page?: number;
}

// Respuestas de la API
export interface CarritoTemporalResponse {
  data: CarritoTemporal;
  message?: string;
}

export interface CarritosTemporalResponse {
  data: CarritoTemporal[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
}

export interface LimpiarCarritoResponse {
  message: string;
  items_eliminados: number;
}

// Estadísticas del carrito
export interface EstadisticasCarrito {
  total_items: number;
  total_productos: number;
  subtotal_general: number;
  total_adicionales: number;
  items_expirados: number;
  items_validos: number;
  productos_mas_agregados: ProductoEstadistica[];
  usuarios_activos: number;
  sesiones_activas: number;
}

export interface ProductoEstadistica {
  producto_id: number;
  nombre: string;
  cantidad_total: number;
  veces_agregado: number;
}

// Constantes y enums
export const TIEMPO_EXPIRACION_HORAS = 24;

export const ESTADOS_CARRITO = {
  VALIDO: 'valido',
  EXPIRADO: 'expirado',
  SIN_STOCK: 'sin_stock',
  PRODUCTO_INACTIVO: 'producto_inactivo',
} as const;

export type EstadoCarrito =
  (typeof ESTADOS_CARRITO)[keyof typeof ESTADOS_CARRITO];

// Funciones utilitarias
export function esCarritoValido(carrito: CarritoTemporal): boolean {
  return carrito.validaciones.carrito_valido && !carrito.esta_expirado;
}

export function calcularTotalCarrito(carritos: CarritoTemporal[]): number {
  return carritos
    .filter((carrito) => esCarritoValido(carrito))
    .reduce((total, carrito) => total + carrito.subtotal, 0);
}

export function obtenerProductosUnicos(
  carritos: CarritoTemporal[]
): ProductoCarrito[] {
  const productosMap = new Map<number, ProductoCarrito>();

  carritos.forEach((carrito) => {
    if (carrito.producto && !productosMap.has(carrito.producto.id)) {
      productosMap.set(carrito.producto.id, carrito.producto);
    }
  });

  return Array.from(productosMap.values());
}

export function agruparPorProducto(
  carritos: CarritoTemporal[]
): Map<number, CarritoTemporal[]> {
  const grupos = new Map<number, CarritoTemporal[]>();

  carritos.forEach((carrito) => {
    const key = carrito.producto_id;
    if (!grupos.has(key)) {
      grupos.set(key, []);
    }
    grupos.get(key)!.push(carrito);
  });

  return grupos;
}

export function formatearTiempoExpiracion(minutos: number | null): string {
  if (!minutos || minutos <= 0) {
    return 'Expirado';
  }

  if (minutos < 60) {
    return `${minutos} min`;
  }

  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  if (minutosRestantes === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${minutosRestantes}min`;
}

export function validarCantidad(
  cantidad: number,
  stockDisponible: number | null
): boolean {
  if (cantidad <= 0 || cantidad > 999) {
    return false;
  }

  if (stockDisponible !== null && cantidad > stockDisponible) {
    return false;
  }

  return true;
}

export function obtenerMensajeValidacion(carrito: CarritoTemporal): string {
  if (carrito.esta_expirado) {
    return 'Este item ha expirado';
  }

  if (!carrito.validaciones.producto_disponible) {
    return 'Producto no disponible';
  }

  if (!carrito.validaciones.stock_suficiente) {
    return 'Stock insuficiente';
  }

  if (!carrito.validaciones.precio_actualizado) {
    return 'Precio desactualizado';
  }

  return 'Item válido';
}

export function crearSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function esItemDuplicado(
  carritos: CarritoTemporal[],
  productoId: number,
  variacionId?: number
): CarritoTemporal | null {
  return (
    carritos.find(
      (carrito) =>
        carrito.producto_id === productoId &&
        carrito.variacion_id === variacionId
    ) || null
  );
}
