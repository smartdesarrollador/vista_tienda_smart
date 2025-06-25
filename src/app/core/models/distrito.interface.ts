export interface Distrito {
  id: number;
  provincia_id: number;
  nombre: string;
  codigo: string;
  codigo_inei: string | null;
  codigo_postal: string | null;
  latitud: number | null;
  longitud: number | null;
  activo: boolean;
  disponible_delivery: boolean;
  limites_geograficos: any | null;
  created_at: string;
  updated_at: string;
  coordenadas: Coordenadas | null;
  provincia?: ProvinciaBasica;
  zonas_reparto?: ZonaRepartoBasica[];
  ubicacion_completa?: string;
  estadisticas: EstadisticasDistrito;
  distancia_km?: number; // Para búsquedas por coordenadas
}

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface ProvinciaBasica {
  id: number;
  nombre: string;
  codigo: string;
  activo?: boolean;
  departamento?: DepartamentoBasico;
}

export interface DepartamentoBasico {
  id: number;
  nombre: string;
  codigo: string;
  activo?: boolean;
}

export interface ZonaRepartoBasica {
  id: number;
  nombre: string;
  activo: boolean;
  costo_envio: number;
  tiempo_entrega_min: number;
  tiempo_entrega_max: number;
}

export interface EstadisticasDistrito {
  zonas_reparto_activas?: number;
}

export interface CreateDistritoRequest {
  provincia_id: number;
  nombre: string;
  codigo: string;
  codigo_inei?: string;
  codigo_postal?: string;
  latitud?: number;
  longitud?: number;
  limites_geograficos?: any;
  activo?: boolean;
  disponible_delivery?: boolean;
}

export interface UpdateDistritoRequest extends Partial<CreateDistritoRequest> {
  id: number;
}

export interface DistritoFilters {
  search?: string;
  provincia_id?: number;
  departamento_id?: number;
  activo?: boolean;
  disponible_delivery?: boolean;
  codigo?: string;
  codigo_inei?: string;
  codigo_postal?: string;
  pais?: string;
  con_coordenadas?: boolean;
  with_provincia?: boolean;
  with_departamento?: boolean;
  with_zonas_reparto?: boolean;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
  paginate?: boolean;
}

export interface DistritoPorProvinciaRequest {
  activo?: boolean;
  disponible_delivery?: boolean;
}

export interface DistritoPorProvinciaResponse {
  data: Distrito[];
  provincia: {
    id: number;
    nombre: string;
    codigo: string;
    activo: boolean;
  };
  total: number;
  activos: number;
  con_delivery: number;
}

export interface DistritosDisponiblesDeliveryResponse {
  data: Distrito[];
  total: number;
  por_provincia: ProvinciasConDistritos[];
}

export interface ProvinciasConDistritos {
  provincia_id: number;
  provincia_nombre: string;
  total_distritos: number;
}

export interface BuscarPorCoordenadasRequest {
  latitud: number;
  longitud: number;
  radio_km?: number;
}

export interface BuscarPorCoordenadasResponse {
  data: Distrito[];
  coordenadas_busqueda: {
    latitud: number;
    longitud: number;
    radio_km: number;
  };
  total_encontrados: number;
}

export interface EstadisticasDistritoGeneral {
  total_distritos: number;
  distritos_activos: number;
  distritos_inactivos: number;
  disponibles_delivery: number;
  no_disponibles_delivery: number;
  con_coordenadas: number;
  sin_coordenadas: number;
  por_provincia: ProvinciaDistrito[];
  con_zonas_reparto: number;
  sin_zonas_reparto: number;
}

export interface ProvinciaDistrito {
  provincia_id: number;
  provincia_nombre: string;
  total_distritos: number;
}

export interface EstadisticasDistritoRequest {
  provincia_id?: number;
  departamento_id?: number;
}

export interface DistritoResponse {
  data: Distrito;
}

