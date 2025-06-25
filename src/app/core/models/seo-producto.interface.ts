export interface SeoProducto {
  id: number;
  producto_id: number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  canonical_url?: string;
  schema_markup?: string | object;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  created_at?: string;
  updated_at?: string;

  // URLs completas
  canonical_url_completa?: string;
  og_image_url?: string;

  // Información calculada
  meta_title_length: number;
  meta_description_length: number;
  keywords_array: string[];
  keywords_count: number;

  // Validaciones SEO
  validaciones_seo: ValidacionesSeo;

  // Recomendaciones
  recomendaciones: string[];

  // Relaciones
  producto?: ProductoSeo;

  // Datos de Open Graph estructurados
  open_graph: OpenGraphData;

  // Schema.org estructurado
  schema_org?: SchemaOrgData;
}

export interface ValidacionesSeo {
  meta_title_valido: boolean;
  meta_description_valida: boolean;
  tiene_keywords: boolean;
  tiene_og_tags: boolean;
  tiene_canonical: boolean;
  schema_markup_valido: boolean;
  configuracion_completa: boolean;
  optimizado_basico: boolean;
}

export interface ProductoSeo {
  id: number;
  nombre: string;
  slug?: string;
  descripcion?: string;
  precio: number;
  activo: boolean;
  disponible: boolean;
}

export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type: string;
}

export interface SchemaOrgData {
  '@context': string;
  '@type': string;
  name?: string;
  description?: string;
  image?: string;
  sku?: string;
  offers?: SchemaOffer;
  brand?: SchemaBrand;
  category?: string;
  [key: string]: any;
}

export interface SchemaOffer {
  '@type': string;
  price: string | number;
  priceCurrency: string;
  availability: string;
  seller?: SchemaOrganization;
}

export interface SchemaBrand {
  '@type': string;
  name: string;
}

export interface SchemaOrganization {
  '@type': string;
  name: string;
}

export interface AnalisisSeo {
  puntuacion_general: number;
  elementos_optimizados: string[];
  elementos_faltantes: string[];
  recomendaciones_prioritarias: RecomendacionPrioritaria[];
  comparacion_competencia: ComparacionCompetencia;
}

export interface RecomendacionPrioritaria {
  prioridad: PrioridadRecomendacion;
  elemento: string;
  accion: string;
}

export interface ComparacionCompetencia {
  posicion_estimada: number;
  competidores_analizados: number;
  puntuacion_promedio_competencia: number;
  areas_mejora: string[];
}

// DTOs para operaciones CRUD
export interface CreateSeoProductoDto {
  producto_id: number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  canonical_url?: string;
  schema_markup?: string | object;
  og_title?: string;
  og_description?: string;
  og_image?: File;
}

export interface UpdateSeoProductoDto
  extends Partial<Omit<CreateSeoProductoDto, 'producto_id'>> {}

export interface GenerarSeoAutomaticoDto {
  producto_id: number;
}

export interface OptimizarMasivoDto {
  productos_ids: number[];
  sobrescribir?: boolean;
}

// Filtros y paginación
export interface FiltrosSeoProducto {
  producto_id?: number;
  search?: string;
  sin_meta_title?: boolean;
  sin_meta_description?: boolean;
  optimizado?: boolean;
  per_page?: number;
  page?: number;
}

export interface PaginacionSeoProducto {
  total: number;
  per_page: number;
  current_page: number;
  last_page?: number;
  from?: number;
  to?: number;
}

export interface SeoProductoResponse {
  data: SeoProducto[];
  meta: PaginacionSeoProducto;
}

export interface OptimizacionMasivaResponse {
  message: string;
  productos_optimizados: number;
  productos_omitidos: number;
}

export interface AnalisisSeoResponse {
  analisis: AnalisisSeo;
  seo_producto: SeoProducto;
}

// Tipos y enums
export type PrioridadRecomendacion = 'alta' | 'media' | 'baja';

export type TipoValidacionSeo =
  | 'meta_title_valido'
  | 'meta_description_valida'
  | 'tiene_keywords'
  | 'tiene_og_tags'
  | 'tiene_canonical'
  | 'schema_markup_valido'
  | 'configuracion_completa'
  | 'optimizado_basico';

export type EstadoOptimizacion =
  | 'completo'
  | 'basico'
  | 'parcial'
  | 'sin_optimizar';

