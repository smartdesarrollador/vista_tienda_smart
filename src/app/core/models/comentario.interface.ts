/**
 * Interfaz para representar un comentario de producto
 * Basada en la tabla 'comentarios' y respuesta del API
 */
export interface Comentario {
  id: number;
  user_id: number;
  producto_id: number;
  comentario: string;
  calificacion: number;
  aprobado: boolean;
  titulo: string;
  respuesta_admin?: string;
  created_at: string;
  updated_at: string;
  tiempo_transcurrido: string;
  es_recomendado: boolean;
  tiene_respuesta: boolean;
  usuario?: UsuarioComentario;
  producto?: ProductoComentario;
}

/**
 * Interfaz para los datos del usuario asociado al comentario
 */
export interface UsuarioComentario {
  id: number | null;
  nombre: string;
  avatar?: string;
  verificado: boolean;
}

/**
 * Interfaz para los datos del producto asociado al comentario
 */
export interface ProductoComentario {
  id: number;
  nombre: string;
  slug: string;
  imagen_principal: string;
}

/**
 * DTO para crear un nuevo comentario
 */
export interface CreateComentarioDto {
  user_id: number;
  producto_id: number;
  comentario: string;
  calificacion: number;
  titulo: string;
  aprobado?: boolean;
}

/**
 * DTO para actualizar un comentario existente
 */
export interface UpdateComentarioDto {
  comentario?: string;
  calificacion?: number;
  titulo?: string;
  aprobado?: boolean;
  respuesta_admin?: string;
}

/**
 * Interfaz para filtros de búsqueda de comentarios
 */
export interface ComentarioFilters {
  producto_id?: number;
  user_id?: number;
  calificacion?: number;
  aprobado?: boolean;
  con_respuesta?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
  calificacion_min?: number;
  calificacion_max?: number;
  search?: string;
  sort_field?: 'created_at' | 'calificacion' | 'aprobado' | 'titulo';
  sort_direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

/**
 * Interfaz para la respuesta paginada de comentarios
 */
export interface ComentarioResponse {
  success: boolean;
  data: Comentario[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  filters_applied: Partial<ComentarioFilters>;
}

/**
 * Interfaz para la respuesta de un solo comentario
 */
export interface ComentarioSingleResponse {
  success: boolean;
  data: Comentario;
  message?: string;
}

/**
 * Interfaz para la respuesta de comentarios por producto
 */
export interface ComentariosByProductoResponse {
  success: boolean;
  data: Comentario[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  producto: {
    id: number;
    nombre: string;
    slug: string;
  };
  estadisticas: EstadisticasProductoComentarios;
}

/**
 * Interfaz para estadísticas de comentarios de un producto específico
 */
export interface EstadisticasProductoComentarios {
  total_comentarios: number;
  comentarios_aprobados: number;
  promedio_calificacion: number;
  distribucion_calificaciones: {
    '5_estrellas': number;
    '4_estrellas': number;
    '3_estrellas': number;
    '2_estrellas': number;
    '1_estrella': number;
  };
}

/**
 * Interfaz para estadísticas generales del sistema de comentarios
 */
export interface EstadisticasComentarios {
  success: boolean;
  data: {
    resumen_general: {
      total_comentarios: number;
      comentarios_aprobados: number;
      comentarios_pendientes: number;
      comentarios_con_respuesta: number;
      promedio_calificacion_general: number;
    };
    distribucion_calificaciones: {
      '5_estrellas': number;
      '4_estrellas': number;
      '3_estrellas': number;
      '2_estrellas': number;
      '1_estrella': number;
    };
    productos_mas_comentados: Array<{
      id: number;
      nombre: string;
      slug: string;
      total_comentarios: number;
    }>;
    productos_mejor_calificados: Array<{
      id: number;
      nombre: string;
      slug: string;
      promedio_calificacion: number;
      total_comentarios: number;
    }>;
    usuarios_mas_activos: Array<{
      id: number;
      nombre: string;
      email: string;
      total_comentarios: number;
    }>;
    tendencia_mensual: Array<{
      mes: string;
      nombre_mes: string;
      comentarios: number;
    }>;
  };
  periodo: {
    fecha_desde?: string;
    fecha_hasta?: string;
  };
}

/**
 * Interfaz para respuesta de operaciones simples (crear, actualizar, eliminar)
 */
export interface ComentarioOperationResponse {
  success: boolean;
  data?: Comentario;
  message: string;
  error?: string;
}

/**
 * Interfaz para responder a un comentario
 */
export interface ResponderComentarioDto {
  respuesta_admin: string;
}

/**
 * Enum para las calificaciones posibles
 */
export enum CalificacionEnum {
  UNA_ESTRELLA = 1,
  DOS_ESTRELLAS = 2,
  TRES_ESTRELLAS = 3,
  CUATRO_ESTRELLAS = 4,
  CINCO_ESTRELLAS = 5,
}

/**
 * Enum para el estado de aprobación
 */
export enum EstadoAprobacion {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
}

/**
 * Interfaz para validación de comentario
 */
export interface ComentarioValidation {
  comentario: boolean;
  titulo: boolean;
  calificacion: boolean;
  user_id: boolean;
  producto_id: boolean;
  isValid: boolean;
  errors: string[];
}

/**
 * Interfaz para resumen de comentarios por estado
 */
export interface ResumenComentarios {
  total: number;
  aprobados: number;
  pendientes: number;
  con_respuesta: number;
  sin_respuesta: number;
  promedio_calificacion: number;
}

/**
 * Interfaz para filtros rápidos predefinidos
 */
export interface FiltrosRapidos {
  todos: ComentarioFilters;
  pendientes: ComentarioFilters;
  aprobados: ComentarioFilters;
  alta_calificacion: ComentarioFilters;
  baja_calificacion: ComentarioFilters;
  con_respuesta: ComentarioFilters;
  sin_respuesta: ComentarioFilters;
  recientes: ComentarioFilters;
}

/**
 * Interfaz para acciones masivas en comentarios
 */
export interface AccionMasivaComentarios {
  comentario_ids: number[];
  accion: 'aprobar' | 'rechazar' | 'eliminar';
  respuesta_admin?: string;
}

/**
 * Interfaz para respuesta de acciones masivas
 */
export interface AccionMasivaResponse {
  success: boolean;
  procesados: number;
  errores: number;
  detalles: Array<{
    comentario_id: number;
    exito: boolean;
    mensaje: string;
  }>;
  message: string;
}

/**
 * Constantes para el sistema de comentarios
 */
export const COMENTARIO_CONSTANTS = {
  MIN_COMENTARIO_LENGTH: 10,
  MAX_COMENTARIO_LENGTH: 1000,
  MIN_TITULO_LENGTH: 5,
  MAX_TITULO_LENGTH: 100,
  MIN_RESPUESTA_ADMIN_LENGTH: 10,
  MAX_RESPUESTA_ADMIN_LENGTH: 500,
  CALIFICACION_MIN: 1,
  CALIFICACION_MAX: 5,
  DEFAULT_PER_PAGE: 15,
  MAX_PER_PAGE: 100,
} as const;

/**
 * Utilidades para trabajar con comentarios
 */
export class ComentarioUtils {
  /**
   * Convierte una calificación numérica a estrellas
   */
  static getEstrellas(calificacion: number): string {
    return '★'.repeat(calificacion) + '☆'.repeat(5 - calificacion);
  }

