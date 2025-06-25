export interface ClienteBasico {
  id: number;
  nombre_completo: string;
  dni: string;
  telefono: string;
  estado: string;
}

export interface TipoDocumentoInfo {
  nombre: string;
  descripcion: string;
  longitud: string | number;
  tipo_persona: string;
}

export interface DatosFacturacionComprobante {
  tipo_documento: string;
  numero_documento: string;
  nombre_facturacion: string;
  direccion_fiscal: string;
  [key: string]: unknown;
}

export interface DatosFacturacionResumen {
  tipo_persona: string;
  documento_descripcion: string;
  estado_texto: string;
  tiempo_registro: string;
}

export interface DatosFacturacion {
  id: number;
  cliente_id: number;

  // Información del documento
  tipo_documento: 'dni' | 'ruc' | 'pasaporte' | 'carnet_extranjeria';
  numero_documento: string;
  numero_documento_formateado: string;

  // Nombres y razón social
  nombre_facturacion: string;
  razon_social?: string;
  nombre_facturacion_completo: string;

  // Dirección fiscal
  direccion_fiscal: string;
  distrito_fiscal: string;
  provincia_fiscal: string;
  departamento_fiscal: string;
  codigo_postal_fiscal?: string;
  direccion_fiscal_completa: string;

  // Contacto
  telefono_fiscal?: string;
  email_facturacion?: string;

  // Estados
  predeterminado: boolean;
  activo: boolean;
  is_predeterminado: boolean;
  is_activo: boolean;

  // Datos empresariales
  contacto_empresa?: string;
  giro_negocio?: string;

  // Metadata adicional
  datos_adicionales?: Record<string, unknown>;

  // Accessors del modelo
  is_empresa: boolean;
  is_persona_natural: boolean;

  // Validaciones
  documento_valido: boolean;

  // Información del tipo de documento
  tipo_documento_info: TipoDocumentoInfo;

  // Cliente relacionado
  cliente?: ClienteBasico;

  // Timestamps
  created_at?: string;
  updated_at?: string;

  // Datos para facturación
  datos_facturacion_comprobante?: DatosFacturacionComprobante;

  // Información adicional contextual
  resumen?: DatosFacturacionResumen;
}

export interface CreateDatosFacturacionRequest {
  cliente_id: number;
  tipo_documento: 'dni' | 'ruc' | 'pasaporte' | 'carnet_extranjeria';
  numero_documento: string;
  nombre_facturacion: string;
  razon_social?: string;
  direccion_fiscal: string;
  distrito_fiscal: string;
  provincia_fiscal: string;
  departamento_fiscal: string;
  codigo_postal_fiscal?: string;
  telefono_fiscal?: string;
  email_facturacion?: string;
  predeterminado?: boolean;
  activo?: boolean;
  contacto_empresa?: string;
  giro_negocio?: string;
  datos_adicionales?: Record<string, unknown>;
}

export interface UpdateDatosFacturacionRequest
  extends Partial<CreateDatosFacturacionRequest> {
  // Todos los campos son opcionales para actualización
}

export interface DatosFacturacionFilters {
  page?: number;
  per_page?: number;
  cliente_id?: number;
  tipo_documento?: 'dni' | 'ruc' | 'pasaporte' | 'carnet_extranjeria';
  activo?: boolean;
  predeterminado?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
  departamento_fiscal?: string;
  provincia_fiscal?: string;
  buscar?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  sin_paginacion?: boolean;
}

export interface DatosFacturacionByClienteFilters {
  solo_activos?: boolean;
  solo_predeterminado?: boolean;
  tipo_documento?: 'dni' | 'ruc' | 'pasaporte' | 'carnet_extranjeria';
}

export interface DatosFacturacionListResponse {
  data: DatosFacturacion[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    filtros_aplicados?: Record<string, unknown>;
  };
  links: {
    first: string;
    last: string;
    prev?: string;
    next?: string;
  };
}

export interface DatosFacturacionCollectionResponse {
  data: DatosFacturacion[];
  meta: {
    total: number;
    filtros_aplicados?: Record<string, unknown>;
  };
}

export interface DatosFacturacionResponse {
  message?: string;
  data: DatosFacturacion;
}

export interface DatosFacturacionByClienteResponse {
  data: DatosFacturacion[];
  cliente: {
    id: number;
    nombre_completo: string;
    dni: string;
  };
  meta: {
    total: number;
    activos: number;
    predeterminado?: number;
  };
}

export interface DatosFacturacionStatistics {
  total: number;
  activos: number;
  predeterminados: number;
  por_tipo_documento: Record<string, number>;
  por_estado: {
    activos: number;
    inactivos: number;
    predeterminados: number;
  };
  clientes_con_datos: number;
  promedio_por_cliente: number;
  documentos_validos: number;
  nuevos_ultimo_mes: number;
}

