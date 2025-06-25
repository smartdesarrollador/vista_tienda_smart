/**
 * Interfaz para Excepción de Zona
 * Sistema de gestión de excepciones en zonas de reparto
 */

// Interfaz principal de ExcepcionZona
export interface ExcepcionZona {
  id: number;
  zona_reparto_id: number;
  fecha_excepcion: string; // ISO date string
  tipo: TipoExcepcion;
  hora_inicio: string | null; // HH:mm:ss format
  hora_fin: string | null; // HH:mm:ss format
  costo_especial: number | null;
  tiempo_especial_min: number | null;
  tiempo_especial_max: number | null;
  motivo: string;
  activo: boolean;
  created_at: string;
  updated_at: string;

  // Campos calculados del resource
  tipo_texto: string;
  fecha_excepcion_formateada: string;
  horario_especial_texto: string | null;
  tiempo_especial_texto: string | null;
  costo_especial_formateado: string | null;
  es_fecha_pasada: boolean;
  es_fecha_hoy: boolean;
  es_fecha_futura: boolean;
  esta_activa_ahora: boolean;

  // Relaciones
  zona_reparto: ZonaRepartoExcepcion;
  estado_excepcion: EstadoExcepcion;
}

// Interfaz para zona de reparto en excepción
export interface ZonaRepartoExcepcion {
  id: number;
  nombre: string;
  slug: string;
  activo: boolean;
}

// Interfaz para estado de excepción
export interface EstadoExcepcion {
  vigente: boolean;
  aplicable_hoy: boolean;
  aplicable_ahora: boolean;
  dias_restantes: number | null;
}

// DTOs para crear y actualizar excepciones
export interface CreateExcepcionZonaDto {
  zona_reparto_id: number;
  fecha_excepcion: string; // YYYY-MM-DD format
  tipo: TipoExcepcion;
  hora_inicio?: string; // HH:mm:ss format
  hora_fin?: string; // HH:mm:ss format
  costo_especial?: number;
  tiempo_especial_min?: number;
  tiempo_especial_max?: number;
  motivo: string;
  activo?: boolean;
}

export interface UpdateExcepcionZonaDto {
  fecha_excepcion?: string;
  tipo?: TipoExcepcion;
  hora_inicio?: string;
  hora_fin?: string;
  costo_especial?: number;
  tiempo_especial_min?: number;
  tiempo_especial_max?: number;
  motivo?: string;
  activo?: boolean;
}

// Filtros para búsqueda
export interface FiltrosExcepcionZona {
  zona_reparto_id?: number;
  tipo?: TipoExcepcion;
  fecha_desde?: string;
  fecha_hasta?: string;
  activo?: boolean;
  vigentes?: boolean;
  per_page?: number;
  page?: number;
  search?: string;
  sort_by?: CampoOrdenamientoExcepcion;
  sort_direction?: DireccionOrdenamiento;
}

// Respuestas de la API
export interface ExcepcionZonaResponse {
  data: ExcepcionZona;
  message?: string;
}

