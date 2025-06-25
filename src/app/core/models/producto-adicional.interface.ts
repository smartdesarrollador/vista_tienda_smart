export interface ProductoAdicional {
  id: number;
  producto_id: number;
  adicional_id: number;
  precio_personalizado: number | null;
  obligatorio: boolean;
  maximo_cantidad: number | null;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;

  // Campos calculados
  precio_efectivo: number;
  precio_formateado: string;
  cantidad_texto: string;

  // Relaciones opcionales
  producto?: ProductoBasico;
  adicional?: AdicionalBasico;
}

export interface ProductoBasico {
  id: number;
  nombre: string;
  sku: string;
  activo: boolean;
}

export interface AdicionalBasico {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio: number;
  imagen: string | null;
  icono: string | null;
  tipo: string;
  disponible: boolean;
  activo: boolean;
  stock: number | null;
  vegetariano: boolean;
  vegano: boolean;
  imagen_url: string | null;
  icono_url: string | null;
}

// DTOs para crear y actualizar
export interface CreateProductoAdicionalDto {
  producto_id: number;
  adicional_id: number;
  precio_personalizado?: number | null;
  obligatorio?: boolean;
  maximo_cantidad?: number | null;
  orden?: number;
  activo?: boolean;
}

export interface UpdateProductoAdicionalDto {
  precio_personalizado?: number | null;
  obligatorio?: boolean;
  maximo_cantidad?: number | null;
  orden?: number;
  activo?: boolean;
}

// Filtros para búsqueda
export interface FiltrosProductoAdicional {
  producto_id?: number;
  adicional_id?: number;
  obligatorio?: boolean;
  activo?: boolean;
  precio_min?: number;
  precio_max?: number;
  tipo_adicional?: string;
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// Respuestas de la API
export interface ProductoAdicionalResponse {
  success: boolean;
  data: ProductoAdicional;
  message?: string;
}

export interface ProductoAdicionalesResponse {
  success: boolean;
  data: ProductoAdicional[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

// Estadísticas
export interface EstadisticasProductoAdicional {
  total_relaciones: number;
  relaciones_activas: number;
  relaciones_obligatorias: number;
  precio_promedio: number;
  productos_con_adicionales: number;
  adicionales_mas_usados: Array<{
    adicional_id: number;
    nombre: string;
    cantidad_productos: number;
  }>;
}

// Configuración de ordenamiento
export interface ConfiguracionOrden {
  producto_id: number;
  adicionales_orden: Array<{
    adicional_id: number;
    orden: number;
  }>;
}

// Funciones utilitarias
export function esProductoAdicionalObligatorio(
  productoAdicional: ProductoAdicional
): boolean {
  return productoAdicional.obligatorio && productoAdicional.activo;
}

export function obtenerPrecioEfectivo(
  productoAdicional: ProductoAdicional
): number {
  if (productoAdicional.precio_personalizado !== null) {
    return productoAdicional.precio_personalizado;
  }
  return productoAdicional.adicional?.precio || 0;
}

export function formatearPrecio(precio: number): string {
  return `S/ ${precio.toFixed(2)}`;
}

export function obtenerTextoMaximoCantidad(maximo: number | null): string {
  if (maximo === null) {
    return 'Sin límite';
  }
  if (maximo === 1) {
    return 'Máximo 1 unidad';
  }
  return `Máximo ${maximo} unidades`;
}

export function validarProductoAdicional(
  data: CreateProductoAdicionalDto | UpdateProductoAdicionalDto
): string[] {
  const errores: string[] = [];

  if ('producto_id' in data && (!data.producto_id || data.producto_id <= 0)) {
    errores.push('El ID del producto es requerido y debe ser válido');
  }

  if (
    'adicional_id' in data &&
    (!data.adicional_id || data.adicional_id <= 0)
  ) {
    errores.push('El ID del adicional es requerido y debe ser válido');
  }

  if (
    data.precio_personalizado !== undefined &&
    data.precio_personalizado !== null &&
    data.precio_personalizado < 0
  ) {
    errores.push('El precio personalizado no puede ser negativo');
  }

  if (
    data.maximo_cantidad !== undefined &&
    data.maximo_cantidad !== null &&
    data.maximo_cantidad < 1
  ) {
    errores.push('La cantidad máxima debe ser mayor a 0');
  }

  if (data.orden !== undefined && data.orden !== null && data.orden < 0) {
    errores.push('El orden no puede ser negativo');
  }

  return errores;
}

export function calcularTotalAdicionales(
  productosAdicionales: ProductoAdicional[],
  cantidades: { [key: number]: number }
): number {
  return productosAdicionales.reduce((total, productoAdicional) => {
    const cantidad = cantidades[productoAdicional.id] || 0;
    const precio = obtenerPrecioEfectivo(productoAdicional);
    return total + precio * cantidad;
  }, 0);
}

export function agruparPorProducto(productosAdicionales: ProductoAdicional[]): {
  [key: number]: ProductoAdicional[];
} {
  return productosAdicionales.reduce((grupos, productoAdicional) => {
    const productoId = productoAdicional.producto_id;
    if (!grupos[productoId]) {
      grupos[productoId] = [];
    }
    grupos[productoId].push(productoAdicional);
    return grupos;
  }, {} as { [key: number]: ProductoAdicional[] });
}

export function ordenarPorOrden(
  productosAdicionales: ProductoAdicional[]
): ProductoAdicional[] {
  return [...productosAdicionales].sort((a, b) => a.orden - b.orden);
}

// Constantes
export const OPCIONES_ORDEN = [
  { value: 'orden', label: 'Orden' },
  { value: 'nombre', label: 'Nombre del adicional' },
  { value: 'precio', label: 'Precio' },
  { value: 'created_at', label: 'Fecha de creación' },
] as const;

export const DIRECCIONES_ORDEN = [
  { value: 'asc', label: 'Ascendente' },
  { value: 'desc', label: 'Descendente' },
] as const;

export type OpcionOrden = (typeof OPCIONES_ORDEN)[number]['value'];
export type DireccionOrden = (typeof DIRECCIONES_ORDEN)[number]['value'];
