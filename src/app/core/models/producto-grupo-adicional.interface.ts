export interface ProductoGrupoAdicional {
  id: number;
  producto_id: number;
  grupo_adicional_id: number;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;

  // Relaciones opcionales
  producto?: ProductoDetalle;
  grupo_adicional?: GrupoAdicionalDetalle;
}

export interface ProductoDetalle {
  id: number;
  nombre: string;
  sku: string;
  activo: boolean;
}

export interface GrupoAdicionalDetalle {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  obligatorio: boolean;
  multiple_seleccion: boolean;
  minimo_seleccion: number | null;
  maximo_seleccion: number | null;
  activo: boolean;
  adicionales?: AdicionalDetalle[];
}

export interface AdicionalDetalle {
  id: number;
  nombre: string;
  precio: number;
  disponible: boolean;
  activo: boolean;
  stock: number | null;
  imagen_url: string | null;
}

// DTOs para crear y actualizar
export interface CreateProductoGrupoAdicionalDto {
  producto_id: number;
  grupo_adicional_id: number;
  obligatorio?: boolean;
  minimo_selecciones?: number;
  maximo_selecciones?: number;
  orden?: number;
  activo?: boolean;
}

export interface UpdateProductoGrupoAdicionalDto {
  obligatorio?: boolean;
  minimo_selecciones?: number;
  maximo_selecciones?: number;
  orden?: number;
  activo?: boolean;
}