export interface ExcepcionesZonaResponse {
  data: ExcepcionZona[];
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

// Estadísticas de excepciones
export interface EstadisticasExcepcionZona {
  total_excepciones: number;
  excepciones_activas: number;
  excepciones_vigentes: number;
  excepciones_por_tipo: ExcepcionesPorTipo[];
  excepciones_por_zona: ExcepcionesPorZona[];
  proximas_excepciones: ExcepcionZona[];
  excepciones_hoy: ExcepcionZona[];
  tendencia_mensual: TendenciaMensual[];
}

export interface ExcepcionesPorTipo {
  tipo: TipoExcepcion;
  tipo_texto: string;
  cantidad: number;
  porcentaje: number;
}

export interface ExcepcionesPorZona {
  zona_reparto_id: number;
  zona_nombre: string;
  cantidad: number;
  excepciones_activas: number;
  proxima_excepcion: ExcepcionZona | null;
}

export interface TendenciaMensual {
  mes: string;
  año: number;
  cantidad: number;
  tipos_mas_comunes: string[];
}

// Tipos y constantes
export type TipoExcepcion =
  | 'no_disponible'
  | 'horario_especial'
  | 'costo_especial'
  | 'tiempo_especial';

export const TIPOS_EXCEPCION = [
  { value: 'no_disponible', label: 'No disponible' },
  { value: 'horario_especial', label: 'Horario especial' },
  { value: 'costo_especial', label: 'Costo especial' },
  { value: 'tiempo_especial', label: 'Tiempo de entrega especial' },
] as const;

export const OPCIONES_ORDEN_EXCEPCION = [
  { value: 'fecha_excepcion', label: 'Fecha de excepción' },
  { value: 'tipo', label: 'Tipo' },
  { value: 'zona_reparto_id', label: 'Zona de reparto' },
  { value: 'created_at', label: 'Fecha de creación' },
  { value: 'activo', label: 'Estado' },
] as const;

export const DIRECCIONES_ORDEN = [
  { value: 'asc', label: 'Ascendente' },
  { value: 'desc', label: 'Descendente' },
] as const;

export type CampoOrdenamientoExcepcion =
  (typeof OPCIONES_ORDEN_EXCEPCION)[number]['value'];
export type DireccionOrdenamiento = (typeof DIRECCIONES_ORDEN)[number]['value'];

// Funciones utilitarias
export function validarExcepcionZona(
  excepcion: Partial<CreateExcepcionZonaDto>
): string[] {
  const errores: string[] = [];

  if (!excepcion.zona_reparto_id) {
    errores.push('La zona de reparto es requerida');
  }

  if (!excepcion.fecha_excepcion) {
    errores.push('La fecha de excepción es requerida');
  } else {
    const fecha = new Date(excepcion.fecha_excepcion);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fecha < hoy) {
      errores.push('La fecha de excepción debe ser hoy o posterior');
    }
  }

  if (!excepcion.tipo) {
    errores.push('El tipo de excepción es requerido');
  }

  if (!excepcion.motivo || excepcion.motivo.trim().length === 0) {
    errores.push('El motivo es requerido');
  } else if (excepcion.motivo.length > 500) {
    errores.push('El motivo no puede exceder 500 caracteres');
  }

  // Validaciones específicas por tipo
  if (excepcion.tipo === 'horario_especial') {
    if (!excepcion.hora_inicio) {
      errores.push('La hora de inicio es requerida para horario especial');
    }
    if (!excepcion.hora_fin) {
      errores.push('La hora de fin es requerida para horario especial');
    }
    if (
      excepcion.hora_inicio &&
      excepcion.hora_fin &&
      excepcion.hora_inicio >= excepcion.hora_fin
    ) {
      errores.push('La hora de fin debe ser posterior a la hora de inicio');
    }
  }

  if (excepcion.tipo === 'costo_especial') {
    if (
      excepcion.costo_especial === undefined ||
      excepcion.costo_especial === null
    ) {
      errores.push('El costo especial es requerido');
    } else if (excepcion.costo_especial < 0) {
      errores.push('El costo especial debe ser mayor o igual a 0');
    }
  }

  if (excepcion.tipo === 'tiempo_especial') {
    if (
      excepcion.tiempo_especial_min === undefined ||
      excepcion.tiempo_especial_min === null
    ) {
      errores.push('El tiempo mínimo es requerido');
    } else if (excepcion.tiempo_especial_min < 0) {
      errores.push('El tiempo mínimo debe ser mayor o igual a 0');
    }

    if (
      excepcion.tiempo_especial_max === undefined ||
      excepcion.tiempo_especial_max === null
    ) {
      errores.push('El tiempo máximo es requerido');
    } else if (excepcion.tiempo_especial_max < 0) {
      errores.push('El tiempo máximo debe ser mayor o igual a 0');
    }

    if (
      excepcion.tiempo_especial_min &&
      excepcion.tiempo_especial_max &&
      excepcion.tiempo_especial_min > excepcion.tiempo_especial_max
    ) {
      errores.push('El tiempo máximo debe ser mayor o igual al tiempo mínimo');
    }
  }

  return errores;
}

export function formatearTipoExcepcion(tipo: TipoExcepcion): string {
  const tipoEncontrado = TIPOS_EXCEPCION.find((t) => t.value === tipo);
  return tipoEncontrado?.label || 'Tipo desconocido';
}