export interface DistritoListResponse {
  data: Distrito[];
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

export interface DistritoSimpleListResponse {
  data: Distrito[];
  meta: {
    total: number;
  };
}

export interface EstadisticasDistritoResponse {
  estadisticas: EstadisticasDistritoGeneral;
  filtros?: {
    provincia_id?: number;
    departamento_id?: number;
  };
}

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export interface DistritoErrorResponse {
  message: string;
  error?: string;
  zonas_reparto_count?: number;
  provincia?: string;
  departamento?: string;
}

// Tipos para validación y formularios
export interface DistritoFormData {
  provincia_id: number;
  nombre: string;
  codigo: string;
  codigo_inei: string;
  codigo_postal: string;
  latitud: number | null;
  longitud: number | null;
  limites_geograficos: any;
  activo: boolean;
  disponible_delivery: boolean;
}

// Constantes para validación
export const DISTRITO_VALIDATION = {
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
  CODIGO_POSTAL: {
    MAX_LENGTH: 10,
  },
  LATITUD: {
    MIN: -90,
    MAX: 90,
  },
  LONGITUD: {
    MIN: -180,
    MAX: 180,
  },
  RADIO_BUSQUEDA: {
    MIN: 0.1,
    MAX: 100,
  },
} as const;

// Opciones de ordenamiento
export const DISTRITO_SORT_OPTIONS = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'codigo', label: 'Código' },
  { value: 'codigo_inei', label: 'Código INEI' },
  { value: 'codigo_postal', label: 'Código Postal' },
  { value: 'activo', label: 'Estado' },
  { value: 'disponible_delivery', label: 'Disponible Delivery' },
  { value: 'created_at', label: 'Fecha de Creación' },
  { value: 'updated_at', label: 'Última Actualización' },
] as const;

// Mensajes de error
export const DISTRITO_ERROR_MESSAGES = {
  NOMBRE_REQUERIDO: 'El nombre del distrito es requerido',
  NOMBRE_MIN_LENGTH: `El nombre debe tener al menos ${DISTRITO_VALIDATION.NOMBRE.MIN_LENGTH} caracteres`,
  NOMBRE_MAX_LENGTH: `El nombre no puede exceder ${DISTRITO_VALIDATION.NOMBRE.MAX_LENGTH} caracteres`,
  CODIGO_REQUERIDO: 'El código del distrito es requerido',
  CODIGO_MIN_LENGTH: `El código debe tener al menos ${DISTRITO_VALIDATION.CODIGO.MIN_LENGTH} caracteres`,
  CODIGO_MAX_LENGTH: `El código no puede exceder ${DISTRITO_VALIDATION.CODIGO.MAX_LENGTH} caracteres`,
  CODIGO_UNICO: 'Ya existe un distrito con este código',
  CODIGO_INEI_UNICO: 'Ya existe un distrito con este código INEI',
  CODIGO_INEI_MAX_LENGTH: `El código INEI no puede exceder ${DISTRITO_VALIDATION.CODIGO_INEI.MAX_LENGTH} caracteres`,
  CODIGO_POSTAL_MAX_LENGTH: `El código postal no puede exceder ${DISTRITO_VALIDATION.CODIGO_POSTAL.MAX_LENGTH} caracteres`,
  PROVINCIA_REQUERIDA: 'La provincia es requerida',
  PROVINCIA_NO_EXISTE: 'La provincia seleccionada no existe',
  PROVINCIA_INACTIVA: 'No se puede crear un distrito en una provincia inactiva',
  DEPARTAMENTO_INACTIVO:
    'No se puede crear un distrito en un departamento inactivo',
  LATITUD_RANGO: `La latitud debe estar entre ${DISTRITO_VALIDATION.LATITUD.MIN} y ${DISTRITO_VALIDATION.LATITUD.MAX} grados`,
  LONGITUD_RANGO: `La longitud debe estar entre ${DISTRITO_VALIDATION.LONGITUD.MIN} y ${DISTRITO_VALIDATION.LONGITUD.MAX} grados`,
  COORDENADAS_COMPLETAS:
    'Debe proporcionar tanto latitud como longitud, o ninguna de las dos',
  LIMITES_GEOGRAFICOS_JSON: 'Los límites geográficos deben ser un JSON válido',
  DISTRITO_NO_ENCONTRADO: 'Distrito no encontrado',
  ERROR_ELIMINAR_CON_ZONAS:
    'No se puede eliminar el distrito porque tiene zonas de reparto asociadas',
  ERROR_ACTIVAR_PROVINCIA_INACTIVA:
    'No se puede activar el distrito porque la provincia está inactiva',
  ERROR_ACTIVAR_DEPARTAMENTO_INACTIVO:
    'No se puede activar el distrito porque el departamento está inactivo',
  ERROR_DELIVERY_DISTRITO_INACTIVO:
    'No se puede activar delivery en un distrito inactivo',
  ERROR_MOVER_PROVINCIA_INACTIVA:
    'No se puede mover el distrito a una provincia inactiva',
  ERROR_MOVER_DEPARTAMENTO_INACTIVO:
    'No se puede mover el distrito a un departamento inactivo',
} as const;

