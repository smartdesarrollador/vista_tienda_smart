export interface Provincia {
  id: number;
  departamento_id: number;
  nombre: string;
  codigo: string;
  codigo_inei: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  departamento?: DepartamentoBasico;
  distritos?: DistritoBasico[];
  estadisticas: EstadisticasProvincia;
}

export interface DepartamentoBasico {
  id: number;
  nombre: string;
  codigo: string;
  pais: string;
  activo?: boolean;
}

export interface DistritoBasico {
  id: number;
  nombre: string;
  codigo: string;
  activo: boolean;
  disponible_delivery: boolean;
}

export interface EstadisticasProvincia {
  total_distritos?: number;
  distritos_activos?: number;
  distritos_con_delivery?: number;
}

export interface CreateProvinciaRequest {
  departamento_id: number;
  nombre: string;
  codigo: string;
  codigo_inei?: string;
  activo?: boolean;
}

export interface UpdateProvinciaRequest
  extends Partial<CreateProvinciaRequest> {
  id: number;
}

export interface ProvinciaFilters {
  search?: string;
  departamento_id?: number;
  activo?: boolean;
  codigo?: string;
  codigo_inei?: string;
  pais?: string;
  with_departamento?: boolean;
  with_distritos?: boolean;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
  paginate?: boolean;
}

export interface ProvinciaPorDepartamentoRequest {
  activo?: boolean;
  with_distritos?: boolean;
}

export interface ProvinciaPorDepartamentoResponse {
  data: Provincia[];
  departamento: {
    id: number;
    nombre: string;
    codigo: string;
    activo: boolean;
  };
  total: number;
  activas: number;
}

export interface EstadisticasProvinciaGeneral {
  total_provincias: number;
  provincias_activas: number;
  provincias_inactivas: number;
  por_departamento: DepartamentoProvincia[];
  con_distritos: number;
  sin_distritos: number;
  total_distritos: number;
}

export interface DepartamentoProvincia {
  departamento_id: number;
  departamento_nombre: string;
  total_provincias: number;
}

export interface EstadisticasProvinciaRequest {
  departamento_id?: number;
}

export interface ProvinciaResponse {
  data: Provincia;
}

export interface ProvinciaListResponse {
  data: Provincia[];
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

export interface ProvinciaSimpleListResponse {
  data: Provincia[];
  meta: {
    total: number;
  };
}

export interface EstadisticasProvinciaResponse {
  estadisticas: EstadisticasProvinciaGeneral;
  filtros?: {
    departamento_id?: number;
  };
}

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export interface ProvinciaErrorResponse {
  message: string;
  error?: string;
  distritos_count?: number;
  departamento?: string;
}

// Tipos para validación y formularios
export interface ProvinciaFormData {
  departamento_id: number;
  nombre: string;
  codigo: string;
  codigo_inei: string;
  activo: boolean;
}

// Constantes para validación
export const PROVINCIA_VALIDATION = {
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
} as const;

// Opciones de ordenamiento
export const PROVINCIA_SORT_OPTIONS = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'codigo', label: 'Código' },
  { value: 'codigo_inei', label: 'Código INEI' },
  { value: 'activo', label: 'Estado' },
  { value: 'created_at', label: 'Fecha de Creación' },
  { value: 'updated_at', label: 'Última Actualización' },
] as const;

// Mensajes de error
export const PROVINCIA_ERROR_MESSAGES = {
  NOMBRE_REQUERIDO: 'El nombre de la provincia es requerido',
  NOMBRE_MIN_LENGTH: `El nombre debe tener al menos ${PROVINCIA_VALIDATION.NOMBRE.MIN_LENGTH} caracteres`,
  NOMBRE_MAX_LENGTH: `El nombre no puede exceder ${PROVINCIA_VALIDATION.NOMBRE.MAX_LENGTH} caracteres`,
  CODIGO_REQUERIDO: 'El código de la provincia es requerido',
  CODIGO_MIN_LENGTH: `El código debe tener al menos ${PROVINCIA_VALIDATION.CODIGO.MIN_LENGTH} caracteres`,
  CODIGO_MAX_LENGTH: `El código no puede exceder ${PROVINCIA_VALIDATION.CODIGO.MAX_LENGTH} caracteres`,
  CODIGO_UNICO: 'Ya existe una provincia con este código',
  CODIGO_INEI_UNICO: 'Ya existe una provincia con este código INEI',
  CODIGO_INEI_MAX_LENGTH: `El código INEI no puede exceder ${PROVINCIA_VALIDATION.CODIGO_INEI.MAX_LENGTH} caracteres`,
  DEPARTAMENTO_REQUERIDO: 'El departamento es requerido',
  DEPARTAMENTO_NO_EXISTE: 'El departamento seleccionado no existe',
  DEPARTAMENTO_INACTIVO:
    'No se puede crear una provincia en un departamento inactivo',
  PROVINCIA_NO_ENCONTRADA: 'Provincia no encontrada',
  ERROR_ELIMINAR_CON_DISTRITOS:
    'No se puede eliminar la provincia porque tiene distritos asociados',
  ERROR_ACTIVAR_DEPARTAMENTO_INACTIVO:
    'No se puede activar la provincia porque el departamento está inactivo',
  ERROR_MOVER_DEPARTAMENTO_INACTIVO:
    'No se puede mover la provincia a un departamento inactivo',
} as const;

// Mensajes de éxito
export const PROVINCIA_SUCCESS_MESSAGES = {
  CREADA: 'Provincia creada exitosamente',
  ACTUALIZADA: 'Provincia actualizada exitosamente',
  ELIMINADA: 'Provincia eliminada exitosamente',
  ESTADO_CAMBIADO: 'Estado de la provincia cambiado exitosamente',
} as const;

