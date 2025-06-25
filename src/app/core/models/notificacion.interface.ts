/**
 * Interfaz para representar una notificación del sistema
 * Basada en la tabla 'notificaciones' y respuesta del API
 */
export interface Notificacion {
  id: number;
  user_id: number;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  leido: boolean;
  created_at: string;
  updated_at: string;
  tiempo_transcurrido: string;
  es_reciente: boolean;
  dias_antiguedad: number;
  tipo_detallado: TipoDetalladoNotificacion;
  prioridad: PrioridadNotificacion;
  requiere_accion: boolean;
  puede_eliminarse: boolean;
  usuario?: UsuarioNotificacion;
}

/**
 * Interfaz para los datos del usuario asociado a la notificación
 */
export interface UsuarioNotificacion {
  id: number;
  name: string;
  email: string;
  rol: string;
  avatar?: string;
}

/**
 * Interfaz para el tipo detallado de notificación
 */
export interface TipoDetalladoNotificacion {
  codigo: string;
  nombre: string;
  icono: string;
  color: string;
}

/**
 * Tipos de notificación disponibles
 */
export type TipoNotificacion =
  | 'admin'
  | 'inventario'
  | 'stock'
  | 'pedido'
  | 'promocion'
  | 'credito'
  | 'bienvenida'
  | 'pago'
  | 'recordatorio'
  | 'sistema'
  | 'general';

/**
 * Niveles de prioridad de notificaciones
 */
export type PrioridadNotificacion = 'alta' | 'media' | 'baja';

/**
 * DTO para crear una nueva notificación
 */
export interface CreateNotificacionDto {
  user_id: number;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  leido?: boolean;
}

/**
 * DTO para actualizar una notificación existente
 */
export interface UpdateNotificacionDto {
  titulo?: string;
  mensaje?: string;
  tipo?: TipoNotificacion;
  leido?: boolean;
}

/**
 * Interfaz para filtros de búsqueda de notificaciones
 */
