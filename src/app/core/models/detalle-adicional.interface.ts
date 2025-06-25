export interface DetalleAdicional {
  id: number;
  detalle_pedido_id: number;
  adicional_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  observaciones: string | null;
  created_at: string;
  updated_at: string;

  // Información calculada
  precio_unitario_formateado: string;
  subtotal_formateado: string;
  total_calculado: number;
  es_subtotal_correcto: boolean;

  // Relaciones opcionales
  detalle_pedido?: DetallePedidoInfo;
  adicional?: AdicionalInfo;
  diferencia_precio?: DiferenciaPrecio;
}

export interface DetallePedidoInfo {
  id: number;
  pedido_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface AdicionalInfo {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio_actual: number;
  imagen: string | null;
  icono: string | null;
  tipo: string;
  disponible: boolean;
  activo: boolean;
  vegetariano: boolean;
  vegano: boolean;
  imagen_url: string | null;
  icono_url: string | null;
}

export interface DiferenciaPrecio {
  precio_actual_adicional: number;
  precio_en_pedido: number;
  diferencia: number;
  precio_cambio: boolean;
  precio_aumento: boolean;
}

// DTOs para crear y actualizar
export interface CreateDetalleAdicionalDto {
  detalle_pedido_id: number;
  adicional_id: number;
  cantidad: number;
  precio_unitario: number;
  observaciones?: string;
}

export interface UpdateDetalleAdicionalDto {
  cantidad?: number;
  precio_unitario?: number;
  observaciones?: string;
}

// Filtros para búsqueda
export interface FiltrosDetalleAdicional {
  detalle_pedido_id?: number;
  adicional_id?: number;
  pedido_id?: number;
  producto_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  precio_min?: number;
  precio_max?: number;
  con_observaciones?: boolean;
  tipo_adicional?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// Respuestas de la API
export interface DetalleAdicionalResponse {
  success: boolean;
  data: DetalleAdicional;
  message?: string;
}

export interface DetallesAdicionalesResponse {
  success: boolean;
  data: DetalleAdicional[];
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
export interface EstadisticasDetalleAdicional {
  total_detalles: number;
  total_cantidad: number;
  total_valor: number;
  promedio_precio_unitario: number;
  promedio_cantidad_por_detalle: number;
  detalles_con_observaciones: number;
  detalles_con_diferencia_precio: number;
  adicionales_mas_pedidos: Array<{
    adicional_id: number;
    adicional_nombre: string;
    total_cantidad: number;
    total_valor: number;
    frecuencia: number;
  }>;
  productos_con_mas_adicionales: Array<{
    producto_id: number;
    producto_nombre: string;
    total_adicionales: number;
    valor_promedio_adicionales: number;
  }>;
  tipos_adicionales_populares: Array<{
    tipo: string;
    cantidad: number;
    valor_total: number;
  }>;
}

// Agrupación por detalle de pedido
export interface AdicionalesPorDetallePedido {
  detalle_pedido_id: number;
  pedido_id: number;
  producto_id: number;
  adicionales: DetalleAdicional[];
  total_adicionales: number;
  valor_total_adicionales: number;
}

// Agrupación por adicional
export interface DetallesPorAdicional {
  adicional_id: number;
  adicional_nombre: string;
  adicional_tipo: string;
  detalles: DetalleAdicional[];
  total_cantidad: number;
  valor_total: number;
  frecuencia_uso: number;
}

// Resumen de pedido con adicionales
export interface ResumenPedidoAdicionales {
  pedido_id: number;
  detalles_pedido: Array<{
    detalle_pedido_id: number;
    producto_nombre: string;
    adicionales: DetalleAdicional[];
    valor_adicionales: number;
  }>;
  total_adicionales_pedido: number;
  valor_total_adicionales: number;
}

// Constantes
export const OPCIONES_ORDEN_DETALLE_ADICIONAL = [
  { value: 'created_at', label: 'Fecha de creación' },
  { value: 'precio_unitario', label: 'Precio unitario' },
  { value: 'cantidad', label: 'Cantidad' },
  { value: 'subtotal', label: 'Subtotal' },
  { value: 'detalle_pedido_id', label: 'ID Detalle Pedido' },
  { value: 'adicional_id', label: 'ID Adicional' },
] as const;

export const DIRECCIONES_ORDEN_DETALLE_ADICIONAL = [
  { value: 'asc', label: 'Ascendente' },
  { value: 'desc', label: 'Descendente' },
] as const;

export const TIPOS_ADICIONAL = [
  { value: 'ingrediente', label: 'Ingrediente' },
  { value: 'salsa', label: 'Salsa' },
  { value: 'bebida', label: 'Bebida' },
  { value: 'postre', label: 'Postre' },
  { value: 'acompañamiento', label: 'Acompañamiento' },
  { value: 'extra', label: 'Extra' },
] as const;

export type OpcionOrdenDetalleAdicional =
  (typeof OPCIONES_ORDEN_DETALLE_ADICIONAL)[number]['value'];
export type DireccionOrdenDetalleAdicional =
  (typeof DIRECCIONES_ORDEN_DETALLE_ADICIONAL)[number]['value'];
export type TipoAdicional = (typeof TIPOS_ADICIONAL)[number]['value'];

// Funciones utilitarias
export function validarDetalleAdicional(
  data: CreateDetalleAdicionalDto | UpdateDetalleAdicionalDto
): string[] {
  const errores: string[] = [];

  if ('detalle_pedido_id' in data) {
    if (!data.detalle_pedido_id || data.detalle_pedido_id <= 0) {
      errores.push(
        'El ID del detalle de pedido es requerido y debe ser mayor a 0'
      );
    }
  }

  if ('adicional_id' in data) {
    if (!data.adicional_id || data.adicional_id <= 0) {
      errores.push('El ID del adicional es requerido y debe ser mayor a 0');
    }
  }

  if ('cantidad' in data && data.cantidad !== undefined) {
    if (!data.cantidad || data.cantidad <= 0) {
      errores.push('La cantidad debe ser mayor a 0');
    }
  }

  if ('precio_unitario' in data && data.precio_unitario !== undefined) {
    if (data.precio_unitario < 0) {
      errores.push('El precio unitario no puede ser negativo');
    }
  }

  if (data.observaciones && data.observaciones.length > 500) {
    errores.push('Las observaciones no pueden exceder 500 caracteres');
  }

  return errores;
}

export function calcularSubtotal(
  cantidad: number,
  precioUnitario: number
): number {
  return Number((cantidad * precioUnitario).toFixed(2));
}

export function validarSubtotal(detalle: DetalleAdicional): boolean {
  const subtotalCalculado = calcularSubtotal(
    detalle.cantidad,
    detalle.precio_unitario
  );
  return Math.abs(detalle.subtotal - subtotalCalculado) < 0.01;
}

export function formatearPrecio(precio: number, moneda: string = 'S/'): string {
  return `${moneda} ${precio.toFixed(2)}`;
}

export function agruparPorDetallePedido(
  detalles: DetalleAdicional[]
): AdicionalesPorDetallePedido[] {
  const grupos = new Map<number, AdicionalesPorDetallePedido>();

  detalles.forEach((detalle) => {
    const detallePedidoId = detalle.detalle_pedido_id;

    if (!grupos.has(detallePedidoId)) {
      grupos.set(detallePedidoId, {
        detalle_pedido_id: detallePedidoId,
        pedido_id: detalle.detalle_pedido?.pedido_id || 0,
        producto_id: detalle.detalle_pedido?.producto_id || 0,
        adicionales: [],
        total_adicionales: 0,
        valor_total_adicionales: 0,
      });
    }

    const grupo = grupos.get(detallePedidoId)!;
    grupo.adicionales.push(detalle);
    grupo.total_adicionales += detalle.cantidad;
    grupo.valor_total_adicionales += detalle.subtotal;
  });

  return Array.from(grupos.values());
}

export function agruparPorAdicional(
  detalles: DetalleAdicional[]
): DetallesPorAdicional[] {
  const grupos = new Map<number, DetallesPorAdicional>();

  detalles.forEach((detalle) => {
    const adicionalId = detalle.adicional_id;

    if (!grupos.has(adicionalId)) {
      grupos.set(adicionalId, {
        adicional_id: adicionalId,
        adicional_nombre:
          detalle.adicional?.nombre || `Adicional ${adicionalId}`,
        adicional_tipo: detalle.adicional?.tipo || 'Sin tipo',
        detalles: [],
        total_cantidad: 0,
        valor_total: 0,
        frecuencia_uso: 0,
      });
    }

    const grupo = grupos.get(adicionalId)!;
    grupo.detalles.push(detalle);
    grupo.total_cantidad += detalle.cantidad;
    grupo.valor_total += detalle.subtotal;
    grupo.frecuencia_uso++;
  });

  return Array.from(grupos.values()).sort(
    (a, b) => b.valor_total - a.valor_total
  );
}

export function agruparPorPedido(
  detalles: DetalleAdicional[]
): ResumenPedidoAdicionales[] {
  const pedidos = new Map<number, ResumenPedidoAdicionales>();

  detalles.forEach((detalle) => {
    const pedidoId = detalle.detalle_pedido?.pedido_id || 0;

    if (!pedidos.has(pedidoId)) {
      pedidos.set(pedidoId, {
        pedido_id: pedidoId,
        detalles_pedido: [],
        total_adicionales_pedido: 0,
        valor_total_adicionales: 0,
      });
    }

    const pedido = pedidos.get(pedidoId)!;

    // Buscar o crear detalle de pedido
    let detallePedido = pedido.detalles_pedido.find(
      (d) => d.detalle_pedido_id === detalle.detalle_pedido_id
    );
    if (!detallePedido) {
      detallePedido = {
        detalle_pedido_id: detalle.detalle_pedido_id,
        producto_nombre: `Producto ${detalle.detalle_pedido?.producto_id || 0}`,
        adicionales: [],
        valor_adicionales: 0,
      };
      pedido.detalles_pedido.push(detallePedido);
    }

    detallePedido.adicionales.push(detalle);
    detallePedido.valor_adicionales += detalle.subtotal;
    pedido.total_adicionales_pedido += detalle.cantidad;
    pedido.valor_total_adicionales += detalle.subtotal;
  });

  return Array.from(pedidos.values());
}

export function calcularEstadisticas(
  detalles: DetalleAdicional[]
): EstadisticasDetalleAdicional {
  const totalDetalles = detalles.length;
  const totalCantidad = detalles.reduce((sum, d) => sum + d.cantidad, 0);
  const totalValor = detalles.reduce((sum, d) => sum + d.subtotal, 0);
  const detallesConObservaciones = detalles.filter(
    (d) => d.observaciones && d.observaciones.trim().length > 0
  ).length;
  const detallesConDiferenciaPrecio = detalles.filter(
    (d) => d.diferencia_precio?.precio_cambio
  ).length;

  // Adicionales más pedidos
  const adicionalesMap = new Map<
    number,
    {
      nombre: string;
      cantidad: number;
      valor: number;
      frecuencia: number;
    }
  >();

  detalles.forEach((detalle) => {
    const adicionalId = detalle.adicional_id;
    const nombre = detalle.adicional?.nombre || `Adicional ${adicionalId}`;

    if (!adicionalesMap.has(adicionalId)) {
      adicionalesMap.set(adicionalId, {
        nombre,
        cantidad: 0,
        valor: 0,
        frecuencia: 0,
      });
    }

    const adicional = adicionalesMap.get(adicionalId)!;
    adicional.cantidad += detalle.cantidad;
    adicional.valor += detalle.subtotal;
    adicional.frecuencia++;
  });

  const adicionalesMasPedidos = Array.from(adicionalesMap.entries())
    .map(([id, data]) => ({
      adicional_id: id,
      adicional_nombre: data.nombre,
      total_cantidad: data.cantidad,
      total_valor: data.valor,
      frecuencia: data.frecuencia,
    }))
    .sort((a, b) => b.total_cantidad - a.total_cantidad)
    .slice(0, 10);

  // Productos con más adicionales
  const productosMap = new Map<
    number,
    {
      nombre: string;
      totalAdicionales: number;
      valorTotal: number;
      count: number;
    }
  >();

  detalles.forEach((detalle) => {
    const productoId = detalle.detalle_pedido?.producto_id || 0;
    const nombre = `Producto ${productoId}`;

    if (!productosMap.has(productoId)) {
      productosMap.set(productoId, {
        nombre,
        totalAdicionales: 0,
        valorTotal: 0,
        count: 0,
      });
    }

    const producto = productosMap.get(productoId)!;
    producto.totalAdicionales += detalle.cantidad;
    producto.valorTotal += detalle.subtotal;
    producto.count++;
  });

  const productosConMasAdicionales = Array.from(productosMap.entries())
    .map(([id, data]) => ({
      producto_id: id,
      producto_nombre: data.nombre,
      total_adicionales: data.totalAdicionales,
      valor_promedio_adicionales:
        data.count > 0 ? data.valorTotal / data.count : 0,
    }))
    .sort((a, b) => b.total_adicionales - a.total_adicionales)
    .slice(0, 10);

  // Tipos de adicionales populares
  const tiposMap = new Map<string, { cantidad: number; valor: number }>();

  detalles.forEach((detalle) => {
    const tipo = detalle.adicional?.tipo || 'Sin tipo';

    if (!tiposMap.has(tipo)) {
      tiposMap.set(tipo, { cantidad: 0, valor: 0 });
    }

    const tipoData = tiposMap.get(tipo)!;
    tipoData.cantidad += detalle.cantidad;
    tipoData.valor += detalle.subtotal;
  });

  const tiposAdicionalesPopulares = Array.from(tiposMap.entries())
    .map(([tipo, data]) => ({
      tipo,
      cantidad: data.cantidad,
      valor_total: data.valor,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);

  return {
    total_detalles: totalDetalles,
    total_cantidad: totalCantidad,
    total_valor: totalValor,
    promedio_precio_unitario:
      totalDetalles > 0 ? totalValor / totalCantidad : 0,
    promedio_cantidad_por_detalle:
      totalDetalles > 0 ? totalCantidad / totalDetalles : 0,
    detalles_con_observaciones: detallesConObservaciones,
    detalles_con_diferencia_precio: detallesConDiferenciaPrecio,
    adicionales_mas_pedidos: adicionalesMasPedidos,
    productos_con_mas_adicionales: productosConMasAdicionales,
    tipos_adicionales_populares: tiposAdicionalesPopulares,
  };
}

export function filtrarPorDetallePedido(
  detalles: DetalleAdicional[],
  detallePedidoId: number
): DetalleAdicional[] {
  return detalles.filter((d) => d.detalle_pedido_id === detallePedidoId);
}

export function filtrarPorAdicional(
  detalles: DetalleAdicional[],
  adicionalId: number
): DetalleAdicional[] {
  return detalles.filter((d) => d.adicional_id === adicionalId);
}

export function filtrarPorPedido(
  detalles: DetalleAdicional[],
  pedidoId: number
): DetalleAdicional[] {
  return detalles.filter((d) => d.detalle_pedido?.pedido_id === pedidoId);
}

export function filtrarPorTipoAdicional(
  detalles: DetalleAdicional[],
  tipo: string
): DetalleAdicional[] {
  return detalles.filter((d) => d.adicional?.tipo === tipo);
}

export function filtrarConObservaciones(
  detalles: DetalleAdicional[]
): DetalleAdicional[] {
  return detalles.filter(
    (d) => d.observaciones && d.observaciones.trim().length > 0
  );
}

export function filtrarConDiferenciaPrecio(
  detalles: DetalleAdicional[]
): DetalleAdicional[] {
  return detalles.filter((d) => d.diferencia_precio?.precio_cambio);
}

export function filtrarPorRangoPrecio(
  detalles: DetalleAdicional[],
  min: number,
  max: number
): DetalleAdicional[] {
  return detalles.filter(
    (d) => d.precio_unitario >= min && d.precio_unitario <= max
  );
}

export function ordenarPorPrecio(
  detalles: DetalleAdicional[],
  direccion: 'asc' | 'desc' = 'desc'
): DetalleAdicional[] {
  return [...detalles].sort((a, b) => {
    return direccion === 'asc'
      ? a.precio_unitario - b.precio_unitario
      : b.precio_unitario - a.precio_unitario;
  });
}

export function ordenarPorCantidad(
  detalles: DetalleAdicional[],
  direccion: 'asc' | 'desc' = 'desc'
): DetalleAdicional[] {
  return [...detalles].sort((a, b) => {
    return direccion === 'asc'
      ? a.cantidad - b.cantidad
      : b.cantidad - a.cantidad;
  });
}

export function ordenarPorSubtotal(
  detalles: DetalleAdicional[],
  direccion: 'asc' | 'desc' = 'desc'
): DetalleAdicional[] {
  return [...detalles].sort((a, b) => {
    return direccion === 'asc'
      ? a.subtotal - b.subtotal
      : b.subtotal - a.subtotal;
  });
}

export function buscarDetallesAdicionales(
  detalles: DetalleAdicional[],
  termino: string
): DetalleAdicional[] {
  const terminoLower = termino.toLowerCase();

  return detalles.filter((detalle) => {
    const adicionalNombre = detalle.adicional?.nombre?.toLowerCase() || '';
    const adicionalDescripcion =
      detalle.adicional?.descripcion?.toLowerCase() || '';
    const observaciones = detalle.observaciones?.toLowerCase() || '';
    const adicionalTipo = detalle.adicional?.tipo?.toLowerCase() || '';

    return (
      adicionalNombre.includes(terminoLower) ||
      adicionalDescripcion.includes(terminoLower) ||
      observaciones.includes(terminoLower) ||
      adicionalTipo.includes(terminoLower)
    );
  });
}

export function obtenerTotalValorAdicionales(
  detalles: DetalleAdicional[]
): number {
  return detalles.reduce((total, detalle) => total + detalle.subtotal, 0);
}

export function obtenerTotalCantidadAdicionales(
  detalles: DetalleAdicional[]
): number {
  return detalles.reduce((total, detalle) => total + detalle.cantidad, 0);
}

export function obtenerPromedioValorPorDetalle(
  detalles: DetalleAdicional[]
): number {
  if (detalles.length === 0) return 0;
  return obtenerTotalValorAdicionales(detalles) / detalles.length;
}

export function obtenerPromedioCantidadPorDetalle(
  detalles: DetalleAdicional[]
): number {
  if (detalles.length === 0) return 0;
  return obtenerTotalCantidadAdicionales(detalles) / detalles.length;
}

export function formatearDetalleAdicional(detalle: DetalleAdicional): string {
  const adicionalNombre =
    detalle.adicional?.nombre || `Adicional ${detalle.adicional_id}`;
  const observaciones = detalle.observaciones
    ? ` (${detalle.observaciones})`
    : '';
  return `${adicionalNombre} x${detalle.cantidad} - ${detalle.subtotal_formateado}${observaciones}`;
}

export function validarConsistenciaPrecios(
  detalles: DetalleAdicional[]
): Array<{
  detalle: DetalleAdicional;
  errores: string[];
}> {
  return detalles
    .map((detalle) => {
      const errores: string[] = [];

      if (!validarSubtotal(detalle)) {
        errores.push('El subtotal no coincide con cantidad × precio unitario');
      }

      if (detalle.diferencia_precio?.precio_cambio) {
        errores.push(
          'El precio del adicional ha cambiado desde que se realizó el pedido'
        );
      }

      if (detalle.precio_unitario < 0) {
        errores.push('El precio unitario no puede ser negativo');
      }

      if (detalle.cantidad <= 0) {
        errores.push('La cantidad debe ser mayor a 0');
      }

      return { detalle, errores };
    })
    .filter((item) => item.errores.length > 0);
}

export function generarResumenDetallePedido(
  detalles: DetalleAdicional[],
  detallePedidoId: number
): {
  detalle_pedido_id: number;
  adicionales: DetalleAdicional[];
  total_adicionales: number;
  valor_total: number;
  adicionales_por_tipo: Record<string, number>;
} {
  const adicionalesDetalle = filtrarPorDetallePedido(detalles, detallePedidoId);
  const totalAdicionales = obtenerTotalCantidadAdicionales(adicionalesDetalle);
  const valorTotal = obtenerTotalValorAdicionales(adicionalesDetalle);

  const adicionalesPorTipo: Record<string, number> = {};
  adicionalesDetalle.forEach((detalle) => {
    const tipo = detalle.adicional?.tipo || 'Sin tipo';
    adicionalesPorTipo[tipo] =
      (adicionalesPorTipo[tipo] || 0) + detalle.cantidad;
  });

  return {
    detalle_pedido_id: detallePedidoId,
    adicionales: adicionalesDetalle,
    total_adicionales: totalAdicionales,
    valor_total: valorTotal,
    adicionales_por_tipo: adicionalesPorTipo,
  };
}
