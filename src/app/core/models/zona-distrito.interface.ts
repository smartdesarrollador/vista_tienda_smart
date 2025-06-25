export interface ZonaDistrito {
  id: number;
  zona_reparto_id: number;
  distrito_id: number;
  costo_envio_personalizado: number | null;
  tiempo_adicional: number;
  activo: boolean;
  prioridad: number;
  created_at: string;
  updated_at: string;

  // Información calculada
  prioridad_texto: string;
  tiempo_adicional_texto: string;
  costo_envio_efectivo: number;
  costo_envio_formateado: string;

  // Relaciones opcionales
  zona_reparto?: ZonaRepartoInfo;
  distrito?: DistritoInfo;
  tiempo_entrega_calculado?: TiempoEntregaCalculado;
}

export interface ZonaRepartoInfo {
  id: number;
  nombre: string;
  slug: string;
  costo_envio: number;
  tiempo_entrega_min: number;
  tiempo_entrega_max: number;
  activo: boolean;
  disponible_24h: boolean;
}

export interface DistritoInfo {
  id: number;
  nombre: string;
  codigo: string;
  activo: boolean;
  disponible_delivery: boolean;
  provincia?: ProvinciaInfo;
}

export interface ProvinciaInfo {
  id: number;
  nombre: string;
  departamento?: DepartamentoInfo;
}

export interface DepartamentoInfo {
  id: number;
  nombre: string;
}

export interface TiempoEntregaCalculado {
  tiempo_min: number;
  tiempo_max: number;
  tiempo_adicional_aplicado: number;
  texto: string;
}

// DTOs para crear y actualizar
export interface CreateZonaDistritoDto {
  zona_reparto_id: number;
  distrito_id: number;
  costo_envio_personalizado?: number;
  tiempo_adicional?: number;
  activo?: boolean;
  prioridad: number;
}

export interface UpdateZonaDistritoDto {
  costo_envio_personalizado?: number | null;
  tiempo_adicional?: number;
  activo?: boolean;
  prioridad?: number;
}