  /**
   * Obtiene el color CSS para una calificación
   */
  static getColorCalificacion(calificacion: number): string {
    if (calificacion >= 4) return 'text-green-500';
    if (calificacion >= 3) return 'text-yellow-500';
    return 'text-red-500';
  }

  /**
   * Obtiene el texto descriptivo de una calificación
   */
  static getTextoCalificacion(calificacion: number): string {
    const textos = {
      1: 'Muy malo',
      2: 'Malo',
      3: 'Regular',
      4: 'Bueno',
      5: 'Excelente',
    };
    return textos[calificacion as keyof typeof textos] || 'Sin calificar';
  }

  /**
   * Verifica si un comentario es recomendado (calificación >= 4)
   */
  static esRecomendado(calificacion: number): boolean {
    return calificacion >= 4;
  }

  /**
   * Formatea el tiempo transcurrido
   */
  static formatearTiempo(fechaCreacion: string): string {
    const fecha = new Date(fechaCreacion);
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();

    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const semanas = Math.floor(dias / 7);
    const meses = Math.floor(dias / 30);

    if (minutos < 60) return `hace ${minutos} minutos`;
    if (horas < 24) return `hace ${horas} horas`;
    if (dias < 7) return `hace ${dias} días`;
    if (semanas < 4) return `hace ${semanas} semanas`;
    return `hace ${meses} meses`;
  }

  /**
   * Trunca un comentario a una longitud específica
   */
  static truncarComentario(comentario: string, longitud: number = 150): string {
    if (comentario.length <= longitud) return comentario;
    return comentario.substring(0, longitud) + '...';
  }
}
