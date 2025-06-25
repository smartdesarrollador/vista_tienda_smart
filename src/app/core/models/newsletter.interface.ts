import { PaginatedResponse } from './common.interface';

// Tipos de intereses disponibles
export type TipoInteres =
  | 'ofertas'
  | 'nuevos_productos'
  | 'tecnologia'
  | 'hogar'
  | 'moda'
  | 'deportes';

// Tipos de frecuencia de envío
export type FrecuenciaNewsletter =
  | 'diaria'
  | 'semanal'
  | 'quincenal'
  | 'mensual';

// Tipos de formato
export type FormatoNewsletter = 'html' | 'texto';

// Motivos de desuscripción
export type MotivoDesuscripcion =
  | 'muchos_emails'
  | 'no_relevante'
  | 'contenido_pobre'
  | 'cambio_email'
  | 'otro';

// Interface para suscribirse al newsletter
export interface SuscribirseNewsletterRequest {
  email: string;
  nombre?: string;
  intereses?: TipoInteres[];
  acepta_politicas: boolean;
}

export interface SuscribirseNewsletterResponse {
  success: boolean;
  message: string;
  data?: {
    id_suscripcion: string;
    token_confirmacion: string;
  };
  errors?: Record<string, string[]>;
}

// Interface para confirmar suscripción
export interface ConfirmarSuscripcionResponse {
  success: boolean;
  message: string;
}

// Interface para desuscribirse
export interface DesuscribirseNewsletterRequest {
  email: string;
  token?: string;
  motivo?: MotivoDesuscripcion;
}

export interface DesuscribirseNewsletterResponse {
  success: boolean;
  message: string;
}

// Interface para preferencias del usuario
export interface PreferenciasNewsletter {
  email: string;
  nombre: string;
  frecuencia: FrecuenciaNewsletter;
  intereses: TipoInteres[];
  formato: FormatoNewsletter;
  activo: boolean;
  fecha_suscripcion: string;
}

export interface PreferenciasNewsletterResponse {
  success: boolean;
  data: PreferenciasNewsletter;
  message?: string;
}

// Interface para actualizar preferencias
export interface ActualizarPreferenciasRequest {
  email: string;
  nombre?: string;
  frecuencia: FrecuenciaNewsletter;
  intereses?: TipoInteres[];
  formato: FormatoNewsletter;
}

export interface ActualizarPreferenciasResponse {
  success: boolean;
  message: string;
}

// Interface para información de tipos de intereses
export interface TipoInteresInfo {
  id: TipoInteres;
  nombre: string;
  descripcion: string;
  icono: string;
}

export interface TiposInteresesResponse {
  success: boolean;
  data: TipoInteresInfo[];
}

// Interface para campaña de newsletter
export interface CampanaNewsletter {
  id: number;
  titulo: string;
  fecha_envio: string;
  tasa_apertura: number;
  tasa_clicks: number;
}

// Interface para estadísticas del newsletter
export interface EstadisticasNewsletter {
  total_suscriptores: number;
  suscriptores_activos: number;
  tasa_apertura: number;
  tasa_clicks: number;
  crecimiento_mensual: number;
  por_intereses: Record<TipoInteres, number>;
  por_frecuencia: Record<FrecuenciaNewsletter, number>;
  ultimas_campanas: CampanaNewsletter[];
}

export interface EstadisticasNewsletterResponse {
  success: boolean;
  data: EstadisticasNewsletter;
}

// Interface para configuración del servicio
export interface ConfiguracionServicioNewsletter {
  cache_duracion_minutos: number;
  timeout_segundos: number;
  reintentos_suscripcion: number;
  validar_email_tiempo_real: boolean;
  permitir_suscripcion_anonima: boolean;
  requerir_confirmacion: boolean;
  max_intentos_confirmacion: number;
  tiempo_expiracion_token_horas: number;
}