// Tipos de datos para TypeScript
export type ProvinciaSortOption =
  (typeof PROVINCIA_SORT_OPTIONS)[number]['value'];
export type SortDirection = 'asc' | 'desc';

// Funciones de utilidad
export const getProvinciaStatusText = (provincia: Provincia): string => {
  return provincia.activo ? 'Activa' : 'Inactiva';
};

export const getProvinciaStatusColor = (provincia: Provincia): string => {
  return provincia.activo
    ? 'text-green-600 bg-green-100'
    : 'text-red-600 bg-red-100';
};

export const formatCodigoInei = (codigoInei: string | null): string => {
  return codigoInei || 'No asignado';
};

export const getProvinciaDisplayName = (provincia: Provincia): string => {
  return `${provincia.nombre} (${provincia.codigo})`;
};

export const getProvinciaFullName = (provincia: Provincia): string => {
  if (provincia.departamento) {
    return `${provincia.nombre}, ${provincia.departamento.nombre}`;
  }
  return provincia.nombre;
};

export const canDeleteProvincia = (provincia: Provincia): boolean => {
  // Una provincia puede eliminarse si no tiene distritos asociados
  return !provincia.distritos || provincia.distritos.length === 0;
};

export const canActivateProvincia = (provincia: Provincia): boolean => {
  // Una provincia puede activarse si el departamento está activo
  return provincia.departamento ? provincia.departamento.activo ?? true : true;
};

export const getProvinciaEstadisticas = (provincia: Provincia): string => {
  if (!provincia.distritos) return 'Sin datos';

  const totalDistritos = provincia.distritos.length;
  const distritosActivos = provincia.distritos.filter((d) => d.activo).length;
  const distritosConDelivery = provincia.distritos.filter(
    (d) => d.disponible_delivery
  ).length;

  return `${distritosActivos}/${totalDistritos} distritos activos, ${distritosConDelivery} con delivery`;
};

export const getProvinciaEstadisticasResumidas = (
  provincia: Provincia
): string => {
  if (!provincia.estadisticas.total_distritos) return 'Sin distritos';

  const total = provincia.estadisticas.total_distritos;
  const activos = provincia.estadisticas.distritos_activos || 0;
  const conDelivery = provincia.estadisticas.distritos_con_delivery || 0;

  return `${activos}/${total} activos, ${conDelivery} con delivery`;
};

export const isDepartamentoActivo = (provincia: Provincia): boolean => {
  return provincia.departamento
    ? provincia.departamento.activo ?? false
    : false;
};

export const getProvinciaCodigoCompleto = (provincia: Provincia): string => {
  if (provincia.departamento) {
    return `${provincia.departamento.codigo}-${provincia.codigo}`;
  }
  return provincia.codigo;
};

export const validateProvinciaCanBeActivated = (
  provincia: Provincia
): { canActivate: boolean; reason?: string } => {
  if (!provincia.departamento) {
    return { canActivate: false, reason: 'Departamento no disponible' };
  }

  if (!(provincia.departamento.activo ?? true)) {
    return { canActivate: false, reason: 'El departamento está inactivo' };
  }

  return { canActivate: true };
};

export const validateProvinciaCanBeDeleted = (
  provincia: Provincia
): { canDelete: boolean; reason?: string } => {
  if (provincia.distritos && provincia.distritos.length > 0) {
    return {
      canDelete: false,
      reason: `Tiene ${provincia.distritos.length} distrito(s) asociado(s)`,
    };
  }

  if (
    provincia.estadisticas.total_distritos &&
    provincia.estadisticas.total_distritos > 0
  ) {
    return {
      canDelete: false,
      reason: `Tiene ${provincia.estadisticas.total_distritos} distrito(s) asociado(s)`,
    };
  }

  return { canDelete: true };
};

export const getProvinciaSearchableText = (provincia: Provincia): string => {
  const searchableFields = [
    provincia.nombre,
    provincia.codigo,
    provincia.codigo_inei,
    provincia.departamento?.nombre,
    provincia.departamento?.codigo,
  ].filter(Boolean);

  return searchableFields.join(' ').toLowerCase();
};

export const sortProvinciasByDepartamento = (
  provincias: Provincia[]
): Provincia[] => {
  return [...provincias].sort((a, b) => {
    // Primero por departamento
    const deptA = a.departamento?.nombre || '';
    const deptB = b.departamento?.nombre || '';

    if (deptA !== deptB) {
      return deptA.localeCompare(deptB);
    }

    // Luego por nombre de provincia
    return a.nombre.localeCompare(b.nombre);
  });
};

export const groupProvinciasByDepartamento = (
  provincias: Provincia[]
): Record<string, Provincia[]> => {
  return provincias.reduce((groups, provincia) => {
    const departamentoNombre =
      provincia.departamento?.nombre || 'Sin departamento';

    if (!groups[departamentoNombre]) {
      groups[departamentoNombre] = [];
    }

    groups[departamentoNombre].push(provincia);
    return groups;
  }, {} as Record<string, Provincia[]>);
};

export const getProvinciasByEstado = (
  provincias: Provincia[],
  activo: boolean
): Provincia[] => {
  return provincias.filter((provincia) => provincia.activo === activo);
};

export const getProvinciasConDistritos = (
  provincias: Provincia[]
): Provincia[] => {
  return provincias.filter(
    (provincia) =>
      (provincia.distritos && provincia.distritos.length > 0) ||
      (provincia.estadisticas.total_distritos &&
        provincia.estadisticas.total_distritos > 0)
  );
};

export const getProvinciasConDelivery = (
  provincias: Provincia[]
): Provincia[] => {
  return provincias.filter(
    (provincia) =>
      provincia.estadisticas.distritos_con_delivery &&
      provincia.estadisticas.distritos_con_delivery > 0
  );
};
