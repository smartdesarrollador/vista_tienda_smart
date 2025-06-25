export interface Adicional {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio: number;
  imagen: string | null;
  icono: string | null;
  tipo: string;
  disponible: boolean;
  activo: boolean;
  stock: number | null;
  tiempo_preparacion: number | null;
  calorias: number | null;
  informacion_nutricional: InformacionNutricional | null;
  alergenos: string[] | null;
  vegetariano: boolean;
  vegano: boolean;
  orden: number;
  created_at: string;
  updated_at: string;

  // Campos calculados
  agotado: boolean;
  precio_formateado: string;
  calorias_texto: string | null;
  tiempo_preparacion_texto: string | null;
  caracteristicas_dieteticas: string[];
  imagen_url: string | null;
  icono_url: string | null;
  estadisticas: EstadisticasAdicional;
}

export interface InformacionNutricional {
  carbohidratos?: string;
  azucares?: string;
  sodio?: string;
  proteinas?: string;
  grasas?: string;
  calcio?: string;
  [key: string]: string | undefined;
}

export interface EstadisticasAdicional {
  productos_asociados?: number;
  grupos_asociados?: number;
  veces_pedido?: number;
  ingresos_generados?: number;
}

// Interfaces para relaciones
export interface ProductoAdicional {
  id: number;
  nombre: string;
  sku: string;
  activo: boolean;
}

export interface GrupoAdicional {
  id: number;
  nombre: string;
  activo: boolean;
  pivot: {
    orden: number;
  };
}

// DTOs para operaciones
export interface CreateAdicionalDto {
  nombre: string;
  slug?: string;
  descripcion?: string;
  precio: number;
  imagen?: string;
  icono?: string;
  tipo: string;
  disponible?: boolean;
  activo?: boolean;
  stock?: number;
  tiempo_preparacion?: number;
  calorias?: number;
  informacion_nutricional?: InformacionNutricional;
  alergenos?: string[];
  vegetariano?: boolean;
  vegano?: boolean;
  orden?: number;
}

export interface UpdateAdicionalDto {
  nombre?: string;
  slug?: string;
  descripcion?: string;
  precio?: number;
  imagen?: string;
  icono?: string;
  tipo?: string;
  disponible?: boolean;
  activo?: boolean;
  stock?: number;
  tiempo_preparacion?: number;
  calorias?: number;
  informacion_nutricional?: InformacionNutricional;
  alergenos?: string[];
  vegetariano?: boolean;
  vegano?: boolean;
  orden?: number;
}

// Filtros para búsqueda
export interface FiltrosAdicional {
  search?: string;
  activo?: boolean;
  disponible?: boolean;
  tipo?: string;
  vegetariano?: boolean;
  vegano?: boolean;
  con_stock?: boolean;
  per_page?: number;
  page?: number;
}

// Respuesta de la API
export interface AdicionalResponse {
  success: boolean;
  data: Adicional;
  message?: string;
}

export interface AdicionalesResponse {
  success: boolean;
  data: Adicional[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

// Tipos para categorización
export type TipoAdicional = 'salsa' | 'queso' | 'carne' | 'vegetal' | 'otro';

export interface TipoAdicionalOption {
  value: TipoAdicional;
  label: string;
  icon?: string;
}

// Constantes
export const TIPOS_ADICIONAL: TipoAdicionalOption[] = [
  { value: 'salsa', label: 'Salsas', icon: 'fas fa-tint' },
  { value: 'queso', label: 'Quesos', icon: 'fas fa-cheese' },
  { value: 'carne', label: 'Carnes', icon: 'fas fa-drumstick-bite' },
  { value: 'vegetal', label: 'Vegetales', icon: 'fas fa-leaf' },
  { value: 'otro', label: 'Otros', icon: 'fas fa-plus-circle' },
];

export const ALERGENOS_COMUNES: string[] = [
  'gluten',
  'lactosa',
  'huevo',
  'frutos secos',
  'soja',
  'pescado',
  'mariscos',
  'apio',
  'mostaza',
  'sesamo',
];

// Funciones utilitarias
export function esAdicionalVegetariano(adicional: Adicional): boolean {
  return adicional.vegetariano;
}

export function esAdicionalVegano(adicional: Adicional): boolean {
  return adicional.vegano;
}

export function tieneAlergenos(adicional: Adicional): boolean {
  return adicional.alergenos !== null && adicional.alergenos.length > 0;
}

export function esAdicionalDisponible(adicional: Adicional): boolean {
  return adicional.activo && adicional.disponible && !adicional.agotado;
}

export function calcularTiempoPreparacionTotal(
  adicionales: Adicional[]
): number {
  return adicionales.reduce((total, adicional) => {
    return total + (adicional.tiempo_preparacion || 0);
  }, 0);
}

export function calcularPrecioTotal(
  adicionales: Adicional[],
  cantidades: { [key: number]: number }
): number {
  return adicionales.reduce((total, adicional) => {
    const cantidad = cantidades[adicional.id] || 0;
    return total + adicional.precio * cantidad;
  }, 0);
}

export function obtenerAdicionalesPorTipo(
  adicionales: Adicional[],
  tipo: TipoAdicional
): Adicional[] {
  return adicionales.filter((adicional) => adicional.tipo === tipo);
}

export function formatearCaracteristicasDieteticas(
  adicional: Adicional
): string[] {
  const caracteristicas: string[] = [];

  if (adicional.vegetariano) {
    caracteristicas.push('Vegetariano');
  }

  if (adicional.vegano) {
    caracteristicas.push('Vegano');
  }

  if (adicional.alergenos && adicional.alergenos.length > 0) {
    caracteristicas.push(`Contiene: ${adicional.alergenos.join(', ')}`);
  }

  return caracteristicas;
}