export interface NotificacionFilters {
  user_id?: number;
  tipo?: string; // Puede ser un tipo único o múltiples separados por coma
  leido?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
  recientes?: number; // horas
  prioridad?: PrioridadNotificacion;
  requiere_accion?: boolean;
  search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'titulo' | 'tipo' | 'leido';
  sort_direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

/**
 * Interfaz para la respuesta paginada de notificaciones
 */
export interface NotificacionResponse {
  success: boolean;
  data: Notificacion[];
  links: {
    first: string;
    last: string;
    prev?: string;
    next?: string;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
    links: Array<{
      url?: string;
      label: string;
      active: boolean;
    }>;
    path: string;
  };
  filters_applied?: Partial<NotificacionFilters>;
}

/**
 * Interfaz para la respuesta de una sola notificación
 */
export interface NotificacionSingleResponse {
  success: boolean;
  data: Notificacion;
  message?: string;
}

/**
 * Interfaz para la respuesta de notificaciones por usuario
 */
export interface NotificacionesByUsuarioResponse {
  success: boolean;
  data: Notificacion[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  usuario: {
    id: number;
    name: string;
    email: string;
    rol: string;
  };
  estadisticas: EstadisticasUsuarioNotificaciones;
}

/**
 * Interfaz para estadísticas de notificaciones de un usuario específico
 */
export interface EstadisticasUsuarioNotificaciones {
  total_notificaciones: number;
  no_leidas: number;
  leidas: number;
  por_tipo: Record<string, number>;
  recientes_24h: number;
}

/**
 * Interfaz para estadísticas generales del sistema de notificaciones
 */
export interface EstadisticasNotificaciones {
  success: boolean;
  data: {
    resumen_general: {
      total_notificaciones: number;
      notificaciones_leidas: number;
      notificaciones_no_leidas: number;
      notificaciones_recientes_24h: number;
      notificaciones_esta_semana: number;
      notificaciones_este_mes: number;
      requieren_accion: number;
      promedio_por_usuario: number;
    };
    distribucion_tipos: Record<string, number>;
    distribucion_lectura: Record<string, number>;
    usuarios_mas_activos: Array<{
      id: number;
      name: string;
      email: string;
      rol: string;
      total_notificaciones: number;
    }>;
    tipos_mas_frecuentes: Array<{
      tipo: string;
      total: number;
      porcentaje: number;
    }>;
    tendencia_mensual: Array<{
      mes: string;
      nombre_mes: string;
      notificaciones: number;
    }>;
  };
  periodo: {
    fecha_desde?: string;
    fecha_hasta?: string;
    user_id?: number;
  };
}

/**
 * Interfaz para respuesta de operaciones simples (crear, actualizar, eliminar)
 */
export interface NotificacionOperationResponse {
  success: boolean;
  data?: Notificacion;
  message: string;
  error?: string;
}

/**
 * Interfaz para marcar notificaciones como leídas
 */
export interface MarcarLeidasRequest {
  user_id: number;
}

/**
 * Interfaz para respuesta de marcar como leídas
 */
export interface MarcarLeidasResponse {
  success: boolean;
  message: string;
  notificaciones_actualizadas: number;
}

/**
 * Interfaz para limpiar notificaciones antiguas
 */
export interface LimpiarAntiguasRequest {
  dias?: number;
  solo_leidas?: boolean;
  user_id?: number;
}

/**
 * Interfaz para respuesta de limpieza de notificaciones
 */
export interface LimpiarAntiguasResponse {
  success: boolean;
  message: string;
  notificaciones_eliminadas: number;
  criterios: {
    dias_antiguedad?: number;
    solo_leidas: boolean;
    user_id?: number;
  };
}

/**
 * Interfaz para envío de notificaciones masivas
 */
export interface EnviarMasivaRequest {
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  usuarios: number[];
  programada_para?: string;
}

/**
 * Interfaz para respuesta de envío masivo
 */
export interface EnviarMasivaResponse {
  success: boolean;
  message: string;
  notificaciones_creadas: number;
  usuarios_objetivo: number;
  errores: string[];
  programada_para?: string;
}

/**
 * Interfaz para validación de notificación
 */
export interface NotificacionValidation {
  user_id: boolean;
  titulo: boolean;
  mensaje: boolean;
  tipo: boolean;
  isValid: boolean;
  errors: string[];
}

/**
 * Interfaz para resumen de notificaciones
 */
export interface ResumenNotificaciones {
  total: number;
  no_leidas: number;
  leidas: number;
  recientes_24h: number;
  esta_semana: number;
  este_mes: number;
  requieren_accion: number;
}

/**
 * Interfaz para filtros rápidos predefinidos
 */
export interface FiltrosRapidosNotificaciones {
  todas: NotificacionFilters;
  no_leidas: NotificacionFilters;
  recientes: NotificacionFilters;
  alta_prioridad: NotificacionFilters;
  requieren_accion: NotificacionFilters;
  por_tipo: Record<TipoNotificacion, NotificacionFilters>;
  esta_semana: NotificacionFilters;
  este_mes: NotificacionFilters;
}

/**
 * Interfaz para acciones masivas en notificaciones
 */
export interface AccionMasivaNotificaciones {
  notificacion_ids: number[];
  accion: 'marcar_leidas' | 'marcar_no_leidas' | 'eliminar';
  criterios?: {
    solo_leidas?: boolean;
    antiguedad_dias?: number;
    tipos?: TipoNotificacion[];
  };
}

/**
 * Interfaz para respuesta de acciones masivas
 */
export interface AccionMasivaNotificacionesResponse {
  success: boolean;
  procesados: number;
  errores: number;
  detalles: Array<{
    notificacion_id: number;
    exito: boolean;
    mensaje: string;
  }>;
  message: string;
}

/**
 * Constantes para el sistema de notificaciones
 */
export const NOTIFICACION_CONSTANTS = {
  DEFAULT_PER_PAGE: 15,
  MAX_PER_PAGE: 100,
  MAX_TITULO_LENGTH: 255,
  MAX_MENSAJE_LENGTH: 1000,
  HORAS_RECIENTES_DEFAULT: 24,
  DIAS_LIMPIEZA_DEFAULT: 30,
  MAX_USUARIOS_MASIVO: 1000,
} as const;

/**
 * Configuración de tipos de notificación
 */
export const TIPOS_NOTIFICACION_CONFIG: Record<
  TipoNotificacion,
  TipoDetalladoNotificacion
> = {
  admin: {
    codigo: 'admin',
    nombre: 'Administración',
    icono: 'shield-check',
    color: 'blue',
  },
  inventario: {
    codigo: 'inventario',
    nombre: 'Inventario',
    icono: 'package',
    color: 'orange',
  },
  stock: {
    codigo: 'stock',
    nombre: 'Stock',
    icono: 'package',
    color: 'orange',
  },
  pedido: {
    codigo: 'pedido',
    nombre: 'Pedido',
    icono: 'shopping-cart',
    color: 'blue',
  },
  promocion: {
    codigo: 'promocion',
    nombre: 'Promoción',
    icono: 'tag',
    color: 'purple',
  },
  credito: {
    codigo: 'credito',
    nombre: 'Crédito',
    icono: 'credit-card',
    color: 'green',
  },
  bienvenida: {
    codigo: 'bienvenida',
    nombre: 'Bienvenida',
    icono: 'user-plus',
    color: 'indigo',
  },
  pago: {
    codigo: 'pago',
    nombre: 'Pago',
    icono: 'credit-card',
    color: 'green',
  },
  recordatorio: {
    codigo: 'recordatorio',
    nombre: 'Recordatorio',
    icono: 'clock',
    color: 'yellow',
  },
  sistema: {
    codigo: 'sistema',
    nombre: 'Sistema',
    icono: 'settings',
    color: 'gray',
  },
  general: {
    codigo: 'general',
    nombre: 'General',
    icono: 'bell',
    color: 'gray',
  },
};

/**
 * Configuración de prioridades
 */
export const PRIORIDADES_CONFIG: Record<
  PrioridadNotificacion,
  {
    tipos: TipoNotificacion[];
    color: string;
    icono: string;
  }
> = {
  alta: {
    tipos: ['pago', 'stock'],
    color: 'red',
    icono: 'alert-triangle',
  },
  media: {
    tipos: ['pedido', 'recordatorio'],
    color: 'yellow',
    icono: 'alert-circle',
  },
  baja: {
    tipos: ['promocion', 'bienvenida', 'sistema', 'general'],
    color: 'green',
    icono: 'info',
  },
};

/**
 * Enum para tipos de ordenamiento
 */
export enum TipoOrdenamientoNotificacion {
  FECHA_CREACION = 'created_at',
  FECHA_ACTUALIZACION = 'updated_at',
  TITULO = 'titulo',
  TIPO = 'tipo',
  ESTADO_LECTURA = 'leido',
}

/**
 * Enum para direcciones de ordenamiento
 */
export enum DireccionOrdenamientoNotificacion {
  ASCENDENTE = 'asc',
  DESCENDENTE = 'desc',
}

/**
 * Utilidades para trabajar con notificaciones
 */
export class NotificacionUtils {
  /**
   * Obtiene la configuración de un tipo de notificación
   */
  static getTipoConfig(tipo: TipoNotificacion): TipoDetalladoNotificacion {
    return TIPOS_NOTIFICACION_CONFIG[tipo] || TIPOS_NOTIFICACION_CONFIG.general;
  }