// Constantes
export const LIMITES_SEO = {
  META_TITLE_MIN: 30,
  META_TITLE_MAX: 60,
  META_DESCRIPTION_MIN: 120,
  META_DESCRIPTION_MAX: 160,
  KEYWORDS_MIN: 3,
  KEYWORDS_MAX: 10,
  OG_TITLE_MAX: 60,
  OG_DESCRIPTION_MAX: 160,
} as const;

export const PRIORIDADES_COLORES: Record<PrioridadRecomendacion, string> = {
  alta: 'text-red-600',
  media: 'text-yellow-600',
  baja: 'text-blue-600',
};

export const PRIORIDADES_BADGES: Record<PrioridadRecomendacion, string> = {
  alta: 'bg-red-100 text-red-800',
  media: 'bg-yellow-100 text-yellow-800',
  baja: 'bg-blue-100 text-blue-800',
};

export const ESTADOS_OPTIMIZACION_COLORES: Record<EstadoOptimizacion, string> =
  {
    completo: 'text-green-600',
    basico: 'text-blue-600',
    parcial: 'text-yellow-600',
    sin_optimizar: 'text-red-600',
  };

export const ESTADOS_OPTIMIZACION_BADGES: Record<EstadoOptimizacion, string> = {
  completo: 'bg-green-100 text-green-800',
  basico: 'bg-blue-100 text-blue-800',
  parcial: 'bg-yellow-100 text-yellow-800',
  sin_optimizar: 'bg-red-100 text-red-800',
};

export const SCHEMA_AVAILABILITY = {
  IN_STOCK: 'https://schema.org/InStock',
  OUT_OF_STOCK: 'https://schema.org/OutOfStock',
  LIMITED_AVAILABILITY: 'https://schema.org/LimitedAvailability',
  DISCONTINUED: 'https://schema.org/Discontinued',
} as const;

// Funciones utilitarias
export function esMetaTitleValido(metaTitle?: string): boolean {
  if (!metaTitle) return false;
  const length = metaTitle.length;
  return (
    length >= LIMITES_SEO.META_TITLE_MIN && length <= LIMITES_SEO.META_TITLE_MAX
  );
}

export function esMetaDescriptionValida(metaDescription?: string): boolean {
  if (!metaDescription) return false;
  const length = metaDescription.length;
  return (
    length >= LIMITES_SEO.META_DESCRIPTION_MIN &&
    length <= LIMITES_SEO.META_DESCRIPTION_MAX
  );
}

export function tieneKeywords(metaKeywords?: string): boolean {
  if (!metaKeywords) return false;
  const keywords = obtenerKeywordsArray(metaKeywords);
  return keywords.length >= LIMITES_SEO.KEYWORDS_MIN;
}

export function tieneOgTags(ogTitle?: string, ogDescription?: string): boolean {
  return !!(ogTitle && ogDescription);
}

export function tieneCanonical(canonicalUrl?: string): boolean {
  return !!canonicalUrl;
}

export function esSchemaMarkupValido(schemaMarkup?: string | object): boolean {
  if (!schemaMarkup) return false;

  if (typeof schemaMarkup === 'string') {
    try {
      const parsed = JSON.parse(schemaMarkup);
      return typeof parsed === 'object' && parsed !== null;
    } catch {
      return false;
    }
  }

  return typeof schemaMarkup === 'object' && schemaMarkup !== null;
}

export function esConfiguracionCompleta(seoProducto: SeoProducto): boolean {
  return (
    esMetaTitleValido(seoProducto.meta_title) &&
    esMetaDescriptionValida(seoProducto.meta_description) &&
    tieneKeywords(seoProducto.meta_keywords) &&
    tieneOgTags(seoProducto.og_title, seoProducto.og_description) &&
    tieneCanonical(seoProducto.canonical_url)
  );
}

export function esOptimizadoBasico(seoProducto: SeoProducto): boolean {
  return !!(
    seoProducto.meta_title &&
    seoProducto.meta_description &&
    seoProducto.canonical_url
  );
}

export function obtenerKeywordsArray(metaKeywords?: string): string[] {
  if (!metaKeywords) return [];
  return metaKeywords
    .split(',')
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
}

export function obtenerEstadoOptimizacion(
  seoProducto: SeoProducto
): EstadoOptimizacion {
  if (esConfiguracionCompleta(seoProducto)) {
    return 'completo';
  } else if (esOptimizadoBasico(seoProducto)) {
    return 'basico';
  } else if (seoProducto.meta_title || seoProducto.meta_description) {
    return 'parcial';
  } else {
    return 'sin_optimizar';
  }
}