// Eventos del servicio
export interface EventoNewsletter {
  tipo:
    | 'suscripcion_iniciada'
    | 'suscripcion_confirmada'
    | 'desuscripcion_realizada'
    | 'preferencias_actualizadas'
    | 'intereses_cargados'
    | 'estadisticas_cargadas'
    | 'error_suscripcion'
    | 'token_expirado';
  data?: any;
  timestamp: Date;
}

// Interface para validación de suscripción
export interface ValidacionSuscripcion {
  email_valido: boolean;
  nombre_valido: boolean;
  intereses_validos: boolean;
  politicas_aceptadas: boolean;
  ya_suscrito: boolean;
  formulario_completo: boolean;
  puntuacion_validez: number; // 0-100
}

// Interface para historial de suscripciones
export interface HistorialSuscripcion {
  email: string;
  fecha_suscripcion: string;
  fecha_confirmacion?: string;
  fecha_desuscripcion?: string;
  motivo_desuscripcion?: MotivoDesuscripcion;
  intereses_iniciales: TipoInteres[];
  intereses_actuales: TipoInteres[];
  frecuencia_actual: FrecuenciaNewsletter;
  campanas_recibidas: number;
  campanas_abiertas: number;
  links_clickeados: number;
  activo: boolean;
}

export interface HistorialSuscripcionResponse {
  success: boolean;
  data: HistorialSuscripcion;
}

// Interface para segmentación de audiencia
export interface SegmentoAudiencia {
  id: string;
  nombre: string;
  descripcion: string;
  criterios: {
    intereses?: TipoInteres[];
    frecuencia?: FrecuenciaNewsletter[];
    actividad_minima?: number;
    fecha_suscripcion_desde?: string;
    fecha_suscripcion_hasta?: string;
  };
  total_suscriptores: number;
  tasa_apertura_promedio: number;
  tasa_click_promedio: number;
}

export interface SegmentosAudienciaResponse {
  success: boolean;
  data: SegmentoAudiencia[];
}

// Interface para personalización de contenido
export interface PersonalizacionContenido {
  suscriptor_email: string;
  recomendaciones_productos: string[];
  contenido_personalizado: {
    saludo: string;
    productos_sugeridos: any[];
    ofertas_relevantes: any[];
    articulos_interes: any[];
  };
  tiempo_mejor_envio: string;
  probabilidad_apertura: number;
}

export interface PersonalizacionContenidoResponse {
  success: boolean;
  data: PersonalizacionContenido;
}

// Interface para métricas avanzadas
export interface MetricasAvanzadasNewsletter {
  periodo: {
    desde: string;
    hasta: string;
  };
  metricas_engagement: {
    tasa_apertura_promedio: number;
    tasa_click_promedio: number;
    tasa_conversion: number;
    tiempo_lectura_promedio: number;
    rebote_promedio: number;
  };
  analisis_temporal: {
    mejor_dia_envio: string;
    mejor_hora_envio: string;
    frecuencia_optima: FrecuenciaNewsletter;
  };
  segmentacion_rendimiento: {
    interes: TipoInteres;
    tasa_apertura: number;
    tasa_click: number;
    valor_conversion: number;
  }[];
  tendencias_crecimiento: {
    fecha: string;
    nuevas_suscripciones: number;
    desuscripciones: number;
    suscriptores_netos: number;
  }[];
}

export interface MetricasAvanzadasNewsletterResponse {
  success: boolean;
  data: MetricasAvanzadasNewsletter;
}

// Interface para A/B testing
export interface PruebaABNewsletter {
  id: string;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin?: string;
  activa: boolean;
  variantes: {
    id: string;
    nombre: string;
    porcentaje_audiencia: number;
    configuracion: {
      asunto?: string;
      contenido?: string;
      hora_envio?: string;
      frecuencia?: FrecuenciaNewsletter;
    };
    metricas: {
      enviados: number;
      aperturas: number;
      clicks: number;
      conversiones: number;
    };
  }[];
  ganador?: string;
  confianza_estadistica: number;
}

export interface PruebasABNewsletterResponse {
  success: boolean;
  data: PruebaABNewsletter[];
}