// Filtros para búsqueda
export interface FiltrosProductoGrupoAdicional {
  producto_id?: number;
  grupo_adicional_id?: number;
  activo?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// Respuestas de la API
export interface ProductoGrupoAdicionalResponse {
  success: boolean;
  data: ProductoGrupoAdicional;
  message?: string;
}

export interface ProductosGrupoAdicionalResponse {
  success: boolean;
  data: ProductoGrupoAdicional[];
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
export interface EstadisticasProductoGrupoAdicional {
  total_relaciones: number;
  productos_con_grupos: number;
  grupos_en_productos: number;
  relaciones_activas: number;
  relaciones_inactivas: number;
  promedio_grupos_por_producto: number;
  productos_mas_populares: Array<{
    producto_id: number;
    producto_nombre: string;
    cantidad_grupos: number;
  }>;
  grupos_mas_usados: Array<{
    grupo_id: number;
    grupo_nombre: string;
    cantidad_productos: number;
  }>;
}

// Configuración de ordenamiento masivo
export interface ConfiguracionOrdenProductoGrupo {
  relaciones_orden: Array<{
    id: number;
    orden: number;
  }>;
}

// Agrupación por producto
export interface GrupoPorProducto {
  producto_id: number;
  producto_nombre: string;
  producto_sku: string;
  grupos: ProductoGrupoAdicional[];
}

// Agrupación por grupo adicional
export interface ProductoPorGrupo {
  grupo_adicional_id: number;
  grupo_nombre: string;
  grupo_descripcion: string | null;
  productos: ProductoGrupoAdicional[];
}

// Configuración de relación producto-grupo
export interface ConfiguracionProductoGrupo {
  producto_id: number;
  grupos_configuracion: Array<{
    grupo_adicional_id: number;
    obligatorio: boolean;
    minimo_selecciones: number;
    maximo_selecciones: number;
    orden: number;
    activo: boolean;
  }>;
}

// Constantes
export const OPCIONES_ORDEN_PRODUCTO_GRUPO = [
  { value: 'orden', label: 'Orden' },
  { value: 'created_at', label: 'Fecha de creación' },
  { value: 'producto_id', label: 'ID Producto' },
  { value: 'grupo_adicional_id', label: 'ID Grupo' },
] as const;

export const DIRECCIONES_ORDEN_PRODUCTO_GRUPO = [
  { value: 'asc', label: 'Ascendente' },
  { value: 'desc', label: 'Descendente' },
] as const;

export const ESTADOS_RELACION = [
  { value: true, label: 'Activo' },
  { value: false, label: 'Inactivo' },
] as const;

export type OpcionOrdenProductoGrupo =
  (typeof OPCIONES_ORDEN_PRODUCTO_GRUPO)[number]['value'];
export type DireccionOrdenProductoGrupo =
  (typeof DIRECCIONES_ORDEN_PRODUCTO_GRUPO)[number]['value'];
export type EstadoRelacion = (typeof ESTADOS_RELACION)[number]['value'];

// Funciones utilitarias
export function validarProductoGrupoAdicional(
  data: CreateProductoGrupoAdicionalDto | UpdateProductoGrupoAdicionalDto
): string[] {
  const errores: string[] = [];

  if ('producto_id' in data) {
    if (!data.producto_id || data.producto_id <= 0) {
      errores.push('El ID del producto es requerido y debe ser mayor a 0');
    }
  }

  if ('grupo_adicional_id' in data) {
    if (!data.grupo_adicional_id || data.grupo_adicional_id <= 0) {
      errores.push(
        'El ID del grupo adicional es requerido y debe ser mayor a 0'
      );
    }
  }

  if (data.orden !== undefined && data.orden !== null && data.orden < 0) {
    errores.push('El orden no puede ser negativo');
  }

  if (
    data.minimo_selecciones !== undefined &&
    data.minimo_selecciones !== null &&
    data.minimo_selecciones < 0
  ) {
    errores.push('El mínimo de selecciones no puede ser negativo');
  }

  if (
    data.maximo_selecciones !== undefined &&
    data.maximo_selecciones !== null &&
    data.maximo_selecciones < 0
  ) {
    errores.push('El máximo de selecciones no puede ser negativo');
  }

  if (
    data.minimo_selecciones !== undefined &&
    data.maximo_selecciones !== undefined &&
    data.minimo_selecciones !== null &&
    data.maximo_selecciones !== null &&
    data.minimo_selecciones > data.maximo_selecciones
  ) {
    errores.push('El mínimo de selecciones no puede ser mayor al máximo');
  }

  return errores;
}

export function validarRelacionProductoGrupoExistente(
  relaciones: ProductoGrupoAdicional[],
  productoId: number,
  grupoId: number
): boolean {
  return relaciones.some(
    (rel) =>
      rel.producto_id === productoId && rel.grupo_adicional_id === grupoId
  );
}

export function obtenerSiguienteOrdenProducto(
  relaciones: ProductoGrupoAdicional[],
  productoId: number
): number {
  const relacionesDelProducto = relaciones.filter(
    (rel) => rel.producto_id === productoId
  );
  if (relacionesDelProducto.length === 0) {
    return 1;
  }

  const maxOrden = Math.max(...relacionesDelProducto.map((rel) => rel.orden));
  return maxOrden + 1;
}

export function agruparPorProducto(
  relaciones: ProductoGrupoAdicional[]
): GrupoPorProducto[] {
  const productos = new Map<number, GrupoPorProducto>();

  relaciones.forEach((relacion) => {
    const productoId = relacion.producto_id;

    if (!productos.has(productoId)) {
      productos.set(productoId, {
        producto_id: productoId,
        producto_nombre: relacion.producto?.nombre || `Producto ${productoId}`,
        producto_sku: relacion.producto?.sku || '',
        grupos: [],
      });
    }

    productos.get(productoId)!.grupos.push(relacion);
  });

  return Array.from(productos.values()).map((producto) => ({
    ...producto,
    grupos: producto.grupos.sort((a, b) => a.orden - b.orden),
  }));
}

export function agruparPorGrupoAdicional(
  relaciones: ProductoGrupoAdicional[]
): ProductoPorGrupo[] {
  const grupos = new Map<number, ProductoPorGrupo>();

  relaciones.forEach((relacion) => {
    const grupoId = relacion.grupo_adicional_id;

    if (!grupos.has(grupoId)) {
      grupos.set(grupoId, {
        grupo_adicional_id: grupoId,
        grupo_nombre: relacion.grupo_adicional?.nombre || `Grupo ${grupoId}`,
        grupo_descripcion: relacion.grupo_adicional?.descripcion || null,
        productos: [],
      });
    }

    grupos.get(grupoId)!.productos.push(relacion);
  });

  return Array.from(grupos.values());
}

export function ordenarPorOrden(
  relaciones: ProductoGrupoAdicional[]
): ProductoGrupoAdicional[] {
  return [...relaciones].sort((a, b) => {
    // Primero por producto, luego por orden
    if (a.producto_id !== b.producto_id) {
      return a.producto_id - b.producto_id;
    }
    return a.orden - b.orden;
  });
}

export function filtrarPorProducto(
  relaciones: ProductoGrupoAdicional[],
  productoId: number
): ProductoGrupoAdicional[] {
  return relaciones.filter((rel) => rel.producto_id === productoId);
}

export function filtrarPorGrupo(
  relaciones: ProductoGrupoAdicional[],
  grupoId: number
): ProductoGrupoAdicional[] {
  return relaciones.filter((rel) => rel.grupo_adicional_id === grupoId);
}

export function filtrarPorEstado(
  relaciones: ProductoGrupoAdicional[],
  activo: boolean
): ProductoGrupoAdicional[] {
  return relaciones.filter((rel) => rel.activo === activo);
}

export function obtenerGruposDeProducto(
  relaciones: ProductoGrupoAdicional[],
  productoId: number
): GrupoAdicionalDetalle[] {
  return relaciones
    .filter((rel) => rel.producto_id === productoId && rel.grupo_adicional)
    .sort((a, b) => a.orden - b.orden)
    .map((rel) => rel.grupo_adicional!);
}

export function obtenerProductosDeGrupo(
  relaciones: ProductoGrupoAdicional[],
  grupoId: number
): ProductoDetalle[] {
  return relaciones
    .filter((rel) => rel.grupo_adicional_id === grupoId && rel.producto)
    .map((rel) => rel.producto!);
}

export function calcularEstadisticas(
  relaciones: ProductoGrupoAdicional[]
): EstadisticasProductoGrupoAdicional {
  const productosUnicos = new Set(relaciones.map((rel) => rel.producto_id));
  const gruposUnicos = new Set(relaciones.map((rel) => rel.grupo_adicional_id));
  const relacionesActivas = relaciones.filter((rel) => rel.activo);
  const relacionesInactivas = relaciones.filter((rel) => !rel.activo);

  // Productos más populares (con más grupos)
  const productoContador = new Map<
    number,
    { nombre: string; sku: string; count: number }
  >();
  relaciones.forEach((rel) => {
    const productoId = rel.producto_id;
    const nombre = rel.producto?.nombre || `Producto ${productoId}`;
    const sku = rel.producto?.sku || '';

    if (!productoContador.has(productoId)) {
      productoContador.set(productoId, { nombre, sku, count: 0 });
    }
    productoContador.get(productoId)!.count++;
  });

  // Grupos más usados (en más productos)
  const grupoContador = new Map<number, { nombre: string; count: number }>();
  relaciones.forEach((rel) => {
    const grupoId = rel.grupo_adicional_id;
    const nombre = rel.grupo_adicional?.nombre || `Grupo ${grupoId}`;

    if (!grupoContador.has(grupoId)) {
      grupoContador.set(grupoId, { nombre, count: 0 });
    }
    grupoContador.get(grupoId)!.count++;
  });

  const productos_mas_populares = Array.from(productoContador.entries())
    .map(([id, data]) => ({
      producto_id: id,
      producto_nombre: data.nombre,
      cantidad_grupos: data.count,
    }))
    .sort((a, b) => b.cantidad_grupos - a.cantidad_grupos)
    .slice(0, 10);

  const grupos_mas_usados = Array.from(grupoContador.entries())
    .map(([id, data]) => ({
      grupo_id: id,
      grupo_nombre: data.nombre,
      cantidad_productos: data.count,
    }))
    .sort((a, b) => b.cantidad_productos - a.cantidad_productos)
    .slice(0, 10);

  return {
    total_relaciones: relaciones.length,
    productos_con_grupos: productosUnicos.size,
    grupos_en_productos: gruposUnicos.size,
    relaciones_activas: relacionesActivas.length,
    relaciones_inactivas: relacionesInactivas.length,
    promedio_grupos_por_producto:
      productosUnicos.size > 0 ? relaciones.length / productosUnicos.size : 0,
    productos_mas_populares,
    grupos_mas_usados,
  };
}

export function reordenarRelacionesProducto(
  relaciones: ProductoGrupoAdicional[],
  productoId: number,
  nuevosOrdenes: Array<{ id: number; orden: number }>
): ProductoGrupoAdicional[] {
  return relaciones.map((rel) => {
    if (rel.producto_id === productoId) {
      const nuevoOrden = nuevosOrdenes.find((o) => o.id === rel.id);
      if (nuevoOrden) {
        return { ...rel, orden: nuevoOrden.orden };
      }
    }
    return rel;
  });
}

export function validarOrdenUnicoProducto(
  relaciones: ProductoGrupoAdicional[],
  productoId: number,
  orden: number,
  excludeId?: number
): boolean {
  return !relaciones.some(
    (rel) =>
      rel.producto_id === productoId &&
      rel.orden === orden &&
      rel.id !== excludeId
  );
}

export function normalizarOrdenesProducto(
  relaciones: ProductoGrupoAdicional[],
  productoId: number
): ProductoGrupoAdicional[] {
  const relacionesDelProducto = relaciones
    .filter((rel) => rel.producto_id === productoId)
    .sort((a, b) => a.orden - b.orden);

  const relacionesActualizadas = relacionesDelProducto.map((rel, index) => ({
    ...rel,
    orden: index + 1,
  }));

  return relaciones.map((rel) => {
    if (rel.producto_id === productoId) {
      const actualizada = relacionesActualizadas.find((r) => r.id === rel.id);
      return actualizada || rel;
    }
    return rel;
  });
}

export function toggleEstadoRelacion(
  relaciones: ProductoGrupoAdicional[],
  id: number
): ProductoGrupoAdicional[] {
  return relaciones.map((rel) =>
    rel.id === id ? { ...rel, activo: !rel.activo } : rel
  );
}

export function formatearRelacionProductoGrupo(
  relacion: ProductoGrupoAdicional
): string {
  const productoNombre =
    relacion.producto?.nombre || `Producto ${relacion.producto_id}`;
  const grupoNombre =
    relacion.grupo_adicional?.nombre || `Grupo ${relacion.grupo_adicional_id}`;
  const estado = relacion.activo ? 'Activo' : 'Inactivo';
  return `${productoNombre} → ${grupoNombre} (Orden: ${relacion.orden}, ${estado})`;
}

export function buscarRelacionesProductoGrupo(
  relaciones: ProductoGrupoAdicional[],
  termino: string
): ProductoGrupoAdicional[] {
  const terminoLower = termino.toLowerCase();

  return relaciones.filter((rel) => {
    const productoNombre = rel.producto?.nombre?.toLowerCase() || '';
    const productoSku = rel.producto?.sku?.toLowerCase() || '';
    const grupoNombre = rel.grupo_adicional?.nombre?.toLowerCase() || '';
    const grupoDescripcion =
      rel.grupo_adicional?.descripcion?.toLowerCase() || '';

    return (
      productoNombre.includes(terminoLower) ||
      productoSku.includes(terminoLower) ||
      grupoNombre.includes(terminoLower) ||
      grupoDescripcion.includes(terminoLower)
    );
  });
}

export function obtenerConfiguracionProducto(
  relaciones: ProductoGrupoAdicional[],
  productoId: number
): ConfiguracionProductoGrupo {
  const relacionesDelProducto = relaciones
    .filter((rel) => rel.producto_id === productoId)
    .sort((a, b) => a.orden - b.orden);

  return {
    producto_id: productoId,
    grupos_configuracion: relacionesDelProducto.map((rel) => ({
      grupo_adicional_id: rel.grupo_adicional_id,
      obligatorio: rel.grupo_adicional?.obligatorio || false,
      minimo_selecciones: rel.grupo_adicional?.minimo_seleccion || 0,
      maximo_selecciones: rel.grupo_adicional?.maximo_seleccion || 1,
      orden: rel.orden,
      activo: rel.activo,
    })),
  };
}

export function validarConfiguracionProducto(
  configuracion: ConfiguracionProductoGrupo
): string[] {
  const errores: string[] = [];

  if (!configuracion.producto_id || configuracion.producto_id <= 0) {
    errores.push('El ID del producto es requerido');
  }

  configuracion.grupos_configuracion.forEach((grupo, index) => {
    if (!grupo.grupo_adicional_id || grupo.grupo_adicional_id <= 0) {
      errores.push(`Grupo ${index + 1}: ID del grupo adicional es requerido`);
    }

    if (grupo.minimo_selecciones < 0) {
      errores.push(
        `Grupo ${index + 1}: El mínimo de selecciones no puede ser negativo`
      );
    }

    if (grupo.maximo_selecciones < 0) {
      errores.push(
        `Grupo ${index + 1}: El máximo de selecciones no puede ser negativo`
      );
    }

    if (grupo.minimo_selecciones > grupo.maximo_selecciones) {
      errores.push(
        `Grupo ${index + 1}: El mínimo no puede ser mayor al máximo`
      );
    }

    if (grupo.orden < 0) {
      errores.push(`Grupo ${index + 1}: El orden no puede ser negativo`);
    }
  });

  // Verificar órdenes únicos
  const ordenes = configuracion.grupos_configuracion.map((g) => g.orden);
  const ordenesUnicos = new Set(ordenes);
  if (ordenes.length !== ordenesUnicos.size) {
    errores.push('Los órdenes de los grupos deben ser únicos');
  }

  return errores;
}

export function clonarConfiguracionProducto(
  configuracionOrigen: ConfiguracionProductoGrupo,
  productoDestinoId: number
): ConfiguracionProductoGrupo {
  return {
    producto_id: productoDestinoId,
    grupos_configuracion: configuracionOrigen.grupos_configuracion.map(
      (grupo) => ({ ...grupo })
    ),
  };
}

export function compararConfiguraciones(
  config1: ConfiguracionProductoGrupo,
  config2: ConfiguracionProductoGrupo
): boolean {
  if (
    config1.grupos_configuracion.length !== config2.grupos_configuracion.length
  ) {
    return false;
  }

  const grupos1 = config1.grupos_configuracion.sort(
    (a, b) => a.orden - b.orden
  );
  const grupos2 = config2.grupos_configuracion.sort(
    (a, b) => a.orden - b.orden
  );

  return grupos1.every((grupo1, index) => {
    const grupo2 = grupos2[index];
    return (
      grupo1.grupo_adicional_id === grupo2.grupo_adicional_id &&
      grupo1.obligatorio === grupo2.obligatorio &&
      grupo1.minimo_selecciones === grupo2.minimo_selecciones &&
      grupo1.maximo_selecciones === grupo2.maximo_selecciones &&
      grupo1.orden === grupo2.orden &&
      grupo1.activo === grupo2.activo
    );
  });
}