  /**
   * Determina la prioridad de una notificación basada en su tipo
   */
  static getPrioridad(tipo: TipoNotificacion): PrioridadNotificacion {
    for (const [prioridad, config] of Object.entries(PRIORIDADES_CONFIG)) {
      if (config.tipos.includes(tipo)) {
        return prioridad as PrioridadNotificacion;
      }
    }
    return 'baja';
  }

  /**
   * Verifica si una notificación requiere acción
   */
  static requiereAccion(notificacion: Notificacion): boolean {
    const tiposQueRequierenAccion: TipoNotificacion[] = [
      'pago',
      'pedido',
      'stock',
      'recordatorio',
    ];
    return (
      tiposQueRequierenAccion.includes(notificacion.tipo) && !notificacion.leido
    );
  }

  /**
   * Verifica si una notificación puede eliminarse
   */
  static puedeEliminarse(notificacion: Notificacion): boolean {
    const tiposNoEliminables: TipoNotificacion[] = ['admin', 'sistema'];
    return !tiposNoEliminables.includes(notificacion.tipo);
  }

  /**
   * Formatea el tiempo transcurrido
   */
  static formatearTiempoTranscurrido(fechaCreacion: string): string {
    const fecha = new Date(fechaCreacion);
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();

    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const semanas = Math.floor(dias / 7);

    if (minutos < 60) return `hace ${minutos} minutos`;
    if (horas < 24) return `hace ${horas} horas`;
    if (dias < 7) return `hace ${dias} días`;
    if (semanas < 4) return `hace ${semanas} semanas`;
    return `hace ${Math.floor(dias / 30)} meses`;
  }

  /**
   * Verifica si una notificación es reciente
   */
  static esReciente(fechaCreacion: string, horasLimite: number = 24): boolean {
    const fecha = new Date(fechaCreacion);
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const horas = diferencia / (1000 * 60 * 60);
    return horas <= horasLimite;
  }

  /**
   * Calcula los días de antigüedad
   */
  static calcularDiasAntiguedad(fechaCreacion: string): number {
    const fecha = new Date(fechaCreacion);
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  }

  /**
   * Obtiene el color CSS para un tipo de notificación
   */
  static getColorTipo(tipo: TipoNotificacion): string {
    const config = NotificacionUtils.getTipoConfig(tipo);
    const colorMap: Record<string, string> = {
      blue: 'text-blue-600 bg-blue-100',
      orange: 'text-orange-600 bg-orange-100',
      purple: 'text-purple-600 bg-purple-100',
      green: 'text-green-600 bg-green-100',
      indigo: 'text-indigo-600 bg-indigo-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      gray: 'text-gray-600 bg-gray-100',
      red: 'text-red-600 bg-red-100',
    };
    return colorMap[config.color] || colorMap['gray'];
  }

