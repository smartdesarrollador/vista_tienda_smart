/**
 * Interfaces para el sistema de Reportes
 * Basadas en ReporteController.php y respuestas del API
 */

/**
 * Tipos de reportes disponibles
 */
export type TipoReporte =
  | 'ventas'
  | 'inventario'
  | 'clientes'
  | 'financiero'
  | 'personalizado';

/**
 * Categorías de reportes
 */
export type CategoriaReporte =
  | 'ventas'
  | 'productos'
  | 'usuarios'
  | 'financieros'
  | 'inventario'
  | 'marketing';

/**
 * Formatos de exportación soportados
 */
export type FormatoExportacion = 'json' | 'csv' | 'excel' | 'pdf';

/**
 * Períodos disponibles para reportes
 */
export type PeriodoReporte =
  | 'hoy'
  | 'semana'
  | 'mes'
  | 'trimestre'
  | 'año'
  | 'personalizado';

/**
 * Monedas soportadas en reportes
 */
export type MonedaReporte = 'PEN' | 'USD' | 'EUR';

/**
 * Tipos de agrupación para reportes
 */
export type AgrupacionReporte = 'dia' | 'semana' | 'mes' | 'trimestre' | 'año';

/**
 * Estados de pedidos para filtros
 */
export type EstadoPedidoReporte =
  | 'pendiente'
  | 'aprobado'
  | 'rechazado'
  | 'en_proceso'
  | 'enviado'
  | 'entregado'
  | 'cancelado'
  | 'devuelto';

/**
 * Canales de venta disponibles
 */
export type CanalVentaReporte =
  | 'web'
  | 'app'
  | 'tienda_fisica'
  | 'telefono'
  | 'whatsapp';

/**
 * Tipos de segmentación de clientes
 */
export type SegmentacionCliente =
  | 'nuevos'
  | 'recurrentes'
  | 'vip'
  | 'inactivos';

/**
 * Módulos disponibles para reportes personalizados
 */
export type ModuloPersonalizado =
  | 'ventas'
  | 'productos'
  | 'usuarios'
  | 'pagos'
  | 'comentarios'
  | 'favoritos';

/**
 * Interfaz para metadatos de reporte
 */
export interface MetadatosReporte {
  ultima_generacion: string;
  tiempo_promedio_generacion: string;
  tamaño_promedio: string;
  veces_generado: number;
}

/**
 * Interfaz para reporte disponible
 */
export interface ReporteDisponible {
  codigo: TipoReporte;
  nombre: string;
  descripcion: string;
  categoria: CategoriaReporte;
  parametros_requeridos: string[];
  formatos_soportados: FormatoExportacion[];
  metadatos?: MetadatosReporte;
}

/**
 * Interfaz para respuesta de lista de reportes
 */
export interface ListaReportesResponse {
  success: boolean;
  data: {
    reportes_disponibles: ReporteDisponible[];
    total_reportes: number;
    categorias: Record<CategoriaReporte, string>;
    formatos_soportados: FormatoExportacion[];
  };
  message: string;
}

/**
 * Interfaz para filtros de lista de reportes
 */
export interface ListaReportesFiltros {
  categoria?: CategoriaReporte;
  formato?: FormatoExportacion;
  incluir_metadatos?: boolean;
}

/**
 * Interfaz para parámetros base de reportes
 */
export interface ParametrosBaseReporte {
  fecha_inicio?: string;
  fecha_fin?: string;
  formato?: FormatoExportacion;
}

/**
 * Interfaz para resumen general de ventas
 */
export interface ResumenVentas {
  total_pedidos: number;
  total_ventas: number;
  ticket_promedio: number;
  pedidos_completados: number;
  tasa_completacion: number;
}

/**
 * Interfaz para ventas agrupadas por período
 */
export interface VentasAgrupadas {
  periodo: string;
  total_pedidos: number;
  total_ventas: number;
  ticket_promedio: number;
}

/**
 * Interfaz para producto más vendido en reportes
 */
export interface ProductoMasVendidoReporte {
  producto_id: number;
  nombre: string;
  sku: string;
  precio_unitario: number;
  cantidad_vendida: number;
  ingresos_generados: number;
}

/**
 * Interfaz para análisis por canal de venta
 */
export interface AnalisisPorCanal {
  canal: CanalVentaReporte;
  total_pedidos: number;
  total_ventas: number;
  ticket_promedio: number;
}

