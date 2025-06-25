export interface MetricaNegocio {
  id: number;
  fecha: string;
  pedidos_totales: number;
  pedidos_entregados: number;
  pedidos_cancelados: number;
  ventas_totales: number;
  costo_envios: number;
  nuevos_clientes: number;
  clientes_recurrentes: number;
  tiempo_promedio_entrega: number;
  productos_vendidos: number;
  ticket_promedio: number;
  productos_mas_vendidos: Record<string, number> | string;
  zonas_mas_activas: Record<string, number> | string;
  created_at?: string;
  updated_at?: string;

  // Información calculada y formateada
  fecha_formateada: string;
  ventas_totales_formateadas: string;
  costo_envios_formateado: string;
  ticket_promedio_formateado: string;
  tiempo_promedio_entrega_texto: string;

  // Métricas porcentuales
  metricas_porcentuales: MetricasPorcentuales;

  // KPIs
  kpis: KpisMetrica;

  // Comparaciones y tendencias
  comparaciones: ComparacionesMetrica;

  // Top productos y zonas
  tops: TopsMetrica;
}

export interface MetricasPorcentuales {
  tasa_entrega: number;
  tasa_cancelacion: number;
  porcentaje_nuevos_clientes: number;
  porcentaje_clientes_recurrentes: number;
  margen_envios: number;
}

export interface KpisMetrica {
  pedidos_por_cliente_nuevo: number;
  ventas_por_pedido_entregado: number;
  productos_por_pedido: number;
  eficiencia_entrega: EficienciaEntrega;
  rentabilidad_dia: number;
}

export interface ComparacionesMetrica {
  es_dia_exitoso: boolean;
  supera_ticket_promedio: boolean;
  tiempo_entrega_optimo: boolean;
  volumen_alto: boolean;
}

export interface TopsMetrica {
  top_3_productos: Array<{ nombre: string; cantidad: number }>;
  top_3_zonas: Array<{ zona: string; pedidos: number }>;
  productos_vendidos_diferentes: number;
  zonas_activas_count: number;
}

export interface ResumenPeriodo {
  periodo: PeriodoResumen;
  totales: TotalesResumen;
  promedios: PromediosResumen;
  kpis: KpisResumen;
}

export interface PeriodoResumen {
  desde: string;
  hasta: string;
  dias: number;
}

export interface TotalesResumen {
  pedidos_totales: number;
  pedidos_entregados: number;
  pedidos_cancelados: number;
  ventas_totales: number;
  costo_envios: number;
  nuevos_clientes: number;
  clientes_recurrentes: number;
  productos_vendidos: number;
}

export interface PromediosResumen {
  pedidos_por_dia: number;
  ventas_por_dia: number;
  ticket_promedio: number;
  tiempo_promedio_entrega: number;
}

export interface KpisResumen {
  tasa_entrega_promedio: number;
  tasa_cancelacion_promedio: number;
  rentabilidad_total: number;
  crecimiento_ventas: number;
}

// DTOs para operaciones CRUD
export interface CreateMetricaNegocioDto {
  fecha: string;
  pedidos_totales: number;
  pedidos_entregados: number;
  pedidos_cancelados: number;
  ventas_totales: number;
  costo_envios: number;
  nuevos_clientes: number;
  clientes_recurrentes: number;
  tiempo_promedio_entrega: number;
  productos_vendidos: number;
  ticket_promedio: number;
  productos_mas_vendidos?: Record<string, number>;
  zonas_mas_activas?: Record<string, number>;
}

export interface UpdateMetricaNegocioDto
  extends Partial<CreateMetricaNegocioDto> {}

export interface GenerarMetricasDto {
  fecha: string;
}

// Filtros y paginación
export interface FiltrosMetricaNegocio {
  fecha_desde?: string;
  fecha_hasta?: string;
  mes?: number;
  year?: number;
  per_page?: number;
  page?: number;
}

export interface PaginacionMetricaNegocio {
  total: number;
  per_page: number;
  current_page: number;
  last_page?: number;
  from?: number;
  to?: number;
}

export interface MetricasNegocioResponse {
  data: MetricaNegocio[];
  meta: PaginacionMetricaNegocio;
}

export interface ResumenPeriodoResponse {
  resumen: ResumenPeriodo;
  metricas_detalle: MetricaNegocio[];
}

// Tipos y enums
export type EficienciaEntrega =
  | 'Excelente'
  | 'Buena'
  | 'Regular'
  | 'Necesita mejora';

export type TipoComparacion =
  | 'dia_exitoso'
  | 'ticket_promedio'
  | 'tiempo_optimo'
  | 'volumen_alto';

export type TipoKpi =
  | 'tasa_entrega'
  | 'tasa_cancelacion'
  | 'rentabilidad'
  | 'crecimiento';

