export interface CostoEnvioDinamico {
  id: number;
  zona_reparto_id: number;
  distancia_desde_km: number;
  distancia_hasta_km: number;
  costo_envio: number;
  tiempo_adicional: number;
  activo: boolean;
  created_at: string;
  updated_at: string;

  // Información calculada
  rango_distancia_texto: string;
  costo_envio_formateado: string;
  tiempo_adicional_texto: string;
  amplitud_rango: number;

  // Relaciones opcionales
  zona_reparto?: ZonaRepartoCosto;
  validaciones?: ValidacionesCosto;
}

export interface ZonaRepartoCosto {
  id: number;
  nombre: string;
  slug: string;
  costo_envio: number;
  activo: boolean;
}

export interface ValidacionesCosto {
  rango_valido: boolean;
  distancia_desde_positiva: boolean;
  distancia_hasta_mayor: boolean;
  costo_positivo: boolean;
}

// DTOs para crear y actualizar
export interface CreateCostoEnvioDinamicoDto {
  zona_reparto_id: number;
  distancia_desde_km: number;
  distancia_hasta_km: number;
  costo_envio: number;
  tiempo_adicional?: number;
  activo?: boolean;
}

export interface UpdateCostoEnvioDinamicoDto {
  distancia_desde_km?: number;
  distancia_hasta_km?: number;
  costo_envio?: number;
  tiempo_adicional?: number;
  activo?: boolean;
}

