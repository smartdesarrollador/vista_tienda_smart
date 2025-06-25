// Interfaces comunes para toda la aplicación

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
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

export interface PaginatedResponse<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

// Interfaces comunes para paginación
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

// Interface base para respuestas paginadas
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

// Interface base para respuestas simples
export interface ApiResponse<T> {
  data: T;
}

// Tipos comunes
export type SortDirection = 'asc' | 'desc';

// Interface base para filtros
export interface BaseFilters {
  search?: string;
  sort_by?: string;
  sort_direction?: SortDirection;
  per_page?: number;
  page?: number;
}
