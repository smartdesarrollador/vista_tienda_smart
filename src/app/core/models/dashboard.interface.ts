/**
 * Interfaces para el sistema de Dashboard
 * Basadas en DashboardController.php y respuestas del API
 */

/**
 * Períodos disponibles para filtros de dashboard
 */
export type PeriodoDashboard = 'hoy' | 'semana' | 'mes' | 'trimestre' | 'año';

/**
 * Monedas soportadas en el sistema
 */
export type MonedaDashboard = 'PEN' | 'USD' | 'EUR';

/**
 * Tipos de agrupación para estadísticas
 */
export type TipoAgrupacion = 'dia' | 'semana' | 'mes' | 'trimestre';

/**
 * Tipos de ordenamiento para productos
 */
export type OrdenamientoProducto =
  | 'ventas'
  | 'stock'
  | 'precio'
  | 'calificacion'
  | 'favoritos';

/**
 * Roles de usuario disponibles
 */
export type RolUsuario =
  | 'cliente'
  | 'administrador'
  | 'vendedor'
  | 'soporte'
  | 'repartidor';

/**
 * Tipos de alertas del sistema
 */
export type TipoAlerta = 'stock' | 'pagos' | 'sistema' | 'usuarios' | 'ventas';

/**
 * Prioridades de alertas
 */
export type PrioridadAlerta = 'alta' | 'media' | 'baja';

/**
 * Tipos de actividad reciente
 */
export type TipoActividad =
  | 'pedidos'
  | 'pagos'
  | 'usuarios'
  | 'productos'
  | 'comentarios';

/**
 * Tipos de cache del dashboard
 */
export type TipoCache =
  | 'todo'
  | 'resumen'
  | 'ventas'
  | 'productos'
  | 'usuarios'
  | 'financieras';

/**
 * Interfaz para fechas de período
 */
export interface FechasPeriodo {
  desde: string;
  hasta: string;
}

/**
 * Interfaz para KPIs principales del dashboard
 */
export interface KPIsPrincipales {
  total_ventas: number;
  numero_pedidos: number;
  nuevos_clientes: number;
  ticket_promedio: number;
  productos_vendidos: number;
  tasa_conversion: number;
}

/**
 * Interfaz para estadísticas de ventas por estado
 */
export interface VentasPorEstado {
  [estado: string]: {
    cantidad: number;
    monto: number;
  };
}

/**
 * Interfaz para estadísticas de ventas por canal
 */
export interface VentasPorCanal {
  [canal: string]: {
    cantidad: number;
    monto: number;
  };
}

/**
 * Interfaz para tendencia diaria de ventas
 */
export interface TendenciaDiariaVenta {
  fecha: string;
  pedidos: number;
  ventas: number;
}

/**
 * Interfaz para estadísticas de ventas
 */
export interface EstadisticasVentas {
  ventas_por_estado: VentasPorEstado;
  ventas_por_canal: VentasPorCanal;
  tendencia_diaria: TendenciaDiariaVenta[];
}

/**
 * Interfaz para producto más vendido
 */
export interface ProductoMasVendido {
  id: number;
  nombre: string;
  precio: number;
  imagen_principal: string;
  cantidad_vendida: number;
}

/**
 * Interfaz para estadísticas de productos
 */
export interface EstadisticasProductos {
  total_productos: number;
  productos_activos: number;
  productos_destacados: number;
  productos_bajo_stock: number;
  mas_vendidos: ProductoMasVendido[];
}

/**
 * Interfaz para top cliente
 */
export interface TopCliente {
  id: number;
  nombre: string;
  email: string;
  total_compras: number;
}

/**
 * Interfaz para estadísticas de usuarios
 */
export interface EstadisticasUsuarios {
  usuarios_por_rol: Record<string, number>;
  nuevos_usuarios: Record<string, number>;
  usuarios_activos: number;
  top_clientes: TopCliente[];
}

/**
 * Interfaz para pagos por método
 */
