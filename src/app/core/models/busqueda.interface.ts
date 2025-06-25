import { PaginatedResponse } from './common.interface';

// Tipos de ordenamiento disponibles
export type TipoOrdenamiento =
  | 'relevancia'
  | 'precio_asc'
  | 'precio_desc'
  | 'nombre'
  | 'fecha'
  | 'popularidad'
  | 'calificacion';

// Interface para búsqueda general
export interface BusquedaGeneralRequest {
  q: string; // término de búsqueda
  categoria?: number;
  precio_min?: number;
  precio_max?: number;
  marca?: string;
  ordenar_por?: TipoOrdenamiento;
  page?: number;
  per_page?: number;
}

export interface ProductoBusqueda {
  id: number;
  nombre: string;
  descripcion?: string;
  sku: string;
  marca: string;
  modelo?: string;
  precio: number;
  precio_oferta?: number;
  imagen_principal?: string;
  activo: boolean;
  categoria: {
    id: number;
    nombre: string;
    slug: string;
  };
  comentarios_count?: number;
  comentarios_avg_calificacion?: number;
}

export interface SugerenciaBusqueda {
  termino: string;
  tipo: 'correccion' | 'relacionado' | 'popular';
}

export interface BusquedaGeneralResponse {
  success: boolean;
  data: {
    productos: ProductoBusqueda[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    termino_busqueda: string;
    total_resultados: number;
    sugerencias: SugerenciaBusqueda[];
    tiempo_busqueda: string;
  };
  message?: string;
}

// Interface para búsqueda avanzada
export interface BusquedaAvanzadaRequest {
  termino?: string;
  categorias?: number[];
  precio_min?: number;
  precio_max?: number;
  marcas?: string[];
  con_descuento?: boolean;
  en_stock?: boolean;
  calificacion_min?: number;
  atributos?: Record<string, any>;
  ordenar_por?: TipoOrdenamiento;
  page?: number;
  per_page?: number;
}

export interface FiltrosDisponiblesBusqueda {
  marcas_disponibles: string[];
  categorias_disponibles: string[];
  rango_precios: {
    min: number;
    max: number;
  };
}

export interface BusquedaAvanzadaResponse {
  success: boolean;
  data: {
    productos: ProductoBusqueda[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    filtros_aplicados: BusquedaAvanzadaRequest;
    filtros_disponibles: FiltrosDisponiblesBusqueda;
    total_resultados: number;
  };
  message?: string;
}

// Interface para autocompletado
export interface AutocompletadoRequest {
  q: string;
}

export interface ProductoAutocompletado {
  id: number;
  nombre: string;
  marca: string;
  precio: number;
  imagen_principal?: string;
}

export interface CategoriaAutocompletado {
  id: number;
  nombre: string;
  slug: string;
}

export interface AutocompletadoResponse {
  success: boolean;
  data: {
    productos: ProductoAutocompletado[];
    categorias: CategoriaAutocompletado[];
    marcas: string[];
    busquedas_populares: string[];
    termino: string;
  };
  message?: string;
}

// Interface para términos populares
export interface TerminoPopular {
  termino: string;
  count: number;
}

export interface TerminosPopularesResponse {
  success: boolean;
  data: TerminoPopular[];
}

// Interface para filtros disponibles
export interface CategoriaFiltro {
  id: number;
  nombre: string;
  slug: string;
  productos_count: number;
}

export interface MarcaFiltro {
  marca: string;
  productos_count: number;
}

export interface RangoPrecio {
  min: number;
  max?: number;
  label: string;
}

export interface OpcionOrdenamiento {
  value: TipoOrdenamiento;
  label: string;
}

export interface FiltrosDisponiblesResponse {
  success: boolean;
  data: {
    categorias: CategoriaFiltro[];
    marcas: MarcaFiltro[];
    rangos_precios: RangoPrecio[];
    opciones_ordenamiento: OpcionOrdenamiento[];
  };
}

// Interface para estadísticas de búsqueda
export interface TerminoEstadistica {
  termino: string;
  busquedas: number;
}

export interface CategoriaEstadistica {
  categoria: string;
  porcentaje: number;
}

export interface EstadisticasBusqueda {
  total_busquedas_hoy: number;
  total_busquedas_mes: number;
  promedio_resultados: number;
  terminos_sin_resultados: number;
  tasa_conversion_busqueda: number;
  top_terminos_hoy: TerminoEstadistica[];
  categorias_mas_buscadas: CategoriaEstadistica[];
}

export interface EstadisticasBusquedaResponse {
  success: boolean;
  data: EstadisticasBusqueda;
}

// Interface para configuración del servicio
export interface ConfiguracionServicioBusqueda {
  cache_duracion_minutos: number;
  autocompletado_debounce_ms: number;
  max_sugerencias: number;
  min_caracteres_busqueda: number;
  max_resultados_autocompletado: number;
  guardar_historial: boolean;
  max_historial_items: number;
  filtros_inteligentes: boolean;
  busqueda_fuzzy: boolean;
}

// Eventos del servicio
export interface EventoBusqueda {
  tipo:
    | 'busqueda_realizada'
    | 'autocompletado_usado'
    | 'filtro_aplicado'
    | 'ordenamiento_cambiado'
    | 'termino_sin_resultados'
    | 'producto_seleccionado'
    | 'historial_actualizado'
    | 'cache_actualizado';
  data?: any;
  timestamp: Date;
}

// Interface para historial de búsquedas
export interface ElementoHistorial {
  id: string;
  termino: string;
  filtros?: BusquedaAvanzadaRequest;
  resultados_total: number;
  fecha: string;
  tiempo_busqueda: number;
  seleccionado?: boolean;
}

export interface HistorialBusquedas {
  items: ElementoHistorial[];
  total: number;
  terminos_frecuentes: string[];
  ultima_actualizacion: string;
}

// Interface para filtros dinámicos
export interface FiltroAplicado {
  tipo:
    | 'categoria'
    | 'marca'
    | 'precio'
    | 'descuento'
    | 'stock'
    | 'calificacion';
  campo: string;
  valor: any;
  label: string;
  activo: boolean;
}

export interface GrupoFiltros {
  nombre: string;
  filtros: FiltroAplicado[];
  expandido: boolean;
}

// Interface para estado de búsqueda
export interface EstadoBusqueda {
  termino_actual: string;
  filtros_aplicados: BusquedaAvanzadaRequest;
  resultados_total: number;
  productos_cargados: ProductoBusqueda[];
  pagina_actual: number;
  ordenamiento_actual: TipoOrdenamiento;
  cargando: boolean;
  tiene_mas_resultados: boolean;
  ultima_busqueda: string;
}

// Interface para métricas de búsqueda
export interface MetricasBusqueda {
  total_busquedas: number;
  busquedas_exitosas: number;
  busquedas_sin_resultados: number;
  tasa_exito: number;
  tiempo_promedio_busqueda: number;
  terminos_mas_buscados: TerminoPopular[];
  conversiones_busqueda: number;
  tasa_conversion: number;
  dispositivos_mas_usados: {
    dispositivo: string;
    porcentaje: number;
  }[];
}

export interface MetricasBusquedaResponse {
  success: boolean;
  data: MetricasBusqueda;
}

// Interface para sugerencias inteligentes
export interface SugerenciaInteligente {
  tipo: 'ortografia' | 'sinonimo' | 'categoria' | 'marca' | 'complemento';
  texto_original: string;
  texto_sugerido: string;
  confianza: number; // 0-100
  razon: string;
  ejemplos?: string[];
}

export interface SugerenciasInteligentesResponse {
  success: boolean;
  data: SugerenciaInteligente[];
}

// Interface para análisis de consulta
export interface AnalisisConsulta {
  termino: string;
  intencion:
    | 'producto'
    | 'categoria'
    | 'marca'
    | 'precio'
    | 'comparacion'
    | 'informacion';
  entidades_detectadas: {
    tipo: string;
    valor: string;
    confianza: number;
  }[];
  filtros_sugeridos: BusquedaAvanzadaRequest;
  correcciones: string[];
  complejidad: 'simple' | 'media' | 'compleja';
}

export interface AnalisisConsultaResponse {
  success: boolean;
  data: AnalisisConsulta;
}

// Interface para búsqueda por voz
export interface BusquedaVozRequest {
  audio_base64: string;
  idioma?: string;
  formato?: 'wav' | 'mp3' | 'ogg';
}

export interface BusquedaVozResponse {
  success: boolean;
  data: {
    texto_transcrito: string;
    confianza: number;
    busqueda_sugerida: BusquedaGeneralRequest;
  };
  message?: string;
}

// Interface para búsqueda por imagen
export interface BusquedaImagenRequest {
  imagen_base64: string;
  tipo_busqueda: 'similar' | 'texto' | 'objeto';
}

export interface BusquedaImagenResponse {
  success: boolean;
  data: {
    productos_similares: ProductoBusqueda[];
    texto_detectado?: string;
    objetos_detectados?: string[];
    confianza: number;
  };
  message?: string;
}

// Interface para personalización de búsqueda
export interface PreferenciasBusqueda {
  categorias_favoritas: number[];
  marcas_favoritas: string[];
  rango_precio_preferido: {
    min: number;
    max: number;
  };
  ordenamiento_preferido: TipoOrdenamiento;
  filtros_automaticos: boolean;
  sugerencias_personalizadas: boolean;
  historial_limitado: boolean;
}

export interface PersonalizacionBusqueda {
  usuario_id?: string;
  preferencias: PreferenciasBusqueda;
  historial_comportamiento: {
    productos_vistos: number[];
    categorias_exploradas: number[];
    marcas_consultadas: string[];
    terminos_frecuentes: string[];
  };
  puntuaciones_relevancia: Record<string, number>;
}

// Interface para cache de búsqueda
export interface CacheBusqueda {
  key: string;
  datos: any;
  timestamp: number;
  expira_en: number;
  tipo: 'busqueda' | 'autocompletado' | 'filtros' | 'estadisticas' | 'terminos';
  metadatos?: {
    termino?: string;
    filtros?: any;
    version?: string;
  };
}

// Interface para notificaciones de búsqueda
export interface NotificacionBusqueda {
  id: string;
  tipo:
    | 'nuevos_productos'
    | 'precio_rebajado'
    | 'stock_disponible'
    | 'termino_trending';
  titulo: string;
  mensaje: string;
  termino_relacionado?: string;
  productos_relacionados?: number[];
  fecha: string;
  leida: boolean;
  accion_disponible: boolean;
  url_accion?: string;
}

export interface NotificacionesBusquedaResponse {
  success: boolean;
  data: NotificacionBusqueda[];
}

// Interface para exportación de búsquedas
export interface ExportacionBusquedas {
  formato: 'csv' | 'xlsx' | 'json';
  incluir_historial: boolean;
  incluir_metricas: boolean;
  filtro_fechas?: {
    desde: string;
    hasta: string;
  };
  campos_personalizados?: string[];
}

export interface ExportacionBusquedasResponse {
  success: boolean;
  data: {
    url_descarga: string;
    nombre_archivo: string;
    total_registros: number;
    tiempo_expiracion: string;
  };
}

// Interface para configuración de la empresa
export interface ConfiguracionEmpresaBusqueda {
  nombre_tienda: string;
  categorias_destacadas: number[];
  marcas_destacadas: string[];
  productos_destacados: number[];
  terminos_prohibidos: string[];
  filtros_personalizados: {
    nombre: string;
    campo: string;
    opciones: any[];
  }[];
  algoritmo_relevancia: 'basico' | 'avanzado' | 'ml';
  busqueda_semantica: boolean;
}

export interface ConfiguracionEmpresaBusquedaResponse {
  success: boolean;
  data: ConfiguracionEmpresaBusqueda;
}

// Interface para A/B testing de búsqueda
export interface PruebaABBusqueda {
  id: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
  variantes: {
    id: string;
    nombre: string;
    porcentaje_trafico: number;
    configuracion: {
      algoritmo?: string;
      filtros_default?: any;
      ordenamiento_default?: TipoOrdenamiento;
      autocompletado_habilitado?: boolean;
    };
    metricas: {
      busquedas_totales: number;
      busquedas_exitosas: number;
      tiempo_promedio: number;
      conversiones: number;
    };
  }[];
  fecha_inicio: string;
  fecha_fin?: string;
  ganador?: string;
}

export interface PruebasABBusquedaResponse {
  success: boolean;
  data: PruebaABBusqueda[];
}

// Interface para geo-localización en búsquedas
export interface BusquedaGeoLocalizada {
  latitud: number;
  longitud: number;
  radio_km: number;
  incluir_envio_gratis?: boolean;
  incluir_tiendas_fisicas?: boolean;
}

export interface ResultadoGeoLocalizado {
  producto: ProductoBusqueda;
  distancia_km: number;
  tiendas_cercanas: {
    id: number;
    nombre: string;
    direccion: string;
    distancia_km: number;
    stock_disponible: boolean;
  }[];
  costo_envio?: number;
  tiempo_entrega_estimado?: string;
}

export interface BusquedaGeoLocalizadaResponse {
  success: boolean;
  data: {
    productos: ResultadoGeoLocalizado[];
    centro_busqueda: {
      latitud: number;
      longitud: number;
    };
    radio_efectivo: number;
  };
}

// Interface para tendencias de búsqueda
export interface TendenciaBusqueda {
  termino: string;
  busquedas_actuales: number;
  busquedas_anterior: number;
  cambio_porcentual: number;
  tendencia: 'creciente' | 'estable' | 'decreciente';
  categoria_principal: string;
  estacionalidad: 'alta' | 'media' | 'baja';
}

export interface TendenciasBusquedaResponse {
  success: boolean;
  data: {
    tendencias_actuales: TendenciaBusqueda[];
    periodo_analisis: {
      desde: string;
      hasta: string;
    };
    total_terminos_analizados: number;
  };
}

// Interface para comparación de productos
export interface ComparacionProductos {
  productos_ids: number[];
  criterios: string[];
}

export interface ProductoComparacion {
  producto: ProductoBusqueda;
  caracteristicas: Record<string, any>;
  puntuacion_total: number;
  ventajas: string[];
  desventajas: string[];
}

export interface ComparacionProductosResponse {
  success: boolean;
  data: {
    productos: ProductoComparacion[];
    criterios_comparacion: string[];
    recomendacion: {
      mejor_opcion: number;
      razon: string;
    };
  };
}

// Respuestas genéricas
export interface BusquedaResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Utilidades para el servicio
export interface UtilBusqueda {
  limpiarTermino: (termino: string) => string;
  validarTermino: (termino: string) => boolean;
  generarSlug: (texto: string) => string;
  destacarTermino: (texto: string, termino: string) => string;
  calcularRelevancia: (producto: ProductoBusqueda, termino: string) => number;
  extraerPalabrasClave: (texto: string) => string[];
  detectarIntencion: (termino: string) => string;
  corregirOrtografia: (termino: string) => string;
  calcularSimilitud: (texto1: string, texto2: string) => number;
  filtrarPalabrasClave: (palabras: string[]) => string[];
  formatearPrecio: (precio: number) => string;
  generarHashBusqueda: (request: any) => string;
}