// Constantes
export const EFICIENCIA_ENTREGA_COLORES: Record<EficienciaEntrega, string> = {
  Excelente: 'text-green-600',
  Buena: 'text-blue-600',
  Regular: 'text-yellow-600',
  'Necesita mejora': 'text-red-600',
};

export const EFICIENCIA_ENTREGA_BADGES: Record<EficienciaEntrega, string> = {
  Excelente: 'bg-green-100 text-green-800',
  Buena: 'bg-blue-100 text-blue-800',
  Regular: 'bg-yellow-100 text-yellow-800',
  'Necesita mejora': 'bg-red-100 text-red-800',
};

export const MESES_NOMBRES: Record<number, string> = {
  1: 'Enero',
  2: 'Febrero',
  3: 'Marzo',
  4: 'Abril',
  5: 'Mayo',
  6: 'Junio',
  7: 'Julio',
  8: 'Agosto',
  9: 'Septiembre',
  10: 'Octubre',
  11: 'Noviembre',
  12: 'Diciembre',
};

// Funciones utilitarias
export function esMetricaExitosa(metrica: MetricaNegocio): boolean {
  return metrica.comparaciones.es_dia_exitoso;
}

export function obtenerEficienciaColor(eficiencia: EficienciaEntrega): string {
  return EFICIENCIA_ENTREGA_COLORES[eficiencia] || 'text-gray-600';
}

export function obtenerEficienciaBadge(eficiencia: EficienciaEntrega): string {
  return EFICIENCIA_ENTREGA_BADGES[eficiencia] || 'bg-gray-100 text-gray-800';
}

export function formatearMoneda(valor: number): string {
  return `S/ ${valor.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatearPorcentaje(valor: number): string {
  return `${valor.toFixed(2)}%`;
}

export function formatearTiempo(minutos: number): string {
  if (minutos < 60) {
    return `${Math.round(minutos)} min`;
  }

  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  if (minutosRestantes === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${Math.round(minutosRestantes)}min`;
}

export function obtenerNombreMes(mes: number): string {
  return MESES_NOMBRES[mes] || 'Mes desconocido';
}

export function calcularCrecimiento(
  valorActual: number,
  valorAnterior: number
): number {
  if (valorAnterior === 0) return 0;
  return ((valorActual - valorAnterior) / valorAnterior) * 100;
}

export function obtenerTendencia(
  crecimiento: number
): 'positiva' | 'negativa' | 'neutral' {
  if (crecimiento > 0) return 'positiva';
  if (crecimiento < 0) return 'negativa';
  return 'neutral';
}