export interface PagosPorMetodo {
  [metodo: string]: {
    cantidad: number;
    total: number;
  };
}

/**
 * Interfaz para estadísticas financieras
 */
export interface EstadisticasFinancieras {
  ingresos_totales: number;
  pagos_por_metodo: PagosPorMetodo;
  creditos_pendientes: number;
  creditos_vencidos: number;
}

/**
 * Interfaz para actividad reciente
 */
export interface ActividadReciente {
  tipo: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  icono: string;
  color: string;
}

/**
 * Interfaz para alertas del sistema
 */
export interface AlertaSistema {
  tipo: TipoAlerta;
  prioridad: PrioridadAlerta;
  titulo: string;
  descripcion: string;
  cantidad: number;
  accion: string;
  icono: string;
  color: string;
}

/**
 * Interfaz principal para el resumen del dashboard
 */
export interface ResumenDashboard {
  periodo: PeriodoDashboard;
  fechas: FechasPeriodo;
  kpis: KPIsPrincipales;
  ventas: EstadisticasVentas;
  productos: EstadisticasProductos;
  usuarios: EstadisticasUsuarios;
  financieras: EstadisticasFinancieras;
  actividad_reciente: ActividadReciente[];
  alertas: AlertaSistema[];
  ultima_actualizacion: string;
}

/**
 * Interfaz para respuesta del resumen del dashboard
 */
export interface DashboardResumenResponse {
  success: boolean;
  data: ResumenDashboard;
  cached: boolean;
  cache_expires_at?: string;
}

/**
 * Interfaz para filtros del dashboard principal
 */
export interface DashboardFiltros {
  periodo?: PeriodoDashboard;
  fecha_desde?: string;
  fecha_hasta?: string;
  incluir_cache?: boolean;
}

/**
 * Interfaz para ventas por período
 */
export interface VentasPorPeriodo {
  fecha: string;
  ventas: number;
  pedidos: number;
}

/**
 * Interfaz para análisis de conversión
 */
export interface AnalisisConversion {
  visitantes: number;
  carritos_creados: number;
  carritos_abandonados: number;
  pedidos_completados: number;
  tasa_conversion_carrito: number;
  tasa_conversion_pedido: number;
}

/**
 * Interfaz para comparación con período anterior
 */
export interface ComparacionPeriodo {
  ventas_actual: number;
  ventas_anterior: number;
  variacion_porcentual: number;
  pedidos_actual: number;
  pedidos_anterior: number;
  variacion_pedidos: number;
}

/**
 * Interfaz para estadísticas detalladas de ventas
 */
export interface EstadisticasVentasDetalladas {
  periodo: PeriodoDashboard;
  fechas: FechasPeriodo;
  moneda: MonedaDashboard;
  ventas_por_periodo: VentasPorPeriodo[];
  top_productos: ProductoMasVendido[];
  ventas_por_canal: VentasPorCanal;
  ventas_por_metodo_pago: PagosPorMetodo;
  analisis_conversion: AnalisisConversion;
  comparacion_periodo_anterior: ComparacionPeriodo;
}

/**
 * Interfaz para respuesta de estadísticas de ventas
 */
export interface DashboardVentasResponse {
  success: boolean;
  data: EstadisticasVentasDetalladas;
}

/**
 * Interfaz para filtros de estadísticas de ventas
 */
export interface VentasFiltros {
  periodo?: PeriodoDashboard;
  fecha_desde?: string;
  fecha_hasta?: string;
  agrupar_por?: TipoAgrupacion;
  moneda?: MonedaDashboard;
}

/**
 * Interfaz para resumen de productos
 */
export interface ResumenProductos {
  total_productos: number;
  productos_activos: number;
  productos_inactivos: number;
  productos_destacados: number;
  productos_bajo_stock: number;
  productos_sin_stock: number;
  valor_inventario: number;
}

/**
 * Interfaz para producto bajo stock
 */
export interface ProductoBajoStock {
  id: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  categoria: string;
  precio: number;
}

