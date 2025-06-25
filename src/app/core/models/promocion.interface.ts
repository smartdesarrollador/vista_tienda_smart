/**
 * Interfaces para Promociones
 * Basado en PromocionResource.php y PromocionController.php
 */

// Interfaz principal de la promoción
export interface Promocion {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  tipo: TipoPromocion;
  descuento_porcentaje: number | null;
  descuento_monto: number | null;
  compra_minima: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  productos_incluidos: number[] | null;
  categorias_incluidas: number[] | null;
  zonas_aplicables: number[] | null;
  limite_uso_total: number | null;
  limite_uso_cliente: number | null;
  usos_actuales: number;
  imagen: string | null;
  created_at: string;
  updated_at: string;

  // Información calculada del Resource
  tipo_texto: string;
  descuento_texto: string;
  compra_minima_formateada: string | null;
  fecha_inicio_formateada: string;
  fecha_fin_formateada: string;
  imagen_url: string | null;

  // Estado de la promoción
  estado_promocion: EstadoPromocion;

  // Alcance de la promoción
  alcance: AlcancePromocion;

  // Validaciones
  validaciones: ValidacionesPromocion;
}

// Tipos de promoción permitidos
export type TipoPromocion =
  | 'descuento_producto'
  | 'descuento_categoria'
  | '2x1'
  | '3x2'
  | 'envio_gratis'
  | 'combo';

// Constantes para tipos de promoción
export const TIPOS_PROMOCION: Record<TipoPromocion, string> = {
  descuento_producto: 'Descuento en productos',
  descuento_categoria: 'Descuento en categorías',
  '2x1': 'Promoción 2x1',
  '3x2': 'Promoción 3x2',
  envio_gratis: 'Envío gratis',
  combo: 'Combo especial',
} as const;

// Interfaz para estado de la promoción
export interface EstadoPromocion {
  vigente: boolean;
  disponible: boolean;
  por_comenzar: boolean;
  expirada: boolean;
  agotada: boolean;
  dias_restantes: number | null;
  usos_restantes: number | null;
  porcentaje_uso: number;
}

// Interfaz para alcance de la promoción
export interface AlcancePromocion {
  productos_count: number;
  categorias_count: number;
  zonas_count: number;
  es_promocion_general: boolean;
  es_promocion_especifica: boolean;
}

// Interfaz para validaciones de la promoción
export interface ValidacionesPromocion {
  tiene_descuento: boolean;
  fechas_validas: boolean;
  limites_configurados: boolean;
  configuracion_completa: boolean;
}

// DTOs para operaciones CRUD

// DTO para crear promoción
export interface CreatePromocionDto {
  nombre: string;
  descripcion: string;
  tipo: TipoPromocion;
  descuento_porcentaje?: number | null;
  descuento_monto?: number | null;
  compra_minima?: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  activo?: boolean;
  productos_incluidos?: number[] | null;
  categorias_incluidas?: number[] | null;
  zonas_aplicables?: number[] | null;
  limite_uso_total?: number | null;
  limite_uso_cliente?: number | null;
  imagen?: File | null;
}

// DTO para actualizar promoción
export interface UpdatePromocionDto {
  nombre?: string;
  descripcion?: string;
  tipo?: TipoPromocion;
  descuento_porcentaje?: number | null;
  descuento_monto?: number | null;
  compra_minima?: number | null;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo?: boolean;
  productos_incluidos?: number[] | null;
  categorias_incluidas?: number[] | null;
  zonas_aplicables?: number[] | null;
  limite_uso_total?: number | null;
  limite_uso_cliente?: number | null;
  imagen?: File | null;
}

// DTO para aplicar promoción
export interface AplicarPromocionDto {
  promocion_id: number;
  monto_compra: number;
  productos?: number[];
  zona_id?: number;
}

// Interfaces para filtros y búsqueda

// Filtros para listado de promociones
export interface FiltrosPromocion {
  activo?: boolean;
  tipo?: TipoPromocion;
  vigente?: boolean;
  search?: string;
  per_page?: number;
  page?: number;
}

// Interfaz para paginación
export interface PaginacionPromocion {
  total: number;
  per_page: number;
  current_page: number;
}

