import { PaginatedResponse } from './common.interface';

// Interface para enviar mensaje de contacto
export interface EnviarMensajeRequest {
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;
  asunto: string;
  mensaje: string;
  tipo_consulta: TipoConsulta;
  acepta_politicas: boolean;
}

export interface EnviarMensajeResponse {
  success: boolean;
  message: string;
  data?: {
    ticket_id: string;
    tiempo_respuesta_estimado: string;
  };
  errors?: Record<string, string[]>;
}

// Tipos de consulta disponibles
export type TipoConsulta =
  | 'general'
  | 'ventas'
  | 'soporte'
  | 'reclamos'
  | 'sugerencias';

// Interface para información de la empresa
export interface InformacionEmpresa {
  datos_empresa: {
    nombre: string;
    ruc: string;
    direccion: string;
    codigo_postal: string;
  };
  contacto: {
    telefono_principal: string;
    telefono_ventas: string;
    whatsapp: string;
    email_general: string;
    email_ventas: string;
    email_soporte: string;
  };
  horarios_atencion: {
    telefono: HorarioAtencion;
    whatsapp: HorarioAtencion;
    email: string;
  };
  ubicacion: {
    latitud: number;
    longitud: number;
    direccion_completa: string;
    referencias: string;
  };
  redes_sociales: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
    tiktok: string;
  };
}

export interface HorarioAtencion {
  lunes_viernes: string;
  sabados: string;
  domingos: string;
}

export interface InformacionEmpresaResponse {
  success: boolean;
  data: InformacionEmpresa;
  message?: string;
}

// Interface para tipos de consulta
export interface TipoConsultaInfo {
  value: TipoConsulta;
  label: string;
  descripcion: string;
  icono: string;
  tiempo_respuesta: string;
  prioridad?: 'alta' | 'media' | 'baja';
}

export interface TiposConsultaResponse {
  success: boolean;
  data: TipoConsultaInfo[];
}

// Interface para FAQ de contacto
export interface FaqContacto {
  id: number;
  pregunta: string;
  respuesta: string;
  categoria: CategoriaFaqContacto;
}

export type CategoriaFaqContacto =
  | 'horarios'
  | 'tiempos_respuesta'
  | 'tienda_fisica'
  | 'whatsapp'
  | 'reclamos'
  | 'general';

export interface FaqContactoResponse {
  success: boolean;
  data: FaqContacto[];
}

// Interface para estado del servicio
export interface EstadoServicio {
  telefono: EstadoCanal;
  whatsapp: EstadoCanal;
  email: EstadoCanalEmail;
  tienda_fisica: EstadoCanalTienda;
}

export interface EstadoCanal {
  disponible: boolean;
  mensaje: string;
  proximo_horario?: string;
}

export interface EstadoCanalEmail extends EstadoCanal {
  tiempo_respuesta: string;
}

export interface EstadoCanalTienda extends EstadoCanal {
  direccion: string;
}

export interface EstadoServicioResponse {
  success: boolean;
  data: {
    servicios: EstadoServicio;
    hora_actual: string;
    zona_horaria: string;
  };
}

// Configuración del servicio de contacto
export interface ConfiguracionServicioContacto {
  cache_duracion_minutos: number;
  timeout_segundos: number;
  reintentos_envio: number;
  validar_email_tiempo_real: boolean;
  mostrar_estado_servicios: boolean;
  actualizar_estado_automatico: boolean;
  intervalo_actualizacion_minutos: number;
}

// Eventos del servicio
export interface EventoContacto {
  tipo:
    | 'mensaje_enviado'
    | 'informacion_cargada'
    | 'estado_actualizado'
    | 'error_envio'
    | 'faq_cargado';
  data?: any;
  timestamp: Date;
}

// Filtros para FAQ
export interface FiltrosFaqContacto {
  categoria?: CategoriaFaqContacto;
  busqueda?: string;
}

// Estadísticas de contacto
export interface EstadisticasContacto {
  mensajes_enviados_hoy: number;
  tiempo_respuesta_promedio: string;
  canal_mas_usado: string;
  tipo_consulta_mas_frecuente: TipoConsulta;
  satisfaccion_promedio: number; // 0-100
  horario_mayor_actividad: string;
}

export interface EstadisticasContactoResponse {
  success: boolean;
  data: EstadisticasContacto;
}

// Validación de formulario de contacto
export interface ValidacionFormularioContacto {
  nombre_valido: boolean;
  apellidos_valido: boolean;
  email_valido: boolean;
  telefono_valido: boolean;
  asunto_valido: boolean;
  mensaje_valido: boolean;
  tipo_consulta_valido: boolean;
  politicas_aceptadas: boolean;
  formulario_completo: boolean;
  puntuacion_validez: number; // 0-100
}

// Sugerencias de mensajes
export interface SugerenciaMensaje {
  tipo_consulta: TipoConsulta;
  plantillas: PlantillaMensaje[];
}

export interface PlantillaMensaje {
  titulo: string;
  contenido: string;
  palabras_clave: string[];
}

export interface SugerenciasMensajesResponse {
  success: boolean;
  data: SugerenciaMensaje[];
}

// Historial de mensajes (para usuarios autenticados)
export interface HistorialMensaje {
  id: string;
  ticket_id: string;
  asunto: string;
  tipo_consulta: TipoConsulta;
  estado: EstadoMensaje;
  fecha_envio: string;
  fecha_respuesta?: string;
  tiempo_respuesta?: string;
  satisfaccion?: number; // 1-5
}

export type EstadoMensaje =
  | 'pendiente'
  | 'en_proceso'
  | 'respondido'
  | 'cerrado';

