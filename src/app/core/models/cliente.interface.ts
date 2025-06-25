export interface Usuario {
  id: number;
  name: string;
  email: string;
  rol: string;
  avatar?: string;
  ultimo_login?: string;
  email_verified_at?: string;
}

export interface DatosFacturacion {
  id: number;
  cliente_id: number;
  tipo_documento: 'dni' | 'ruc' | 'pasaporte' | 'carnet_extranjeria';
  numero_documento: string;
  numero_documento_formateado: string;
  nombre_facturacion: string;
  razon_social?: string;
  nombre_facturacion_completo: string;
  direccion_fiscal: string;
  distrito_fiscal: string;
  provincia_fiscal: string;
  departamento_fiscal: string;
  codigo_postal_fiscal?: string;
  direccion_fiscal_completa: string;
  telefono_fiscal?: string;
  email_facturacion?: string;
  predeterminado: boolean;
  activo: boolean;
  is_predeterminado: boolean;
  is_activo: boolean;
  contacto_empresa?: string;
  giro_negocio?: string;
  datos_adicionales?: Record<string, unknown>;
  is_empresa: boolean;
  is_persona_natural: boolean;
  documento_valido: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClientePreferencias {
  categorias_favoritas?: number[];
  notificaciones_email?: boolean;
  notificaciones_sms?: boolean;
  [key: string]: unknown;
}

export interface ClienteMetadata {
  fuente_registro?: string;
  ip_registro?: string;
  user_agent?: string;
  [key: string]: unknown;
}

export interface ClienteResumen {
  edad_anos: number;
  tiempo_como_cliente: string;
  estado_credito: string;
  estado_verificacion: string;
  origen_registro: string;
}

export interface Cliente {
  id: number;
  user_id: number;
  dni: string;
  telefono: string;
  direccion: string;
  nombre_completo: string;
  apellidos: string;
  fecha_nacimiento?: string;
  genero?: 'M' | 'F' | 'O';
  limite_credito: number;
  credito_disponible: number;
  tiene_credito: boolean;
  verificado: boolean;
  estado: 'activo' | 'inactivo' | 'bloqueado';
  is_activo: boolean;
  is_verificado: boolean;
  referido_por?: string;
  profesion?: string;
  empresa?: string;
  ingresos_mensuales?: number;
  preferencias?: ClientePreferencias;
  metadata?: ClienteMetadata;
  nombre_completo_formateado: string;
  edad?: number;
  usuario?: Usuario;
  datos_facturacion?: DatosFacturacion[];
  dato_facturacion_predeterminado?: DatosFacturacion;
  datos_facturacion_activos?: DatosFacturacion[];
  total_datos_facturacion?: number;
  datos_facturacion_activos_count?: number;
  created_at?: string;
  updated_at?: string;
  resumen?: ClienteResumen;
}

export interface ClienteSimple {
  id: number;
  dni: string;
  nombre_completo_formateado: string;
  telefono: string;
  estado: string;
  verificado: boolean;
  limite_credito: number;
  created_at?: string;
}

export interface CreateClienteRequest {
  user_id: number;
  dni: string;
  telefono: string;
  direccion: string;
  nombre_completo: string;
  apellidos: string;
  fecha_nacimiento?: string;
  genero?: 'M' | 'F' | 'O';
  limite_credito?: number;
  estado?: 'activo' | 'inactivo' | 'bloqueado';
  referido_por?: string;
  profesion?: string;
  empresa?: string;
  ingresos_mensuales?: number;
  preferencias?: ClientePreferencias;
  metadata?: ClienteMetadata;
}

export interface UpdateClienteRequest extends Partial<CreateClienteRequest> {
  // Todos los campos son opcionales para actualización
}

export interface ClienteFilters {
  page?: number;
  per_page?: number;
  estado?: 'activo' | 'inactivo' | 'bloqueado';
  verificado?: boolean;
  con_credito?: boolean;
  genero?: 'M' | 'F' | 'O';
  fecha_desde?: string;
  fecha_hasta?: string;
  edad_min?: number;
  edad_max?: number;
  buscar?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  simple?: boolean;
  sin_paginacion?: boolean;
  incluir_datos_facturacion?: boolean;
  incluir_contadores?: boolean;
  incluir_datos_completos?: boolean;
  incluir_resumen?: boolean;
}

export interface ClienteListResponse {
  data: Cliente[] | ClienteSimple[];
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

export interface ClienteCollectionResponse {
  data: Cliente[];
  statistics: {
    total: number;
    activos: number;
    verificados: number;
    con_credito: number;
    por_estado: Record<string, number>;
    por_genero: Record<string, number>;
  };
}

export interface ClienteResponse {
  message?: string;
  data: Cliente;
}

export interface ClienteStatistics {
  total: number;
  activos: number;
  verificados: number;
  con_credito: number;
  por_estado: Record<string, number>;
  por_genero: Record<string, number>;
  limite_credito_total: number;
  promedio_edad: number;
  nuevos_ultimo_mes: number;
}

export interface ClienteStatisticsResponse {
  data: ClienteStatistics;
}

export interface CambiarEstadoRequest {
  estado: 'activo' | 'inactivo' | 'bloqueado';
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
export enum EstadoCliente {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  BLOQUEADO = 'bloqueado',
}

export enum GeneroCliente {
  MASCULINO = 'M',
  FEMENINO = 'F',
  OTRO = 'O',
}

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
export const CLIENTE_SORT_FIELDS = [
  'id',
  'created_at',
  'updated_at',
  'nombre_completo',
  'dni',
  'fecha_nacimiento',
  'limite_credito',
  'estado',
] as const;

export type ClienteSortField = (typeof CLIENTE_SORT_FIELDS)[number];
