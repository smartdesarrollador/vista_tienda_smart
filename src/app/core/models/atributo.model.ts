import { ValorAtributo } from './valor-atributo.interface';

/**
 * Tipos de atributos permitidos.
 */
export type TipoAtributo = 'texto' | 'color' | 'numero' | 'tamaño' | 'booleano';

/**
 * Representa la información detallada del tipo de un atributo.
 */
export interface TipoDetalladoAtributo {
  codigo: TipoAtributo;
  nombre: string;
  icono: string;
}

/**
 * Representa un atributo de un producto, como "Color", "Talla", "Material".
 */
export interface Atributo {
  id: number;
  nombre: string;
  slug: string;
  tipo: TipoAtributo;
  filtrable: boolean;
  visible: boolean;
  created_at: string;
  updated_at: string;

  tipo_detallado: TipoDetalladoAtributo;
  valores_count?: number; // Cantidad de valores asociados
  valores?: ValorAtributo[]; // Lista de valores asociados (si se cargan)
}

/**
 * Datos necesarios para crear o actualizar un atributo.
 */
export interface AtributoFormData {
  nombre: string;
  tipo: TipoAtributo;
  filtrable?: boolean; // Por defecto será false si no se envía
  visible?: boolean; // Por defecto será true si no se envía
}

/**
 * Representa la estructura de una respuesta paginada de la API.
 */
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