// Filtros para búsqueda
export interface FiltrosCostoEnvioDinamico {
  zona_reparto_id?: number;
  distancia?: number;
  activo?: boolean;
  distancia_desde_min?: number;
  distancia_desde_max?: number;
  distancia_hasta_min?: number;
  distancia_hasta_max?: number;
  costo_min?: number;
  costo_max?: number;
  tiempo_adicional_min?: number;
  tiempo_adicional_max?: number;
  amplitud_min?: number;
  amplitud_max?: number;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// Respuestas de la API
export interface CostoEnvioDinamicoResponse {
  success: boolean;
  data: CostoEnvioDinamico;
  message?: string;
}

export interface CostosEnvioDinamicoResponse {
  data: CostoEnvioDinamico[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

// Estadísticas
export interface EstadisticasCostoEnvioDinamico {
  total_costos: number;
  costos_activos: number;
  costos_inactivos: number;
  zonas_con_costos: number;
  costo_promedio: number;
  costo_minimo: number;
  costo_maximo: number;
  distancia_maxima_cubierta: number;
  tiempo_adicional_promedio: number;
  amplitud_promedio: number;
  costos_por_zona: Array<{
    zona_reparto_id: number;
    zona_nombre: string;
    total_costos: number;
    costos_activos: number;
    costo_promedio: number;
    distancia_maxima: number;
    cobertura_completa: boolean;
  }>;
  rangos_populares: Array<{
    rango_texto: string;
    total_costos: number;
    costo_promedio: number;
    porcentaje: number;
  }>;
  distribucion_costos: Array<{
    rango_costo: string;
    total_costos: number;
    porcentaje: number;
  }>;
}

// Agrupación por zona de reparto
export interface CostosPorZona {
  zona_reparto_id: number;
  zona_nombre: string;
  zona_slug: string;
  costos: CostoEnvioDinamico[];
  total_costos: number;
  costos_activos: number;
  costo_promedio: number;
  distancia_maxima_cubierta: number;
  cobertura_completa: boolean;
  rangos_ordenados: CostoEnvioDinamico[];
  gaps_cobertura: Array<{
    desde: number;
    hasta: number;
    amplitud: number;
  }>;
}

// Análisis de cobertura
export interface AnalisisCobertura {
  zonas_analizadas: number;
  zonas_con_cobertura_completa: number;
  zonas_con_gaps: number;
  gaps_totales: number;
  distancia_promedio_cubierta: number;
  zonas_problematicas: Array<{
    zona_reparto_id: number;
    zona_nombre: string;
    problemas: string[];
    gaps: Array<{
      desde: number;
      hasta: number;
    }>;
    solapamientos: Array<{
      costo1_id: number;
      costo2_id: number;
      rango_solapado: string;
    }>;
  }>;
}

// Cálculo de costo para distancia específica
export interface CalculoCosto {
  zona_reparto_id: number;
  distancia_km: number;
  costo_encontrado: boolean;
  costo_envio: number;
  tiempo_adicional: number;
  costo_formateado: string;
  tiempo_texto: string;
  rango_aplicado: string;
  costo_detalle?: CostoEnvioDinamico;
}

// Optimización de rangos
export interface OptimizacionRangos {
  zona_reparto_id: number;
  rangos_actuales: number;
  rangos_optimizados: number;
  gaps_eliminados: number;
  solapamientos_resueltos: number;
  sugerencias: Array<{
    tipo: 'crear' | 'modificar' | 'eliminar' | 'fusionar';
    descripcion: string;
    rango_sugerido?: {
      distancia_desde_km: number;
      distancia_hasta_km: number;
      costo_envio: number;
    };
    costos_afectados?: number[];
  }>;
}

// Constantes y tipos
export const OPCIONES_ORDEN_COSTO = [
  { value: 'distancia_desde_km', label: 'Distancia desde' },
  { value: 'distancia_hasta_km', label: 'Distancia hasta' },
  { value: 'costo_envio', label: 'Costo de envío' },
  { value: 'tiempo_adicional', label: 'Tiempo adicional' },
  { value: 'amplitud_rango', label: 'Amplitud del rango' },
  { value: 'zona_reparto_id', label: 'Zona de reparto' },
  { value: 'created_at', label: 'Fecha de creación' },
] as const;

export const DIRECCIONES_ORDEN_COSTO = [
  { value: 'asc', label: 'Ascendente' },
  { value: 'desc', label: 'Descendente' },
] as const;

export const RANGOS_DISTANCIA_COMUNES = [
  { desde: 0, hasta: 1, label: 'Hasta 1 km' },
  { desde: 1, hasta: 2, label: 'De 1 a 2 km' },
  { desde: 2, hasta: 3, label: 'De 2 a 3 km' },
  { desde: 3, hasta: 5, label: 'De 3 a 5 km' },
  { desde: 5, hasta: 10, label: 'De 5 a 10 km' },
  { desde: 10, hasta: 20, label: 'De 10 a 20 km' },
] as const;

export const RANGOS_COSTO_ANALISIS = [
  { min: 0, max: 5, label: 'Hasta S/ 5.00' },
  { min: 5, max: 10, label: 'S/ 5.00 - S/ 10.00' },
  { min: 10, max: 15, label: 'S/ 10.00 - S/ 15.00' },
  { min: 15, max: 20, label: 'S/ 15.00 - S/ 20.00' },
  { min: 20, max: 999, label: 'Más de S/ 20.00' },
] as const;

export type OpcionOrdenCosto = (typeof OPCIONES_ORDEN_COSTO)[number]['value'];
export type DireccionOrdenCosto =
  (typeof DIRECCIONES_ORDEN_COSTO)[number]['value'];

// Funciones utilitarias
export function validarCostoEnvioDinamico(
  data: CreateCostoEnvioDinamicoDto | UpdateCostoEnvioDinamicoDto
): string[] {
  const errores: string[] = [];

  if ('zona_reparto_id' in data) {
    if (!data.zona_reparto_id || data.zona_reparto_id <= 0) {
      errores.push(
        'El ID de la zona de reparto es requerido y debe ser mayor a 0'
      );
    }
  }

  if ('distancia_desde_km' in data) {
    if (data.distancia_desde_km === undefined || data.distancia_desde_km < 0) {
      errores.push('La distancia desde debe ser mayor o igual a 0');
    }
  }

  if ('distancia_hasta_km' in data) {
    if (data.distancia_hasta_km === undefined || data.distancia_hasta_km <= 0) {
      errores.push('La distancia hasta debe ser mayor a 0');
    }
  }

  if ('distancia_desde_km' in data && 'distancia_hasta_km' in data) {
    if (
      data.distancia_desde_km !== undefined &&
      data.distancia_hasta_km !== undefined
    ) {
      if (data.distancia_hasta_km <= data.distancia_desde_km) {
        errores.push(
          'La distancia hasta debe ser mayor que la distancia desde'
        );
      }
    }
  }

  if ('costo_envio' in data) {
    if (data.costo_envio === undefined || data.costo_envio < 0) {
      errores.push('El costo de envío debe ser mayor o igual a 0');
    }
  }

  if ('tiempo_adicional' in data && data.tiempo_adicional !== undefined) {
    if (data.tiempo_adicional < 0) {
      errores.push('El tiempo adicional debe ser mayor o igual a 0');
    }
  }

  return errores;
}

export function formatearDistancia(km: number): string {
  if (km < 1) {
    return `${(km * 1000).toFixed(0)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export function formatearCosto(costo: number): string {
  return `S/ ${costo.toFixed(2)}`;
}

export function formatearTiempoAdicional(minutos: number): string {
  if (minutos === 0) {
    return 'Sin tiempo adicional';
  }

  if (minutos < 0) {
    return `${Math.abs(minutos)} minutos menos`;
  }

  if (minutos < 60) {
    return `${minutos} minutos adicionales`;
  }

  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;

  if (mins === 0) {
    return `${horas} hora${horas > 1 ? 's' : ''} adicionales`;
  }

  return `${horas}h ${mins}min adicionales`;
}

export function formatearRangoDistancia(desde: number, hasta: number): string {
  if (desde === 0) {
    return `Hasta ${formatearDistancia(hasta)}`;
  }
  return `De ${formatearDistancia(desde)} a ${formatearDistancia(hasta)}`;
}

export function calcularAmplitudRango(desde: number, hasta: number): number {
  return hasta - desde;
}

export function esRangoValido(
  desde: number,
  hasta: number,
  costo: number
): boolean {
  return desde >= 0 && hasta > desde && costo >= 0;
}

export function detectarSolapamiento(
  rango1: { desde: number; hasta: number },
  rango2: { desde: number; hasta: number }
): boolean {
  return !(rango1.hasta <= rango2.desde || rango2.hasta <= rango1.desde);
}

export function encontrarGaps(
  costos: CostoEnvioDinamico[]
): Array<{ desde: number; hasta: number; amplitud: number }> {
  if (costos.length === 0) return [];

  const costosOrdenados = [...costos].sort(
    (a, b) => a.distancia_desde_km - b.distancia_desde_km
  );
  const gaps: Array<{ desde: number; hasta: number; amplitud: number }> = [];

  for (let i = 0; i < costosOrdenados.length - 1; i++) {
    const actual = costosOrdenados[i];
    const siguiente = costosOrdenados[i + 1];

    if (actual.distancia_hasta_km < siguiente.distancia_desde_km) {
      const gap = {
        desde: actual.distancia_hasta_km,
        hasta: siguiente.distancia_desde_km,
        amplitud: siguiente.distancia_desde_km - actual.distancia_hasta_km,
      };
      gaps.push(gap);
    }
  }

  return gaps;
}

export function encontrarSolapamientos(costos: CostoEnvioDinamico[]): Array<{
  costo1_id: number;
  costo2_id: number;
  rango_solapado: string;
}> {
  const solapamientos: Array<{
    costo1_id: number;
    costo2_id: number;
    rango_solapado: string;
  }> = [];

  for (let i = 0; i < costos.length; i++) {
    for (let j = i + 1; j < costos.length; j++) {
      const costo1 = costos[i];
      const costo2 = costos[j];

      if (
        detectarSolapamiento(
          {
            desde: costo1.distancia_desde_km,
            hasta: costo1.distancia_hasta_km,
          },
          { desde: costo2.distancia_desde_km, hasta: costo2.distancia_hasta_km }
        )
      ) {
        const inicioSolape = Math.max(
          costo1.distancia_desde_km,
          costo2.distancia_desde_km
        );
        const finSolape = Math.min(
          costo1.distancia_hasta_km,
          costo2.distancia_hasta_km
        );

        solapamientos.push({
          costo1_id: costo1.id,
          costo2_id: costo2.id,
          rango_solapado: formatearRangoDistancia(inicioSolape, finSolape),
        });
      }
    }
  }

  return solapamientos;
}

export function calcularCostoParaDistancia(
  costos: CostoEnvioDinamico[],
  distancia: number
): CalculoCosto | null {
  const costoAplicable = costos.find(
    (c) =>
      c.activo &&
      c.distancia_desde_km <= distancia &&
      c.distancia_hasta_km > distancia
  );

  if (!costoAplicable) {
    return null;
  }

  return {
    zona_reparto_id: costoAplicable.zona_reparto_id,
    distancia_km: distancia,
    costo_encontrado: true,
    costo_envio: costoAplicable.costo_envio,
    tiempo_adicional: costoAplicable.tiempo_adicional,
    costo_formateado: formatearCosto(costoAplicable.costo_envio),
    tiempo_texto: formatearTiempoAdicional(costoAplicable.tiempo_adicional),
    rango_aplicado: costoAplicable.rango_distancia_texto,
    costo_detalle: costoAplicable,
  };
}

export function agruparPorZona(costos: CostoEnvioDinamico[]): CostosPorZona[] {
  const grupos = new Map<number, CostosPorZona>();

  costos.forEach((costo) => {
    const zonaId = costo.zona_reparto_id;

    if (!grupos.has(zonaId)) {
      grupos.set(zonaId, {
        zona_reparto_id: zonaId,
        zona_nombre: costo.zona_reparto?.nombre || `Zona ${zonaId}`,
        zona_slug: costo.zona_reparto?.slug || '',
        costos: [],
        total_costos: 0,
        costos_activos: 0,
        costo_promedio: 0,
        distancia_maxima_cubierta: 0,
        cobertura_completa: false,
        rangos_ordenados: [],
        gaps_cobertura: [],
      });
    }

    const grupo = grupos.get(zonaId)!;
    grupo.costos.push(costo);
    grupo.total_costos++;

    if (costo.activo) {
      grupo.costos_activos++;
    }

    grupo.distancia_maxima_cubierta = Math.max(
      grupo.distancia_maxima_cubierta,
      costo.distancia_hasta_km
    );
  });

  // Calcular estadísticas adicionales
  grupos.forEach((grupo) => {
    const costosActivos = grupo.costos.filter((c) => c.activo);

    // Costo promedio
    if (costosActivos.length > 0) {
      grupo.costo_promedio =
        costosActivos.reduce((sum, c) => sum + c.costo_envio, 0) /
        costosActivos.length;
    }

    // Rangos ordenados
    grupo.rangos_ordenados = [...costosActivos].sort(
      (a, b) => a.distancia_desde_km - b.distancia_desde_km
    );

    // Gaps de cobertura
    grupo.gaps_cobertura = encontrarGaps(costosActivos);

    // Cobertura completa (sin gaps y empieza desde 0)
    grupo.cobertura_completa =
      grupo.gaps_cobertura.length === 0 &&
      grupo.rangos_ordenados.length > 0 &&
      grupo.rangos_ordenados[0].distancia_desde_km === 0;
  });

  return Array.from(grupos.values()).sort((a, b) =>
    a.zona_nombre.localeCompare(b.zona_nombre)
  );
}

export function calcularEstadisticas(
  costos: CostoEnvioDinamico[]
): EstadisticasCostoEnvioDinamico {
  const totalCostos = costos.length;
  const costosActivos = costos.filter((c) => c.activo);
  const costosInactivos = totalCostos - costosActivos.length;

  // Zonas únicas
  const zonasUnicas = new Set(costos.map((c) => c.zona_reparto_id));

  // Estadísticas de costos
  const costosEnvio = costosActivos.map((c) => c.costo_envio);
  const costoPromedio =
    costosEnvio.length > 0
      ? costosEnvio.reduce((sum, c) => sum + c, 0) / costosEnvio.length
      : 0;
  const costoMinimo = costosEnvio.length > 0 ? Math.min(...costosEnvio) : 0;
  const costoMaximo = costosEnvio.length > 0 ? Math.max(...costosEnvio) : 0;

  // Distancia máxima cubierta
  const distanciaMaxima =
    costos.length > 0
      ? Math.max(...costos.map((c) => c.distancia_hasta_km))
      : 0;

  // Tiempo adicional promedio
  const tiemposAdicionales = costosActivos.map((c) => c.tiempo_adicional);
  const tiempoAdicionalPromedio =
    tiemposAdicionales.length > 0
      ? tiemposAdicionales.reduce((sum, t) => sum + t, 0) /
        tiemposAdicionales.length
      : 0;

  // Amplitud promedio
  const amplitudes = costos.map((c) => c.amplitud_rango);
  const amplitudPromedio =
    amplitudes.length > 0
      ? amplitudes.reduce((sum, a) => sum + a, 0) / amplitudes.length
      : 0;

  // Costos por zona
  const costosPorZona = agruparPorZona(costos).map((grupo) => ({
    zona_reparto_id: grupo.zona_reparto_id,
    zona_nombre: grupo.zona_nombre,
    total_costos: grupo.total_costos,
    costos_activos: grupo.costos_activos,
    costo_promedio: grupo.costo_promedio,
    distancia_maxima: grupo.distancia_maxima_cubierta,
    cobertura_completa: grupo.cobertura_completa,
  }));

  // Rangos populares
  const rangosMap = new Map<string, { total: number; costos: number[] }>();
  costos.forEach((c) => {
    const rango = c.rango_distancia_texto;
    if (!rangosMap.has(rango)) {
      rangosMap.set(rango, { total: 0, costos: [] });
    }
    const rangoData = rangosMap.get(rango)!;
    rangoData.total++;
    rangoData.costos.push(c.costo_envio);
  });

  const rangosPopulares = Array.from(rangosMap.entries())
    .map(([rango, data]) => ({
      rango_texto: rango,
      total_costos: data.total,
      costo_promedio:
        data.costos.reduce((sum, c) => sum + c, 0) / data.costos.length,
      porcentaje: totalCostos > 0 ? (data.total / totalCostos) * 100 : 0,
    }))
    .sort((a, b) => b.total_costos - a.total_costos);

  // Distribución de costos
  const distribucionCostos = RANGOS_COSTO_ANALISIS.map((rango) => {
    const costosEnRango = costos.filter(
      (c) => c.costo_envio >= rango.min && c.costo_envio < rango.max
    );

    return {
      rango_costo: rango.label,
      total_costos: costosEnRango.length,
      porcentaje:
        totalCostos > 0 ? (costosEnRango.length / totalCostos) * 100 : 0,
    };
  });

  return {
    total_costos: totalCostos,
    costos_activos: costosActivos.length,
    costos_inactivos: costosInactivos,
    zonas_con_costos: zonasUnicas.size,
    costo_promedio: costoPromedio,
    costo_minimo: costoMinimo,
    costo_maximo: costoMaximo,
    distancia_maxima_cubierta: distanciaMaxima,
    tiempo_adicional_promedio: tiempoAdicionalPromedio,
    amplitud_promedio: amplitudPromedio,
    costos_por_zona: costosPorZona,
    rangos_populares: rangosPopulares,
    distribucion_costos: distribucionCostos,
  };
}

export function analizarCobertura(
  costos: CostoEnvioDinamico[]
): AnalisisCobertura {
  const costosPorZona = agruparPorZona(costos);
  const zonasAnalizadas = costosPorZona.length;
  const zonasConCoberturaCompleta = costosPorZona.filter(
    (z) => z.cobertura_completa
  ).length;
  const zonasConGaps = costosPorZona.filter(
    (z) => z.gaps_cobertura.length > 0
  ).length;
  const gapsTotal = costosPorZona.reduce(
    (sum, z) => sum + z.gaps_cobertura.length,
    0
  );

  const distanciaPromedioCubierta =
    zonasAnalizadas > 0
      ? costosPorZona.reduce((sum, z) => sum + z.distancia_maxima_cubierta, 0) /
        zonasAnalizadas
      : 0;

  const zonasProblematicas = costosPorZona
    .filter((zona) => {
      const problemas = [];
      const solapamientos = encontrarSolapamientos(zona.costos);

      if (zona.gaps_cobertura.length > 0) {
        problemas.push(`${zona.gaps_cobertura.length} gaps de cobertura`);
      }

      if (solapamientos.length > 0) {
        problemas.push(`${solapamientos.length} solapamientos`);
      }

      if (!zona.cobertura_completa) {
        problemas.push('Cobertura incompleta');
      }

      return problemas.length > 0;
    })
    .map((zona) => ({
      zona_reparto_id: zona.zona_reparto_id,
      zona_nombre: zona.zona_nombre,
      problemas: [],
      gaps: zona.gaps_cobertura,
      solapamientos: encontrarSolapamientos(zona.costos),
    }));

  return {
    zonas_analizadas: zonasAnalizadas,
    zonas_con_cobertura_completa: zonasConCoberturaCompleta,
    zonas_con_gaps: zonasConGaps,
    gaps_totales: gapsTotal,
    distancia_promedio_cubierta: distanciaPromedioCubierta,
    zonas_problematicas: zonasProblematicas,
  };
}

export function filtrarPorZona(
  costos: CostoEnvioDinamico[],
  zonaRepartoId: number
): CostoEnvioDinamico[] {
  return costos.filter((c) => c.zona_reparto_id === zonaRepartoId);
}

export function filtrarActivos(
  costos: CostoEnvioDinamico[]
): CostoEnvioDinamico[] {
  return costos.filter((c) => c.activo);
}

export function filtrarInactivos(
  costos: CostoEnvioDinamico[]
): CostoEnvioDinamico[] {
  return costos.filter((c) => !c.activo);
}

export function filtrarPorRangoCosto(
  costos: CostoEnvioDinamico[],
  min: number,
  max: number
): CostoEnvioDinamico[] {
  return costos.filter((c) => c.costo_envio >= min && c.costo_envio <= max);
}

export function filtrarPorRangoDistancia(
  costos: CostoEnvioDinamico[],
  distanciaMin: number,
  distanciaMax: number
): CostoEnvioDinamico[] {
  return costos.filter(
    (c) =>
      c.distancia_desde_km <= distanciaMax &&
      c.distancia_hasta_km >= distanciaMin
  );
}

export function ordenarPorDistancia(
  costos: CostoEnvioDinamico[],
  direccion: 'asc' | 'desc' = 'asc'
): CostoEnvioDinamico[] {
  return [...costos].sort((a, b) => {
    const ordenA = a.distancia_desde_km;
    const ordenB = b.distancia_desde_km;
    return direccion === 'asc' ? ordenA - ordenB : ordenB - ordenA;
  });
}

export function ordenarPorCosto(
  costos: CostoEnvioDinamico[],
  direccion: 'asc' | 'desc' = 'asc'
): CostoEnvioDinamico[] {
  return [...costos].sort((a, b) => {
    const ordenA = a.costo_envio;
    const ordenB = b.costo_envio;
    return direccion === 'asc' ? ordenA - ordenB : ordenB - ordenA;
  });
}

export function ordenarPorAmplitud(
  costos: CostoEnvioDinamico[],
  direccion: 'asc' | 'desc' = 'asc'
): CostoEnvioDinamico[] {
  return [...costos].sort((a, b) => {
    const ordenA = a.amplitud_rango;
    const ordenB = b.amplitud_rango;
    return direccion === 'asc' ? ordenA - ordenB : ordenB - ordenA;
  });
}

export function buscarCostos(
  costos: CostoEnvioDinamico[],
  termino: string
): CostoEnvioDinamico[] {
  const terminoLower = termino.toLowerCase();

  return costos.filter((costo) => {
    const zonaNombre = costo.zona_reparto?.nombre?.toLowerCase() || '';
    const rangoTexto = costo.rango_distancia_texto.toLowerCase();
    const costoTexto = costo.costo_envio_formateado.toLowerCase();
    const tiempoTexto = costo.tiempo_adicional_texto.toLowerCase();

    return (
      zonaNombre.includes(terminoLower) ||
      rangoTexto.includes(terminoLower) ||
      costoTexto.includes(terminoLower) ||
      tiempoTexto.includes(terminoLower)
    );
  });
}

export function validarRangoUnico(
  costos: CostoEnvioDinamico[],
  zonaRepartoId: number,
  desde: number,
  hasta: number,
  excludeId?: number
): boolean {
  return !costos.some(
    (c) =>
      c.zona_reparto_id === zonaRepartoId &&
      c.id !== excludeId &&
      detectarSolapamiento(
        { desde: c.distancia_desde_km, hasta: c.distancia_hasta_km },
        { desde, hasta }
      )
  );
}

export function generarSugerenciasOptimizacion(
  costos: CostoEnvioDinamico[],
  zonaRepartoId: number
): OptimizacionRangos {
  const costosZona = filtrarPorZona(filtrarActivos(costos), zonaRepartoId);
  const rangosOrdenados = ordenarPorDistancia(costosZona);
  const gaps = encontrarGaps(costosZona);
  const solapamientos = encontrarSolapamientos(costosZona);

  const sugerencias: OptimizacionRangos['sugerencias'] = [];

  // Sugerencias para llenar gaps
  gaps.forEach((gap) => {
    if (gap.amplitud >= 0.1) {
      // Solo gaps significativos
      sugerencias.push({
        tipo: 'crear',
        descripcion: `Crear rango para cubrir gap de ${formatearRangoDistancia(
          gap.desde,
          gap.hasta
        )}`,
        rango_sugerido: {
          distancia_desde_km: gap.desde,
          distancia_hasta_km: gap.hasta,
          costo_envio: estimarCostoParaGap(costosZona, gap.desde, gap.hasta),
        },
      });
    }
  });

  // Sugerencias para resolver solapamientos
  solapamientos.forEach((solape) => {
    sugerencias.push({
      tipo: 'modificar',
      descripcion: `Resolver solapamiento en ${solape.rango_solapado}`,
      costos_afectados: [solape.costo1_id, solape.costo2_id],
    });
  });

  return {
    zona_reparto_id: zonaRepartoId,
    rangos_actuales: costosZona.length,
    rangos_optimizados: costosZona.length + gaps.length,
    gaps_eliminados: gaps.length,
    solapamientos_resueltos: solapamientos.length,
    sugerencias,
  };
}

function estimarCostoParaGap(
  costos: CostoEnvioDinamico[],
  desde: number,
  hasta: number
): number {
  // Buscar costos antes y después del gap para interpolar
  const costosOrdenados = ordenarPorDistancia(costos);

  const costoAnterior = costosOrdenados
    .filter((c) => c.distancia_hasta_km <= desde)
    .pop();

  const costoPosterior = costosOrdenados.find(
    (c) => c.distancia_desde_km >= hasta
  );

  if (costoAnterior && costoPosterior) {
    // Interpolación lineal
    return (costoAnterior.costo_envio + costoPosterior.costo_envio) / 2;
  }

  if (costoAnterior) {
    return costoAnterior.costo_envio * 1.2; // 20% más
  }

  if (costoPosterior) {
    return costoPosterior.costo_envio * 0.8; // 20% menos
  }

  return 5; // Valor por defecto
}

export function obtenerCostoMasEconomico(
  costos: CostoEnvioDinamico[],
  distancia: number
): CostoEnvioDinamico | null {
  const costosAplicables = costos.filter(
    (c) =>
      c.activo &&
      c.distancia_desde_km <= distancia &&
      c.distancia_hasta_km > distancia
  );

  if (costosAplicables.length === 0) return null;

  return costosAplicables.reduce((menor, actual) =>
    actual.costo_envio < menor.costo_envio ? actual : menor
  );
}

export function obtenerCostoMasRapido(
  costos: CostoEnvioDinamico[],
  distancia: number
): CostoEnvioDinamico | null {
  const costosAplicables = costos.filter(
    (c) =>
      c.activo &&
      c.distancia_desde_km <= distancia &&
      c.distancia_hasta_km > distancia
  );

  if (costosAplicables.length === 0) return null;

  return costosAplicables.reduce((masRapido, actual) =>
    actual.tiempo_adicional < masRapido.tiempo_adicional ? actual : masRapido
  );
}