export function formatearFechaExcepcion(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatearHorarioEspecial(
  horaInicio: string | null,
  horaFin: string | null
): string | null {
  if (!horaInicio || !horaFin) return null;
  return `${horaInicio} - ${horaFin}`;
}

export function formatearTiempoEspecial(
  min: number | null,
  max: number | null
): string | null {
  if (!min && !max) return null;

  if (min && max) {
    if (min === max) {
      return `${min} minutos`;
    }
    return `${min} - ${max} minutos`;
  }

  if (min) return `Mínimo ${min} minutos`;
  if (max) return `Máximo ${max} minutos`;

  return null;
}

export function formatearCostoEspecial(costo: number | null): string | null {
  if (costo === null || costo === undefined) return null;
  return `S/ ${costo.toFixed(2)}`;
}

export function esExcepcionVigente(excepcion: ExcepcionZona): boolean {
  return excepcion.activo && !excepcion.es_fecha_pasada;
}

export function esExcepcionAplicableHoy(excepcion: ExcepcionZona): boolean {
  return excepcion.activo && excepcion.es_fecha_hoy;
}

export function esExcepcionAplicableAhora(excepcion: ExcepcionZona): boolean {
  return excepcion.activo && excepcion.esta_activa_ahora;
}

export function obtenerDiasRestantes(fechaExcepcion: string): number | null {
  const fecha = new Date(fechaExcepcion);
  const hoy = new Date();

  if (fecha < hoy) return null;

  const diferencia = fecha.getTime() - hoy.getTime();
  return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
}

export function agruparPorTipo(
  excepciones: ExcepcionZona[]
): ExcepcionesPorTipo[] {
  const grupos = excepciones.reduce((acc, excepcion) => {
    if (!acc[excepcion.tipo]) {
      acc[excepcion.tipo] = {
        tipo: excepcion.tipo,
        tipo_texto: excepcion.tipo_texto,
        cantidad: 0,
        porcentaje: 0,
      };
    }
    acc[excepcion.tipo].cantidad++;
    return acc;
  }, {} as Record<TipoExcepcion, ExcepcionesPorTipo>);

  const total = excepciones.length;
  return Object.values(grupos).map((grupo) => ({
    ...grupo,
    porcentaje: total > 0 ? (grupo.cantidad / total) * 100 : 0,
  }));
}

export function agruparPorZona(
  excepciones: ExcepcionZona[]
): ExcepcionesPorZona[] {
  const grupos = excepciones.reduce((acc, excepcion) => {
    const zonaId = excepcion.zona_reparto_id;
    if (!acc[zonaId]) {
      acc[zonaId] = {
        zona_reparto_id: zonaId,
        zona_nombre: excepcion.zona_reparto.nombre,
        cantidad: 0,
        excepciones_activas: 0,
        proxima_excepcion: null,
      };
    }

    acc[zonaId].cantidad++;
    if (excepcion.activo) {
      acc[zonaId].excepciones_activas++;
    }

    // Encontrar próxima excepción
    if (excepcion.es_fecha_futura && excepcion.activo) {
      if (
        !acc[zonaId].proxima_excepcion ||
        new Date(excepcion.fecha_excepcion) <
          new Date(acc[zonaId].proxima_excepcion!.fecha_excepcion)
      ) {
        acc[zonaId].proxima_excepcion = excepcion;
      }
    }

    return acc;
  }, {} as Record<number, ExcepcionesPorZona>);

  return Object.values(grupos);
}

export function filtrarPorTipo(
  excepciones: ExcepcionZona[],
  tipo: TipoExcepcion
): ExcepcionZona[] {
  return excepciones.filter((excepcion) => excepcion.tipo === tipo);
}

export function filtrarPorZona(
  excepciones: ExcepcionZona[],
  zonaId: number
): ExcepcionZona[] {
  return excepciones.filter(
    (excepcion) => excepcion.zona_reparto_id === zonaId
  );
}

export function filtrarVigentes(excepciones: ExcepcionZona[]): ExcepcionZona[] {
  return excepciones.filter((excepcion) => esExcepcionVigente(excepcion));
}

export function filtrarAplicablesHoy(
  excepciones: ExcepcionZona[]
): ExcepcionZona[] {
  return excepciones.filter((excepcion) => esExcepcionAplicableHoy(excepcion));
}

export function filtrarPorFecha(
  excepciones: ExcepcionZona[],
  fechaDesde?: string,
  fechaHasta?: string
): ExcepcionZona[] {
  return excepciones.filter((excepcion) => {
    const fechaExcepcion = new Date(excepcion.fecha_excepcion);

    if (fechaDesde) {
      const desde = new Date(fechaDesde);
      if (fechaExcepcion < desde) return false;
    }

    if (fechaHasta) {
      const hasta = new Date(fechaHasta);
      if (fechaExcepcion > hasta) return false;
    }

    return true;
  });
}

export function ordenarPorFecha(
  excepciones: ExcepcionZona[],
  direccion: DireccionOrdenamiento = 'asc'
): ExcepcionZona[] {
  return [...excepciones].sort((a, b) => {
    const fechaA = new Date(a.fecha_excepcion).getTime();
    const fechaB = new Date(b.fecha_excepcion).getTime();
    return direccion === 'asc' ? fechaA - fechaB : fechaB - fechaA;
  });
}

export function ordenarPorTipo(
  excepciones: ExcepcionZona[],
  direccion: DireccionOrdenamiento = 'asc'
): ExcepcionZona[] {
  return [...excepciones].sort((a, b) => {
    const comparacion = a.tipo.localeCompare(b.tipo);
    return direccion === 'asc' ? comparacion : -comparacion;
  });
}

export function buscarExcepciones(
  excepciones: ExcepcionZona[],
  termino: string
): ExcepcionZona[] {
  const terminoLower = termino.toLowerCase();
  return excepciones.filter(
    (excepcion) =>
      excepcion.motivo.toLowerCase().includes(terminoLower) ||
      excepcion.tipo_texto.toLowerCase().includes(terminoLower) ||
      excepcion.zona_reparto.nombre.toLowerCase().includes(terminoLower)
  );
}

export function calcularEstadisticas(
  excepciones: ExcepcionZona[]
): EstadisticasExcepcionZona {
  const total = excepciones.length;
  const activas = excepciones.filter((e) => e.activo).length;
  const vigentes = excepciones.filter((e) => esExcepcionVigente(e)).length;
  const hoy = excepciones.filter((e) => esExcepcionAplicableHoy(e));
  const proximas = excepciones
    .filter((e) => e.es_fecha_futura && e.activo)
    .sort(
      (a, b) =>
        new Date(a.fecha_excepcion).getTime() -
        new Date(b.fecha_excepcion).getTime()
    )
    .slice(0, 5);

  return {
    total_excepciones: total,
    excepciones_activas: activas,
    excepciones_vigentes: vigentes,
    excepciones_por_tipo: agruparPorTipo(excepciones),
    excepciones_por_zona: agruparPorZona(excepciones),
    proximas_excepciones: proximas,
    excepciones_hoy: hoy,
    tendencia_mensual: [], // Se puede implementar según necesidades
  };
}

export function obtenerIconoPorTipo(tipo: TipoExcepcion): string {
  switch (tipo) {
    case 'no_disponible':
      return 'ban';
    case 'horario_especial':
      return 'clock';
    case 'costo_especial':
      return 'dollar-sign';
    case 'tiempo_especial':
      return 'timer';
    default:
      return 'alert-circle';
  }
}

export function obtenerColorPorTipo(tipo: TipoExcepcion): string {
  switch (tipo) {
    case 'no_disponible':
      return 'text-red-600';
    case 'horario_especial':
      return 'text-blue-600';
    case 'costo_especial':
      return 'text-yellow-600';
    case 'tiempo_especial':
      return 'text-purple-600';
    default:
      return 'text-gray-600';
  }
}

export function obtenerColorFondoPorTipo(tipo: TipoExcepcion): string {
  switch (tipo) {
    case 'no_disponible':
      return 'bg-red-100';
    case 'horario_especial':
      return 'bg-blue-100';
    case 'costo_especial':
      return 'bg-yellow-100';
    case 'tiempo_especial':
      return 'bg-purple-100';
    default:
      return 'bg-gray-100';
  }
}