/**
 * Interfaz para producto mejor calificado
 */
export interface ProductoMejorCalificado {
  id: number;
  nombre: string;
  calificacion_promedio: number;
  total_comentarios: number;
  precio: number;
  imagen_principal: string;
}

/**
 * Interfaz para análisis de categorías
 */
export interface AnalisisCategorias {
  categoria: string;
  total_productos: number;
  productos_activos: number;
  ventas_totales: number;
  productos_mas_vendidos: number;
}

/**
 * Interfaz para tendencias de precios
 */
export interface TendenciaPrecios {
  categoria: string;
  precio_promedio: number;
  precio_minimo: number;
  precio_maximo: number;
  variacion_mensual: number;
}

/**
 * Interfaz para estadísticas detalladas de productos
 */
export interface EstadisticasProductosDetalladas {
  resumen_general: ResumenProductos;
  mas_vendidos: ProductoMasVendido[];
  bajo_stock: ProductoBajoStock[];
  mejor_calificados: ProductoMejorCalificado[];
  analisis_categorias: AnalisisCategorias[];
  mas_favoriteados: ProductoMasVendido[];
  tendencias_precios: TendenciaPrecios[];
  filtros_aplicados: {
    categoria_id?: number;
    incluir_variaciones: boolean;
    ordenar_por: OrdenamientoProducto;
  };
}

/**
 * Interfaz para respuesta de estadísticas de productos
 */
export interface DashboardProductosResponse {
  success: boolean;
  data: EstadisticasProductosDetalladas;
}

/**
 * Interfaz para filtros de productos
 */
export interface ProductosFiltros {
  categoria_id?: number;
  incluir_variaciones?: boolean;
  ordenar_por?: OrdenamientoProducto;
}

/**
 * Interfaz para resumen de usuarios
 */
export interface ResumenUsuarios {
  total_usuarios: number;
  usuarios_activos: number;
  usuarios_inactivos: number;
  nuevos_este_mes: number;
  usuarios_por_rol: Record<RolUsuario, number>;
}

/**
 * Interfaz para nuevos registros por período
 */
export interface NuevosRegistrosPorPeriodo {
  fecha: string;
  registros: number;
  rol: RolUsuario;
}

/**
 * Interfaz para usuario más activo
 */
export interface UsuarioMasActivo {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  total_pedidos: number;
  total_compras: number;
  ultima_actividad: string;
}

/**
 * Interfaz para análisis de comportamiento
 */
export interface AnalisisComportamiento {
  promedio_sesiones_mes: number;
  tiempo_promedio_sesion: number;
  paginas_promedio_sesion: number;
  tasa_rebote: number;
  dispositivos_mas_usados: Record<string, number>;
}

/**
 * Interfaz para distribución geográfica
 */
export interface DistribucionGeografica {
  pais: string;
  region: string;
  ciudad: string;
  total_usuarios: number;
  porcentaje: number;
}

/**
 * Interfaz para análisis de retención
 */
export interface AnalisisRetencion {
  retencion_7_dias: number;
  retencion_30_dias: number;
  retencion_90_dias: number;
  usuarios_recurrentes: number;
  usuarios_nuevos: number;
}

/**
 * Interfaz para estadísticas detalladas de usuarios
 */
export interface EstadisticasUsuariosDetalladas {
  periodo: PeriodoDashboard;
  fechas: FechasPeriodo;
  resumen_general: ResumenUsuarios;
  nuevos_registros: NuevosRegistrosPorPeriodo[];
  usuarios_mas_activos: UsuarioMasActivo[];
  analisis_comportamiento: AnalisisComportamiento;
  distribucion_geografica: DistribucionGeografica[];
  analisis_retencion: AnalisisRetencion;
  filtros_aplicados: {
    rol?: RolUsuario;
    incluir_inactivos: boolean;
  };
}

/**
 * Interfaz para respuesta de estadísticas de usuarios
 */