export function obtenerColorTendencia(
  tendencia: 'positiva' | 'negativa' | 'neutral'
): string {
  switch (tendencia) {
    case 'positiva':
      return 'text-green-600';
    case 'negativa':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

export function procesarProductosMasVendidos(
  productos: Record<string, number> | string
): Array<{ nombre: string; cantidad: number }> {
  if (typeof productos === 'string') {
    try {
      productos = JSON.parse(productos);
    } catch {
      return [];
    }
  }

  if (!productos || typeof productos !== 'object') {
    return [];
  }

  return Object.entries(productos)
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

export function procesarZonasMasActivas(
  zonas: Record<string, number> | string
): Array<{ zona: string; pedidos: number }> {
  if (typeof zonas === 'string') {
    try {
      zonas = JSON.parse(zonas);
    } catch {
      return [];
    }
  }

  if (!zonas || typeof zonas !== 'object') {
    return [];
  }

  return Object.entries(zonas)
    .map(([zona, pedidos]) => ({ zona, pedidos }))
    .sort((a, b) => b.pedidos - a.pedidos);
}

export function obtenerTop3Productos(
  metrica: MetricaNegocio
): Array<{ nombre: string; cantidad: number }> {
  const productos = procesarProductosMasVendidos(
    metrica.productos_mas_vendidos
  );
  return productos.slice(0, 3);
}

export function obtenerTop3Zonas(
  metrica: MetricaNegocio
): Array<{ zona: string; pedidos: number }> {
  const zonas = procesarZonasMasActivas(metrica.zonas_mas_activas);
  return zonas.slice(0, 3);
}

export function calcularPromedioMetricas(
  metricas: MetricaNegocio[]
): Partial<MetricaNegocio> {
  if (metricas.length === 0) return {};

  const totales = metricas.reduce(
    (acc, metrica) => ({
      pedidos_totales: acc.pedidos_totales + metrica.pedidos_totales,
      pedidos_entregados: acc.pedidos_entregados + metrica.pedidos_entregados,
      pedidos_cancelados: acc.pedidos_cancelados + metrica.pedidos_cancelados,
      ventas_totales: acc.ventas_totales + metrica.ventas_totales,
      costo_envios: acc.costo_envios + metrica.costo_envios,
      nuevos_clientes: acc.nuevos_clientes + metrica.nuevos_clientes,
      clientes_recurrentes:
        acc.clientes_recurrentes + metrica.clientes_recurrentes,
      tiempo_promedio_entrega:
        acc.tiempo_promedio_entrega + metrica.tiempo_promedio_entrega,
      productos_vendidos: acc.productos_vendidos + metrica.productos_vendidos,
      ticket_promedio: acc.ticket_promedio + metrica.ticket_promedio,
    }),
    {
      pedidos_totales: 0,
      pedidos_entregados: 0,
      pedidos_cancelados: 0,
      ventas_totales: 0,
      costo_envios: 0,
      nuevos_clientes: 0,
      clientes_recurrentes: 0,
      tiempo_promedio_entrega: 0,
      productos_vendidos: 0,
      ticket_promedio: 0,
    }
  );

  const count = metricas.length;

  return {
    pedidos_totales: Math.round(totales.pedidos_totales / count),
    pedidos_entregados: Math.round(totales.pedidos_entregados / count),
    pedidos_cancelados: Math.round(totales.pedidos_cancelados / count),
    ventas_totales: totales.ventas_totales / count,
    costo_envios: totales.costo_envios / count,
    nuevos_clientes: Math.round(totales.nuevos_clientes / count),
    clientes_recurrentes: Math.round(totales.clientes_recurrentes / count),
    tiempo_promedio_entrega: totales.tiempo_promedio_entrega / count,
    productos_vendidos: Math.round(totales.productos_vendidos / count),
    ticket_promedio: totales.ticket_promedio / count,
  };
}

export function agruparMetricasPorMes(
  metricas: MetricaNegocio[]
): Record<string, MetricaNegocio[]> {
  return metricas.reduce((acc, metrica) => {
    const fecha = new Date(metrica.fecha);
    const clave = `${fecha.getFullYear()}-${String(
      fecha.getMonth() + 1
    ).padStart(2, '0')}`;

    if (!acc[clave]) {
      acc[clave] = [];
    }

    acc[clave].push(metrica);
    return acc;
  }, {} as Record<string, MetricaNegocio[]>);
}

export function obtenerMetricasDelMes(
  metricas: MetricaNegocio[],
  year: number,
  mes: number
): MetricaNegocio[] {
  return metricas.filter((metrica) => {
    const fecha = new Date(metrica.fecha);
    return fecha.getFullYear() === year && fecha.getMonth() + 1 === mes;
  });
}

export function buscarMetricas(
  metricas: MetricaNegocio[],
  termino: string
): MetricaNegocio[] {
  if (!termino.trim()) return metricas;

  const terminoLower = termino.toLowerCase();

  return metricas.filter(
    (metrica) =>
      metrica.fecha_formateada.toLowerCase().includes(terminoLower) ||
      metrica.kpis.eficiencia_entrega.toLowerCase().includes(terminoLower) ||
      metrica.ventas_totales_formateadas.toLowerCase().includes(terminoLower)
  );
}

export function ordenarMetricas(
  metricas: MetricaNegocio[],
  campo: keyof MetricaNegocio,
  direccion: 'asc' | 'desc' = 'desc'
): MetricaNegocio[] {
  return [...metricas].sort((a, b) => {
    const valorA = a[campo];
    const valorB = b[campo];

    if (typeof valorA === 'number' && typeof valorB === 'number') {
      return direccion === 'asc' ? valorA - valorB : valorB - valorA;
    }

    if (typeof valorA === 'string' && typeof valorB === 'string') {
      return direccion === 'asc'
        ? valorA.localeCompare(valorB)
        : valorB.localeCompare(valorA);
    }

    return 0;
  });
}

export function obtenerEstadisticasGenerales(metricas: MetricaNegocio[]): {
  total_dias: number;
  promedio_ventas_diarias: number;
  mejor_dia: MetricaNegocio | null;
  peor_dia: MetricaNegocio | null;
  dias_exitosos: number;
  tasa_exito: number;
} {
  if (metricas.length === 0) {
    return {
      total_dias: 0,
      promedio_ventas_diarias: 0,
      mejor_dia: null,
      peor_dia: null,
      dias_exitosos: 0,
      tasa_exito: 0,
    };
  }

  const totalVentas = metricas.reduce((sum, m) => sum + m.ventas_totales, 0);
  const diasExitosos = metricas.filter(
    (m) => m.comparaciones.es_dia_exitoso
  ).length;

  const mejorDia = metricas.reduce((mejor, actual) =>
    actual.ventas_totales > mejor.ventas_totales ? actual : mejor
  );

  const peorDia = metricas.reduce((peor, actual) =>
    actual.ventas_totales < peor.ventas_totales ? actual : peor
  );

  return {
    total_dias: metricas.length,
    promedio_ventas_diarias: totalVentas / metricas.length,
    mejor_dia: mejorDia,
    peor_dia: peorDia,
    dias_exitosos: diasExitosos,
    tasa_exito: (diasExitosos / metricas.length) * 100,
  };
}