// Filtros para búsqueda
export interface FiltrosZonaDistrito {
  zona_reparto_id?: number;
  distrito_id?: number;
  activo?: boolean;
  prioridad?: number;
  departamento_id?: number;
  provincia_id?: number;
  disponible_delivery?: boolean;
  costo_min?: number;
  costo_max?: number;
  tiempo_min?: number;
  tiempo_max?: number;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// Respuestas de la API
export interface ZonaDistritoResponse {
  success: boolean;
  data: ZonaDistrito;
  message?: string;
}

export interface ZonasDistritosResponse {
  data: ZonaDistrito[];
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
export interface EstadisticasZonaDistrito {
  total_asignaciones: number;
  asignaciones_activas: number;
  asignaciones_inactivas: number;
  zonas_con_asignaciones: number;
  distritos_con_asignaciones: number;
  costo_promedio: number;
  tiempo_promedio_adicional: number;
  asignaciones_por_prioridad: Array<{
    prioridad: number;
    prioridad_texto: string;
    cantidad: number;
    porcentaje: number;
  }>;
  zonas_mas_asignadas: Array<{
    zona_reparto_id: number;
    zona_nombre: string;
    total_asignaciones: number;
    distritos_asignados: number;
  }>;
  distritos_mas_asignados: Array<{
    distrito_id: number;
    distrito_nombre: string;
    total_asignaciones: number;
    zonas_asignadas: number;
  }>;
  costos_personalizados: {
    total_con_costo_personalizado: number;
    total_sin_costo_personalizado: number;
    costo_personalizado_promedio: number;
  };
  tiempos_adicionales: {
    total_con_tiempo_adicional: number;
    total_sin_tiempo_adicional: number;
    tiempo_adicional_promedio: number;
  };
}

// Agrupación por zona de reparto
export interface AsignacionesPorZona {
  zona_reparto_id: number;
  zona_nombre: string;
  zona_slug: string;
  asignaciones: ZonaDistrito[];
  total_distritos: number;
  costo_base: number;
  tiempo_entrega_base: {
    min: number;
    max: number;
  };
}

// Agrupación por distrito
export interface AsignacionesPorDistrito {
  distrito_id: number;
  distrito_nombre: string;
  distrito_codigo: string;
  asignaciones: ZonaDistrito[];
  total_zonas: number;
  disponible_delivery: boolean;
  provincia_nombre?: string;
  departamento_nombre?: string;
}

// Resumen de cobertura
export interface ResumenCobertura {
  total_zonas_reparto: number;
  total_distritos: number;
  total_asignaciones: number;
  cobertura_porcentaje: number;
  zonas_sin_asignaciones: Array<{
    id: number;
    nombre: string;
  }>;
  distritos_sin_asignaciones: Array<{
    id: number;
    nombre: string;
    disponible_delivery: boolean;
  }>;
}

// Constantes
export const PRIORIDADES_ZONA_DISTRITO = [
  { value: 1, label: 'Alta', color: 'text-red-600', bgColor: 'bg-red-100' },
  {
    value: 2,
    label: 'Media',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  { value: 3, label: 'Baja', color: 'text-green-600', bgColor: 'bg-green-100' },
] as const;

export const OPCIONES_ORDEN_ZONA_DISTRITO = [
  { value: 'prioridad', label: 'Prioridad' },
  { value: 'costo_envio_efectivo', label: 'Costo de envío' },
  { value: 'tiempo_adicional', label: 'Tiempo adicional' },
  { value: 'created_at', label: 'Fecha de creación' },
  { value: 'zona_reparto_id', label: 'Zona de reparto' },
  { value: 'distrito_id', label: 'Distrito' },
] as const;

export const DIRECCIONES_ORDEN_ZONA_DISTRITO = [
  { value: 'asc', label: 'Ascendente' },
  { value: 'desc', label: 'Descendente' },
] as const;

export type PrioridadZonaDistrito =
  (typeof PRIORIDADES_ZONA_DISTRITO)[number]['value'];
export type OpcionOrdenZonaDistrito =
  (typeof OPCIONES_ORDEN_ZONA_DISTRITO)[number]['value'];
export type DireccionOrdenZonaDistrito =
  (typeof DIRECCIONES_ORDEN_ZONA_DISTRITO)[number]['value'];

// Funciones utilitarias
export function validarZonaDistrito(
  data: CreateZonaDistritoDto | UpdateZonaDistritoDto
): string[] {
  const errores: string[] = [];

  if ('zona_reparto_id' in data) {
    if (!data.zona_reparto_id || data.zona_reparto_id <= 0) {
      errores.push(
        'El ID de la zona de reparto es requerido y debe ser mayor a 0'
      );
    }
  }

  if ('distrito_id' in data) {
    if (!data.distrito_id || data.distrito_id <= 0) {
      errores.push('El ID del distrito es requerido y debe ser mayor a 0');
    }
  }

  if ('prioridad' in data && data.prioridad !== undefined) {
    if (!data.prioridad || data.prioridad < 1 || data.prioridad > 3) {
      errores.push('La prioridad debe ser 1 (Alta), 2 (Media) o 3 (Baja)');
    }
  }

  if (
    'costo_envio_personalizado' in data &&
    data.costo_envio_personalizado !== undefined &&
    data.costo_envio_personalizado !== null
  ) {
    if (data.costo_envio_personalizado < 0) {
      errores.push('El costo de envío personalizado no puede ser negativo');
    }
  }

  if ('tiempo_adicional' in data && data.tiempo_adicional !== undefined) {
    if (data.tiempo_adicional < -60 || data.tiempo_adicional > 120) {
      errores.push('El tiempo adicional debe estar entre -60 y 120 minutos');
    }
  }

  return errores;
}

export function obtenerPrioridadInfo(
  prioridad: number
): (typeof PRIORIDADES_ZONA_DISTRITO)[number] {
  return (
    PRIORIDADES_ZONA_DISTRITO.find((p) => p.value === prioridad) ||
    PRIORIDADES_ZONA_DISTRITO[1]
  );
}

export function formatearCostoEnvio(
  costo: number,
  moneda: string = 'S/'
): string {
  return `${moneda} ${costo.toFixed(2)}`;
}

export function formatearTiempoAdicional(tiempo: number): string {
  if (tiempo === 0) return 'Sin tiempo adicional';
  if (tiempo > 0) return `${tiempo} minutos`;
  return `${Math.abs(tiempo)} minutos menos`;
}

export function calcularCostoEfectivo(asignacion: ZonaDistrito): number {
  return (
    asignacion.costo_envio_personalizado ??
    asignacion.zona_reparto?.costo_envio ??
    0
  );
}

export function calcularTiempoEntrega(
  asignacion: ZonaDistrito
): TiempoEntregaCalculado | null {
  if (!asignacion.zona_reparto) return null;

  const tiempoMin = Math.max(
    0,
    asignacion.zona_reparto.tiempo_entrega_min + asignacion.tiempo_adicional
  );
  const tiempoMax = Math.max(
    0,
    asignacion.zona_reparto.tiempo_entrega_max + asignacion.tiempo_adicional
  );

  return {
    tiempo_min: tiempoMin,
    tiempo_max: tiempoMax,
    tiempo_adicional_aplicado: asignacion.tiempo_adicional,
    texto:
      tiempoMin === tiempoMax
        ? `${tiempoMin} minutos`
        : `${tiempoMin} - ${tiempoMax} minutos`,
  };
}

export function agruparPorZonaReparto(
  asignaciones: ZonaDistrito[]
): AsignacionesPorZona[] {
  const grupos = new Map<number, AsignacionesPorZona>();

  asignaciones.forEach((asignacion) => {
    const zonaId = asignacion.zona_reparto_id;

    if (!grupos.has(zonaId)) {
      grupos.set(zonaId, {
        zona_reparto_id: zonaId,
        zona_nombre: asignacion.zona_reparto?.nombre || `Zona ${zonaId}`,
        zona_slug: asignacion.zona_reparto?.slug || '',
        asignaciones: [],
        total_distritos: 0,
        costo_base: asignacion.zona_reparto?.costo_envio || 0,
        tiempo_entrega_base: {
          min: asignacion.zona_reparto?.tiempo_entrega_min || 0,
          max: asignacion.zona_reparto?.tiempo_entrega_max || 0,
        },
      });
    }

    const grupo = grupos.get(zonaId)!;
    grupo.asignaciones.push(asignacion);
    grupo.total_distritos = grupo.asignaciones.length;
  });

  return Array.from(grupos.values()).sort((a, b) =>
    a.zona_nombre.localeCompare(b.zona_nombre)
  );
}

export function agruparPorDistrito(
  asignaciones: ZonaDistrito[]
): AsignacionesPorDistrito[] {
  const grupos = new Map<number, AsignacionesPorDistrito>();

  asignaciones.forEach((asignacion) => {
    const distritoId = asignacion.distrito_id;

    if (!grupos.has(distritoId)) {
      grupos.set(distritoId, {
        distrito_id: distritoId,
        distrito_nombre:
          asignacion.distrito?.nombre || `Distrito ${distritoId}`,
        distrito_codigo: asignacion.distrito?.codigo || '',
        asignaciones: [],
        total_zonas: 0,
        disponible_delivery: asignacion.distrito?.disponible_delivery || false,
        provincia_nombre: asignacion.distrito?.provincia?.nombre,
        departamento_nombre:
          asignacion.distrito?.provincia?.departamento?.nombre,
      });
    }

    const grupo = grupos.get(distritoId)!;
    grupo.asignaciones.push(asignacion);
    grupo.total_zonas = grupo.asignaciones.length;
  });

  return Array.from(grupos.values()).sort((a, b) =>
    a.distrito_nombre.localeCompare(b.distrito_nombre)
  );
}

export function calcularEstadisticas(
  asignaciones: ZonaDistrito[]
): EstadisticasZonaDistrito {
  const totalAsignaciones = asignaciones.length;
  const asignacionesActivas = asignaciones.filter((a) => a.activo).length;
  const asignacionesInactivas = totalAsignaciones - asignacionesActivas;

  // Zonas y distritos únicos
  const zonasUnicas = new Set(asignaciones.map((a) => a.zona_reparto_id));
  const distritosUnicos = new Set(asignaciones.map((a) => a.distrito_id));

  // Costos y tiempos
  const costosEfectivos = asignaciones.map((a) => calcularCostoEfectivo(a));
  const costoPromedio =
    costosEfectivos.length > 0
      ? costosEfectivos.reduce((sum, c) => sum + c, 0) / costosEfectivos.length
      : 0;
  const tiempoPromedioAdicional =
    asignaciones.length > 0
      ? asignaciones.reduce((sum, a) => sum + a.tiempo_adicional, 0) /
        asignaciones.length
      : 0;

  // Asignaciones por prioridad
  const prioridadMap = new Map<number, number>();
  asignaciones.forEach((a) => {
    prioridadMap.set(a.prioridad, (prioridadMap.get(a.prioridad) || 0) + 1);
  });

  const asignacionesPorPrioridad = Array.from(prioridadMap.entries()).map(
    ([prioridad, cantidad]) => ({
      prioridad,
      prioridad_texto: obtenerPrioridadInfo(prioridad).label,
      cantidad,
      porcentaje:
        totalAsignaciones > 0 ? (cantidad / totalAsignaciones) * 100 : 0,
    })
  );

  // Zonas más asignadas
  const zonaMap = new Map<
    number,
    { nombre: string; count: number; distritos: Set<number> }
  >();
  asignaciones.forEach((a) => {
    const zonaId = a.zona_reparto_id;
    if (!zonaMap.has(zonaId)) {
      zonaMap.set(zonaId, {
        nombre: a.zona_reparto?.nombre || `Zona ${zonaId}`,
        count: 0,
        distritos: new Set(),
      });
    }
    const zona = zonaMap.get(zonaId)!;
    zona.count++;
    zona.distritos.add(a.distrito_id);
  });

  const zonasMasAsignadas = Array.from(zonaMap.entries())
    .map(([id, data]) => ({
      zona_reparto_id: id,
      zona_nombre: data.nombre,
      total_asignaciones: data.count,
      distritos_asignados: data.distritos.size,
    }))
    .sort((a, b) => b.total_asignaciones - a.total_asignaciones)
    .slice(0, 10);

  // Distritos más asignados
  const distritoMap = new Map<
    number,
    { nombre: string; count: number; zonas: Set<number> }
  >();
  asignaciones.forEach((a) => {
    const distritoId = a.distrito_id;
    if (!distritoMap.has(distritoId)) {
      distritoMap.set(distritoId, {
        nombre: a.distrito?.nombre || `Distrito ${distritoId}`,
        count: 0,
        zonas: new Set(),
      });
    }
    const distrito = distritoMap.get(distritoId)!;
    distrito.count++;
    distrito.zonas.add(a.zona_reparto_id);
  });

  const distritosMasAsignados = Array.from(distritoMap.entries())
    .map(([id, data]) => ({
      distrito_id: id,
      distrito_nombre: data.nombre,
      total_asignaciones: data.count,
      zonas_asignadas: data.zonas.size,
    }))
    .sort((a, b) => b.total_asignaciones - a.total_asignaciones)
    .slice(0, 10);

  // Costos personalizados
  const conCostoPersonalizado = asignaciones.filter(
    (a) => a.costo_envio_personalizado !== null
  );
  const costosPersonalizados = {
    total_con_costo_personalizado: conCostoPersonalizado.length,
    total_sin_costo_personalizado:
      totalAsignaciones - conCostoPersonalizado.length,
    costo_personalizado_promedio:
      conCostoPersonalizado.length > 0
        ? conCostoPersonalizado.reduce(
            (sum, a) => sum + (a.costo_envio_personalizado || 0),
            0
          ) / conCostoPersonalizado.length
        : 0,
  };

  // Tiempos adicionales
  const conTiempoAdicional = asignaciones.filter(
    (a) => a.tiempo_adicional !== 0
  );
  const tiemposAdicionales = {
    total_con_tiempo_adicional: conTiempoAdicional.length,
    total_sin_tiempo_adicional: totalAsignaciones - conTiempoAdicional.length,
    tiempo_adicional_promedio:
      conTiempoAdicional.length > 0
        ? conTiempoAdicional.reduce((sum, a) => sum + a.tiempo_adicional, 0) /
          conTiempoAdicional.length
        : 0,
  };

  return {
    total_asignaciones: totalAsignaciones,
    asignaciones_activas: asignacionesActivas,
    asignaciones_inactivas: asignacionesInactivas,
    zonas_con_asignaciones: zonasUnicas.size,
    distritos_con_asignaciones: distritosUnicos.size,
    costo_promedio: costoPromedio,
    tiempo_promedio_adicional: tiempoPromedioAdicional,
    asignaciones_por_prioridad: asignacionesPorPrioridad,
    zonas_mas_asignadas: zonasMasAsignadas,
    distritos_mas_asignados: distritosMasAsignados,
    costos_personalizados: costosPersonalizados,
    tiempos_adicionales: tiemposAdicionales,
  };
}

export function filtrarPorZonaReparto(
  asignaciones: ZonaDistrito[],
  zonaRepartoId: number
): ZonaDistrito[] {
  return asignaciones.filter((a) => a.zona_reparto_id === zonaRepartoId);
}

export function filtrarPorDistrito(
  asignaciones: ZonaDistrito[],
  distritoId: number
): ZonaDistrito[] {
  return asignaciones.filter((a) => a.distrito_id === distritoId);
}

export function filtrarPorPrioridad(
  asignaciones: ZonaDistrito[],
  prioridad: number
): ZonaDistrito[] {
  return asignaciones.filter((a) => a.prioridad === prioridad);
}

export function filtrarActivas(asignaciones: ZonaDistrito[]): ZonaDistrito[] {
  return asignaciones.filter((a) => a.activo);
}

export function filtrarInactivas(asignaciones: ZonaDistrito[]): ZonaDistrito[] {
  return asignaciones.filter((a) => !a.activo);
}

export function filtrarConCostoPersonalizado(
  asignaciones: ZonaDistrito[]
): ZonaDistrito[] {
  return asignaciones.filter((a) => a.costo_envio_personalizado !== null);
}

export function filtrarConTiempoAdicional(
  asignaciones: ZonaDistrito[]
): ZonaDistrito[] {
  return asignaciones.filter((a) => a.tiempo_adicional !== 0);
}

export function filtrarPorRangoCosto(
  asignaciones: ZonaDistrito[],
  min: number,
  max: number
): ZonaDistrito[] {
  return asignaciones.filter((a) => {
    const costo = calcularCostoEfectivo(a);
    return costo >= min && costo <= max;
  });
}

export function ordenarPorPrioridad(
  asignaciones: ZonaDistrito[],
  direccion: 'asc' | 'desc' = 'asc'
): ZonaDistrito[] {
  return [...asignaciones].sort((a, b) => {
    return direccion === 'asc'
      ? a.prioridad - b.prioridad
      : b.prioridad - a.prioridad;
  });
}

export function ordenarPorCosto(
  asignaciones: ZonaDistrito[],
  direccion: 'asc' | 'desc' = 'asc'
): ZonaDistrito[] {
  return [...asignaciones].sort((a, b) => {
    const costoA = calcularCostoEfectivo(a);
    const costoB = calcularCostoEfectivo(b);
    return direccion === 'asc' ? costoA - costoB : costoB - costoA;
  });
}

export function ordenarPorTiempoAdicional(
  asignaciones: ZonaDistrito[],
  direccion: 'asc' | 'desc' = 'asc'
): ZonaDistrito[] {
  return [...asignaciones].sort((a, b) => {
    return direccion === 'asc'
      ? a.tiempo_adicional - b.tiempo_adicional
      : b.tiempo_adicional - a.tiempo_adicional;
  });
}

export function buscarAsignaciones(
  asignaciones: ZonaDistrito[],
  termino: string
): ZonaDistrito[] {
  const terminoLower = termino.toLowerCase();

  return asignaciones.filter((asignacion) => {
    const zonaNombre = asignacion.zona_reparto?.nombre?.toLowerCase() || '';
    const distritoNombre = asignacion.distrito?.nombre?.toLowerCase() || '';
    const distritoCodigo = asignacion.distrito?.codigo?.toLowerCase() || '';
    const provinciaNombre =
      asignacion.distrito?.provincia?.nombre?.toLowerCase() || '';
    const departamentoNombre =
      asignacion.distrito?.provincia?.departamento?.nombre?.toLowerCase() || '';

    return (
      zonaNombre.includes(terminoLower) ||
      distritoNombre.includes(terminoLower) ||
      distritoCodigo.includes(terminoLower) ||
      provinciaNombre.includes(terminoLower) ||
      departamentoNombre.includes(terminoLower)
    );
  });
}

export function validarAsignacionUnica(
  asignaciones: ZonaDistrito[],
  zonaRepartoId: number,
  distritoId: number,
  excludeId?: number
): boolean {
  return !asignaciones.some(
    (a) =>
      a.zona_reparto_id === zonaRepartoId &&
      a.distrito_id === distritoId &&
      a.id !== excludeId
  );
}

export function obtenerAsignacionesPorUbicacion(
  asignaciones: ZonaDistrito[]
): Record<string, ZonaDistrito[]> {
  const ubicaciones: Record<string, ZonaDistrito[]> = {};

  asignaciones.forEach((asignacion) => {
    const departamento =
      asignacion.distrito?.provincia?.departamento?.nombre ||
      'Sin departamento';
    const provincia = asignacion.distrito?.provincia?.nombre || 'Sin provincia';
    const key = `${departamento} - ${provincia}`;

    if (!ubicaciones[key]) {
      ubicaciones[key] = [];
    }
    ubicaciones[key].push(asignacion);
  });

  return ubicaciones;
}

export function generarResumenCobertura(
  asignaciones: ZonaDistrito[],
  totalZonas: number,
  totalDistritos: number
): ResumenCobertura {
  const zonasConAsignaciones = new Set(
    asignaciones.map((a) => a.zona_reparto_id)
  );
  const distritosConAsignaciones = new Set(
    asignaciones.map((a) => a.distrito_id)
  );

  const coberturaZonas = (zonasConAsignaciones.size / totalZonas) * 100;
  const coberturaDistritos =
    (distritosConAsignaciones.size / totalDistritos) * 100;
  const coberturaPromedio = (coberturaZonas + coberturaDistritos) / 2;

  return {
    total_zonas_reparto: totalZonas,
    total_distritos: totalDistritos,
    total_asignaciones: asignaciones.length,
    cobertura_porcentaje: coberturaPromedio,
    zonas_sin_asignaciones: [], // Se debe llenar desde el servicio con datos completos
    distritos_sin_asignaciones: [], // Se debe llenar desde el servicio con datos completos
  };
}

export function formatearAsignacion(asignacion: ZonaDistrito): string {
  const zonaNombre =
    asignacion.zona_reparto?.nombre || `Zona ${asignacion.zona_reparto_id}`;
  const distritoNombre =
    asignacion.distrito?.nombre || `Distrito ${asignacion.distrito_id}`;
  const prioridadInfo = obtenerPrioridadInfo(asignacion.prioridad);
  const costo = formatearCostoEnvio(calcularCostoEfectivo(asignacion));

  return `${zonaNombre} → ${distritoNombre} (${prioridadInfo.label}, ${costo})`;
}

export function obtenerConflictosAsignacion(
  asignaciones: ZonaDistrito[]
): Array<{
  distrito_id: number;
  distrito_nombre: string;
  asignaciones_conflicto: ZonaDistrito[];
}> {
  const conflictos: Array<{
    distrito_id: number;
    distrito_nombre: string;
    asignaciones_conflicto: ZonaDistrito[];
  }> = [];

  const distritoMap = new Map<number, ZonaDistrito[]>();

  asignaciones.forEach((asignacion) => {
    const distritoId = asignacion.distrito_id;
    if (!distritoMap.has(distritoId)) {
      distritoMap.set(distritoId, []);
    }
    distritoMap.get(distritoId)!.push(asignacion);
  });

  distritoMap.forEach((asignacionesDistrito, distritoId) => {
    if (asignacionesDistrito.length > 1) {
      // Verificar si hay conflictos de prioridad
      const prioridadesActivas = asignacionesDistrito
        .filter((a) => a.activo)
        .map((a) => a.prioridad);

      if (prioridadesActivas.length > 1) {
        const prioridadMinima = Math.min(...prioridadesActivas);
        const asignacionesConflicto = asignacionesDistrito.filter(
          (a) => a.activo && a.prioridad !== prioridadMinima
        );

        if (asignacionesConflicto.length > 0) {
          conflictos.push({
            distrito_id: distritoId,
            distrito_nombre:
              asignacionesDistrito[0].distrito?.nombre ||
              `Distrito ${distritoId}`,
            asignaciones_conflicto: asignacionesConflicto,
          });
        }
      }
    }
  });

  return conflictos;
}