/**
 * Interfaz para análisis por método de pago
 */
export interface AnalisisPorMetodoPago {
  metodo_pago: string;
  total_transacciones: number;
  total_monto: number;
  monto_promedio: number;
}

/**
 * Interfaz para detalle de pedido en reporte
 */
export interface DetallePedidoReporte {
  id: number;
  cliente: string;
  email: string;
  total: number;
  estado: EstadoPedidoReporte;
  canal_venta: CanalVentaReporte;
  fecha: string;
  productos: {
    nombre: string;
    sku: string;
    cantidad: number;
    precio: number;
  }[];
}

/**
 * Interfaz para parámetros de reporte de ventas
 */
export interface ParametrosReporteVentas extends ParametrosBaseReporte {
  agrupar_por?: AgrupacionReporte;
  incluir_detalles?: boolean;
  canal_venta?: CanalVentaReporte;
  estado_pedido?: EstadoPedidoReporte;
  moneda?: MonedaReporte;
}

/**
 * Interfaz para datos de reporte de ventas
 */
export interface DatosReporteVentas {
  parametros: ParametrosReporteVentas;
  resumen_general: ResumenVentas;
  ventas_agrupadas: VentasAgrupadas[];
  top_productos: ProductoMasVendidoReporte[];
  analisis_por_canal: AnalisisPorCanal[];
  analisis_por_metodo_pago: AnalisisPorMetodoPago[];
  detalles_pedidos?: DetallePedidoReporte[];
  generado_en: string;
}

/**
 * Interfaz para respuesta de reporte de ventas
 */
export interface ReporteVentasResponse {
  success: boolean;
  data: DatosReporteVentas;
  message: string;
}

/**
 * Interfaz para parámetros de reporte de inventario
 */
export interface ParametrosReporteInventario extends ParametrosBaseReporte {
  categoria_id?: number;
  incluir_variaciones?: boolean;
  stock_minimo?: number;
  solo_activos?: boolean;
  incluir_valoracion?: boolean;
}

/**
 * Interfaz para resumen de inventario
 */
export interface ResumenInventario {
  total_productos: number;
  productos_activos: number;
  productos_inactivos: number;
  valor_total_inventario: number;
  productos_bajo_stock: number;
  productos_sin_stock: number;
}

/**
 * Interfaz para producto con stock bajo
 */
export interface ProductoStockBajo {
  id: number;
  nombre: string;
  sku: string;
  stock_actual: number;
  stock_minimo: number;
  categoria: string;
  precio: number;
}

/**
 * Interfaz para análisis por categoría de inventario
 */
export interface AnalisisCategoriasInventario {
  categoria: string;
  total_productos: number;
  productos_activos: number;
  valor_inventario: number;
  productos_bajo_stock: number;
}

/**
 * Interfaz para rotación de inventario
 */
export interface RotacionInventario {
  producto_id: number;
  nombre: string;
  sku: string;
  ventas_periodo: number;
  stock_promedio: number;
  rotacion: number;
  dias_inventario: number;
}

/**
 * Interfaz para valoración de inventario
 */
export interface ValoracionInventario {
  valor_total: number;
  valor_por_categoria: Record<string, number>;
  productos_mayor_valor: {
    id: number;
    nombre: string;
    valor_total: number;
    cantidad: number;
    precio_unitario: number;
  }[];
}

/**
 * Interfaz para listado de productos en inventario
 */
export interface ProductoInventario {
  id: number;
  nombre: string;
  sku: string;
  categoria: string;
  precio: number;
  stock: number;
  stock_minimo: number;
  estado: 'activo' | 'inactivo';
  valor_total: number;
  variaciones?: {
    id: number;
    nombre: string;
    stock: number;
    precio: number;
  }[];
}

/**
 * Interfaz para datos de reporte de inventario
 */
export interface DatosReporteInventario {
  parametros: ParametrosReporteInventario;
  resumen_general: ResumenInventario;
  stock_bajo: ProductoStockBajo[];
  sin_stock: ProductoInventario[];
  analisis_por_categoria: AnalisisCategoriasInventario[];
  productos_mas_vendidos: ProductoMasVendidoReporte[];
  rotacion_inventario: RotacionInventario[];
  valoracion_inventario?: ValoracionInventario;
  listado_productos: ProductoInventario[];
  generado_en: string;
}

/**
 * Interfaz para respuesta de reporte de inventario
 */
