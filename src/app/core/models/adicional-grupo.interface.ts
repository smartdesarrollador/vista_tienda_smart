export interface AdicionalGrupo {
  id: number;
  adicional_id: number;
  grupo_adicional_id: number;
  orden: number;
  created_at: string;
  updated_at: string;

  // Relaciones opcionales
  adicional?: AdicionalDetalle;
  grupo_adicional?: GrupoAdicionalDetalle;
}

export interface AdicionalDetalle {
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
  precio_formateado: string;
  imagen_url: string | null;
  icono_url: string | null;
}

export interface GrupoAdicionalDetalle {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  obligatorio: boolean;
  multiple_seleccion: boolean;
  minimo_seleccion: number | null;
  maximo_seleccion: number | null;
  activo: boolean;
}

// DTOs para crear y actualizar
export interface CreateAdicionalGrupoDto {
  adicional_id: number;
  grupo_adicional_id: number;
  orden?: number;
}

export interface UpdateAdicionalGrupoDto {
  orden?: number;
}

// Filtros para búsqueda
export interface FiltrosAdicionalGrupo {
  adicional_id?: number;
  grupo_adicional_id?: number;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// Respuestas de la API
export interface AdicionalGrupoResponse {
  success: boolean;
  data: AdicionalGrupo;
  message?: string;
}

export interface AdicionalesGrupoResponse {
  success: boolean;
  data: AdicionalGrupo[];
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
export interface EstadisticasAdicionalGrupo {
  total_relaciones: number;
  grupos_con_adicionales: number;
  adicionales_en_grupos: number;
  promedio_adicionales_por_grupo: number;
  grupos_mas_populares: Array<{
    grupo_id: number;
    grupo_nombre: string;
    cantidad_adicionales: number;
  }>;
  adicionales_mas_usados: Array<{
    adicional_id: number;
    adicional_nombre: string;
    cantidad_grupos: number;
  }>;
}

// Configuración de ordenamiento masivo
export interface ConfiguracionOrdenAdicionalGrupo {
  relaciones_orden: Array<{
    id: number;
    orden: number;
  }>;
}

// Agrupación por grupo adicional
export interface AdicionalPorGrupo {
  grupo_adicional_id: number;
  grupo_nombre: string;
  grupo_descripcion: string | null;
  adicionales: AdicionalGrupo[];
}

// Agrupación por adicional
export interface GrupoPorAdicional {
  adicional_id: number;
  adicional_nombre: string;
  adicional_descripcion: string | null;
  grupos: AdicionalGrupo[];
}

// Constantes
export const OPCIONES_ORDEN_ADICIONAL_GRUPO = [
  { value: 'orden', label: 'Orden' },
  { value: 'created_at', label: 'Fecha de creación' },
  { value: 'adicional_id', label: 'ID Adicional' },
  { value: 'grupo_adicional_id', label: 'ID Grupo' },
] as const;

export const DIRECCIONES_ORDEN_ADICIONAL_GRUPO = [
  { value: 'asc', label: 'Ascendente' },
  { value: 'desc', label: 'Descendente' },
] as const;

export type OpcionOrdenAdicionalGrupo =
  (typeof OPCIONES_ORDEN_ADICIONAL_GRUPO)[number]['value'];
export type DireccionOrdenAdicionalGrupo =
  (typeof DIRECCIONES_ORDEN_ADICIONAL_GRUPO)[number]['value'];

// Funciones utilitarias
export function validarAdicionalGrupo(
  data: CreateAdicionalGrupoDto | UpdateAdicionalGrupoDto
): string[] {
  const errores: string[] = [];

  if ('adicional_id' in data) {
    if (!data.adicional_id || data.adicional_id <= 0) {
      errores.push('El ID del adicional es requerido y debe ser mayor a 0');
    }
  }

  if ('grupo_adicional_id' in data) {
    if (!data.grupo_adicional_id || data.grupo_adicional_id <= 0) {
      errores.push(
        'El ID del grupo adicional es requerido y debe ser mayor a 0'
      );
    }
  }

  if (data.orden !== undefined && data.orden !== null && data.orden < 0) {
    errores.push('El orden no puede ser negativo');
  }

  return errores;
}

export function validarRelacionExistente(
  relaciones: AdicionalGrupo[],
  adicionalId: number,
  grupoId: number
): boolean {
  return relaciones.some(
    (rel) =>
      rel.adicional_id === adicionalId && rel.grupo_adicional_id === grupoId
  );
}

export function obtenerSiguienteOrden(
  relaciones: AdicionalGrupo[],
  grupoId: number
): number {
  const relacionesDelGrupo = relaciones.filter(
    (rel) => rel.grupo_adicional_id === grupoId
  );
  if (relacionesDelGrupo.length === 0) {
    return 1;
  }

  const maxOrden = Math.max(...relacionesDelGrupo.map((rel) => rel.orden));
  return maxOrden + 1;
}

export function agruparPorGrupoAdicional(
  relaciones: AdicionalGrupo[]
): AdicionalPorGrupo[] {
  const grupos = new Map<number, AdicionalPorGrupo>();

  relaciones.forEach((relacion) => {
    const grupoId = relacion.grupo_adicional_id;

    if (!grupos.has(grupoId)) {
      grupos.set(grupoId, {
        grupo_adicional_id: grupoId,
        grupo_nombre: relacion.grupo_adicional?.nombre || `Grupo ${grupoId}`,
        grupo_descripcion: relacion.grupo_adicional?.descripcion || null,
        adicionales: [],
      });
    }

    grupos.get(grupoId)!.adicionales.push(relacion);
  });

  return Array.from(grupos.values()).map((grupo) => ({
    ...grupo,
    adicionales: grupo.adicionales.sort((a, b) => a.orden - b.orden),
  }));
}

export function agruparPorAdicional(
  relaciones: AdicionalGrupo[]
): GrupoPorAdicional[] {
  const adicionales = new Map<number, GrupoPorAdicional>();

  relaciones.forEach((relacion) => {
    const adicionalId = relacion.adicional_id;

    if (!adicionales.has(adicionalId)) {
      adicionales.set(adicionalId, {
        adicional_id: adicionalId,
        adicional_nombre:
          relacion.adicional?.nombre || `Adicional ${adicionalId}`,
        adicional_descripcion: relacion.adicional?.descripcion || null,
        grupos: [],
      });
    }

    adicionales.get(adicionalId)!.grupos.push(relacion);
  });

  return Array.from(adicionales.values());
}

export function ordenarPorOrden(
  relaciones: AdicionalGrupo[]
): AdicionalGrupo[] {
  return [...relaciones].sort((a, b) => {
    // Primero por grupo, luego por orden
    if (a.grupo_adicional_id !== b.grupo_adicional_id) {
      return a.grupo_adicional_id - b.grupo_adicional_id;
    }
    return a.orden - b.orden;
  });
}

export function filtrarPorGrupo(
  relaciones: AdicionalGrupo[],
  grupoId: number
): AdicionalGrupo[] {
  return relaciones.filter((rel) => rel.grupo_adicional_id === grupoId);
}

export function filtrarPorAdicional(
  relaciones: AdicionalGrupo[],
  adicionalId: number
): AdicionalGrupo[] {
  return relaciones.filter((rel) => rel.adicional_id === adicionalId);
}

export function obtenerAdicionalesDeGrupo(
  relaciones: AdicionalGrupo[],
  grupoId: number
): AdicionalDetalle[] {
  return relaciones
    .filter((rel) => rel.grupo_adicional_id === grupoId && rel.adicional)
    .sort((a, b) => a.orden - b.orden)
    .map((rel) => rel.adicional!);
}

export function obtenerGruposDeAdicional(
  relaciones: AdicionalGrupo[],
  adicionalId: number
): GrupoAdicionalDetalle[] {
  return relaciones
    .filter((rel) => rel.adicional_id === adicionalId && rel.grupo_adicional)
    .map((rel) => rel.grupo_adicional!);
}

export function calcularEstadisticas(
  relaciones: AdicionalGrupo[]
): EstadisticasAdicionalGrupo {
  const gruposUnicos = new Set(relaciones.map((rel) => rel.grupo_adicional_id));
  const adicionalesUnicos = new Set(relaciones.map((rel) => rel.adicional_id));

  // Grupos más populares (con más adicionales)
  const grupoContador = new Map<number, { nombre: string; count: number }>();
  relaciones.forEach((rel) => {
    const grupoId = rel.grupo_adicional_id;
    const nombre = rel.grupo_adicional?.nombre || `Grupo ${grupoId}`;

    if (!grupoContador.has(grupoId)) {
      grupoContador.set(grupoId, { nombre, count: 0 });
    }
    grupoContador.get(grupoId)!.count++;
  });

  // Adicionales más usados (en más grupos)
  const adicionalContador = new Map<
    number,
    { nombre: string; count: number }
  >();
  relaciones.forEach((rel) => {
    const adicionalId = rel.adicional_id;
    const nombre = rel.adicional?.nombre || `Adicional ${adicionalId}`;

    if (!adicionalContador.has(adicionalId)) {
      adicionalContador.set(adicionalId, { nombre, count: 0 });
    }
    adicionalContador.get(adicionalId)!.count++;
  });

  const grupos_mas_populares = Array.from(grupoContador.entries())
    .map(([id, data]) => ({
      grupo_id: id,
      grupo_nombre: data.nombre,
      cantidad_adicionales: data.count,
    }))
    .sort((a, b) => b.cantidad_adicionales - a.cantidad_adicionales)
    .slice(0, 10);

  const adicionales_mas_usados = Array.from(adicionalContador.entries())
    .map(([id, data]) => ({
      adicional_id: id,
      adicional_nombre: data.nombre,
      cantidad_grupos: data.count,
    }))
    .sort((a, b) => b.cantidad_grupos - a.cantidad_grupos)
    .slice(0, 10);

  return {
    total_relaciones: relaciones.length,
    grupos_con_adicionales: gruposUnicos.size,
    adicionales_en_grupos: adicionalesUnicos.size,
    promedio_adicionales_por_grupo:
      gruposUnicos.size > 0 ? relaciones.length / gruposUnicos.size : 0,
    grupos_mas_populares,
    adicionales_mas_usados,
  };
}

export function reordenarRelaciones(
  relaciones: AdicionalGrupo[],
  grupoId: number,
  nuevosOrdenes: Array<{ id: number; orden: number }>
): AdicionalGrupo[] {
  return relaciones.map((rel) => {
    if (rel.grupo_adicional_id === grupoId) {
      const nuevoOrden = nuevosOrdenes.find((o) => o.id === rel.id);
      if (nuevoOrden) {
        return { ...rel, orden: nuevoOrden.orden };
      }
    }
    return rel;
  });
}

export function validarOrdenUnico(
  relaciones: AdicionalGrupo[],
  grupoId: number,
  orden: number,
  excludeId?: number
): boolean {
  return !relaciones.some(
    (rel) =>
      rel.grupo_adicional_id === grupoId &&
      rel.orden === orden &&
      rel.id !== excludeId
  );
}

export function normalizarOrdenes(
  relaciones: AdicionalGrupo[],
  grupoId: number
): AdicionalGrupo[] {
  const relacionesDelGrupo = relaciones
    .filter((rel) => rel.grupo_adicional_id === grupoId)
    .sort((a, b) => a.orden - b.orden);

  const relacionesActualizadas = relacionesDelGrupo.map((rel, index) => ({
    ...rel,
    orden: index + 1,
  }));

  return relaciones.map((rel) => {
    if (rel.grupo_adicional_id === grupoId) {
      const actualizada = relacionesActualizadas.find((r) => r.id === rel.id);
      return actualizada || rel;
    }
    return rel;
  });
}

export function formatearRelacion(relacion: AdicionalGrupo): string {
  const adicionalNombre =
    relacion.adicional?.nombre || `Adicional ${relacion.adicional_id}`;
  const grupoNombre =
    relacion.grupo_adicional?.nombre || `Grupo ${relacion.grupo_adicional_id}`;
  return `${adicionalNombre} → ${grupoNombre} (Orden: ${relacion.orden})`;
}

export function buscarRelaciones(
  relaciones: AdicionalGrupo[],
  termino: string
): AdicionalGrupo[] {
  const terminoLower = termino.toLowerCase();

  return relaciones.filter((rel) => {
    const adicionalNombre = rel.adicional?.nombre?.toLowerCase() || '';
    const grupoNombre = rel.grupo_adicional?.nombre?.toLowerCase() || '';
    const adicionalDescripcion =
      rel.adicional?.descripcion?.toLowerCase() || '';
    const grupoDescripcion =
      rel.grupo_adicional?.descripcion?.toLowerCase() || '';

    return (
      adicionalNombre.includes(terminoLower) ||
      grupoNombre.includes(terminoLower) ||
      adicionalDescripcion.includes(terminoLower) ||
      grupoDescripcion.includes(terminoLower)
    );
  });
}