export function calcularPuntuacionSeo(seoProducto: SeoProducto): number {
  let puntuacion = 0;

  if (esMetaTitleValido(seoProducto.meta_title)) puntuacion += 20;
  if (esMetaDescriptionValida(seoProducto.meta_description)) puntuacion += 20;
  if (tieneKeywords(seoProducto.meta_keywords)) puntuacion += 15;
  if (tieneCanonical(seoProducto.canonical_url)) puntuacion += 15;
  if (tieneOgTags(seoProducto.og_title, seoProducto.og_description))
    puntuacion += 15;
  if (esSchemaMarkupValido(seoProducto.schema_markup)) puntuacion += 15;

  return puntuacion;
}

export function obtenerColorPrioridad(
  prioridad: PrioridadRecomendacion
): string {
  return PRIORIDADES_COLORES[prioridad] || 'text-gray-600';
}

export function obtenerBadgePrioridad(
  prioridad: PrioridadRecomendacion
): string {
  return PRIORIDADES_BADGES[prioridad] || 'bg-gray-100 text-gray-800';
}

export function obtenerColorEstadoOptimizacion(
  estado: EstadoOptimizacion
): string {
  return ESTADOS_OPTIMIZACION_COLORES[estado] || 'text-gray-600';
}

export function obtenerBadgeEstadoOptimizacion(
  estado: EstadoOptimizacion
): string {
  return ESTADOS_OPTIMIZACION_BADGES[estado] || 'bg-gray-100 text-gray-800';
}

export function formatearPuntuacionSeo(puntuacion: number): string {
  if (puntuacion >= 90) return 'Excelente';
  if (puntuacion >= 70) return 'Bueno';
  if (puntuacion >= 50) return 'Regular';
  if (puntuacion >= 30) return 'Deficiente';
  return 'Muy deficiente';
}

export function obtenerRecomendacionesBasicas(
  seoProducto: SeoProducto
): string[] {
  const recomendaciones: string[] = [];

  if (!esMetaTitleValido(seoProducto.meta_title)) {
    if (!seoProducto.meta_title) {
      recomendaciones.push('Agregar meta título para mejorar SEO');
    } else {
      const length = seoProducto.meta_title.length;
      if (length < LIMITES_SEO.META_TITLE_MIN) {
        recomendaciones.push(
          `Meta título muy corto (mínimo ${LIMITES_SEO.META_TITLE_MIN} caracteres)`
        );
      } else if (length > LIMITES_SEO.META_TITLE_MAX) {
        recomendaciones.push(
          `Meta título muy largo (máximo ${LIMITES_SEO.META_TITLE_MAX} caracteres)`
        );
      }
    }
  }

  if (!esMetaDescriptionValida(seoProducto.meta_description)) {
    if (!seoProducto.meta_description) {
      recomendaciones.push('Agregar meta descripción para mejorar CTR');
    } else {
      const length = seoProducto.meta_description.length;
      if (length < LIMITES_SEO.META_DESCRIPTION_MIN) {
        recomendaciones.push(
          `Meta descripción muy corta (mínimo ${LIMITES_SEO.META_DESCRIPTION_MIN} caracteres)`
        );
      } else if (length > LIMITES_SEO.META_DESCRIPTION_MAX) {
        recomendaciones.push(
          `Meta descripción muy larga (máximo ${LIMITES_SEO.META_DESCRIPTION_MAX} caracteres)`
        );
      }
    }
  }

  if (!tieneKeywords(seoProducto.meta_keywords)) {
    recomendaciones.push('Agregar palabras clave relevantes al producto');
  }

  if (!tieneOgTags(seoProducto.og_title, seoProducto.og_description)) {
    recomendaciones.push('Configurar Open Graph tags para redes sociales');
  }

  if (!tieneCanonical(seoProducto.canonical_url)) {
    recomendaciones.push(
      'Definir URL canónica para evitar contenido duplicado'
    );
  }

  if (!esSchemaMarkupValido(seoProducto.schema_markup)) {
    recomendaciones.push('Implementar Schema.org markup para rich snippets');
  }

  return recomendaciones;
}

export function generarMetaTitleAutomatico(producto: ProductoSeo): string {
  let titulo = producto.nombre;
  if (titulo.length > 55) {
    titulo = titulo.substring(0, 52) + '...';
  }
  return `${titulo} | Tienda Virtual`;
}