export interface DashboardUsuariosResponse {
  success: boolean;
  data: EstadisticasUsuariosDetalladas;
}

/**
 * Interfaz para filtros de usuarios
 */
export interface UsuariosFiltros {
  periodo?: PeriodoDashboard;
  fecha_desde?: string;
  fecha_hasta?: string;
  rol?: RolUsuario;
  incluir_inactivos?: boolean;
}

/**
 * Interfaz para resumen financiero
 */
export interface ResumenFinanciero {
  ingresos_totales: number;
  ingresos_netos: number;
  gastos_totales: number;
  margen_bruto: number;
  margen_neto: number;
  crecimiento_mensual: number;
}

/**
 * Interfaz para flujo de caja
 */
export interface FlujoCaja {
  fecha: string;
  ingresos: number;
  egresos: number;
  saldo: number;
  saldo_acumulado: number;
}

/**
 * Interfaz para análisis de créditos
 */
export interface AnalisisCreditos {
  creditos_otorgados: number;
  creditos_pagados: number;
  creditos_pendientes: number;
  creditos_vencidos: number;
  tasa_morosidad: number;
  monto_promedio_credito: number;
}

/**
 * Interfaz para análisis de cupones
 */
export interface AnalisisCupones {
  cupones_utilizados: number;
  descuento_total_otorgado: number;
  cupon_mas_usado: string;
  ahorro_promedio_cliente: number;
  tasa_uso_cupones: number;
}

/**
 * Interfaz para proyecciones financieras
 */
export interface ProyeccionesFinancieras {
  ingresos_proyectados_mes: number;
  crecimiento_proyectado: number;
  meta_mensual: number;
  porcentaje_meta_alcanzado: number;
  dias_restantes_mes: number;
}

/**
 * Interfaz para estadísticas financieras detalladas
 */
export interface EstadisticasFinancierasDetalladas {
  periodo: PeriodoDashboard;
  fechas: FechasPeriodo;
  moneda: MonedaDashboard;
  resumen_financiero: ResumenFinanciero;
  flujo_caja: FlujoCaja[];
  analisis_creditos: AnalisisCreditos;
  metodos_pago: PagosPorMetodo;
  analisis_cupones: AnalisisCupones;
  proyecciones?: ProyeccionesFinancieras;
}

/**
 * Interfaz para respuesta de estadísticas financieras
 */
export interface DashboardFinancierasResponse {
  success: boolean;
  data: EstadisticasFinancierasDetalladas;
}

/**
 * Interfaz para filtros financieros
 */
export interface FinancierasFiltros {
  periodo?: PeriodoDashboard;
  fecha_desde?: string;
  fecha_hasta?: string;
  moneda?: MonedaDashboard;
  incluir_proyecciones?: boolean;
}

/**
 * Interfaz para respuesta de alertas
 */
export interface DashboardAlertasResponse {
  success: boolean;
  data: AlertaSistema[];
  filtros_aplicados: {
    tipo?: TipoAlerta;
    prioridad?: PrioridadAlerta;
    solo_activas: boolean;
  };
}

/**
 * Interfaz para filtros de alertas
 */
export interface AlertasFiltros {
  tipo?: TipoAlerta;
  prioridad?: PrioridadAlerta;
  solo_activas?: boolean;
}

/**
 * Interfaz para respuesta de actividad reciente
 */
export interface DashboardActividadResponse {
  success: boolean;
  data: ActividadReciente[];
  filtros_aplicados: {
    limite: number;
    tipo?: TipoActividad;
    horas: number;
  };
}

/**
 * Interfaz para filtros de actividad
 */
export interface ActividadFiltros {
  limite?: number;
  tipo?: TipoActividad;
  horas?: number;
}

/**
 * Interfaz para respuesta de limpieza de cache
 */
export interface LimpiarCacheResponse {
  success: boolean;
  message: string;
  cache_limpiado: string[];
}

/**
 * Interfaz para request de limpieza de cache
 */
