/**
 * Interfaces para Inventario Movimiento
 * Basado en InventarioMovimientoResource.php y InventarioMovimientoController.php
 */

// Interfaz principal del movimiento de inventario
export interface InventarioMovimiento {
  id: number;
  producto_id: number;
  variacion_id: number | null;
  tipo_movimiento: TipoMovimiento;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo: string;
  referencia: string | null;
  usuario_id: number;
  created_at: string;
  updated_at: string;

  // Información calculada del Resource
  tipo_movimiento_texto: string;
  cantidad_absoluta: number;
  diferencia_stock: number;
  es_movimiento_positivo: boolean;
  es_movimiento_valido: boolean;
  fecha_formateada: string;

  // Relaciones
  producto?: ProductoMovimiento;
  variacion?: VariacionMovimiento;
  usuario?: UsuarioMovimiento;

  // Información del movimiento
  detalle_movimiento: DetalleMovimiento;

  // Auditoría del stock
  auditoria_stock: AuditoriaStock;
}

// Tipos de movimiento permitidos
export type TipoMovimiento =
  | 'entrada'
  | 'salida'
  | 'ajuste'
  | 'reserva'
  | 'liberacion';

// Constantes para tipos de movimiento
export const TIPOS_MOVIMIENTO: Record<TipoMovimiento, string> = {
  entrada: 'Entrada de inventario',
  salida: 'Salida de inventario',
  ajuste: 'Ajuste de inventario',
  reserva: 'Reserva de stock',
  liberacion: 'Liberación de reserva',
} as const;

// Interfaz para producto en movimiento
export interface ProductoMovimiento {
  id: number;
  nombre: string;
  sku: string;
  stock_actual: number;
  activo: boolean;
}

// Interfaz para variación en movimiento
export interface VariacionMovimiento {
  id: number;
  nombre: string;
  sku: string;
  stock_actual: number;
  disponible: boolean;
}

// Interfaz para usuario en movimiento
export interface UsuarioMovimiento {
  id: number;
  nombre: string;
  email: string;
}

// Interfaz para detalle del movimiento
export interface DetalleMovimiento {
  impacto_texto: string;
  motivo_detallado: string;
  requiere_atencion: boolean;
  es_critico: boolean;
}

// Interfaz para auditoría del stock
export interface AuditoriaStock {
  stock_antes: number;
  stock_despues: number;
  cambio: number;
  cambio_esperado: number;
  discrepancia: number;
  auditoria_correcta: boolean;
}

// DTOs para operaciones CRUD

// DTO para crear movimiento
export interface CreateInventarioMovimientoDto {
  producto_id: number;
  variacion_id?: number | null;
  tipo_movimiento: TipoMovimiento;
  cantidad: number;
  motivo: string;
  referencia?: string | null;
}

// DTO para actualizar movimiento (solo algunos campos editables)
export interface UpdateInventarioMovimientoDto {
  motivo?: string;
  referencia?: string | null;
}

// Interfaces para filtros y búsqueda

// Filtros para listado de movimientos
export interface FiltrosInventarioMovimiento {
  producto_id?: number;
  variacion_id?: number;
  tipo_movimiento?: TipoMovimiento;
  usuario_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  per_page?: number;
  page?: number;
  order_by?: 'created_at' | 'tipo_movimiento' | 'cantidad' | 'stock_nuevo';
  order_direction?: 'asc' | 'desc';
}