// Respuestas de la API

// Respuesta para listado de promociones
export interface PromocionesResponse {
  data: Promocion[];
  meta: PaginacionPromocion;
}

// Respuesta para promoción individual
export interface PromocionResponse {
  data: Promocion;
}

// Respuesta para crear promoción
export interface CreatePromocionResponse {
  message: string;
  data: Promocion;
}

// Respuesta para actualizar promoción
export interface UpdatePromocionResponse {
  message: string;
  data: Promocion;
}

// Respuesta para eliminar promoción
export interface DeletePromocionResponse {
  message: string;
}

// Respuesta para toggle activo
export interface ToggleActivoResponse {
  message: string;
  data: Promocion;
}

// Respuesta para aplicar promoción
export interface AplicarPromocionResponse {
  aplicable: boolean;
  descuento: number;
  monto_final: number;
  promocion: Promocion;
}

// Interfaces para validaciones y errores

// Errores de validación
export interface ErroresValidacionPromocion {
  nombre?: string[];
  descripcion?: string[];
  tipo?: string[];
  descuento_porcentaje?: string[];
  descuento_monto?: string[];
  compra_minima?: string[];
  fecha_inicio?: string[];
  fecha_fin?: string[];
  productos_incluidos?: string[];
  categorias_incluidas?: string[];
  zonas_aplicables?: string[];
  limite_uso_total?: string[];
  limite_uso_cliente?: string[];
  imagen?: string[];
}

// Respuesta de error
export interface ErrorPromocionResponse {
  message: string;
  errors?: ErroresValidacionPromocion;
}

// Interfaces para estadísticas

// Estadísticas de promociones
export interface EstadisticasPromociones {
  total_promociones: number;
  promociones_activas: number;
  promociones_vigentes: number;
  promociones_expiradas: number;
  promociones_agotadas: number;
  promociones_por_tipo: Record<TipoPromocion, number>;
  uso_promedio: number;
  descuento_promedio: number;
}

// Funciones utilitarias

/**
 * Verifica si una promoción está vigente
 */
export function esPromocionVigente(promocion: Promocion): boolean {
  return promocion.estado_promocion.vigente;
}

/**
 * Verifica si una promoción está disponible
 */
export function esPromocionDisponible(promocion: Promocion): boolean {
  return promocion.estado_promocion.disponible;
}

/**
 * Verifica si una promoción está expirada
 */
export function esPromocionExpirada(promocion: Promocion): boolean {
  return promocion.estado_promocion.expirada;
}

/**
 * Verifica si una promoción está agotada
 */
export function esPromocionAgotada(promocion: Promocion): boolean {
  return promocion.estado_promocion.agotada;
}

/**
 * Obtiene el texto descriptivo del tipo de promoción
 */
export function getTipoPromocionTexto(tipo: TipoPromocion): string {
  return TIPOS_PROMOCION[tipo] || 'Tipo de promoción desconocido';
}

/**
 * Obtiene la clase CSS para el estado de la promoción
 */
export function getClaseEstadoPromocion(promocion: Promocion): string {
  if (promocion.estado_promocion.disponible) {
    return 'text-green-600 bg-green-100';
  }
  if (promocion.estado_promocion.expirada) {
    return 'text-red-600 bg-red-100';
  }
  if (promocion.estado_promocion.agotada) {
    return 'text-orange-600 bg-orange-100';
  }
  if (promocion.estado_promocion.por_comenzar) {
    return 'text-blue-600 bg-blue-100';
  }
  if (!promocion.activo) {
    return 'text-gray-600 bg-gray-100';
  }
  return 'text-gray-600 bg-gray-100';
}

/**
 * Obtiene el texto del estado de la promoción
 */
export function getTextoEstadoPromocion(promocion: Promocion): string {
  if (!promocion.activo) {
    return 'Inactiva';
  }
  if (promocion.estado_promocion.disponible) {
    return 'Disponible';
  }
  if (promocion.estado_promocion.expirada) {
    return 'Expirada';
  }
  if (promocion.estado_promocion.agotada) {
    return 'Agotada';
  }
  if (promocion.estado_promocion.por_comenzar) {
    return 'Por comenzar';
  }
  return 'Inactiva';
}

