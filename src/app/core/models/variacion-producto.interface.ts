import { Producto } from './producto.interface';

// Interfaz principal de VariacionProducto
export interface VariacionProducto {
  id: number;
  producto_id: number;
  sku: string;
  precio: number;
  precio_oferta: number | null;
  stock: number;
  activo: boolean;
  atributos: Record<string, any> | null;
  created_at: string;
  updated_at: string;

  // Campos calculados
  disponible?: boolean;
  estado_stock?: 'sin_stock' | 'stock_limitado' | 'disponible';
  descuento_porcentaje?: number;

  // Relaciones
  producto?: Producto;
  imagenes?: ImagenVariacion[];
  valores_atributos?: ValorAtributo[];
}

// Interfaz simplificada para listados
export interface VariacionProductoSimple {
  id: number;
  producto_id: number;
  sku: string;
  precio: number;
  precio_oferta: number | null;
  stock: number;
  activo: boolean;
  atributos: Record<string, any> | null;
  disponible: boolean;
  estado_stock: 'sin_stock' | 'stock_limitado' | 'disponible';
  descuento_porcentaje: number;
}

// Interfaz para imágenes de variaciones
export interface ImagenVariacion {
  id: number;
  variacion_producto_id: number;
  url: string;
  alt: string;
  principal: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

// Interfaz para atributos de productos
export interface AtributoProducto {
  id: number;
  nombre: string;
  slug: string;
  tipo: 'color' | 'talla' | 'marca' | 'material' | 'personalizado';
  descripcion: string | null;
  activo: boolean;
  orden: number | null;
  created_at: string;
  updated_at: string;

  // Relaciones
  valores?: ValorAtributo[];
}

// Interfaz para valores de atributos
export interface ValorAtributo {
  id: number;
  atributo_id: number;
  valor: string;
  codigo_color: string | null; // Para colores en hexadecimal
  imagen: string | null; // Para texturas o patrones
  activo: boolean;
  orden: number | null;
  created_at: string;
  updated_at: string;

  // Relaciones
  atributo?: AtributoProducto;
}

// Interfaz para la tabla pivot variacion_valor
export interface VariacionValor {
  id: number;
  variacion_producto_id: number;
  valor_atributo_id: number;
  created_at: string;
  updated_at: string;

  // Relaciones
  variacion?: VariacionProducto;
  valor_atributo?: ValorAtributo;
}

// Interfaces para filtros y búsquedas
export interface VariacionProductoFilters {
  producto_id?: number;
  sku?: string;
  precio_min?: number;
  precio_max?: number;
  con_stock?: boolean;
  activo?: boolean;
  atributos?: Record<string, any>;
  per_page?: number;
  order_by?: 'sku' | 'precio' | 'stock' | 'created_at';
  order_direction?: 'asc' | 'desc';
  page?: number;
}

// Interface para request de creación
export interface CreateVariacionProductoRequest {
  producto_id: number;
  sku: string;
  precio: number;
  precio_oferta?: number | null;
  stock: number;
  activo?: boolean;
  atributos?: Record<string, any> | null;
  valores_atributos?: number[]; // IDs de valores de atributos
}

// Interface para request de actualización
export interface UpdateVariacionProductoRequest {
  sku?: string;
  precio?: number;
  precio_oferta?: number | null;
  stock?: number;
  activo?: boolean;
  atributos?: Record<string, any> | null;
  valores_atributos?: number[]; // IDs de valores de atributos
}

// Interfaces de respuesta de API
export interface VariacionProductoResponse {
  data: VariacionProducto;
}

export interface VariacionesProductoResponse {
  data: VariacionProducto[];
  links: VariacionPaginationLinks;
  meta: VariacionPaginationMeta;
}

// Interfaces de paginación específicas
export interface VariacionPaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface VariacionPaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: VariacionPaginationLink[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface VariacionPaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

// Interface para selector de variaciones en el frontend
export interface VariacionSelector {
  atributo: AtributoProducto;
  valores: ValorAtributo[];
  valorSeleccionado: ValorAtributo | null;
}

// Interface para combinación de variaciones seleccionadas
export interface VariacionSeleccionada {
  variacion: VariacionProducto | null;
  atributos: Record<string, ValorAtributo>;
  esValida: boolean;
  disponible: boolean;
}

// Interface para configuración de selector de variaciones
export interface ConfiguracionSelectores {
  mostrarColores: boolean;
  mostrarTallas: boolean;
  mostrarOtrosAtributos: boolean;
  permitirSeleccionMultiple: boolean;
  mostrarImagenesPorVariacion: boolean;
}

// Interfaz para atributos
export interface Atributo {
  id: number;
  nombre: string;
  slug: string;
  tipo: 'texto' | 'color' | 'imagen' | 'numero';
  requerido: boolean;
  activo: boolean;
  orden: number | null;
  created_at: string;
  updated_at: string;
}

// Response interfaces
export interface VariacionProductoResponse {
  success: boolean;
  data: VariacionProducto;
  message?: string;
}

export interface VariacionesProductoResponse {
  success: boolean;
  data: VariacionProducto[];
  pagination: VariacionProductoPagination;
  filters: VariacionProductoFilters;
  message?: string;
}

export interface VariacionesByProductoResponse {
  success: boolean;
  data: VariacionProducto[];
  producto: {
    id: number;
    nombre: string;
    sku: string;
  };
  message?: string;
}

// Pagination interfaces
export interface VariacionProductoPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

// Form data interface
export interface VariacionProductoFormData {
  producto_id: number;
  sku: string;
  precio: number;
  precio_oferta: number | null;
  stock: number;
  activo: boolean;
  atributos: Record<string, any>;
  valores_atributos: number[];
}

// Stock update interface
export interface UpdateStockRequest {
  stock: number;
  operacion?: 'set' | 'add' | 'subtract';
}

export interface UpdateStockResponse {
  success: boolean;
  data: VariacionProducto;
  stock_anterior: number;
  stock_nuevo: number;
  message: string;
}

// Error interface
export interface VariacionProductoApiError {
  success: false;
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// State interface para gestión de estado
export interface VariacionProductoState {
  variaciones: VariacionProducto[];
  currentVariacion: VariacionProducto | null;
  loading: boolean;
  error: string | null;
  filters: VariacionProductoFilters;
  pagination: VariacionProductoPagination | null;
}

// Enum para estados de stock
export enum EstadoStock {
  SIN_STOCK = 'sin_stock',
  STOCK_LIMITADO = 'stock_limitado',
  DISPONIBLE = 'disponible',
}

// Enum para operaciones de stock
export enum OperacionStock {
  SET = 'set',
  ADD = 'add',
  SUBTRACT = 'subtract',
}

// Enum para campos de ordenamiento
export enum SortField {
  ID = 'id',
  SKU = 'sku',
  PRECIO = 'precio',
  PRECIO_OFERTA = 'precio_oferta',
  STOCK = 'stock',
  ACTIVO = 'activo',
  CREATED_AT = 'created_at',
}

// Enum para dirección de ordenamiento
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}