export interface ReporteInventarioResponse {
  success: boolean;
  data: DatosReporteInventario;
  message: string;
}

/**
 * Interfaz para parámetros de reporte de clientes
 */
export interface ParametrosReporteClientes extends ParametrosBaseReporte {
  incluir_inactivos?: boolean;
  segmentacion?: SegmentacionCliente;
  incluir_geografico?: boolean;
  incluir_comportamiento?: boolean;
}

/**
 * Interfaz para resumen de clientes
 */
export interface ResumenClientes {
  total_clientes: number;
  clientes_activos: number;
  clientes_inactivos: number;
  nuevos_clientes_periodo: number;
  clientes_recurrentes: number;
  ticket_promedio_cliente: number;
}

/**
 * Interfaz para nuevos clientes por período
 */
export interface NuevosClientesPorPeriodo {
  fecha: string;
  nuevos_clientes: number;
  clientes_activos: number;
}

/**
 * Interfaz para segmentación de clientes
 */
export interface SegmentacionClientesData {
  segmento: SegmentacionCliente;
  cantidad: number;
  porcentaje: number;
  valor_promedio_compra: number;
  frecuencia_compra: number;
}

/**
 * Interfaz para top cliente
 */
export interface TopClienteReporte {
  id: number;
  nombre: string;
  email: string;
  total_pedidos: number;
  total_compras: number;
  ticket_promedio: number;
  ultima_compra: string;
}

/**
 * Interfaz para análisis de retención
 */
export interface AnalisisRetencionClientes {
  retencion_30_dias: number;
  retencion_60_dias: number;
  retencion_90_dias: number;
  tasa_churn: number;
  valor_vida_cliente: number;
}

/**
 * Interfaz para distribución geográfica
 */
export interface DistribucionGeograficaClientes {
  pais: string;
  region: string;
  ciudad: string;
  total_clientes: number;
  porcentaje: number;
  valor_promedio_compra: number;
}

/**
 * Interfaz para análisis de comportamiento de clientes
 */
export interface AnalisisComportamientoClientes {
  sesiones_promedio_mes: number;
  tiempo_promedio_sesion: number;
  paginas_promedio_sesion: number;
  tasa_conversion: number;
  productos_favoritos_promedio: number;
  canales_preferidos: Record<CanalVentaReporte, number>;
}

/**
 * Interfaz para clientes con créditos
 */
export interface ClienteConCredito {
  id: number;
  nombre: string;
  email: string;
  creditos_activos: number;
  monto_total_credito: number;
  cuotas_vencidas: number;
  monto_vencido: number;
  score_crediticio: number;
}

/**
 * Interfaz para datos de reporte de clientes
 */
export interface DatosReporteClientes {
  parametros: ParametrosReporteClientes;
  resumen_general: ResumenClientes;
  nuevos_clientes: NuevosClientesPorPeriodo[];
  segmentacion_clientes: SegmentacionClientesData[];
  top_clientes: TopClienteReporte[];
  analisis_retencion: AnalisisRetencionClientes;
  distribucion_geografica?: DistribucionGeograficaClientes[];
  analisis_comportamiento?: AnalisisComportamientoClientes;
  clientes_creditos: ClienteConCredito[];
  generado_en: string;
}

/**
 * Interfaz para respuesta de reporte de clientes
 */
export interface ReporteClientesResponse {
  success: boolean;
  data: DatosReporteClientes;
  message: string;
}

/**
 * Interfaz para parámetros de reporte financiero
 */
export interface ParametrosReporteFinanciero extends ParametrosBaseReporte {
  moneda?: MonedaReporte;
  incluir_proyecciones?: boolean;
  incluir_creditos?: boolean;
  incluir_cupones?: boolean;
}

/**
 * Interfaz para resumen financiero
 */
export interface ResumenFinancieroReporte {
  ingresos_totales: number;
  ingresos_netos: number;
  gastos_operativos: number;
  margen_bruto: number;
  margen_neto: number;
  crecimiento_periodo_anterior: number;
}

/**
 * Interfaz para ingresos por período
 */
export interface IngresosPorPeriodo {
  fecha: string;
  ingresos_brutos: number;
  ingresos_netos: number;
  gastos: number;
  margen: number;
}

/**
 * Interfaz para cuentas por cobrar
 */
