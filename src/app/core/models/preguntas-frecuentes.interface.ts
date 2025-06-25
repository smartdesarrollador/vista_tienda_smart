import { PaginatedResponse } from './common.interface';

// Interface principal de pregunta frecuente
export interface PreguntaFrecuente {
  id: number;
  pregunta: string;
  respuesta: string;
  categoria: CategoriaFaq;
  popularidad: number;
  palabras_clave: string;
}

// Tipos de categorías de FAQ
export type CategoriaFaq =
  | 'pedidos'
  | 'envios'
  | 'pagos'
  | 'productos'
  | 'cuenta'
  | 'soporte';

// Interface para información de categoría
export interface CategoriaFaqInfo {
  id: CategoriaFaq;
  nombre: string;
  descripcion: string;
  icono: string;
  orden: number;
}

// Respuestas de la API

export interface PreguntasFrecuentesResponse {
  success: boolean;
  data: PreguntaFrecuente[];
  message?: string;
}

export interface PreguntaFrecuenteResponse {
  success: boolean;
  data: PreguntaFrecuente;
  message?: string;
}

export interface CategoriasFaqResponse {
  success: boolean;
  data: CategoriaFaqInfo[];
}

export interface PreguntasPorCategoriaResponse {
  success: boolean;
  data: PreguntaFrecuente[];
  message?: string;
}

// Interface para búsqueda de FAQ
export interface BusquedaFaqRequest {
  q: string; // término de búsqueda
}

export interface BusquedaFaqResponse {
  success: boolean;
  data: {
    resultados: PreguntaFrecuente[];
    total: number;
    termino_busqueda: string;
  };
  message?: string;
}

// Interface para marcar pregunta como útil
export interface MarcarUtilRequest {
  util: boolean;
}

export interface MarcarUtilResponse {
  success: boolean;
  message: string;
}

// Interface para sugerir nueva pregunta
export interface SugerirPreguntaRequest {
  pregunta: string;
  email?: string;
  categoria: CategoriaFaq;
}

export interface SugerirPreguntaResponse {
  success: boolean;
  message: string;
  data?: {
    ticket_id: string;
  };
  errors?: Record<string, string[]>;
}

// Interface para estadísticas de FAQ
export interface EstadisticasFaq {
  total_preguntas: number;
  por_categoria: Record<CategoriaFaq, number>;
  mas_populares: PreguntaFrecuente[];
  actualizacion: string;
}

export interface EstadisticasFaqResponse {
  success: boolean;
  data: EstadisticasFaq;
}

// Filtros para obtener preguntas frecuentes
export interface FiltrosFaq {
  categoria?: CategoriaFaq;
  buscar?: string;
  popular?: boolean;
  limite?: number;
}

// Interface para navegación y paginación
export interface NavegacionFaq {
  categoria_actual?: CategoriaFaq;
  termino_busqueda?: string;
  pagina: number;
  resultados_por_pagina: number;
  total_resultados: number;
}

// Interface para gestión de favoritas/útiles
export interface PreguntaUtil {
  pregunta_id: number;
  util: boolean;
  fecha_marcado: string;
  ip_usuario?: string;
}

export interface HistorialUtilidad {
  pregunta_id: number;
  votos_utiles: number;
  votos_no_utiles: number;
  puntuacion: number; // 0-100
}

// Interface para configuración del servicio
export interface ConfiguracionServicioFaq {
  cache_duracion_minutos: number;
  resultados_por_pagina: number;
  max_resultados_busqueda: number;
  auto_cargar_categorias: boolean;
  mostrar_popularidad: boolean;
  permitir_sugerencias: boolean;
  validar_duplicados: boolean;
}

// Eventos del servicio
export interface EventoFaq {
  tipo:
    | 'preguntas_cargadas'
    | 'pregunta_vista'
    | 'busqueda_realizada'
    | 'pregunta_marcada_util'
    | 'pregunta_sugerida'
    | 'categoria_cambiada'
    | 'error_carga';
  data?: any;
  timestamp: Date;
}

// Interface para análisis de contenido
export interface AnalisisPregunta {
  pregunta_id: number;
  relevancia: number; // 0-100
  claridad: number; // 0-100
  completitud: number; // 0-100
  palabras_clave_detectadas: string[];
  categoria_sugerida: CategoriaFaq;
  similar_a: number[]; // IDs de preguntas similares
}

// Interface para métricas de uso
export interface MetricasFaq {
  pregunta_id: number;
  vistas: number;
  busquedas: number;
  utilidad_promedio: number;
  tiempo_lectura_promedio: number; // en segundos
  categoria: CategoriaFaq;
  tendencia: 'creciente' | 'estable' | 'decreciente';
}

export interface ResumenMetricasFaq {
  total_vistas: number;
  preguntas_mas_vistas: PreguntaFrecuente[];
  categorias_mas_populares: CategoriaFaqInfo[];
  terminos_mas_buscados: string[];
  satisfaccion_promedio: number;
  tiempo_respuesta_promedio: number;
}

export interface MetricasFaqResponse {
  success: boolean;
  data: ResumenMetricasFaq;
}

// Interface para validación de sugerencias
export interface ValidacionSugerencia {
  pregunta_valida: boolean;
  email_valido: boolean;
  categoria_valida: boolean;
  es_duplicada: boolean;
  preguntas_similares: PreguntaFrecuente[];
  puntuacion_calidad: number; // 0-100
  sugerencias_mejora: string[];
}

// Interface para respuestas automáticas
export interface RespuestaAutomatica {
  pregunta_id: number;
  coincidencia: number; // 0-100
  respuesta_sugerida: string;
  confianza: number; // 0-100
  requiere_revision: boolean;
}

