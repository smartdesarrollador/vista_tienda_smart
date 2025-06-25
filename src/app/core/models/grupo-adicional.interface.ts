export interface GrupoAdicional {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  obligatorio: boolean;
  multiple_seleccion: boolean;
  minimo_seleccion: number | null;
  maximo_seleccion: number | null;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;

  // Campos calculados
  tipo_seleccion: TipoSeleccion;
  reglas_seleccion: ReglasSeleccion;
  seleccion_texto: string;

  // Relaciones opcionales
  adicionales?: AdicionalGrupo[];
  productos?: ProductoGrupo[];
  estadisticas?: EstadisticasGrupo;
}

export interface AdicionalGrupo {
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
  vegetariano: boolean;
  vegano: boolean;
  imagen_url: string | null;
  icono_url: string | null;
  pivot: {
    orden: number;
  };
}

export interface ProductoGrupo {
  id: number;
  nombre: string;
  sku: string;
  activo: boolean;
  pivot: {
    orden: number;
  };
}

export interface ReglasSeleccion {
  obligatorio: boolean;
  multiple_seleccion: boolean;
  minimo_seleccion: number;
  maximo_seleccion: number | null;
}

export interface EstadisticasGrupo {
  total_adicionales?: number;
  adicionales_disponibles?: number;
  productos_asociados?: number;
}

// DTOs para crear y actualizar
export interface CreateGrupoAdicionalDto {
  nombre: string;
  slug?: string | null;
  descripcion?: string | null;
  obligatorio?: boolean;
  multiple_seleccion?: boolean;
  minimo_selecciones?: number | null;
  maximo_selecciones?: number | null;
  orden?: number;
  activo?: boolean;
}

export interface UpdateGrupoAdicionalDto {
  nombre?: string;
  slug?: string | null;
  descripcion?: string | null;
  obligatorio?: boolean;
  multiple_seleccion?: boolean;
  minimo_selecciones?: number | null;
  maximo_selecciones?: number | null;
  orden?: number;
  activo?: boolean;
}