export interface CuentasPorCobrar {
  total_creditos_otorgados: number;
  creditos_vigentes: number;
  creditos_vencidos: number;
  monto_por_vencer: number;
  monto_vencido: number;
  tasa_morosidad: number;
  provision_incobrables: number;
}

/**
 * Interfaz para análisis de cupones financiero
 */
export interface AnalisisCuponesFinanciero {
  cupones_utilizados: number;
  descuento_total_otorgado: number;
  impacto_ingresos: number;
  roi_cupones: number;
  cupon_mas_efectivo: string;
  ahorro_promedio_cliente: number;
}

/**
 * Interfaz para flujo de caja
 */
export interface FlujoCajaReporte {
  fecha: string;
  ingresos_operativos: number;
  egresos_operativos: number;
  flujo_neto: number;
  saldo_acumulado: number;
}

/**
 * Interfaz para proyecciones financieras
 */
export interface ProyeccionesFinancierasReporte {
  ingresos_proyectados_mes: number;
  crecimiento_proyectado: number;
  meta_mensual: number;
  porcentaje_meta_alcanzado: number;
  proyeccion_trimestre: number;
  proyeccion_año: number;
}

/**
 * Interfaz para indicadores financieros
 */
export interface IndicadoresFinancieros {
  liquidez_corriente: number;
  rotacion_inventario: number;
  margen_ebitda: number;
  retorno_inversion: number;
  punto_equilibrio: number;
  dias_cartera: number;
}

/**
 * Interfaz para datos de reporte financiero
 */
export interface DatosReporteFinanciero {
  parametros: ParametrosReporteFinanciero;
  resumen_financiero: ResumenFinancieroReporte;
  ingresos_por_periodo: IngresosPorPeriodo[];
  analisis_metodos_pago: AnalisisPorMetodoPago[];
  cuentas_por_cobrar?: CuentasPorCobrar;
  analisis_cupones?: AnalisisCuponesFinanciero;
  flujo_caja: FlujoCajaReporte[];
  proyecciones?: ProyeccionesFinancierasReporte;
  indicadores_financieros: IndicadoresFinancieros;
  generado_en: string;
}

/**
 * Interfaz para respuesta de reporte financiero
 */
export interface ReporteFinancieroResponse {
  success: boolean;
  data: DatosReporteFinanciero;
  message: string;
}

/**
 * Interfaz para configuración de reporte personalizado
 */
export interface ConfiguracionReportePersonalizado {
  nombre: string;
  descripcion?: string;
  modulos: ModuloPersonalizado[];
  fecha_inicio: string;
  fecha_fin: string;
  filtros: Record<string, any>;
  metricas: string[];
}

/**
 * Interfaz para parámetros de reporte personalizado
 */
export interface ParametrosReportePersonalizado extends ParametrosBaseReporte {
  nombre: string;
  descripcion?: string;
  modulos: ModuloPersonalizado[];
  filtros?: Record<string, any>;
  metricas: string[];
  guardar_configuracion?: boolean;
}

/**
 * Interfaz para datos de reporte personalizado
 */
export interface DatosReportePersonalizado {
  configuracion: ConfiguracionReportePersonalizado;
  resultados: Record<ModuloPersonalizado, any>;
  generado_en: string;
}

/**
 * Interfaz para respuesta de reporte personalizado
 */
export interface ReportePersonalizadoResponse {
  success: boolean;
  data: DatosReportePersonalizado;
  message: string;
}

/**
 * Interfaz para estadísticas generales de reportes
 */
export interface EstadisticasGeneralesReportes {
  total_pedidos: number;
  total_ventas: number;
  total_productos: number;
  total_clientes: number;
  productos_bajo_stock: number;
  comentarios_pendientes: number;
  cuotas_vencidas: number;
}

/**
 * Interfaz para tendencias de reportes
 */
export interface TendenciasReportes {
  ventas_diarias: { fecha: string; ventas: number }[];
  pedidos_diarios: { fecha: string; pedidos: number }[];
  clientes_nuevos: { fecha: string; clientes: number }[];
}

/**
 * Interfaz para reportes más generados
 */
export interface ReporteMasGenerado {
  tipo: TipoReporte;
  nombre: string;
  veces_generado: number;
  ultima_generacion: string;
  tiempo_promedio: string;
}

/**
 * Interfaz para parámetros de estadísticas de reportes
 */
export interface ParametrosEstadisticasReportes {
  periodo?: PeriodoReporte;
  incluir_cache?: boolean;
}

