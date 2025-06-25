// export type TipoCupon = 'porcentaje' | 'monto_fijo'; // Original, ajustar según backend
export type TipoCupon = 'porcentaje' | 'fijo'; // Ajustado para coincidir con el backend

export interface TipoDetalladoCupon {
  codigo: TipoCupon;
  nombre: string;
  simbolo: string;
}

export interface PeriodoVigencia {
  inicio: string; // Formato dd/mm/YYYY
  fin: string; // Formato dd/mm/YYYY
  inicio_formateado: string; // Ej: "1 week ago"
  fin_formateado: string; // Ej: "4 weeks from now"
}

export interface Cupon {
  id: number;
  codigo: string;
  descuento: number;
  tipo: TipoCupon;
  fecha_inicio: string; // Formato YYYY-MM-DDTHH:mm:ss.sssZ o YYYY-MM-DD HH:mm:ss
  fecha_fin: string; // Formato YYYY-MM-DDTHH:mm:ss.sssZ o YYYY-MM-DD HH:mm:ss
  limite_uso: number | null;
  usos: number;
  activo: boolean;
  descripcion: string | null;
  created_at: string;
  updated_at: string;

  // Campos calculados/formateados desde el backend (CuponResource)
  esta_vigente: boolean;
  puede_usarse: boolean;
  dias_restantes: number | null;
  usos_restantes: number | null;
  porcentaje_uso: number | null;
  descuento_formateado: string;
  tipo_detallado: TipoDetalladoCupon;
  periodo_vigencia: PeriodoVigencia;
}

export interface CuponFormData {
  codigo: string;
  descuento: number;
  tipo: TipoCupon;
  fecha_inicio: string; // Formato YYYY-MM-DD HH:mm:ss
  fecha_fin: string; // Formato YYYY-MM-DD HH:mm:ss
  limite_uso?: number | null;
  activo?: boolean;
  descripcion?: string | null;
}

// Definición de interfaces genéricas de API directamente aquí
export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