  /**
   * Obtiene el color CSS para una prioridad
   */
  static getColorPrioridad(prioridad: PrioridadNotificacion): string {
    const colorMap: Record<PrioridadNotificacion, string> = {
      alta: 'text-red-600 bg-red-100 border-red-200',
      media: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      baja: 'text-green-600 bg-green-100 border-green-200',
    };
    return colorMap[prioridad];
  }

  /**
   * Filtra notificaciones por criterios específicos
   */
  static filtrarNotificaciones(
    notificaciones: Notificacion[],
    criterios: {
      leidas?: boolean;
      tipos?: TipoNotificacion[];
      prioridad?: PrioridadNotificacion;
      recientes?: boolean;
      requierenAccion?: boolean;
    }
  ): Notificacion[] {
    return notificaciones.filter((notificacion) => {
      if (
        criterios.leidas !== undefined &&
        notificacion.leido !== criterios.leidas
      ) {
        return false;
      }

      if (criterios.tipos && !criterios.tipos.includes(notificacion.tipo)) {
        return false;
      }

      if (
        criterios.prioridad &&
        NotificacionUtils.getPrioridad(notificacion.tipo) !==
          criterios.prioridad
      ) {
        return false;
      }

      if (criterios.recientes && !notificacion.es_reciente) {
        return false;
      }

      if (
        criterios.requierenAccion &&
        !NotificacionUtils.requiereAccion(notificacion)
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Agrupa notificaciones por tipo
   */
  static agruparPorTipo(
    notificaciones: Notificacion[]
  ): Record<TipoNotificacion, Notificacion[]> {
    const grupos: Record<string, Notificacion[]> = {};

    notificaciones.forEach((notificacion) => {
      if (!grupos[notificacion.tipo]) {
        grupos[notificacion.tipo] = [];
      }
      grupos[notificacion.tipo].push(notificacion);
    });

    return grupos as Record<TipoNotificacion, Notificacion[]>;
  }

  /**
   * Calcula estadísticas básicas de una lista de notificaciones
   */
  static calcularEstadisticas(
    notificaciones: Notificacion[]
  ): ResumenNotificaciones {
    const total = notificaciones.length;
    const noLeidas = notificaciones.filter((n) => !n.leido).length;
    const leidas = notificaciones.filter((n) => n.leido).length;
    const recientes24h = notificaciones.filter((n) => n.es_reciente).length;
    const estaSemana = notificaciones.filter(
      (n) => n.dias_antiguedad <= 7
    ).length;
    const esteMes = notificaciones.filter(
      (n) => n.dias_antiguedad <= 30
    ).length;
    const requierenAccion = notificaciones.filter((n) =>
      NotificacionUtils.requiereAccion(n)
    ).length;

    return {
      total,
      no_leidas: noLeidas,
      leidas,
      recientes_24h: recientes24h,
      esta_semana: estaSemana,
      este_mes: esteMes,
      requieren_accion: requierenAccion,
    };
  }

  /**
   * Valida los datos de una notificación
   */
  static validarNotificacion(
    data: Partial<CreateNotificacionDto>
  ): NotificacionValidation {
    const errors: string[] = [];
    const validation: NotificacionValidation = {
      user_id: false,
      titulo: false,
      mensaje: false,
      tipo: false,
      isValid: false,
      errors,
    };

    // Validar user_id
    if (!data.user_id || data.user_id <= 0) {
      errors.push('Debe especificar un usuario válido');
    } else {
      validation.user_id = true;
    }

    // Validar título
    if (!data.titulo || data.titulo.trim().length === 0) {
      errors.push('El título es obligatorio');
    } else if (data.titulo.length > NOTIFICACION_CONSTANTS.MAX_TITULO_LENGTH) {
      errors.push(
        `El título no puede exceder ${NOTIFICACION_CONSTANTS.MAX_TITULO_LENGTH} caracteres`
      );
    } else {
      validation.titulo = true;
    }

    // Validar mensaje
    if (!data.mensaje || data.mensaje.trim().length === 0) {
      errors.push('El mensaje es obligatorio');
    } else if (
      data.mensaje.length > NOTIFICACION_CONSTANTS.MAX_MENSAJE_LENGTH
    ) {
      errors.push(
        `El mensaje no puede exceder ${NOTIFICACION_CONSTANTS.MAX_MENSAJE_LENGTH} caracteres`
      );
    } else {
      validation.mensaje = true;
    }

    // Validar tipo
    if (!data.tipo) {
      errors.push('El tipo de notificación es obligatorio');
    } else if (!Object.keys(TIPOS_NOTIFICACION_CONFIG).includes(data.tipo)) {
      errors.push('El tipo de notificación no es válido');
    } else {
      validation.tipo = true;
    }

    validation.isValid =
      validation.user_id &&
      validation.titulo &&
      validation.mensaje &&
      validation.tipo;

    return validation;
  }
}