/**
 * Interfaz para datos de estadísticas de reportes
 */
export interface DatosEstadisticasReportes {
  periodo: PeriodoReporte;
  fechas: {
    desde: string;
    hasta: string;
  };
  estadisticas_generales: EstadisticasGeneralesReportes;
  tendencias: TendenciasReportes;
  reportes_mas_generados: ReporteMasGenerado[];
  ultima_actualizacion: string;
}

/**
 * Interfaz para respuesta de estadísticas de reportes
 */
export interface EstadisticasReportesResponse {
  success: boolean;
  data: DatosEstadisticasReportes;
  cached?: boolean;
  message: string;
}

/**
 * Interfaz para respuesta de exportación
 */
export interface ExportacionResponse {
  success: boolean;
  message: string;
  archivo: string;
  url_descarga: string;
}

/**
 * Interfaz para respuesta de error de reportes
 */
export interface ReporteErrorResponse {
  success: false;
  message: string;
  error: string;
}

/**
 * Constantes del sistema de reportes
 */
export const REPORTE_CONSTANTS = {
  DEFAULT_FORMATO: 'json' as FormatoExportacion,
  DEFAULT_MONEDA: 'PEN' as MonedaReporte,
  DEFAULT_AGRUPACION: 'dia' as AgrupacionReporte,
  MAX_REGISTROS_DETALLE: 1000,
  CACHE_DURATION_MINUTES: 30,
  FORMATOS_IMAGEN: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
  TAMAÑO_MAXIMO_ARCHIVO: 50 * 1024 * 1024, // 50MB
} as const;

/**
 * Configuración de categorías de reportes
 */
export const CATEGORIAS_REPORTES = {
  ventas: 'Reportes de Ventas',
  productos: 'Reportes de Productos',
  usuarios: 'Reportes de Usuarios',
  financieros: 'Reportes Financieros',
  inventario: 'Reportes de Inventario',
  marketing: 'Reportes de Marketing',
} as const;

/**
 * Configuración de iconos para tipos de reportes
 */
export const ICONOS_REPORTES = {
  ventas: 'trending-up',
  inventario: 'package',
  clientes: 'users',
  financiero: 'dollar-sign',
  personalizado: 'settings',
} as const;

/**
 * Configuración de colores para tipos de reportes
 */
export const COLORES_REPORTES = {
  ventas: '#10B981',
  inventario: '#F59E0B',
  clientes: '#3B82F6',
  financiero: '#8B5CF6',
  personalizado: '#6B7280',
} as const;

/**
 * Utilidades para el sistema de reportes
 */
export class ReporteUtils {
  /**
   * Valida un tipo de reporte
   */
  static isValidTipoReporte(tipo: string): tipo is TipoReporte {
    return [
      'ventas',
      'inventario',
      'clientes',
      'financiero',
      'personalizado',
    ].includes(tipo);
  }

  /**
   * Valida un formato de exportación
   */
  static isValidFormato(formato: string): formato is FormatoExportacion {
    return ['json', 'csv', 'excel', 'pdf'].includes(formato);
  }

  /**
   * Valida una moneda
   */
  static isValidMoneda(moneda: string): moneda is MonedaReporte {
    return ['PEN', 'USD', 'EUR'].includes(moneda);
  }

  /**
   * Obtiene el icono para un tipo de reporte
   */
  static getIconoReporte(tipo: TipoReporte): string {
    return ICONOS_REPORTES[tipo] || 'file-text';
  }

  /**
   * Obtiene el color para un tipo de reporte
   */
  static getColorReporte(tipo: TipoReporte): string {
    return COLORES_REPORTES[tipo] || '#6B7280';
  }

  /**
   * Formatea el tamaño de archivo
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Genera nombre de archivo para exportación
   */
  static generateFileName(
    tipo: TipoReporte,
    formato: FormatoExportacion
  ): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `reporte_${tipo}_${timestamp}.${formato}`;
  }

  /**
   * Valida parámetros de fecha
   */
  static validateDateRange(fechaInicio: string, fechaFin: string): boolean {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    return inicio <= fin && inicio <= new Date();
  }

  /**
   * Calcula el período en días
   */
  static calculatePeriodDays(fechaInicio: string, fechaFin: string): number {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Genera fechas para un período predefinido
   */
  static generatePeriodDates(periodo: PeriodoReporte): {
    desde: string;
    hasta: string;
  } {
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
