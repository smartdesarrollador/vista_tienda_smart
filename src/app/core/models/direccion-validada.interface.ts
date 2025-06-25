export interface DireccionValidada {
  id: number;
  direccion_id: number;
  zona_reparto_id: number | null;
  latitud: number | null;
  longitud: number | null;
  distancia_tienda_km: number | null;
  en_zona_cobertura: boolean;
  costo_envio_calculado: number | null;
  tiempo_entrega_estimado: number | null;
  fecha_ultima_validacion: string;
  observaciones_validacion: string | null;
  created_at: string;
  updated_at: string;

  // Información calculada
  coordenadas: Coordenadas | null;
  distancia_texto: string;
  tiempo_entrega_texto: string;
  estado_validacion: EstadoValidacion;

  // Relaciones opcionales
  direccion?: DireccionDetalle;
  zona_reparto?: ZonaRepartoDetalle;
}

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface EstadoValidacion {
  codigo: 'no_validada' | 'validada_cobertura' | 'validada_sin_cobertura';
  mensaje: string;
  tiene_coordenadas: boolean;
  tiene_zona_asignada: boolean;
}

export interface DireccionDetalle {
  id: number;
  direccion: string;
  referencia: string | null;
  distrito: string;
  provincia: string;
  departamento: string;
  predeterminada: boolean;
}

export interface ZonaRepartoDetalle {
  id: number;
  nombre: string;
  slug: string;
  costo_envio: number;
  tiempo_entrega_min: number | null;
  tiempo_entrega_max: number | null;
  activo: boolean;
}

// Interfaces para respuestas de la API
export interface DireccionValidadaResponse {
  data: DireccionValidada;
}

export interface DireccionValidadaListResponse {
  data: DireccionValidada[];
  links: DireccionValidadaPaginationLinks;
  meta: DireccionValidadaPaginationMeta;
}

export interface DireccionValidadaPaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface DireccionValidadaPaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links: DireccionValidadaPaginationLink[];
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface DireccionValidadaPaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

// Interfaces para requests
export interface CreateDireccionValidadaRequest {
  direccion_id: number;
  zona_reparto_id?: number;
  latitud: number;
  longitud: number;
  distancia_tienda_km?: number;
  en_zona_cobertura: boolean;
  costo_envio_calculado?: number;
  tiempo_entrega_estimado?: number;
  observaciones_validacion?: string;
}

export interface UpdateDireccionValidadaRequest {
  zona_reparto_id?: number;
  latitud?: number;
  longitud?: number;
  distancia_tienda_km?: number;
  en_zona_cobertura?: boolean;
  costo_envio_calculado?: number;
  tiempo_entrega_estimado?: number;
  observaciones_validacion?: string;
}

export interface ValidarDireccionRequest {
  direccion_id: number;
  latitud?: number;
  longitud?: number;
  observaciones_validacion?: string;
}

export interface ValidarDireccionResponse {
  message: string;
  en_cobertura: boolean;
  data: DireccionValidada;
  metricas?: MetricasValidacion;
}

export interface MetricasValidacion {
  distancia_km: number;
  costo_envio: number;
  tiempo_entrega_min: number;
  zona_asignada: string;
}

export interface RevalidarDireccionesRequest {
  direcciones_ids?: number[];
  zona_reparto_id?: number;
}

export interface RevalidarDireccionesResponse {
  message: string;
  total_procesadas: number;
  exitosas: number;
  errores: ErrorRevalidacion[];
}

export interface ErrorRevalidacion {
  direccion_id: number;
  error: string;
}

// Interfaces para filtros
export interface DireccionValidadaFilters {
  direccion_id?: number;
  zona_reparto_id?: number;
  en_zona_cobertura?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
  with_direccion?: boolean;
  with_zona?: boolean;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  per_page?: number | 'all';
  page?: number;
  search?: string;
}

// Interfaces para estadísticas
export interface EstadisticasDireccionValidada {
  estadisticas_generales: EstadisticasGenerales;
  estadisticas_por_zona: EstadisticasPorZona[];
}

export interface EstadisticasGenerales {
  total_direcciones_validadas: number;
  en_cobertura: number;
  fuera_cobertura: number;
  validadas_hoy: number;
  validadas_semana: number;
  costo_promedio_envio: number | null;
  distancia_promedio: number | null;
  tiempo_promedio_entrega: number | null;
}

export interface EstadisticasPorZona {
  zona_id: number;
  zona_nombre: string;
  total_direcciones: number;
}

// Tipos de utilidad
export type EstadoCobertura = 'todas' | 'en_cobertura' | 'fuera_cobertura';
export type TipoValidacion = 'automatica' | 'manual' | 'revalidacion';

// Constantes para estados
export const ESTADOS_VALIDACION = {
  NO_VALIDADA: 'no_validada',
  VALIDADA_COBERTURA: 'validada_cobertura',
  VALIDADA_SIN_COBERTURA: 'validada_sin_cobertura',
} as const;

export const COLORES_ESTADO = {
  [ESTADOS_VALIDACION.NO_VALIDADA]: 'text-gray-600 bg-gray-100',
  [ESTADOS_VALIDACION.VALIDADA_COBERTURA]: 'text-green-600 bg-green-100',
  [ESTADOS_VALIDACION.VALIDADA_SIN_COBERTURA]: 'text-red-600 bg-red-100',
} as const;

// Utilidades para formateo
export const formatearDistancia = (distanciaKm: number | null): string => {
  if (!distanciaKm) return 'No calculada';

  if (distanciaKm < 1) {
    return `${Math.round(distanciaKm * 1000)} metros`;
  }

  return `${distanciaKm.toFixed(1)} km`;
};

export const formatearTiempoEntrega = (minutos: number | null): string => {
  if (!minutos) return 'No calculado';

  if (minutos < 60) {
    return `${minutos} minutos`;
  }

  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  if (minutosRestantes === 0) {
    return `${horas} hora${horas > 1 ? 's' : ''}`;
  }

  return `${horas}h ${minutosRestantes}min`;
};

export const obtenerTextoEstado = (estado: EstadoValidacion): string => {
  switch (estado.codigo) {
    case ESTADOS_VALIDACION.NO_VALIDADA:
      return 'No validada';
    case ESTADOS_VALIDACION.VALIDADA_COBERTURA:
      return 'En cobertura';
    case ESTADOS_VALIDACION.VALIDADA_SIN_COBERTURA:
      return 'Fuera de cobertura';
    default:
      return 'Desconocido';
  }
};

export const obtenerColorEstado = (estado: EstadoValidacion): string => {
  return COLORES_ESTADO[estado.codigo] || 'text-gray-600 bg-gray-100';
};