// Interface para automatización
export interface AutomatizacionNewsletter {
  id: string;
  nombre: string;
  tipo:
    | 'bienvenida'
    | 'abandonado'
    | 'cumpleanos'
    | 'reactivacion'
    | 'personalizada';
  activa: boolean;
  trigger: {
    evento: string;
    condiciones: Record<string, any>;
    retraso_horas?: number;
  };
  plantilla: {
    asunto: string;
    contenido: string;
    personalizacion: boolean;
  };
  metricas: {
    ejecutadas: number;
    tasa_apertura: number;
    tasa_click: number;
    tasa_conversion: number;
  };
}

export interface AutomatizacionesNewsletterResponse {
  success: boolean;
  data: AutomatizacionNewsletter[];
}

// Interface para gestión de plantillas
export interface PlantillaNewsletter {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  html_contenido: string;
  variables_disponibles: string[];
  preview_url?: string;
  fecha_creacion: string;
  fecha_modificacion: string;
  veces_utilizada: number;
  calificacion_promedio: number;
}

export interface PlantillasNewsletterResponse {
  success: boolean;
  data: PlantillaNewsletter[];
}

// Interface para gestión de listas
export interface ListaNewsletter {
  id: string;
  nombre: string;
  descripcion: string;
  total_suscriptores: number;
  suscriptores_activos: number;
  criterios_inclusion: {
    intereses?: TipoInteres[];
    frecuencia?: FrecuenciaNewsletter[];
    actividad_minima?: number;
    tags?: string[];
  };
  fecha_creacion: string;
  ultima_campana?: string;
  tasa_apertura_promedio: number;
}

export interface ListasNewsletterResponse {
  success: boolean;
  data: ListaNewsletter[];
}

// Interface para configuración GDPR/Privacidad
export interface ConfiguracionPrivacidadNewsletter {
  requiere_doble_opt_in: boolean;
  permite_opt_out_facil: boolean;
  guarda_historial_consentimiento: boolean;
  elimina_datos_automaticamente: boolean;
  dias_retencion_datos: number;
  incluye_link_privacidad: boolean;
  permite_descarga_datos: boolean;
  notifica_cambios_politica: boolean;
}

export interface ConfiguracionPrivacidadNewsletterResponse {
  success: boolean;
  data: ConfiguracionPrivacidadNewsletter;
}

// Interface para análisis de contenido
export interface AnalisisContenidoNewsletter {
  campana_id: string;
  analisis_asunto: {
    longitud_caracteres: number;
    longitud_palabras: number;
    contiene_emojis: boolean;
    probabilidad_spam: number;
    sentimiento: 'positivo' | 'neutral' | 'negativo';
    urgencia: 'alta' | 'media' | 'baja';
  };
  analisis_contenido: {
    legibilidad_score: number;
    tiempo_lectura_estimado: number;
    enlaces_total: number;
    imagenes_total: number;
    llamadas_accion: number;
    ratio_texto_imagen: number;
  };
  recomendaciones: string[];
  prediccion_rendimiento: {
    tasa_apertura_estimada: number;
    tasa_click_estimada: number;
    confianza: number;
  };
}

export interface AnalisisContenidoNewsletterResponse {
  success: boolean;
  data: AnalisisContenidoNewsletter;
}

// Interface para cache del servicio
export interface CacheNewsletter {
  key: string;
  datos: any;
  timestamp: number;
  expira_en: number;
  tipo:
    | 'suscripcion'
    | 'preferencias'
    | 'intereses'
    | 'estadisticas'
    | 'metricas';
  metadatos?: {
    email?: string;
    token?: string;
    version?: string;
  };
}

// Interface para notificaciones del newsletter
export interface NotificacionNewsletter {
  id: string;
  tipo:
    | 'confirmacion_pendiente'
    | 'suscripcion_exitosa'
    | 'error_envio'
    | 'campana_enviada';
  titulo: string;
  mensaje: string;
  email?: string;
  fecha: string;
  leida: boolean;
  accion_requerida: boolean;
  url_accion?: string;
}

export interface NotificacionesNewsletterResponse {
  success: boolean;
  data: NotificacionNewsletter[];
}

