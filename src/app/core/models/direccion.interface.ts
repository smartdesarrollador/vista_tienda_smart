/**
 * Interfaz para representar una dirección de usuario
 * Basada en la tabla 'direcciones' y respuesta del API
 */
export interface Direccion {
  id: number;
  user_id: number;
  direccion: string;
  referencia?: string;
  distrito: string;
  provincia: string;
  departamento: string;
  pais: string;
  codigo_postal?: string;
  predeterminada: boolean;
  created_at: string;
  updated_at: string;
  direccion_completa?: string;
  ubicacion?: UbicacionDireccion;
  usuario?: UsuarioDireccion;
}

/**
 * Interfaz para la ubicación geográfica de una dirección
 */
export interface UbicacionDireccion {
  distrito: string;
  provincia: string;
  departamento: string;
  pais: string;
}

/**
 * Interfaz para los datos del usuario asociado a la dirección
 */
export interface UsuarioDireccion {
  id: number;
  name: string;
  email: string;
  telefono?: string;
  dni?: string;
}

/**
 * DTO para crear una nueva dirección
 */
export interface CreateDireccionDto {
  user_id: number;
  direccion: string;
  referencia?: string;
  distrito: string;
  provincia: string;
  departamento: string;
  pais?: string;
  codigo_postal?: string;
  predeterminada?: boolean;
}

/**
 * DTO para actualizar una dirección existente
 */
export interface UpdateDireccionDto {
  direccion?: string;
  referencia?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  pais?: string;
  codigo_postal?: string;
  predeterminada?: boolean;
}

/**
 * Interfaz para filtros de búsqueda de direcciones
 */
export interface DireccionFilters {
  user_id?: number;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  pais?: string;
  predeterminada?: boolean;
  search?: string;
  sort_field?:
    | 'id'
    | 'direccion'
    | 'distrito'
    | 'provincia'
    | 'departamento'
    | 'pais'
    | 'predeterminada'
    | 'created_at';
  sort_direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

/**
 * Interfaz para la respuesta paginada de direcciones
 */
export interface DireccionResponse {
  success: boolean;
  data: Direccion[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  message: string;
}

/**
 * Interfaz para la respuesta de una sola dirección
 */
export interface DireccionSingleResponse {
  success: boolean;
  data: Direccion;
  message: string;
}

/**
 * Interfaz para la respuesta de direcciones por usuario
 */
export interface DireccionesByUsuarioResponse {
  success: boolean;
  data: Direccion[];
  resumen: {
    total_direcciones: number;
    direccion_predeterminada?: number;
    distribución_geografica: {
      departamentos: Record<string, number>;
      provincias: Record<string, number>;
      distritos: Record<string, number>;
    };
  };
  usuario: {
    id: number;
    name: string;
    email: string;
    telefono?: string;
  };
  message: string;
}

/**
 * Interfaz para estadísticas de direcciones
 */
export interface EstadisticasDirecciones {
  success: boolean;
  data: {
    resumen_general: {
      total_direcciones: number;
      direcciones_predeterminadas: number;
      usuarios_con_direcciones: number;
      promedio_direcciones_por_usuario: number;
    };
    distribucion_geografica: {
      por_departamento: Array<{ departamento: string; total: number }>;
      por_provincia: Array<{ provincia: string; total: number }>;
      por_distrito: Array<{ distrito: string; total: number }>;
    };
    usuarios_con_mas_direcciones: Array<{
      user_id: number;
      nombre: string;
      email: string;
      total_direcciones: number;
    }>;
    tendencia_mensual: Array<{
      periodo: string;
      total_direcciones: number;
    }>;
  };
  message: string;
}

/**
 * Interfaz para respuesta de operaciones simples (crear, actualizar, eliminar)
 */
export interface DireccionOperationResponse {
  success: boolean;
  data?: Direccion;
  message: string;
  error?: string;
}

/**
 * Enum para los países soportados
 */
export enum PaisEnum {
  PERU = 'Perú',
  COLOMBIA = 'Colombia',
  ECUADOR = 'Ecuador',
  BOLIVIA = 'Bolivia',
  CHILE = 'Chile',
}

/**
 * Interfaz para validación de dirección
 */
export interface DireccionValidation {
  direccion: boolean;
  distrito: boolean;
  provincia: boolean;
  departamento: boolean;
  pais: boolean;
  isValid: boolean;
  errors: string[];
}