// Mensajes de éxito
export const DISTRITO_SUCCESS_MESSAGES = {
  CREADO: 'Distrito creado exitosamente',
  ACTUALIZADO: 'Distrito actualizado exitosamente',
  ELIMINADO: 'Distrito eliminado exitosamente',
  ESTADO_CAMBIADO: 'Estado del distrito cambiado exitosamente',
  DELIVERY_CAMBIADO: 'Disponibilidad de delivery cambiada exitosamente',
} as const;

// Tipos de datos para TypeScript
export type DistritoSortOption =
  (typeof DISTRITO_SORT_OPTIONS)[number]['value'];
export type SortDirection = 'asc' | 'desc';

// Funciones de utilidad
export const getDistritoStatusText = (distrito: Distrito): string => {
  return distrito.activo ? 'Activo' : 'Inactivo';
};

export const getDistritoStatusColor = (distrito: Distrito): string => {
  return distrito.activo
    ? 'text-green-600 bg-green-100'
    : 'text-red-600 bg-red-100';
};

export const getDistritoDeliveryText = (distrito: Distrito): string => {
  return distrito.disponible_delivery ? 'Disponible' : 'No disponible';
};

export const getDistritoDeliveryColor = (distrito: Distrito): string => {
  return distrito.disponible_delivery
    ? 'text-blue-600 bg-blue-100'
    : 'text-gray-600 bg-gray-100';
};

export const formatCodigoIneiDistrito = (codigoInei: string | null): string => {
  return codigoInei || 'No asignado';
};

export const formatCodigoPostal = (codigoPostal: string | null): string => {
  return codigoPostal || 'No asignado';
};

export const getDistritoDisplayName = (distrito: Distrito): string => {
  return `${distrito.nombre} (${distrito.codigo})`;
};

export const getDistritoFullName = (distrito: Distrito): string => {
  if (distrito.provincia) {
    const provincia = distrito.provincia.nombre;
    const departamento = distrito.provincia.departamento?.nombre;

    if (departamento) {
      return `${distrito.nombre}, ${provincia}, ${departamento}`;
    }
    return `${distrito.nombre}, ${provincia}`;
  }
  return distrito.nombre;
};

export const getDistritoUbicacionCompleta = (distrito: Distrito): string => {
  if (distrito.ubicacion_completa) {
    return distrito.ubicacion_completa;
  }

  const parts = [
    distrito.nombre,
    distrito.provincia?.nombre,
    distrito.provincia?.departamento?.nombre,
    'Perú',
  ].filter(Boolean);

  return parts.join(', ');
};

export const hasCoordinates = (distrito: Distrito): boolean => {
  return distrito.latitud !== null && distrito.longitud !== null;
};

export const getCoordinatesDisplay = (distrito: Distrito): string => {
  if (!hasCoordinates(distrito)) {
    return 'Sin coordenadas';
  }
  return `${distrito.latitud}, ${distrito.longitud}`;
};

export const canDeleteDistrito = (distrito: Distrito): boolean => {
  // Un distrito puede eliminarse si no tiene zonas de reparto asociadas
  return !distrito.zonas_reparto || distrito.zonas_reparto.length === 0;
};

export const canActivateDistrito = (distrito: Distrito): boolean => {
  // Un distrito puede activarse si la provincia y departamento están activos
  if (!distrito.provincia) return false;

  const provinciaActiva = distrito.provincia.activo !== false; // Asumimos activo si no está definido
  const departamentoActivo = distrito.provincia.departamento?.activo !== false;

  return provinciaActiva && departamentoActivo;
};