// Interface para exportación de datos
export interface ExportacionSuscriptores {
  formato: 'csv' | 'xlsx' | 'json';
  incluir_inactivos: boolean;
  campos: string[];
  filtros?: {
    intereses?: TipoInteres[];
    frecuencia?: FrecuenciaNewsletter[];
    fecha_desde?: string;
    fecha_hasta?: string;
  };
}

export interface ExportacionSuscriptoresResponse {
  success: boolean;
  data: {
    url_descarga: string;
    nombre_archivo: string;
    total_registros: number;
    tiempo_expiracion: string;
  };
}

// Interface para importación de suscriptores
export interface ImportacionSuscriptores {
  archivo: File;
  mapeo_campos: Record<string, string>;
  sobrescribir_existentes: boolean;
  enviar_confirmacion: boolean;
  lista_destino?: string;
}

export interface ImportacionSuscriptoresResponse {
  success: boolean;
  data: {
    total_procesados: number;
    exitosos: number;
    errores: number;
    duplicados: number;
    detalles_errores?: string[];
  };
  message: string;
}

// Interface para webhooks
export interface WebhookNewsletter {
  id: string;
  url: string;
  eventos: string[];
  activo: boolean;
  secreto: string;
  ultimo_intento?: string;
  ultimo_exito?: string;
  reintentos_fallidos: number;
}

export interface WebhooksNewsletterResponse {
  success: boolean;
  data: WebhookNewsletter[];
}

// Respuestas genéricas
export interface NewsletterResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Interface para configuración de la empresa
export interface ConfiguracionEmpresaNewsletter {
  nombre_empresa: string;
  email_remitente: string;
  nombre_remitente: string;
  direccion_respuesta: string;
  direccion_fisica: string;
  telefono_contacto: string;
  sitio_web: string;
  politicas_privacidad_url: string;
  terminos_servicio_url: string;
  logo_url?: string;
  colores_marca: {
    primario: string;
    secundario: string;
    acento: string;
  };
}

export interface ConfiguracionEmpresaNewsletterResponse {
  success: boolean;
  data: ConfiguracionEmpresaNewsletter;
}

// Interface para límites y restricciones
export interface LimitesNewsletter {
  max_suscriptores: number;
  max_emails_por_mes: number;
  max_campanas_por_dia: number;
  max_listas: number;
  max_plantillas: number;
  max_automatizaciones: number;
  tiempo_minimo_entre_envios: number; // en minutos
  limite_tamano_archivo_mb: number;
  tipos_archivo_permitidos: string[];
}

export interface LimitesNewsletterResponse {
  success: boolean;
  data: LimitesNewsletter;
}

// Interface para estado del servicio
export interface EstadoServicioNewsletter {
  envios_activos: boolean;
  procesando_cola: boolean;
  emails_en_cola: number;
  tiempo_estimado_procesamiento: string;
  ultimo_mantenimiento: string;
  proximo_mantenimiento?: string;
  servicios_externos: {
    proveedor_email: 'activo' | 'inactivo' | 'degradado';
    analytics: 'activo' | 'inactivo' | 'degradado';
    almacenamiento: 'activo' | 'inactivo' | 'degradado';
  };
}

export interface EstadoServicioNewsletterResponse {
  success: boolean;
  data: EstadoServicioNewsletter;
}

// Utilidades para el servicio
export interface UtilNewsletter {
  validarEmail: (email: string) => boolean;
  validarNombre: (nombre: string) => boolean;
  limpiarEmail: (email: string) => string;
  formatearFecha: (fecha: string) => string;
  calcularTasaApertura: (aperturas: number, enviados: number) => number;
  calcularTasaClick: (clicks: number, aperturas: number) => number;
  generarTokenConfirmacion: () => string;
  validarToken: (token: string) => boolean;
  calcularPuntuacionEngagement: (historial: HistorialSuscripcion) => number;
  determinarMejorHoraEnvio: (timezone: string) => string;
  segmentarAudiencia: (criterios: any) => string[];
  personalizarContenido: (template: string, datos: any) => string;
}