// Interfaz para paginación
export interface PaginacionInventarioMovimiento {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

// Respuestas de la API

// Respuesta para listado de movimientos
export interface InventarioMovimientosResponse {
  data: InventarioMovimiento[];
  meta: PaginacionInventarioMovimiento;
}

// Respuesta para movimiento individual
export interface InventarioMovimientoResponse {
  data: InventarioMovimiento;
}

// Respuesta para crear movimiento
export interface CreateInventarioMovimientoResponse {
  message: string;
  data: InventarioMovimiento;
}

// Interfaces para reportes

// Filtros para reporte
export interface FiltrosReporteInventario {
  fecha_desde: string;
  fecha_hasta: string;
  producto_id?: number;
  variacion_id?: number;
  tipo_movimiento?: TipoMovimiento;
  usuario_id?: number;
  incluir_detalles?: boolean;
}

// Resumen de movimientos para reporte
export interface ResumenMovimientos {
  total_movimientos: number;
  entradas: ResumenTipoMovimiento;
  salidas: ResumenTipoMovimiento;
  ajustes: ResumenTipoMovimiento;
  reservas: ResumenTipoMovimiento;
  liberaciones: ResumenTipoMovimiento;
}

// Resumen por tipo de movimiento
export interface ResumenTipoMovimiento {
  cantidad: number;
  total_unidades: number;
}

// Respuesta del reporte
export interface ReporteInventarioResponse {
  periodo: {
    fecha_desde: string;
    fecha_hasta: string;
  };
  resumen: ResumenMovimientos;
  movimientos?: InventarioMovimiento[];
}

// Interfaces para estadísticas

// Filtros para estadísticas
export interface FiltrosEstadisticasInventario {
  dias?: number;
  producto_id?: number;
}

// Estadísticas por tipo
export interface EstadisticasPorTipo {
  entradas: number;
  salidas: number;
  ajustes: number;
  reservas: number;
  liberaciones: number;
}

// Cantidades por tipo
export interface CantidadesPorTipo {
  total_entradas: number;
  total_salidas: number;
  total_ajustes: number;
}

// Producto más movido
export interface ProductoMasMovido {
  producto_id: number;
  nombre: string;
  sku: string;
  total_movimientos: number;
  total_cantidad: number;
}

// Usuario más activo
export interface UsuarioMasActivo {
  usuario_id: number;
  nombre: string;
  email: string;
  total_movimientos: number;
}

// Respuesta de estadísticas
export interface EstadisticasInventarioResponse {
  periodo_dias: number;
  total_movimientos: number;
  por_tipo: EstadisticasPorTipo;
  cantidades: CantidadesPorTipo;
  productos_mas_movidos: ProductoMasMovido[];
  usuarios_mas_activos: UsuarioMasActivo[];
}

// Interfaces para validaciones y errores

// Errores de validación
export interface ErroresValidacionInventario {
  producto_id?: string[];
  variacion_id?: string[];
  tipo_movimiento?: string[];
  cantidad?: string[];
  motivo?: string[];
  referencia?: string[];
}

// Respuesta de error
export interface ErrorInventarioResponse {
  message: string;
  errors?: ErroresValidacionInventario;
  error?: string;
}

// Funciones utilitarias

/**
 * Verifica si un movimiento es positivo (aumenta el stock)
 */
export function esMovimientoPositivo(
  tipoMovimiento: TipoMovimiento,
  cantidad: number
): boolean {
  return (
    tipoMovimiento === 'entrada' ||
    tipoMovimiento === 'liberacion' ||
    (tipoMovimiento === 'ajuste' && cantidad > 0)
  );
}

/**
 * Obtiene el texto descriptivo del tipo de movimiento
 */
export function getTipoMovimientoTexto(tipo: TipoMovimiento): string {
  return TIPOS_MOVIMIENTO[tipo] || 'Movimiento desconocido';
}

/**
 * Calcula el impacto en el stock
 */
export function calcularImpactoStock(
  stockAnterior: number,
  stockNuevo: number
): number {
  return stockNuevo - stockAnterior;
}

/**
 * Verifica si un movimiento requiere atención
 */
export function requiereAtencion(movimiento: InventarioMovimiento): boolean {
  return (
    movimiento.stock_nuevo <= 0 ||
    !movimiento.es_movimiento_valido ||
    !movimiento.auditoria_stock.auditoria_correcta
  );
}

/**
 * Verifica si un movimiento es crítico
 */
export function esCritico(movimiento: InventarioMovimiento): boolean {
  return movimiento.stock_nuevo < 0 || movimiento.stock_anterior < 0;
}

/**
 * Formatea la cantidad para mostrar
 */
export function formatearCantidad(
  cantidad: number,
  tipoMovimiento: TipoMovimiento
): string {
  const signo = esMovimientoPositivo(tipoMovimiento, cantidad) ? '+' : '-';
  return `${signo}${Math.abs(cantidad)}`;
}

/**
 * Obtiene la clase CSS para el tipo de movimiento
 */
export function getClaseTipoMovimiento(tipo: TipoMovimiento): string {
  const clases: Record<TipoMovimiento, string> = {
    entrada: 'text-green-600 bg-green-100',
    salida: 'text-red-600 bg-red-100',
    ajuste: 'text-blue-600 bg-blue-100',
    reserva: 'text-yellow-600 bg-yellow-100',
    liberacion: 'text-purple-600 bg-purple-100',
  };
  return clases[tipo] || 'text-gray-600 bg-gray-100';
}

/**
 * Obtiene el ícono para el tipo de movimiento
 */
export function getIconoTipoMovimiento(tipo: TipoMovimiento): string {
  const iconos: Record<TipoMovimiento, string> = {
    entrada: 'arrow-up',
    salida: 'arrow-down',
    ajuste: 'edit',
    reserva: 'lock',
    liberacion: 'unlock',
  };
  return iconos[tipo] || 'help';
}

/**
 * Valida los datos de un movimiento antes de enviar
 */
export function validarMovimiento(
  movimiento: CreateInventarioMovimientoDto
): string[] {
  const errores: string[] = [];

  if (!movimiento.producto_id) {
    errores.push('El producto es requerido');
  }

  if (!movimiento.tipo_movimiento) {
    errores.push('El tipo de movimiento es requerido');
  }

  if (!movimiento.cantidad || movimiento.cantidad <= 0) {
    errores.push('La cantidad debe ser mayor a 0');
  }

  if (!movimiento.motivo || movimiento.motivo.trim().length === 0) {
    errores.push('El motivo es requerido');
  }

  if (movimiento.motivo && movimiento.motivo.length > 500) {
    errores.push('El motivo no puede exceder 500 caracteres');
  }

  if (movimiento.referencia && movimiento.referencia.length > 100) {
    errores.push('La referencia no puede exceder 100 caracteres');
  }

  return errores;
}

/**
 * Agrupa movimientos por fecha
 */
export function agruparPorFecha(
  movimientos: InventarioMovimiento[]
): Record<string, InventarioMovimiento[]> {
  return movimientos.reduce((grupos, movimiento) => {
    const fecha = movimiento.created_at.split('T')[0]; // Obtener solo la fecha
    if (!grupos[fecha]) {
      grupos[fecha] = [];
    }
    grupos[fecha].push(movimiento);
    return grupos;
  }, {} as Record<string, InventarioMovimiento[]>);
}

/**
 * Agrupa movimientos por tipo
 */
export function agruparPorTipo(
  movimientos: InventarioMovimiento[]
): Record<TipoMovimiento, InventarioMovimiento[]> {
  return movimientos.reduce((grupos, movimiento) => {
    if (!grupos[movimiento.tipo_movimiento]) {
      grupos[movimiento.tipo_movimiento] = [];
    }
    grupos[movimiento.tipo_movimiento].push(movimiento);
    return grupos;
  }, {} as Record<TipoMovimiento, InventarioMovimiento[]>);
}

/**
 * Calcula el total de unidades por tipo de movimiento
 */
export function calcularTotalUnidades(
  movimientos: InventarioMovimiento[],
  tipo: TipoMovimiento
): number {
  return movimientos
    .filter((m) => m.tipo_movimiento === tipo)
    .reduce((total, m) => total + Math.abs(m.cantidad), 0);
}

/**
 * Obtiene los movimientos críticos
 */
export function obtenerMovimientosCriticos(
  movimientos: InventarioMovimiento[]
): InventarioMovimiento[] {
  return movimientos.filter((m) => esCritico(m));
}

/**
 * Obtiene los movimientos que requieren atención
 */
export function obtenerMovimientosAtencion(
  movimientos: InventarioMovimiento[]
): InventarioMovimiento[] {
  return movimientos.filter((m) => requiereAtencion(m));
}
