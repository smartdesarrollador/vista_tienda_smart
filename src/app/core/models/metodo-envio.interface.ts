import { PaginatedResponse } from './common.interface';

// Interface principal del método de envío
export interface MetodoEnvioCompleto {
  id: number;
  nombre: string;
  descripcion: string;
  descripcion_completa?: string;
  icono: string;
  tiempo_entrega_min: number;
  tiempo_entrega_max: number;
  tiempo_entrega?: string;
  activo: boolean;
  costo_base: number;
  costo_por_kg: number;
  direccion_tienda?: string;
  restricciones?: string[];
  caracteristicas?: string[];
  horarios_atencion?: string;
}

// Cálculo de costo de envío
export interface CalcularCostoEnvioRequest {
  metodo_envio_id: number;
  distrito: string;
  provincia: string;
  departamento: string;
  peso_total: number;
  subtotal: number;
}

export interface TiempoEstimado {
  min: number;
  max: number;
}

export interface CalcularCostoEnvioResponse {
  success: boolean;
  data: {
    metodo_envio_id: number;
    costo: number;
    disponible: boolean;
    envio_gratis: boolean;
    tiempo_estimado: TiempoEstimado;
    mensaje: string;
  };
  message?: string;
}

// Zonas de cobertura
export interface ZonaCobertura {
  nombre: string;
  departamento?: string;
  departamentos?: string[];
  provincias?: string[];
  distritos?: string[];
  metodos_disponibles: number[];
  cobertura?: string;
}

export interface ZonasCoberturaResponse {
  success: boolean;
  data: Record<string, ZonaCobertura>;
}

// Información detallada del método de envío
export interface MetodoEnvioDetallado extends MetodoEnvioCompleto {
  descripcion_completa: string;
  direccion_tienda?: string;
  horarios_atencion?: string;
  caracteristicas: string[];
  restricciones?: string[];
}

export interface MetodoEnvioDetalladoResponse {
  success: boolean;
  data: MetodoEnvioDetallado;
  message?: string;
}

// Lista de métodos de envío
export interface MetodosEnvioRequest {
  solo_activos?: boolean;
}

export interface MetodosEnvioResponse {
  success: boolean;
  data: MetodoEnvioCompleto[];
}

// Configuración de métodos de envío
export interface ConfiguracionMetodoEnvio {
  id: number;
  nombre: string;
  activo: boolean;
  costo_base: number;
  costo_por_kg: number;
  multiplicador: number;
  zonas_disponibles: string[];
  requisitos_especiales?: string[];
}

// Cálculo de tiempo estimado
export interface CalcularTiempoRequest {
  metodo_envio_id: number;
  departamento: string;
  provincia: string;
  distrito?: string;
}

export interface CalcularTiempoResponse {
  success: boolean;
  data: {
    tiempo_estimado: TiempoEstimado;
    descripcion: string;
    fecha_estimada_entrega?: string;
  };
}

// Validación de disponibilidad
export interface ValidarDisponibilidadRequest {
  metodo_envio_id: number;
  departamento: string;
  provincia: string;
  distrito: string;
  peso_total?: number;
  subtotal?: number;
}

export interface ValidarDisponibilidadResponse {
  success: boolean;
  data: {
    disponible: boolean;
    motivo?: string;
    alternativas?: MetodoEnvioCompleto[];
  };
}

// Comparación de métodos de envío
export interface CompararMetodosRequest {
  departamento: string;
  provincia: string;
  distrito: string;
  peso_total: number;
  subtotal: number;
  metodos_ids?: number[];
}

export interface ComparacionMetodo {
  metodo: MetodoEnvioCompleto;
  costo: number;
  tiempo_estimado: TiempoEstimado;
  disponible: boolean;
  envio_gratis: boolean;
  puntuacion_velocidad: number; // 1-5
  puntuacion_precio: number; // 1-5
  recomendado: boolean;
}

export interface CompararMetodosResponse {
  success: boolean;
  data: {
    comparaciones: ComparacionMetodo[];
    mejor_precio: ComparacionMetodo;
    mas_rapido: ComparacionMetodo;
    recomendado: ComparacionMetodo;
  };
}

// Estados y tipos
export type TipoEntrega = 'domicilio' | 'recojo_tienda' | 'punto_entrega';

export type EstadoDisponibilidad = 'disponible' | 'no_disponible' | 'limitado';

export type ZonaEntrega =
  | 'lima_metropolitana'
  | 'lima_provincias'
  | 'principales_ciudades'
  | 'nacional';

// Eventos del servicio
export interface EventoMetodoEnvio {
  tipo:
    | 'metodo_seleccionado'
    | 'costo_calculado'
    | 'disponibilidad_verificada'
    | 'error';
  data?: any;
  timestamp: Date;
}

// Configuración del servicio
export interface ConfiguracionServicioEnvio {
  cache_duracion_minutos: number;
  reintentos_calculo: number;
  timeout_segundos: number;
  auto_seleccionar_mas_barato: boolean;
  auto_seleccionar_mas_rapido: boolean;
  mostrar_solo_disponibles: boolean;
}

// Estadísticas de uso
export interface EstadisticasMetodoEnvio {
  metodo_id: number;
  nombre: string;
  total_usos: number;
  costo_promedio: number;
  tiempo_promedio_entrega: number;
  satisfaction_rate: number; // 0-100
  zonas_mas_utilizadas: string[];
  tendencia_uso: 'creciente' | 'estable' | 'decreciente';
}

export interface EstadisticasMetodosEnvioResponse {
  success: boolean;
  data: {
    estadisticas: EstadisticasMetodoEnvio[];
    metodo_mas_usado: EstadisticasMetodoEnvio;
    metodo_mas_rapido: EstadisticasMetodoEnvio;
    metodo_mas_economico: EstadisticasMetodoEnvio;
    periodo: {
      desde: string;
      hasta: string;
    };
  };
}

// Cache de cálculos
export interface CacheCalculoEnvio {
  key: string;
  metodo_envio_id: number;
  ubicacion: string;
  peso: number;
  subtotal: number;
  resultado: CalcularCostoEnvioResponse;
  timestamp: number;
  expira_en: number;
}

// Filtros avanzados
export interface FiltrosMetodoEnvio {
  zona?: ZonaEntrega;
  tipo_entrega?: TipoEntrega;
  costo_maximo?: number;
  tiempo_maximo_dias?: number;
  solo_activos?: boolean;
  incluir_gratis?: boolean;
  departamento?: string;
  provincia?: string;
}

// Respuestas genéricas
export interface MetodoEnvioResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Información de empresa para método de envío
export interface InformacionEmpresaEnvio {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  horarios: {
    lunes_viernes: string;
    sabados: string;
    domingos: string;
  };
  zonas_cobertura: string[];
  politicas_envio: string[];
  tiempo_procesamiento: string;
}

export interface InformacionEmpresaEnvioResponse {
  success: boolean;
  data: InformacionEmpresaEnvio;
}