export interface HistorialMensajesResponse {
  success: boolean;
  data: HistorialMensaje[];
  meta?: {
    total: number;
    current_page: number;
    last_page: number;
  };
}

// Información de contacto de emergencia
export interface ContactoEmergencia {
  nombre: string;
  telefono: string;
  email: string;
  disponibilidad: string;
  descripcion: string;
}

export interface ContactosEmergenciaResponse {
  success: boolean;
  data: ContactoEmergencia[];
}

// Cache para datos de contacto
export interface CacheContacto {
  key: string;
  datos: any;
  timestamp: number;
  expira_en: number;
  tipo:
    | 'empresa'
    | 'tipos_consulta'
    | 'faq'
    | 'estado_servicio'
    | 'sugerencias';
}

// Notificaciones de contacto
export interface NotificacionContacto {
  id: string;
  tipo: 'respuesta_recibida' | 'mensaje_visto' | 'seguimiento_pendiente';
  titulo: string;
  mensaje: string;
  ticket_id?: string;
  fecha: string;
  leida: boolean;
  accion_requerida: boolean;
}

export interface NotificacionesContactoResponse {
  success: boolean;
  data: NotificacionContacto[];
}

// Configuración de preferencias de contacto
export interface PreferenciasContacto {
  canal_preferido: CanalContacto;
  horario_preferido: string;
  idioma_preferido: string;
  notificaciones_email: boolean;
  notificaciones_sms: boolean;
  tipo_consulta_frecuente: TipoConsulta;
}

export type CanalContacto = 'email' | 'telefono' | 'whatsapp' | 'tienda_fisica';

export interface PreferenciasContactoResponse {
  success: boolean;
  data: PreferenciasContacto;
}

// Solicitud de callback
export interface SolicitarCallbackRequest {
  nombre: string;
  telefono: string;
  horario_preferido: string;
  motivo: string;
  urgencia: 'baja' | 'media' | 'alta';
}

export interface SolicitarCallbackResponse {
  success: boolean;
  data?: {
    callback_id: string;
    tiempo_estimado: string;
    instrucciones: string[];
  };
  message?: string;
  errors?: Record<string, string[]>;
}

// Evaluación de satisfacción
export interface EvaluacionSatisfaccion {
  ticket_id: string;
  puntuacion: number; // 1-5
  comentarios?: string;
  aspectos_positivos?: string[];
  aspectos_mejora?: string[];
  recomendaria: boolean;
}

export interface EvaluacionSatisfaccionResponse {
  success: boolean;
  message: string;
}

// Información de seguimiento
export interface SeguimientoTicket {
  ticket_id: string;
  estado_actual: EstadoMensaje;
  historial_estados: HistorialEstado[];
  tiempo_transcurrido: string;
  tiempo_restante_estimado?: string;
  agente_asignado?: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
}

export interface HistorialEstado {
  estado: EstadoMensaje;
  fecha: string;
  comentario?: string;
  agente?: string;
}

export interface SeguimientoTicketResponse {
  success: boolean;
  data: SeguimientoTicket;
  message?: string;
}

// Ubicaciones de oficinas/tiendas
export interface UbicacionOficina {
  id: number;
  nombre: string;
  tipo: 'tienda' | 'oficina' | 'centro_servicio';
  direccion: string;
  telefono: string;
  email: string;
  horarios: HorarioAtencion;
  servicios_disponibles: string[];
  coordenadas: {
    latitud: number;
    longitud: number;
  };
  imagen?: string;
  instrucciones_llegada: string[];
}

export interface UbicacionesResponse {
  success: boolean;
  data: UbicacionOficina[];
}

// Respuestas genéricas
export interface ContactoResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Datos del remitente para autocompletar
export interface DatosRemitente {
  nombre?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  empresa?: string;
  cargo?: string;
}

// Archivos adjuntos para mensajes
export interface ArchivoAdjunto {
  nombre: string;
  tipo: string;
  tamaño: number;
  contenido: File;
}

// Límites y restricciones
export interface LimitesContacto {
  max_mensajes_por_dia: number;
  max_caracteres_mensaje: number;
  max_archivos_adjuntos: number;
  max_tamaño_archivo_mb: number;
  tipos_archivo_permitidos: string[];
  tiempo_minimo_entre_mensajes: number; // en minutos
}

export interface LimitesContactoResponse {
  success: boolean;
  data: LimitesContacto;
}

// Estados de disponibilidad en tiempo real
export interface DisponibilidadTiempoReal {
  agentes_online: number;
  tiempo_espera_estimado: string;
  carga_trabajo: 'baja' | 'media' | 'alta';
  servicios_afectados: string[];
  mensaje_estado?: string;
}

export interface DisponibilidadTiempoRealResponse {
  success: boolean;
  data: DisponibilidadTiempoReal;
}

// Métricas de rendimiento del servicio
export interface MetricasServicioContacto {
  tiempo_respuesta_promedio: string;
  satisfaccion_cliente: number; // 0-100
  resolucion_primer_contacto: number; // 0-100
  mensajes_procesados_hoy: number;
  escalaciones_dia: number;
  canales_mas_utilizados: {
    canal: CanalContacto;
    porcentaje: number;
  }[];
}

export interface MetricasServicioContactoResponse {
  success: boolean;
  data: MetricasServicioContacto;
}

// Utilidades para validación
export interface UtilValidacionContacto {
  validarEmail: (email: string) => boolean;
  validarTelefono: (telefono: string) => boolean;
  validarNombre: (nombre: string) => boolean;
  limpiarTexto: (texto: string) => string;
  detectarIdioma: (texto: string) => string;
  contarPalabras: (texto: string) => number;
  validarArchivoAdjunto: (archivo: File) => boolean;
  formatearTelefono: (telefono: string) => string;
}