export interface LimpiarCacheRequest {
  tipo?: TipoCache;
}

/**
 * Interfaz para respuesta de error del dashboard
 */
export interface DashboardErrorResponse {
  success: false;
  message: string;
  error: string;
}

/**
 * Constantes del dashboard
 */
export const DASHBOARD_CONSTANTS = {
  DEFAULT_PERIODO: 'mes' as PeriodoDashboard,
  DEFAULT_MONEDA: 'PEN' as MonedaDashboard,
  DEFAULT_AGRUPACION: 'dia' as TipoAgrupacion,
  CACHE_DURATION_MINUTES: 15,
  MAX_ACTIVIDAD_ITEMS: 100,
  MAX_HORAS_ACTIVIDAD: 168, // 1 semana
  DEFAULT_HORAS_ACTIVIDAD: 24,
  DEFAULT_LIMITE_ACTIVIDAD: 20,
} as const;

/**
 * Configuración de colores para gráficos
 */
export const DASHBOARD_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  success: '#22C55E',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  gray: '#6B7280',
} as const;

/**
 * Configuración de iconos para diferentes tipos
 */
export const DASHBOARD_ICONS = {
  ventas: 'trending-up',
  productos: 'package',
  usuarios: 'users',
  financieras: 'dollar-sign',
  alertas: 'alert-triangle',
  actividad: 'activity',
  pedidos: 'shopping-cart',
  pagos: 'credit-card',
  stock: 'package',
  comentarios: 'message-circle',
} as const;

/**
 * Utilidades para el dashboard
 */
export class DashboardUtils {
  /**
   * Formatea un número como moneda
   */
  static formatCurrency(
    amount: number,
    currency: MonedaDashboard = 'PEN'
  ): string {
    const symbols = { PEN: 'S/', USD: '$', EUR: '€' };
    return `${symbols[currency]} ${amount.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
    })}`;
  }

  /**
   * Formatea un porcentaje
   */
  static formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Calcula la variación porcentual entre dos valores
   */
  static calculateVariation(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Obtiene el color para una variación
   */
  static getVariationColor(variation: number): string {
    if (variation > 0) return DASHBOARD_COLORS.success;
    if (variation < 0) return DASHBOARD_COLORS.danger;
    return DASHBOARD_COLORS.gray;
  }

  /**
   * Formatea un número de manera compacta (1K, 1M, etc.)
   */
  static formatCompactNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Obtiene el icono para un tipo de actividad
   */
  static getActivityIcon(tipo: string): string {
    return DASHBOARD_ICONS[tipo as keyof typeof DASHBOARD_ICONS] || 'circle';
  }

  /**
   * Obtiene el color para una prioridad de alerta
   */
  static getAlertColor(prioridad: PrioridadAlerta): string {
    const colors = {
      alta: DASHBOARD_COLORS.danger,
      media: DASHBOARD_COLORS.warning,
      baja: DASHBOARD_COLORS.info,
    };
    return colors[prioridad];
  }

  /**
   * Valida un período de dashboard
   */
  static isValidPeriod(periodo: string): periodo is PeriodoDashboard {
    return ['hoy', 'semana', 'mes', 'trimestre', 'año'].includes(periodo);
  }

  /**
   * Valida una moneda
   */
  static isValidCurrency(moneda: string): moneda is MonedaDashboard {
    return ['PEN', 'USD', 'EUR'].includes(moneda);
  }

  /**
   * Genera fechas para un período específico
   */
  static generatePeriodDates(periodo: PeriodoDashboard): FechasPeriodo {
    const now = new Date();
    let desde: Date;
    let hasta: Date = new Date(now);

    switch (periodo) {
      case 'hoy':
        desde = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'semana':
        desde = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes':
        desde = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'trimestre':
        const quarter = Math.floor(now.getMonth() / 3);
        desde = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'año':
        desde = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        desde = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      desde: desde.toISOString().split('T')[0],
      hasta: hasta.toISOString().split('T')[0],
    };
  }
}
