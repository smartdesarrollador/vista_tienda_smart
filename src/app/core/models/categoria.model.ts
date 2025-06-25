export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen: string | null;
  activo: boolean;
  orden: number;
  categoria_padre_id: number | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  subcategorias_count?: number;
  productos_count?: number;
  categoria_padre?: CategoriaSimple | null;
  subcategorias?: CategoriaSimple[];
}

export interface CategoriaSimple {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen: string | null;
  activo: boolean;
  orden: number;
  categoria_padre_id: number | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoriaTreeNode {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string | null;
  imagen?: string | null;
  activo?: boolean;
  orden?: number;
  subcategorias: CategoriaTreeNode[];
}

export interface CategoriaFormData {
  nombre: string;
  descripcion?: string;
  imagen?: string;
  activo: boolean;
  orden: number;
  categoria_padre_id?: number | null;
  meta_title?: string;
  meta_description?: string;
}

export interface CategoriaUpdateOrderData {
  categorias: {
    id: number;
    orden: number;
  }[];
}

export interface CategoriaResponse {
  data: Categoria[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface CategoriaTreeResponse {
  data: CategoriaTreeNode[];
  meta: {
    total_categorias: number;
    cache_enabled: boolean;
  };
}

export interface CategoriaSingleResponse {
  message?: string;
  data: Categoria;
}

export interface CategoriaFilters {
  activo?: boolean;
  categoria_padre_id?: number;
  search?: string;
  sort_by?: 'id' | 'nombre' | 'orden' | 'created_at' | 'updated_at';
  sort_direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface CategoriaStats {
  total_categorias: number;
  categorias_activas: number;
  categorias_inactivas: number;
  categorias_principales: number;
  subcategorias: number;
}
