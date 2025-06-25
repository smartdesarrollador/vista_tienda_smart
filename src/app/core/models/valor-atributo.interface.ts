import { TipoAtributo } from './atributo.model';

export interface ValorAtributo {
  id: number;
  atributo_id: number;
  valor: string;
  codigo?: string | null;
  imagen?: string | null;
  created_at: string;
  updated_at: string;
  valor_formateado: string;
  es_color: boolean;
  tiene_imagen: boolean;
  atributo: { id: number; nombre: string; tipo: TipoAtributo };
  variaciones_count?: number;
}

export interface CreateValorAtributoRequest {
  atributo_id: number;
  valor: string;
  codigo?: string;
  imagen?: File;
}

export interface UpdateValorAtributoRequest {
  valor?: string;
  codigo?: string;
  imagen?: File;
  atributo_id?: number;
}

export interface BulkCreateValorAtributoRequest {
  valores: Array<{
    valor: string;
    codigo?: string;
  }>;
}

export interface BulkCreateValorAtributoResponse {
  message: string;
  creados: ValorAtributo[];
  errores: string[];
  total_creados: number;
  total_errores: number;
}

export interface ValorAtributoFilters {
  atributo_id?: number;
  valor?: string;
  codigo?: string;
  tipo_atributo?: string;
  con_imagen?: boolean;
  include_usage?: boolean;
  order_by?: 'valor' | 'codigo' | 'created_at' | 'atributo_id';
  order_direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface PaginatedValorAtributoResponse {
  data: ValorAtributo[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export interface ValorAtributoStatistics {
  total_valores: number;
  valores_con_imagen: number;
  valores_con_codigo: number;
  valores_en_uso: number;
  por_tipo_atributo: Record<string, number>;
  top_atributos: Array<{
    nombre: string;
    total_valores: number;
  }>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
}