export const canActivateDelivery = (distrito: Distrito): boolean => {
  // El delivery puede activarse solo si el distrito está activo
  return distrito.activo;
};

export const getDistritoEstadisticas = (distrito: Distrito): string => {
  if (!distrito.zonas_reparto) return 'Sin datos';

  const totalZonas = distrito.zonas_reparto.length;
  const zonasActivas = distrito.zonas_reparto.filter((z) => z.activo).length;

  return `${zonasActivas}/${totalZonas} zonas activas`;
};

export const getDistritoEstadisticasResumidas = (
  distrito: Distrito
): string => {
  if (!distrito.estadisticas.zonas_reparto_activas) return 'Sin zonas';

  return `${distrito.estadisticas.zonas_reparto_activas} zonas activas`;
};

export const isProvinciaActiva = (distrito: Distrito): boolean => {
  return distrito.provincia ? distrito.provincia.activo !== false : false;
};

export const isDepartamentoActivo = (distrito: Distrito): boolean => {
  return distrito.provincia?.departamento
    ? distrito.provincia.departamento.activo !== false
    : false;
};

export const getDistritoCodigoCompleto = (distrito: Distrito): string => {
  if (distrito.provincia) {
    const provinciaCode = distrito.provincia.codigo;
    const departamentoCode = distrito.provincia.departamento?.codigo;

    if (departamentoCode) {
      return `${departamentoCode}-${provinciaCode}-${distrito.codigo}`;
    }
    return `${provinciaCode}-${distrito.codigo}`;
  }
  return distrito.codigo;
};

export const validateDistritoCanBeActivated = (
  distrito: Distrito
): { canActivate: boolean; reason?: string } => {
  if (!distrito.provincia) {
    return { canActivate: false, reason: 'Provincia no disponible' };
  }

  if (distrito.provincia.activo === false) {
    return { canActivate: false, reason: 'La provincia está inactiva' };
  }

  if (distrito.provincia.departamento?.activo === false) {
    return { canActivate: false, reason: 'El departamento está inactivo' };
  }

  return { canActivate: true };
};

export const validateDistritoCanBeDeleted = (
  distrito: Distrito
): { canDelete: boolean; reason?: string } => {
  if (distrito.zonas_reparto && distrito.zonas_reparto.length > 0) {
    return {
      canDelete: false,
      reason: `Tiene ${distrito.zonas_reparto.length} zona(s) de reparto asociada(s)`,
    };
  }

  if (
    distrito.estadisticas.zonas_reparto_activas &&
    distrito.estadisticas.zonas_reparto_activas > 0
  ) {
    return {
      canDelete: false,
      reason: `Tiene ${distrito.estadisticas.zonas_reparto_activas} zona(s) de reparto activa(s)`,
    };
  }

  return { canDelete: true };
};

export const validateDeliveryCanBeActivated = (
  distrito: Distrito
): { canActivate: boolean; reason?: string } => {
  if (!distrito.activo) {
    return { canActivate: false, reason: 'El distrito debe estar activo' };
  }

  return { canActivate: true };
};

export const getDistritoSearchableText = (distrito: Distrito): string => {
  const searchableFields = [
    distrito.nombre,
    distrito.codigo,
    distrito.codigo_inei,
    distrito.codigo_postal,
    distrito.provincia?.nombre,
    distrito.provincia?.departamento?.nombre,
  ].filter(Boolean);

  return searchableFields.join(' ').toLowerCase();
};

export const sortDistritosByProvincia = (distritos: Distrito[]): Distrito[] => {
  return [...distritos].sort((a, b) => {
    // Primero por departamento
    const deptA = a.provincia?.departamento?.nombre || '';
    const deptB = b.provincia?.departamento?.nombre || '';

    if (deptA !== deptB) {
      return deptA.localeCompare(deptB);
    }

    // Luego por provincia
    const provA = a.provincia?.nombre || '';
    const provB = b.provincia?.nombre || '';

    if (provA !== provB) {
      return provA.localeCompare(provB);
    }

    // Finalmente por nombre de distrito
    return a.nombre.localeCompare(b.nombre);
  });
};