export interface DatosFacturacionStatisticsResponse {
  data: DatosFacturacionStatistics;
}

export interface ValidarDocumentoRequest {
  tipo_documento: 'dni' | 'ruc' | 'pasaporte' | 'carnet_extranjeria';
  numero_documento: string;
}

export interface ValidarDocumentoResponse {
  valido: boolean;
  numero_documento_limpio: string;
  tipo_documento: string;
  formato_esperado: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
  links?: Record<string, string>;
}

// Tipos para paginación
export interface PaginationLinks {
  first: string;
  last: string;
  prev?: string;
  next?: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  filtros_aplicados?: Record<string, unknown>;
}

// Enums para mayor type safety
export enum TipoDocumento {
  DNI = 'dni',
  RUC = 'ruc',
  PASAPORTE = 'pasaporte',
  CARNET_EXTRANJERIA = 'carnet_extranjeria',
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

// Constantes
export const DATOS_FACTURACION_SORT_FIELDS = [
  'id',
  'created_at',
  'updated_at',
  'tipo_documento',
  'numero_documento',
  'nombre_facturacion',
  'predeterminado',
  'activo',
] as const;

export type DatosFacturacionSortField =
  (typeof DATOS_FACTURACION_SORT_FIELDS)[number];

// Constantes para tipos de documento
export const TIPOS_DOCUMENTO_OPCIONES = [
  {
    value: TipoDocumento.DNI,
    label: 'DNI',
    descripcion: 'Documento Nacional de Identidad',
  },
  {
    value: TipoDocumento.RUC,
    label: 'RUC',
    descripcion: 'Registro Único de Contribuyentes',
  },
  {
    value: TipoDocumento.PASAPORTE,
    label: 'Pasaporte',
    descripcion: 'Pasaporte',
  },
  {
    value: TipoDocumento.CARNET_EXTRANJERIA,
    label: 'Carnet de Extranjería',
    descripcion: 'Carnet de Extranjería',
  },
] as const;

// Validaciones por tipo de documento
export const VALIDACIONES_DOCUMENTO = {
  [TipoDocumento.DNI]: {
    longitud: 8,
    patron: /^\d{8}$/,
    descripcion: '8 dígitos numéricos',
  },
  [TipoDocumento.RUC]: {
    longitud: 11,
    patron: /^\d{11}$/,
    descripcion: '11 dígitos numéricos',
  },
  [TipoDocumento.PASAPORTE]: {
    longitud: [6, 12],
    patron: /^[A-Za-z0-9]{6,12}$/,
    descripcion: '6-12 caracteres alfanuméricos',
  },
  [TipoDocumento.CARNET_EXTRANJERIA]: {
    longitud: 9,
    patron: /^\d{9}$/,
    descripcion: '9 dígitos numéricos',
  },
} as const;

// Campos requeridos según tipo de documento
export const CAMPOS_REQUERIDOS_POR_TIPO = {
  [TipoDocumento.DNI]: ['nombre_facturacion'],
  [TipoDocumento.RUC]: [
    'nombre_facturacion',
    'razon_social',
    'contacto_empresa',
    'giro_negocio',
  ],
  [TipoDocumento.PASAPORTE]: ['nombre_facturacion'],
  [TipoDocumento.CARNET_EXTRANJERIA]: ['nombre_facturacion'],
} as const;

// Funciones de utilidad
export function esTipoEmpresa(tipoDocumento: TipoDocumento): boolean {
  return tipoDocumento === TipoDocumento.RUC;
}

export function esPersonaNatural(tipoDocumento: TipoDocumento): boolean {
  return !esTipoEmpresa(tipoDocumento);
}

export function validarDocumento(
  tipoDocumento: TipoDocumento,
  numeroDocumento: string
): boolean {
  const validacion = VALIDACIONES_DOCUMENTO[tipoDocumento];
  if (!validacion) return false;

  return validacion.patron.test(numeroDocumento);
}

export function limpiarDocumento(numeroDocumento: string): string {
  return numeroDocumento.replace(/[^\dA-Za-z]/g, '');
}

export function formatearDocumento(
  tipoDocumento: TipoDocumento,
  numeroDocumento: string
): string {
  const documentoLimpio = limpiarDocumento(numeroDocumento);

  switch (tipoDocumento) {
    case TipoDocumento.RUC:
      if (documentoLimpio.length === 11) {
        return `${documentoLimpio.slice(0, 2)}-${documentoLimpio.slice(
          2,
          10
        )}-${documentoLimpio.slice(10)}`;
      }
      return documentoLimpio;
    case TipoDocumento.PASAPORTE:
      return documentoLimpio.toUpperCase();
    default:
      return documentoLimpio;
  }
}