export function generarMetaDescriptionAutomatica(
  producto: ProductoSeo
): string {
  const descripcion = producto.descripcion || producto.nombre;
  const precio = producto.precio.toFixed(2);

  let metaDesc = `Compra ${producto.nombre} por S/ ${precio}. `;
  metaDesc += descripcion.substring(0, 120);

  if (metaDesc.length > 155) {
    metaDesc = metaDesc.substring(0, 152) + '...';
  }

  return metaDesc;
}

export function generarKeywordsAutomaticas(producto: ProductoSeo): string {
  const keywords: string[] = [producto.nombre];

  // Agregar palabras del nombre del producto
  const palabras = producto.nombre.split(' ');
  palabras.forEach((palabra) => {
    if (palabra.length > 3) {
      keywords.push(palabra.toLowerCase());
    }
  });

  return Array.from(new Set(keywords)).join(', ');
}

export function generarCanonicalUrlAutomatica(producto: ProductoSeo): string {
  const slug =
    producto.slug || producto.nombre.toLowerCase().replace(/\s+/g, '-');
  return `/productos/${slug}`;
}

export function generarSchemaMarkupAutomatico(
  producto: ProductoSeo
): SchemaOrgData {
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: producto.nombre,
    description: producto.descripcion || producto.nombre,
    offers: {
      '@type': 'Offer',
      price: producto.precio.toString(),
      priceCurrency: 'PEN',
      availability: producto.disponible
        ? SCHEMA_AVAILABILITY.IN_STOCK
        : SCHEMA_AVAILABILITY.OUT_OF_STOCK,
      seller: {
        '@type': 'Organization',
        name: 'Tienda Virtual',
      },
    },
    brand: {
      '@type': 'Brand',
      name: 'Tienda Virtual',
    },
  };
}

export function validarMetaTitle(metaTitle: string): {
  valido: boolean;
  errores: string[];
  sugerencias: string[];
} {
  const errores: string[] = [];
  const sugerencias: string[] = [];

  if (!metaTitle) {
    errores.push('El meta título es requerido');
    return { valido: false, errores, sugerencias };
  }

  const length = metaTitle.length;

  if (length < LIMITES_SEO.META_TITLE_MIN) {
    errores.push(
      `Meta título muy corto (mínimo ${LIMITES_SEO.META_TITLE_MIN} caracteres)`
    );
  } else if (length > LIMITES_SEO.META_TITLE_MAX) {
    errores.push(
      `Meta título muy largo (máximo ${LIMITES_SEO.META_TITLE_MAX} caracteres)`
    );
  }

  if (!metaTitle.includes('|')) {
    sugerencias.push(
      'Considera agregar el nombre de la marca separado por "|"'
    );
  }

  if (!/[A-Z]/.test(metaTitle)) {
    sugerencias.push('Considera usar mayúsculas para mejorar la legibilidad');
  }

  return {
    valido: errores.length === 0,
    errores,
    sugerencias,
  };
}

export function validarMetaDescription(metaDescription: string): {
  valido: boolean;
  errores: string[];
  sugerencias: string[];
} {
  const errores: string[] = [];
  const sugerencias: string[] = [];

  if (!metaDescription) {
    errores.push('La meta descripción es requerida');
    return { valido: false, errores, sugerencias };
  }

  const length = metaDescription.length;

  if (length < LIMITES_SEO.META_DESCRIPTION_MIN) {
    errores.push(
      `Meta descripción muy corta (mínimo ${LIMITES_SEO.META_DESCRIPTION_MIN} caracteres)`
    );
  } else if (length > LIMITES_SEO.META_DESCRIPTION_MAX) {
    errores.push(
      `Meta descripción muy larga (máximo ${LIMITES_SEO.META_DESCRIPTION_MAX} caracteres)`
    );
  }

  if (!metaDescription.includes('S/') && !metaDescription.includes('precio')) {
    sugerencias.push('Considera incluir información de precio');
  }

  if (!metaDescription.includes('.')) {
    sugerencias.push('Considera usar puntos para mejorar la legibilidad');
  }

  return {
    valido: errores.length === 0,
    errores,
    sugerencias,
  };
}

export function agruparPorEstadoOptimizacion(
  seoProductos: SeoProducto[]
): Record<EstadoOptimizacion, SeoProducto[]> {
  return seoProductos.reduce((acc, seoProducto) => {
    const estado = obtenerEstadoOptimizacion(seoProducto);
    if (!acc[estado]) {
      acc[estado] = [];
    }
    acc[estado].push(seoProducto);
    return acc;
  }, {} as Record<EstadoOptimizacion, SeoProducto[]>);
}

