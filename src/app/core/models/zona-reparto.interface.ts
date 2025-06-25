export interface ZonaReparto {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  costo_envio: number;
  costo_envio_adicional: number;
  tiempo_entrega_min: number;
  tiempo_entrega_max: number;
  pedido_minimo: number | null;
  radio_cobertura_km: number | null;
  coordenadas_centro: string | null;
  poligono_cobertura: string | null;
  activo: boolean;
  disponible_24h: boolean;
  orden: number;
  color_mapa: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  tiempo_entrega_promedio: number | null;
  tiempo_entrega_texto: string;
  coordenadas_centro_array: CoordenadasCentro | null;
  distritos: DistritoZona[];
  estadisticas: EstadisticasZona;
  envio_gratis_desde?: number | null;
}

export interface CoordenadasCentro {
  lat: number;
  lng: number;
}

export interface DistritoZona {
  id: number;
  nombre: string;
  codigo: string;
  activo: boolean;
  disponible_delivery: boolean;
}

export interface EstadisticasZona {
  total_distritos: number;
  distritos_activos: number;
}

export interface ZonaRepartoEstadisticas {
  zona_info: {
    id: number;
    nombre: string;
    activo: boolean;
    disponible_24h: boolean;
  };
  cobertura: {
    radio_km: number | null;
    tiene_poligono: boolean;
    distritos_asignados: number;
  };
  costos: {
    costo_base: number;
    pedido_minimo: number | null;
    envio_gratis_desde: number | null;
    costos_dinamicos: number;
  };
  horarios: {
    total_horarios: number;
    horarios_activos: number;
  };
  actividad: {
    total_pedidos: number;
    pedidos_mes_actual: number;
    pedidos_pendientes: number;
  };
  rendimiento?: {
    tiempo_promedio_entrega: number | null;
    tasa_entrega_exitosa: number;
    pedidos_por_dia_promedio: number;
  };
}

export interface CreateZonaRepartoRequest {
  nombre: string;
  descripcion?: string;
  costo_envio: number;
  costo_envio_adicional?: number;
  tiempo_entrega_min: number;
  tiempo_entrega_max: number;
  pedido_minimo?: number;
  radio_cobertura_km?: number;
  coordenadas_centro?: string;
  poligono_cobertura?: string;
  activo?: boolean;
  disponible_24h?: boolean;
  orden?: number;
  color_mapa?: string;
  observaciones?: string;
  distritos_ids?: number[];
  envio_gratis_desde?: number;
}

export interface UpdateZonaRepartoRequest
  extends Partial<CreateZonaRepartoRequest> {
  id: number;
}

export interface ZonaRepartoFilters {
  search?: string;
  activo?: boolean;
  disponible_24h?: boolean;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  with_horarios?: boolean;
  with_costos?: boolean;
  with_excepciones?: boolean;
  with_zona_distritos?: boolean;
  per_page?: number | 'all';
  page?: number;
}

export interface CalcularCostoEnvioRequest {
  latitud: number;
  longitud: number;
  monto_pedido?: number;
}

export interface CalcularCostoEnvioResponse {
  en_cobertura: boolean;
  distancia_km?: number;
  costo_base?: number;
  costo_adicional?: number;
  costo_total?: number;
  cumple_pedido_minimo?: boolean;
  pedido_minimo?: number | null;
  tiempo_entrega_estimado?: number | null;
  mensaje?: string;
}

export interface VerificarDisponibilidadRequest {
  fecha_hora: string;
}

export interface VerificarDisponibilidadResponse {
  disponible: boolean;
  zona: string;
  fecha_consulta: string;
  es_24h: boolean;
}

export interface ZonaRepartoResponse {
  data: ZonaReparto;
}

export interface ZonaRepartoListResponse {
  data: ZonaReparto[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

export interface ZonaRepartoEstadisticasResponse {
  data: ZonaRepartoEstadisticas;
}

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}