export interface BusquedaInteligente {
  termino_original: string;
  terminos_expandidos: string[];
  filtros_aplicados: FiltrosFaq;
  resultados_directos: PreguntaFrecuente[];
  sugerencias_relacionadas: PreguntaFrecuente[];
  respuesta_automatica?: RespuestaAutomatica;
}

export interface BusquedaInteligenteResponse {
  success: boolean;
  data: BusquedaInteligente;
}

// Interface para gestión de cache
export interface CacheFaq {
  key: string;
  datos: any;
  timestamp: number;
  expira_en: number;
  tipo: 'preguntas' | 'categorias' | 'busqueda' | 'estadisticas' | 'metricas';
  metadatos?: {
    categoria?: CategoriaFaq;
    termino_busqueda?: string;
    filtros?: FiltrosFaq;
  };
}

// Interface para notificaciones FAQ
export interface NotificacionFaq {
  id: string;
  tipo:
    | 'nueva_pregunta'
    | 'respuesta_actualizada'
    | 'categoria_nueva'
    | 'mantenimiento';
  titulo: string;
  mensaje: string;
  pregunta_id?: number;
  categoria?: CategoriaFaq;
  fecha: string;
  leida: boolean;
  accion_requerida: boolean;
}

export interface NotificacionesFaqResponse {
  success: boolean;
  data: NotificacionFaq[];
}

// Interface para exportación de datos
export interface ExportacionFaq {
  formato: 'json' | 'csv' | 'pdf' | 'xml';
  incluir_estadisticas: boolean;
  filtros?: FiltrosFaq;
  campos_personalizados?: string[];
}

export interface ExportacionFaqResponse {
  success: boolean;
  data: {
    url_descarga: string;
    nombre_archivo: string;
    tamaño_archivo: number;
    tiempo_expiracion: string;
  };
}

// Interface para administración (uso interno)
export interface AdminFaq {
  pregunta_id: number;
  estado: 'activa' | 'inactiva' | 'revision' | 'archivada';
  autor: string;
  fecha_creacion: string;
  fecha_modificacion: string;
  numero_revisiones: number;
  aprobada_por?: string;
  notas_internas?: string;
}

// Interface para SEO y metadatos
export interface MetadatosFaq {
  pregunta_id: number;
  titulo_seo: string;
  descripcion_meta: string;
  palabras_clave_seo: string[];
  url_personalizada?: string;
  canonical_url?: string;
  schema_markup?: any;
}

// Interface para accesibilidad
export interface AccesibilidadFaq {
  pregunta_id: number;
  nivel_lectura: 'basico' | 'intermedio' | 'avanzado';
  texto_alternativo: string;
  resumen_corto: string;
  disponible_audio: boolean;
  traducciones_disponibles: string[];
}

// Interface para versionado
export interface VersionFaq {
  pregunta_id: number;
  version: number;
  contenido_anterior: string;
  contenido_actual: string;
  razon_cambio: string;
  fecha_cambio: string;
  usuario_cambio: string;
}

export interface HistorialVersionesFaq {
  pregunta_id: number;
  versiones: VersionFaq[];
  version_actual: number;
}

export interface HistorialVersionesFaqResponse {
  success: boolean;
  data: HistorialVersionesFaq;
}

// Respuestas genéricas
export interface FaqResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Interface para configuración de la empresa
export interface ConfiguracionEmpresaFaq {
  nombre_empresa: string;
  soporte_email: string;
  soporte_telefono: string;
  horario_atencion: string;
  tiempo_respuesta_promedio: string;
  idiomas_soportados: string[];
  politicas_privacidad_url: string;
  terminos_servicio_url: string;
}

export interface ConfiguracionEmpresaFaqResponse {
  success: boolean;
  data: ConfiguracionEmpresaFaq;
}

// Interface para feedback de usuarios
export interface FeedbackFaq {
  pregunta_id: number;
  usuario_id?: string;
  puntuacion: number; // 1-5
  comentario?: string;
  aspectos_positivos: string[];
  aspectos_mejora: string[];
  fecha: string;
  anonimo: boolean;
}

export interface FeedbackFaqResponse {
  success: boolean;
  message: string;
}

// Interface para recomendaciones personalizadas
export interface RecomendacionFaq {
  pregunta: PreguntaFrecuente;
  puntuacion_relevancia: number; // 0-100
  razon_recomendacion: string;
  basado_en: 'historial' | 'categoria' | 'popularidad' | 'similitud';
}

export interface RecomendacionesFaqResponse {
  success: boolean;
  data: RecomendacionFaq[];
}

// Interface para analytics avanzados
export interface AnalyticsFaq {
  periodo: {
    desde: string;
    hasta: string;
  };
  total_consultas: number;
  consultas_resueltas: number;
  tasa_resolucion: number;
  tiempo_promedio_resolucion: number;
  satisfaccion_promedio: number;
  categorias_mas_consultadas: {
    categoria: CategoriaFaq;
    consultas: number;
    porcentaje: number;
  }[];
  tendencias: {
    fecha: string;
    consultas: number;
    satisfaccion: number;
  }[];
}

export interface AnalyticsFaqResponse {
  success: boolean;
  data: AnalyticsFaq;
}

// Utilidades para el servicio
export interface UtilFaq {
  destacarTexto: (texto: string, termino: string) => string;
  calcularRelevancia: (pregunta: PreguntaFrecuente, termino: string) => number;
  formatearRespuesta: (respuesta: string) => string;
  extraerPalabrasClave: (texto: string) => string[];
  detectarIdioma: (texto: string) => string;
  validarEmail: (email: string) => boolean;
  limpiarTexto: (texto: string) => string;
  calcularTiempoLectura: (texto: string) => number;
}