/**
 * Obtiene el ícono para el tipo de promoción
 */
export function getIconoTipoPromocion(tipo: TipoPromocion): string {
  const iconos: Record<TipoPromocion, string> = {
    descuento_producto: 'tag',
    descuento_categoria: 'tags',
    '2x1': 'gift',
    '3x2': 'gifts',
    envio_gratis: 'truck',
    combo: 'package',
  };
  return iconos[tipo] || 'help';
}

/**
 * Calcula el descuento de una promoción
 */
export function calcularDescuento(
  promocion: Promocion,
  montoCompra: number
): number {
  if (promocion.descuento_porcentaje) {
    return (montoCompra * promocion.descuento_porcentaje) / 100;
  }
  if (promocion.descuento_monto) {
    return Math.min(promocion.descuento_monto, montoCompra);
  }
  return 0;
}

/**
 * Verifica si una promoción es aplicable a un monto
 */
export function esPromocionAplicable(
  promocion: Promocion,
  montoCompra: number
): boolean {
  if (!promocion.estado_promocion.disponible) {
    return false;
  }
  if (promocion.compra_minima && montoCompra < promocion.compra_minima) {
    return false;
  }
  return true;
}

/**
 * Valida los datos de una promoción antes de enviar
 */
export function validarPromocion(
  promocion: CreatePromocionDto | UpdatePromocionDto
): string[] {
  const errores: string[] = [];

  if (
    'nombre' in promocion &&
    (!promocion.nombre || promocion.nombre.trim().length === 0)
  ) {
    errores.push('El nombre es requerido');
  }

  if (
    'descripcion' in promocion &&
    (!promocion.descripcion || promocion.descripcion.trim().length === 0)
  ) {
    errores.push('La descripción es requerida');
  }

  if ('tipo' in promocion && !promocion.tipo) {
    errores.push('El tipo de promoción es requerido');
  }

  if (
    'fecha_inicio' in promocion &&
    'fecha_fin' in promocion &&
    promocion.fecha_inicio &&
    promocion.fecha_fin
  ) {
    const fechaInicio = new Date(promocion.fecha_inicio);
    const fechaFin = new Date(promocion.fecha_fin);
    if (fechaInicio >= fechaFin) {
      errores.push('La fecha de fin debe ser posterior a la fecha de inicio');
    }
  }

  if (
    'descuento_porcentaje' in promocion &&
    promocion.descuento_porcentaje !== null &&
    promocion.descuento_porcentaje !== undefined
  ) {
    if (
      promocion.descuento_porcentaje < 0 ||
      promocion.descuento_porcentaje > 100
    ) {
      errores.push('El porcentaje de descuento debe estar entre 0 y 100');
    }
  }

  if (
    'descuento_monto' in promocion &&
    promocion.descuento_monto !== null &&
    promocion.descuento_monto !== undefined
  ) {
    if (promocion.descuento_monto < 0) {
      errores.push('El monto de descuento debe ser mayor o igual a 0');
    }
  }

  if (
    'compra_minima' in promocion &&
    promocion.compra_minima !== null &&
    promocion.compra_minima !== undefined
  ) {
    if (promocion.compra_minima < 0) {
      errores.push('La compra mínima debe ser mayor o igual a 0');
    }
  }

  return errores;
}

/**
 * Formatea el descuento para mostrar
 */
export function formatearDescuento(promocion: Promocion): string {
  if (promocion.tipo === 'envio_gratis') {
    return 'Envío gratis';
  }
  if (promocion.tipo === '2x1' || promocion.tipo === '3x2') {
    return promocion.tipo_texto;
  }
  if (promocion.descuento_porcentaje) {
    return `${promocion.descuento_porcentaje}% de descuento`;
  }
  if (promocion.descuento_monto) {
    return `S/ ${promocion.descuento_monto.toFixed(2)} de descuento`;
  }
  return 'Descuento especial';
}

/**
 * Agrupa promociones por tipo
 */
