export interface Departamento {
  id: number;
  nombre: string;
  codigo: string;
  codigo_inei: string | null;
  pais: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  estadisticas: EstadisticasDepartamento[];
  provincias?: Provincia[];
}

export interface Provincia {
  id: number;
  nombre: string;
  codigo: string;
  codigo_inei: string | null;
  departamento_id: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  distritos?: Distrito[];
}

export interface Distrito {
  id: number;
  nombre: string;
  codigo: string;
  codigo_inei: string | null;
  provincia_id: number;
  activo: boolean;
  disponible_delivery: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstadisticasDepartamento {
  total_provincias: number;
  provincias_activas: number;
  total_distritos: number;
  distritos_activos: number;
  distritos_con_delivery: number;
}

export interface CreateDepartamentoRequest {
  nombre: string;
  codigo: string;
  codigo_inei?: string;
  pais: string;
  activo?: boolean;
}

export interface UpdateDepartamentoRequest
  extends Partial<CreateDepartamentoRequest> {
  id: number;
}

export interface DepartamentoFilters {
  search?: string;
  activo?: boolean;
  pais?: string;
  codigo?: string;
  codigo_inei?: string;
  with_provincias?: boolean;
  with_distritos?: boolean;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
  paginate?: boolean;
}

export interface DepartamentoPorPaisRequest {
  pais: string;
  activo?: boolean;
  with_provincias?: boolean;
}

export interface DepartamentoPorPaisResponse {
  data: Departamento[];
  pais: string;
  total: number;
  activos: number;
}

export interface EstadisticasDepartamentoGeneral {
  total_departamentos: number;
  departamentos_activos: number;
  departamentos_inactivos: number;
  por_pais: PaisDepartamento[];
  con_provincias: number;
  sin_provincias: number;
  total_provincias: number;
  total_distritos: number;
}

export interface PaisDepartamento {
  pais: string;
  total: number;
}

export interface DepartamentoResponse {
  data: Departamento;
}

export interface DepartamentoListResponse {
  data: Departamento[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

export interface DepartamentoSimpleListResponse {
  data: Departamento[];
  meta: {
    total: number;
  };
}

export interface EstadisticasDepartamentoResponse {
  estadisticas: EstadisticasDepartamentoGeneral;
}

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export interface DepartamentoErrorResponse {
  message: string;
  error?: string;
  provincias_count?: number;
}

// Tipos para validación y formularios
export interface DepartamentoFormData {
  nombre: string;
  codigo: string;
  codigo_inei: string;
  pais: string;
  activo: boolean;
}

// Constantes para validación
export const DEPARTAMENTO_VALIDATION = {
  NOMBRE: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  CODIGO: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 10,
  },
  CODIGO_INEI: {
    MAX_LENGTH: 10,
  },
  PAIS: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
} as const;

// Opciones de ordenamiento
export const DEPARTAMENTO_SORT_OPTIONS = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'codigo', label: 'Código' },
  { value: 'codigo_inei', label: 'Código INEI' },
  { value: 'pais', label: 'País' },
  { value: 'activo', label: 'Estado' },
  { value: 'created_at', label: 'Fecha de Creación' },
  { value: 'updated_at', label: 'Última Actualización' },
] as const;

// Países disponibles (puede expandirse)
export const PAISES_DISPONIBLES = [
  { value: 'Perú', label: 'Perú' },
  { value: 'Colombia', label: 'Colombia' },
  { value: 'Ecuador', label: 'Ecuador' },
  { value: 'Bolivia', label: 'Bolivia' },
  { value: 'Chile', label: 'Chile' },
] as const;

// Mensajes de error
export const DEPARTAMENTO_ERROR_MESSAGES = {
  NOMBRE_REQUERIDO: 'El nombre del departamento es requerido',
  NOMBRE_MIN_LENGTH: `El nombre debe tener al menos ${DEPARTAMENTO_VALIDATION.NOMBRE.MIN_LENGTH} caracteres`,
  NOMBRE_MAX_LENGTH: `El nombre no puede exceder ${DEPARTAMENTO_VALIDATION.NOMBRE.MAX_LENGTH} caracteres`,
  CODIGO_REQUERIDO: 'El código del departamento es requerido',
  CODIGO_MIN_LENGTH: `El código debe tener al menos ${DEPARTAMENTO_VALIDATION.CODIGO.MIN_LENGTH} caracteres`,
  CODIGO_MAX_LENGTH: `El código no puede exceder ${DEPARTAMENTO_VALIDATION.CODIGO.MAX_LENGTH} caracteres`,
  CODIGO_UNICO: 'Ya existe un departamento con este código',
  CODIGO_INEI_UNICO: 'Ya existe un departamento con este código INEI',
  CODIGO_INEI_MAX_LENGTH: `El código INEI no puede exceder ${DEPARTAMENTO_VALIDATION.CODIGO_INEI.MAX_LENGTH} caracteres`,
  PAIS_REQUERIDO: 'El país es requerido',
  PAIS_MIN_LENGTH: `El país debe tener al menos ${DEPARTAMENTO_VALIDATION.PAIS.MIN_LENGTH} caracteres`,
  PAIS_MAX_LENGTH: `El país no puede exceder ${DEPARTAMENTO_VALIDATION.PAIS.MAX_LENGTH} caracteres`,
  DEPARTAMENTO_NO_ENCONTRADO: 'Departamento no encontrado',
  ERROR_ELIMINAR_CON_PROVINCIAS:
    'No se puede eliminar el departamento porque tiene provincias asociadas',
} as const;

// Mensajes de éxito
export const DEPARTAMENTO_SUCCESS_MESSAGES = {
  CREADO: 'Departamento creado exitosamente',
  ACTUALIZADO: 'Departamento actualizado exitosamente',
  ELIMINADO: 'Departamento eliminado exitosamente',
  ESTADO_CAMBIADO: 'Estado del departamento cambiado exitosamente',
} as const;

// Tipos de datos para TypeScript
export type DepartamentoSortOption =
  (typeof DEPARTAMENTO_SORT_OPTIONS)[number]['value'];
export type PaisDisponible = (typeof PAISES_DISPONIBLES)[number]['value'];
export type SortDirection = 'asc' | 'desc';

// Funciones de utilidad
export const getDepartamentoStatusText = (
  departamento: Departamento
): string => {
  return departamento.activo ? 'Activo' : 'Inactivo';
};

export const getDepartamentoStatusColor = (
  departamento: Departamento
): string => {
  return departamento.activo
    ? 'text-green-600 bg-green-100'
    : 'text-red-600 bg-red-100';
};

export const formatCodigoInei = (codigoInei: string | null): string => {
  return codigoInei || 'No asignado';
};

export const getDepartamentoDisplayName = (
  departamento: Departamento
): string => {
  return `${departamento.nombre} (${departamento.codigo})`;
};

export const canDeleteDepartamento = (departamento: Departamento): boolean => {
  // Un departamento puede eliminarse si no tiene provincias asociadas
  return !departamento.provincias || departamento.provincias.length === 0;
};

export const getDepartamentoEstadisticas = (
  departamento: Departamento
): string => {
  if (!departamento.provincias) return 'Sin datos';

  const totalProvincias = departamento.provincias.length;
  const provinciasActivas = departamento.provincias.filter(
    (p) => p.activo
  ).length;

  return `${provinciasActivas}/${totalProvincias} provincias activas`;
};