export function filtrarPorEstadoOptimizacion(
  seoProductos: SeoProducto[],
  estado: EstadoOptimizacion
): SeoProducto[] {
  return seoProductos.filter(
    (seoProducto) => obtenerEstadoOptimizacion(seoProducto) === estado
  );
}

export function filtrarSinOptimizar(
  seoProductos: SeoProducto[]
): SeoProducto[] {
  return seoProductos.filter(
    (seoProducto) => obtenerEstadoOptimizacion(seoProducto) === 'sin_optimizar'
  );
}

export function filtrarOptimizadosCompletos(
  seoProductos: SeoProducto[]
): SeoProducto[] {
  return seoProductos.filter(
    (seoProducto) => obtenerEstadoOptimizacion(seoProducto) === 'completo'
  );
}

export function ordenarPorPuntuacion(
  seoProductos: SeoProducto[],
  direccion: 'asc' | 'desc' = 'desc'
): SeoProducto[] {
  return [...seoProductos].sort((a, b) => {
    const puntuacionA = calcularPuntuacionSeo(a);
    const puntuacionB = calcularPuntuacionSeo(b);
    return direccion === 'asc'
      ? puntuacionA - puntuacionB
      : puntuacionB - puntuacionA;
  });
}

export function buscarSeoProductos(
  seoProductos: SeoProducto[],
  termino: string
): SeoProducto[] {
  if (!termino.trim()) return seoProductos;

  const terminoLower = termino.toLowerCase();

  return seoProductos.filter(
    (seoProducto) =>
      seoProducto.producto?.nombre?.toLowerCase().includes(terminoLower) ||
      seoProducto.meta_title?.toLowerCase().includes(terminoLower) ||
      seoProducto.meta_description?.toLowerCase().includes(terminoLower) ||
      seoProducto.meta_keywords?.toLowerCase().includes(terminoLower)
  );
}

export function obtenerEstadisticasSeo(seoProductos: SeoProducto[]): {
  total: number;
  completos: number;
  basicos: number;
  parciales: number;
  sin_optimizar: number;
  puntuacion_promedio: number;
  con_meta_title: number;
  con_meta_description: number;
  con_keywords: number;
  con_canonical: number;
  con_og_tags: number;
  con_schema: number;
} {
  const total = seoProductos.length;
  const agrupados = agruparPorEstadoOptimizacion(seoProductos);

  const puntuaciones = seoProductos.map((seo) => calcularPuntuacionSeo(seo));
  const puntuacion_promedio =
    puntuaciones.length > 0
      ? puntuaciones.reduce((sum, p) => sum + p, 0) / puntuaciones.length
      : 0;

  return {
    total,
    completos: agrupados.completo?.length || 0,
    basicos: agrupados.basico?.length || 0,
    parciales: agrupados.parcial?.length || 0,
    sin_optimizar: agrupados.sin_optimizar?.length || 0,
    puntuacion_promedio: Math.round(puntuacion_promedio),
    con_meta_title: seoProductos.filter((seo) => !!seo.meta_title).length,
    con_meta_description: seoProductos.filter((seo) => !!seo.meta_description)
      .length,
    con_keywords: seoProductos.filter((seo) => tieneKeywords(seo.meta_keywords))
      .length,
    con_canonical: seoProductos.filter((seo) =>
      tieneCanonical(seo.canonical_url)
    ).length,
    con_og_tags: seoProductos.filter((seo) =>
      tieneOgTags(seo.og_title, seo.og_description)
    ).length,
    con_schema: seoProductos.filter((seo) =>
      esSchemaMarkupValido(seo.schema_markup)
    ).length,
  };
}

export function exportarSeoCSV(seoProductos: SeoProducto[]): string {
  if (seoProductos.length === 0) return '';

  const headers = [
    'ID',
    'Producto',
    'Meta Title',
    'Meta Description',
    'Keywords',
    'URL Canónica',
    'OG Title',
    'OG Description',
    'Estado Optimización',
    'Puntuación SEO',
    'Recomendaciones',
  ];

  const rows = seoProductos.map((seo) => [
    seo.id,
    seo.producto?.nombre || '',
    seo.meta_title || '',
    seo.meta_description || '',
    seo.meta_keywords || '',
    seo.canonical_url || '',
    seo.og_title || '',
    seo.og_description || '',
    obtenerEstadoOptimizacion(seo),
    calcularPuntuacionSeo(seo),
    seo.recomendaciones.join('; '),
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');
}
