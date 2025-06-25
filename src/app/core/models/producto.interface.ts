export interface Producto {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio: number;
  precio_oferta: number | null;
  stock: number;
  sku: string;
  codigo_barras: string | null;
  imagen_principal: string | null;
  destacado: boolean;
  activo: boolean;
  categoria_id: number;
  marca: string | null;
  modelo: string | null;
  garantia: string | null;
  peso?: number | null;
  dimensiones?: string | null;
  caracteristicas?: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  idioma: string;
  moneda: string;
  atributos_extra: Record<string, any> | null;
  created_at: string;
  updated_at: string;

  // Campos calculados
  precio_min?: number;
  precio_max?: number;
  rating_promedio?: number;
  total_comentarios?: number;

  // Contadores de relaciones
  variaciones_count?: number;
  imagenes_count?: number;
  favoritos_count?: number;

  // Relaciones
  categoria?: Categoria;
  variaciones?: VariacionProducto[];
  imagenes?: ImagenProducto[];
  comentarios?: Comentario[];
}

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen: string | null;
  activo: boolean;
  orden: number | null;
  categoria_padre_id: number | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string | null;
  updated_at: string | null;
  productos_count?: number;
  subcategorias_count?: number;
  categoria_padre?: Categoria;
  subcategorias?: Categoria[];
  productos?: Producto[];
}

export interface VariacionProducto {
  id: number;
  producto_id: number;
  sku: string;
  precio: number;
  precio_oferta?: number | null;
  stock: number;
  activo: boolean;
}

export interface ImagenProducto {
  id: number;
  producto_id: number;
  url: string;
  alt: string;
  principal: boolean;
  orden: number;
}

export interface Comentario {
  id: number;
  producto_id: number;
  usuario_id: number;
  calificacion: number;
  comentario: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Request interfaces
export interface CreateProductoRequest {
  nombre: string;
  slug?: string;
  descripcion?: string;
  precio: number;
  precio_oferta?: number;
  stock: number;
  sku?: string;
  codigo_barras?: string;
  imagen_principal?: File;
  destacado?: boolean;
  activo?: boolean;
  categoria_id: number;
  marca?: string;
  modelo?: string;
  garantia?: string;
  meta_title?: string;
  meta_description?: string;
  idioma?: string;
  moneda?: string;
  atributos_extra?: Record<string, any>;
}

export interface UpdateProductoRequest {
  nombre?: string;
  slug?: string;
  descripcion?: string;
  precio?: number;
  precio_oferta?: number;
  stock?: number;
  sku?: string;
  codigo_barras?: string;
  imagen_principal?: File;
  destacado?: boolean;
  activo?: boolean;
  categoria_id?: number;
  marca?: string;
  modelo?: string;
  garantia?: string;
  meta_title?: string;
  meta_description?: string;
  idioma?: string;
  moneda?: string;
  atributos_extra?: Record<string, any>;
}

// Response interfaces específicas para productos
export interface ProductoResponse {
  data: Producto;
}

export interface ProductosResponse {
  data: Producto[];
  links: ProductoPaginationLinks;
  meta: ProductoPaginationMeta;
}

// Interfaces de paginación específicas para productos
export interface ProductoPaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface ProductoPaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: ProductoPaginationLink[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface ProductoPaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

// Filter interfaces
export interface ProductoFilters {
  categoria_id?: number;
  nombre?: string;
  sku?: string;
  marca?: string;
  modelo?: string;
  precio_min?: number;
  precio_max?: number;
  con_stock?: boolean;
  destacado?: boolean;
  activo?: boolean;
  con_imagen?: boolean;
  include_stats?: boolean;
  include_variaciones?: boolean;
  include_imagenes?: boolean;
  per_page?: number;
  order_by?: 'nombre' | 'precio' | 'stock' | 'created_at' | 'categoria_id';
  order_direction?: 'asc' | 'desc';
  page?: number;
}

// Statistics interfaces
export interface ProductoStatistics {
  total_productos: number;
  productos_activos: number;
  productos_destacados: number;
  productos_sin_stock: number;
  productos_con_imagen: number;
  valor_total_inventario: number;
  precio_promedio: number;
  por_categoria: Record<string, number>;
  top_marcas: TopMarca[];
}

export interface TopMarca {
  marca: string;
  total_productos: number;
}

export interface ProductoStatisticsResponse {
  data: ProductoStatistics;
}

// Search interfaces
export interface ProductoSearchParams {
  q: string;
  limit?: number;
}

// API Error interface específica para productos
export interface ProductoApiError {
  message: string;
  error?: string;
  trace?: string;
  errors?: Record<string, string[]>;
}

// Form interfaces para componentes
export interface ProductoFormData {
  nombre: string;
  descripcion: string;
  precio: number;
  precio_oferta: number | null;
  stock: number;
  categoria_id: number;
  marca: string;
  modelo: string;
  garantia: string;
  destacado: boolean;
  activo: boolean;
  meta_title: string;
  meta_description: string;
  idioma: string;
  moneda: string;
  atributos_extra: Record<string, any>;
}

// Estado del servicio
export interface ProductoState {
  productos: Producto[];
  currentProducto: Producto | null;
  loading: boolean;
  error: string | null;
  filters: ProductoFilters;
  pagination: ProductoPaginationMeta | null;
  statistics: ProductoStatistics | null;
}

// Alias para compatibilidad (mantener las interfaces originales)
export type PaginationLinks = ProductoPaginationLinks;
export type PaginationMeta = ProductoPaginationMeta;
export type PaginationLink = ProductoPaginationLink;
export type ApiError = ProductoApiError;