// Filtros para búsqueda
export interface FiltrosGrupoAdicional {
  search?: string;
  activo?: boolean;
  obligatorio?: boolean;
  multiple_seleccion?: boolean;
  tipo_seleccion?: TipoSeleccion;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// Respuestas de la API
export interface GrupoAdicionalResponse {
  success: boolean;
  data: GrupoAdicional;
  message?: string;
}

export interface GruposAdicionalesResponse {
  success: boolean;
  data: GrupoAdicional[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

// Estadísticas
export interface EstadisticasGrupoAdicional {
  total_grupos: number;
  grupos_activos: number;
  grupos_obligatorios: number;
  grupos_multiples: number;
  promedio_adicionales_por_grupo: number;
  grupos_mas_usados: Array<{
    grupo_id: number;
    nombre: string;
    cantidad_productos: number;
  }>;
}

// Configuración de ordenamiento
export interface ConfiguracionOrdenGrupo {
  grupos_orden: Array<{
    grupo_id: number;
    orden: number;
  }>;
}

// Tipos y constantes
export type TipoSeleccion = 'seleccion_unica' | 'seleccion_multiple';

export const TIPOS_SELECCION = [
  { value: 'seleccion_unica', label: 'Selección única' },
  { value: 'seleccion_multiple', label: 'Selección múltiple' },
] as const;

export const OPCIONES_ORDEN_GRUPO = [
  { value: 'orden', label: 'Orden' },
  { value: 'nombre', label: 'Nombre' },
  { value: 'created_at', label: 'Fecha de creación' },
] as const;

export const DIRECCIONES_ORDEN_GRUPO = [
  { value: 'asc', label: 'Ascendente' },
  { value: 'desc', label: 'Descendente' },
] as const;

export type OpcionOrdenGrupo = (typeof OPCIONES_ORDEN_GRUPO)[number]['value'];
export type DireccionOrdenGrupo =
  (typeof DIRECCIONES_ORDEN_GRUPO)[number]['value'];

// Funciones utilitarias
export function esGrupoObligatorio(grupo: GrupoAdicional): boolean {
  return grupo.obligatorio && grupo.activo;
}

export function esSeleccionMultiple(grupo: GrupoAdicional): boolean {
  return grupo.multiple_seleccion;
}

export function obtenerTipoSeleccion(grupo: GrupoAdicional): TipoSeleccion {
  return grupo.multiple_seleccion ? 'seleccion_multiple' : 'seleccion_unica';
}

export function obtenerTextoSeleccion(grupo: GrupoAdicional): string {
  if (!grupo.multiple_seleccion) {
    return grupo.obligatorio
      ? 'Seleccionar 1 opción (obligatorio)'
      : 'Seleccionar 1 opción (opcional)';
  }

  let texto = 'Seleccionar ';

  if (grupo.minimo_seleccion && grupo.maximo_seleccion) {
    if (grupo.minimo_seleccion === grupo.maximo_seleccion) {
      texto += `exactamente ${grupo.minimo_seleccion} opciones`;
    } else {
      texto += `entre ${grupo.minimo_seleccion} y ${grupo.maximo_seleccion} opciones`;
    }
  } else if (grupo.minimo_seleccion) {
    texto += `mínimo ${grupo.minimo_seleccion} opciones`;
  } else if (grupo.maximo_seleccion) {
    texto += `máximo ${grupo.maximo_seleccion} opciones`;
  } else {
    texto += 'múltiples opciones';
  }

  return texto + (grupo.obligatorio ? ' (obligatorio)' : ' (opcional)');
}

export function validarGrupoAdicional(
  data: CreateGrupoAdicionalDto | UpdateGrupoAdicionalDto
): string[] {
  const errores: string[] = [];

  if ('nombre' in data && (!data.nombre || data.nombre.trim().length < 2)) {
    errores.push('El nombre debe tener al menos 2 caracteres');
  }

  if ('nombre' in data && data.nombre && data.nombre.length > 100) {
    errores.push('El nombre no puede exceder 100 caracteres');
  }

  if ('slug' in data && data.slug && data.slug.length > 100) {
    errores.push('El slug no puede exceder 100 caracteres');
  }

  if (
    data.minimo_selecciones !== undefined &&
    data.minimo_selecciones !== null &&
    data.minimo_selecciones < 0
  ) {
    errores.push('El mínimo de selecciones no puede ser negativo');
  }

  if (
    data.maximo_selecciones !== undefined &&
    data.maximo_selecciones !== null &&
    data.maximo_selecciones < 0
  ) {
    errores.push('El máximo de selecciones no puede ser negativo');
  }

  if (
    data.minimo_selecciones !== undefined &&
    data.maximo_selecciones !== undefined &&
    data.minimo_selecciones !== null &&
    data.maximo_selecciones !== null &&
    data.minimo_selecciones > data.maximo_selecciones
  ) {
    errores.push('El mínimo de selecciones no puede ser mayor al máximo');
  }

  if (data.orden !== undefined && data.orden !== null && data.orden < 0) {
    errores.push('El orden no puede ser negativo');
  }

  return errores;
}

export function validarSeleccionGrupo(
  grupo: GrupoAdicional,
  seleccionados: number[]
): { valido: boolean; errores: string[] } {
  const errores: string[] = [];
  const cantidad = seleccionados.length;

  // Validar si es obligatorio
  if (grupo.obligatorio && cantidad === 0) {
    errores.push(
      'Este grupo es obligatorio, debe seleccionar al menos una opción'
    );
  }

  // Validar selección única
  if (!grupo.multiple_seleccion && cantidad > 1) {
    errores.push('Solo puede seleccionar una opción en este grupo');
  }

  // Validar mínimo
  if (grupo.minimo_seleccion && cantidad < grupo.minimo_seleccion) {
    errores.push(
      `Debe seleccionar al menos ${grupo.minimo_seleccion} opciones`
    );
  }

  // Validar máximo
  if (grupo.maximo_seleccion && cantidad > grupo.maximo_seleccion) {
    errores.push(
      `No puede seleccionar más de ${grupo.maximo_seleccion} opciones`
    );
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

export function calcularTotalAdicionalesGrupo(
  grupos: GrupoAdicional[]
): number {
  return grupos.reduce((total, grupo) => {
    return total + (grupo.estadisticas?.total_adicionales || 0);
  }, 0);
}

export function agruparPorTipo(grupos: GrupoAdicional[]): {
  [key in TipoSeleccion]: GrupoAdicional[];
} {
  return grupos.reduce((acc, grupo) => {
    const tipo = obtenerTipoSeleccion(grupo);
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(grupo);
    return acc;
  }, {} as { [key in TipoSeleccion]: GrupoAdicional[] });
}

export function ordenarPorOrden(grupos: GrupoAdicional[]): GrupoAdicional[] {
  return [...grupos].sort((a, b) => a.orden - b.orden);
}

export function filtrarGruposActivos(
  grupos: GrupoAdicional[]
): GrupoAdicional[] {
  return grupos.filter((grupo) => grupo.activo);
}

export function filtrarGruposObligatorios(
  grupos: GrupoAdicional[]
): GrupoAdicional[] {
  return grupos.filter((grupo) => esGrupoObligatorio(grupo));
}

export function obtenerGruposConAdicionales(
  grupos: GrupoAdicional[]
): GrupoAdicional[] {
  return grupos.filter(
    (grupo) =>
      grupo.estadisticas?.total_adicionales &&
      grupo.estadisticas.total_adicionales > 0
  );
}

export function generarSlugDesdeNombre(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .trim()
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-'); // Remover guiones duplicados
}

export function formatearReglasSeleccion(reglas: ReglasSeleccion): string {
  const partes: string[] = [];

  if (reglas.obligatorio) {
    partes.push('Obligatorio');
  } else {
    partes.push('Opcional');
  }

  if (reglas.multiple_seleccion) {
    partes.push('Múltiple');
  } else {
    partes.push('Única');
  }

  if (reglas.minimo_seleccion > 0) {
    partes.push(`Mín: ${reglas.minimo_seleccion}`);
  }

  if (reglas.maximo_seleccion) {
    partes.push(`Máx: ${reglas.maximo_seleccion}`);
  }

  return partes.join(' • ');
}