export const groupDistritosByProvincia = (
  distritos: Distrito[]
): Record<string, Distrito[]> => {
  return distritos.reduce((groups, distrito) => {
    const provinciaKey = distrito.provincia
      ? `${distrito.provincia.id}-${distrito.provincia.nombre}`
      : 'sin-provincia';

    if (!groups[provinciaKey]) {
      groups[provinciaKey] = [];
    }

    groups[provinciaKey].push(distrito);
    return groups;
  }, {} as Record<string, Distrito[]>);
};

export const groupDistritosByDepartamento = (
  distritos: Distrito[]
): Record<string, Distrito[]> => {
  return distritos.reduce((groups, distrito) => {
    const departamentoKey = distrito.provincia?.departamento
      ? `${distrito.provincia.departamento.id}-${distrito.provincia.departamento.nombre}`
      : 'sin-departamento';

    if (!groups[departamentoKey]) {
      groups[departamentoKey] = [];
    }

    groups[departamentoKey].push(distrito);
    return groups;
  }, {} as Record<string, Distrito[]>);
};

export const getDistritosByEstado = (
  distritos: Distrito[],
  activo: boolean
): Distrito[] => {
  return distritos.filter((distrito) => distrito.activo === activo);
};

export const getDistritosConDelivery = (distritos: Distrito[]): Distrito[] => {
  return distritos.filter((distrito) => distrito.disponible_delivery);
};

export const getDistritosConCoordenadas = (
  distritos: Distrito[]
): Distrito[] => {
  return distritos.filter((distrito) => hasCoordinates(distrito));
};

export const getDistritosSinCoordenadas = (
  distritos: Distrito[]
): Distrito[] => {
  return distritos.filter((distrito) => !hasCoordinates(distrito));
};

export const getDistritosConZonasReparto = (
  distritos: Distrito[]
): Distrito[] => {
  return distritos.filter(
    (distrito) =>
      (distrito.zonas_reparto && distrito.zonas_reparto.length > 0) ||
      (distrito.estadisticas.zonas_reparto_activas &&
        distrito.estadisticas.zonas_reparto_activas > 0)
  );
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const findNearestDistritos = (
  distritos: Distrito[],
  targetLat: number,
  targetLon: number,
  maxDistance: number = 10
): Distrito[] => {
  return distritos
    .filter((distrito) => hasCoordinates(distrito))
    .map((distrito) => ({
      ...distrito,
      distancia_km: calculateDistance(
        targetLat,
        targetLon,
        distrito.latitud!,
        distrito.longitud!
      ),
    }))
    .filter((distrito) => distrito.distancia_km! <= maxDistance)
    .sort((a, b) => a.distancia_km! - b.distancia_km!);
};

export const validateCoordinates = (
  latitud: number | null,
  longitud: number | null
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Ambas deben estar presentes o ambas ausentes
  if (
    (latitud !== null && longitud === null) ||
    (latitud === null && longitud !== null)
  ) {
    errors.push(DISTRITO_ERROR_MESSAGES.COORDENADAS_COMPLETAS);
  }

  // Validar rangos si están presentes
  if (latitud !== null) {
    if (
      latitud < DISTRITO_VALIDATION.LATITUD.MIN ||
      latitud > DISTRITO_VALIDATION.LATITUD.MAX
    ) {
      errors.push(DISTRITO_ERROR_MESSAGES.LATITUD_RANGO);
    }
  }

  if (longitud !== null) {
    if (
      longitud < DISTRITO_VALIDATION.LONGITUD.MIN ||
      longitud > DISTRITO_VALIDATION.LONGITUD.MAX
    ) {
      errors.push(DISTRITO_ERROR_MESSAGES.LONGITUD_RANGO);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const formatDistanceDisplay = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

export const getDistritoIcon = (distrito: Distrito): string => {
  if (!distrito.activo) return 'map-pin-off';
  if (distrito.disponible_delivery) return 'truck';
  return 'map-pin';
};

export const getDistritoIconColor = (distrito: Distrito): string => {
  if (!distrito.activo) return 'text-gray-400';
  if (distrito.disponible_delivery) return 'text-blue-600';
  return 'text-green-600';
};