export function agruparPorTipo(
  promociones: Promocion[]
): Record<TipoPromocion, Promocion[]> {
  return promociones.reduce((grupos, promocion) => {
    if (!grupos[promocion.tipo]) {
      grupos[promocion.tipo] = [];
    }
    grupos[promocion.tipo].push(promocion);
    return grupos;
  }, {} as Record<TipoPromocion, Promocion[]>);
}

/**
 * Agrupa promociones por estado
 */
export function agruparPorEstado(promociones: Promocion[]): {
  vigentes: Promocion[];
  expiradas: Promocion[];
  agotadas: Promocion[];
  inactivas: Promocion[];
  por_comenzar: Promocion[];
} {
  return promociones.reduce(
    (grupos, promocion) => {
      if (!promocion.activo) {
        grupos.inactivas.push(promocion);
      } else if (promocion.estado_promocion.por_comenzar) {
        grupos.por_comenzar.push(promocion);
      } else if (promocion.estado_promocion.expirada) {
        grupos.expiradas.push(promocion);
      } else if (promocion.estado_promocion.agotada) {
        grupos.agotadas.push(promocion);
      } else if (promocion.estado_promocion.vigente) {
        grupos.vigentes.push(promocion);
      }
      return grupos;
    },
    {
      vigentes: [] as Promocion[],
      expiradas: [] as Promocion[],
      agotadas: [] as Promocion[],
      inactivas: [] as Promocion[],
      por_comenzar: [] as Promocion[],
    }
  );
}

/**
 * Filtra promociones vigentes
 */
export function obtenerPromocionesVigentes(
  promociones: Promocion[]
): Promocion[] {
  return promociones.filter((p) => p.estado_promocion.vigente);
}

/**
 * Filtra promociones disponibles
 */
export function obtenerPromocionesDisponibles(
  promociones: Promocion[]
): Promocion[] {
  return promociones.filter((p) => p.estado_promocion.disponible);
}

/**
 * Filtra promociones por tipo
 */
export function obtenerPromocionesPorTipo(
  promociones: Promocion[],
  tipo: TipoPromocion
): Promocion[] {
  return promociones.filter((p) => p.tipo === tipo);
}

/**
 * Calcula estadísticas de promociones
 */
export function calcularEstadisticasPromociones(
  promociones: Promocion[]
): EstadisticasPromociones {
  const total = promociones.length;
  const activas = promociones.filter((p) => p.activo).length;
  const vigentes = promociones.filter((p) => p.estado_promocion.vigente).length;
  const expiradas = promociones.filter(
    (p) => p.estado_promocion.expirada
  ).length;
  const agotadas = promociones.filter((p) => p.estado_promocion.agotada).length;

  const porTipo = promociones.reduce((acc, p) => {
    acc[p.tipo] = (acc[p.tipo] || 0) + 1;
    return acc;
  }, {} as Record<TipoPromocion, number>);

  const usoPromedio =
    total > 0
      ? promociones.reduce(
          (sum, p) => sum + p.estado_promocion.porcentaje_uso,
          0
        ) / total
      : 0;

  const descuentoPromedio = promociones
    .filter((p) => p.descuento_porcentaje || p.descuento_monto)
    .reduce((sum, p, _, arr) => {
      const descuento =
        p.descuento_porcentaje ||
        (p.descuento_monto ? (p.descuento_monto * 100) / 50 : 0); // Estimación
      return sum + descuento / arr.length;
    }, 0);

  return {
    total_promociones: total,
    promociones_activas: activas,
    promociones_vigentes: vigentes,
    promociones_expiradas: expiradas,
    promociones_agotadas: agotadas,
    promociones_por_tipo: porTipo,
    uso_promedio: usoPromedio,
    descuento_promedio: descuentoPromedio,
  };
}

/**
 * Busca promociones por texto
 */
export function buscarPromociones(
  promociones: Promocion[],
  texto: string
): Promocion[] {
  const textoBusqueda = texto.toLowerCase().trim();
  if (!textoBusqueda) {
    return promociones;
  }

  return promociones.filter(
    (promocion) =>
      promocion.nombre.toLowerCase().includes(textoBusqueda) ||
      promocion.descripcion.toLowerCase().includes(textoBusqueda) ||
      promocion.tipo_texto.toLowerCase().includes(textoBusqueda)
  );
}
