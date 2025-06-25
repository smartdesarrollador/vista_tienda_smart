export interface ImagenProducto {
  id: number;
  url: string;
  url_completa: string;
  alt: string | null;
  orden: number;
  principal: boolean;
  tipo: TipoImagen | null;
  producto_id: number;
  variacion_id: number | null;
  producto?: ProductoBasico;
  variacion?: VariacionBasica;
  metadata: ImagenMetadata;
  created_at: string;
  updated_at: string;
}

export interface ProductoBasico {
  id: number;
  nombre: string;
  sku: string;
  slug: string;
}

export interface VariacionBasica {
  id: number;
  sku: string;
  precio: number;
  stock: number;
  activo: boolean;
}

export interface ImagenMetadata {
  es_principal: boolean;
  tiene_variacion: boolean;
  tipo_display: string;
  orden_display: number;
}

export type TipoImagen =
  | 'miniatura'
  | 'galeria'
  | 'zoom'
  | 'banner'
  | 'detalle';

export interface CreateImagenProductoRequest {
  imagen: File;
  producto_id: number;
  variacion_id?: number;
  alt?: string;
  orden?: number;
  principal?: boolean;
  tipo?: TipoImagen;
}

export interface UpdateImagenProductoRequest {
  imagen?: File;
  alt?: string;
  orden?: number;
  principal?: boolean;
  tipo?: TipoImagen;
}

export interface ImagenProductoFilters {
  producto_id?: number;
  variacion_id?: number;
  tipo?: TipoImagen;
  principal?: boolean;
  search?: string;
  sort_by?: 'id' | 'orden' | 'principal' | 'created_at';
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface ImagenProductoListResponse {
  success: boolean;
  data: ImagenProducto[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  filters: {
    producto_id: number | null;
    variacion_id: number | null;
    tipo: TipoImagen | null;
    principal: boolean | null;
    search: string | null;
    sort_by: string;
    sort_order: string;
  };
}

export interface ImagenProductoResponse {
  success: boolean;
  message?: string;
  data: ImagenProducto;
  error?: string;
}

export interface ImagenProductoByProductoResponse {
  success: boolean;
  data: ImagenProducto[];
  producto: ProductoBasico;
  total_imagenes: number;
}

export interface ImagenProductoByVariacionResponse {
  success: boolean;
  data: ImagenProducto[];
  variacion: {
    id: number;
    sku: string;
    producto: ProductoBasico;
  };
  total_imagenes: number;
}

export interface UpdateOrderRequest {
  imagenes: Array<{
    id: number;
    orden: number;
  }>;
}

export interface ImagenProductoStatistics {
  total_imagenes: number;
  imagenes_principales: number;
  imagenes_por_producto: number;
  imagenes_por_variacion: number;
  por_tipo: Record<TipoImagen, number>;
  productos_con_imagenes: number;
  variaciones_con_imagenes: number;
}

export interface ImagenProductoStatisticsResponse {
  success: boolean;
  data: ImagenProductoStatistics;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Constantes para tipos de imagen
export const TIPOS_IMAGEN: Record<TipoImagen, string> = {
  miniatura: 'Miniatura',
  galeria: 'Galería',
  zoom: 'Zoom',
  banner: 'Banner',
  detalle: 'Detalle',
} as const;

// Constantes para validación de archivos
export const IMAGEN_CONSTRAINTS = {
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif',
    'image/webp',
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  MIN_WIDTH: 100,
  MIN_HEIGHT: 100,
  MAX_WIDTH: 4000,
  MAX_HEIGHT: 4000,
} as const;

// Utilidades para validación
export const isValidImageType = (file: File): boolean => {
  return IMAGEN_CONSTRAINTS.ALLOWED_TYPES.includes(file.type as any);
};

export const isValidImageSize = (file: File): boolean => {
  return file.size <= IMAGEN_CONSTRAINTS.MAX_SIZE_BYTES;
};

export const getImageTypeDisplay = (tipo: TipoImagen | null): string => {
  return tipo ? TIPOS_IMAGEN[tipo] : 'General';
};
