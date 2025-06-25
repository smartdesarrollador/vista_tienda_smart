/**
 * Interfaz para representar un favorito de usuario
 * Basada en la tabla 'favoritos' y respuesta del API
 */
export interface Favorito {
  id: number;
  user_id: number;
  producto_id: number;
  created_at: string;
  updated_at: string;
  agregado_hace: string;
  dias_favorito: number;
  usuario?: UsuarioFavorito;
  producto?: ProductoFavorito;
}

/**
 * Interfaz para los datos del usuario asociado al favorito
 */
export interface UsuarioFavorito {
  id: number;
  name: string;
  email: string;
  rol: string;
  avatar?: string;
}

/**
 * Interfaz para los datos del producto asociado al favorito
 */
export interface ProductoFavorito {
  id: number;
  nombre: string;
  slug: string;
  precio: number;
  precio_oferta?: number;
  imagen_principal: string;
  activo: boolean;
  stock: number;
  destacado: boolean;
  disponible: boolean;
  tiene_oferta: boolean;
  porcentaje_descuento?: number;
  categoria?: CategoriaFavorito;
}

/**
 * Interfaz para los datos de la categoría del producto favorito
 */
export interface CategoriaFavorito {
  id: number;
  nombre: string;
  slug: string;
}

/**
 * DTO para crear un nuevo favorito
 */
export interface CreateFavoritoDto {
  user_id: number;
  producto_id: number;
}

/**
 * DTO para actualizar un favorito existente (limitado)
 */
export interface UpdateFavoritoDto {
  // Principalmente para auditoría, pocos campos editables
  updated_at?: string;
}

/**
 * Interfaz para filtros de búsqueda de favoritos
 */
export interface FavoritoFilters {
  user_id?: number;
  producto_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  recientes?: number; // días
  categoria_id?: number;
  productos_activos?: boolean;
  productos_disponibles?: boolean;
  con_ofertas?: boolean;
  rango_precio?: string; // formato: "min-max"
  search?: string;
  sort_by?:
    | 'created_at'
    | 'updated_at'
    | 'user_id'
    | 'producto_id'
    | 'producto_nombre'
    | 'producto_precio';
  sort_direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

/**
 * Interfaz para la respuesta paginada de favoritos
 */
export interface FavoritoResponse {
  success: boolean;
  data: Favorito[];
  links: {
    first: string;
    last: string;
    prev?: string;
    next?: string;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
    links: Array<{
      url?: string;
      label: string;
      active: boolean;
    }>;
    path: string;
  };
  filters_applied?: Partial<FavoritoFilters>;
}

/**
 * Interfaz para la respuesta de un solo favorito
 */
export interface FavoritoSingleResponse {
  success: boolean;
  data: Favorito;
  message?: string;
}

/**
 * Interfaz para la respuesta de favoritos por usuario
 */
export interface FavoritosByUsuarioResponse {
  success: boolean;
  data: Favorito[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  usuario: {
    id: number;
    name: string;
    email: string;
    rol: string;
  };
  estadisticas: EstadisticasUsuarioFavoritos;
}

/**
 * Interfaz para estadísticas de favoritos de un usuario específico
 */
export interface EstadisticasUsuarioFavoritos {
  total_favoritos: number;
  favoritos_disponibles: number;
  favoritos_con_ofertas: number;
  por_categoria: Record<string, number>;
  recientes_7_dias: number;
  valor_total_favoritos: number;
}

/**
 * Interfaz para estadísticas generales del sistema de favoritos
 */
export interface EstadisticasFavoritos {
  success: boolean;
  data: {
    resumen_general: {
      total_favoritos: number;
      favoritos_recientes_24h: number;
      favoritos_esta_semana: number;
      favoritos_este_mes: number;
      usuarios_con_favoritos: number;
      productos_favoriteados: number;
      promedio_favoritos_por_usuario: number;
      favoritos_productos_disponibles: number;
      favoritos_productos_con_ofertas: number;
      valor_total_favoritos: number;
    };
    productos_mas_favoriteados: Array<{
      id: number;
      nombre: string;
      precio: number;
      precio_oferta?: number;
      imagen_principal: string;
      activo: boolean;
      stock: number;
      total_favoritos: number;
    }>;
    usuarios_mas_activos: Array<{
      id: number;
      name: string;
      email: string;
      rol: string;
      total_favoritos: number;
    }>;
    distribucion_categorias: Record<string, number>;
    tendencia_mensual: Array<{
      mes: string;
      nombre_mes: string;
      favoritos: number;
    }>;
    analisis_conversion: {
      productos_favoriteados_comprados: number;
      tasa_conversion: number;
    };
  };
  periodo: {
    fecha_desde?: string;
    fecha_hasta?: string;
    user_id?: number;
  };
}

/**
 * Interfaz para respuesta de operaciones simples (crear, actualizar, eliminar)
 */
export interface FavoritoOperationResponse {
  success: boolean;
  data?: Favorito;
  message: string;
  error?: string;
}

/**
 * Interfaz para la respuesta del toggle de favorito
 */
export interface ToggleFavoritoResponse {
  success: boolean;
  message: string;
  accion: 'agregado' | 'eliminado';
  data?: Favorito;
}

/**
 * Interfaz para verificar si un producto es favorito
 */
export interface VerificarFavoritoRequest {
  user_id: number;
  producto_id: number;
}

/**
 * Interfaz para la respuesta de verificación de favorito
 */
export interface VerificarFavoritoResponse {
  success: boolean;
  es_favorito: boolean;
  data?: Favorito;
}

/**
 * Interfaz para limpiar favoritos
 */
export interface LimpiarFavoritosRequest {
  dias?: number;
  productos_inactivos?: boolean;
  productos_agotados?: boolean;
  user_id?: number;
}

/**
 * Interfaz para la respuesta de limpieza de favoritos
 */
export interface LimpiarFavoritosResponse {
  success: boolean;
  message: string;
  favoritos_eliminados: number;
  criterios: {
    dias_antiguedad?: number;
    productos_inactivos: boolean;
    productos_agotados: boolean;
    user_id?: number;
  };
}

/**
 * Interfaz para validación de favorito
 */
export interface FavoritoValidation {
  user_id: boolean;
  producto_id: boolean;
  isValid: boolean;
  errors: string[];
}

/**
 * Interfaz para resumen de favoritos
 */
export interface ResumenFavoritos {
  total: number;
  recientes_24h: number;
  esta_semana: number;
  este_mes: number;
  productos_disponibles: number;
  productos_con_ofertas: number;
  valor_total: number;
}

/**
 * Interfaz para filtros rápidos predefinidos
 */
export interface FiltrosRapidosFavoritos {
  todos: FavoritoFilters;
  recientes: FavoritoFilters;
  con_ofertas: FavoritoFilters;
  disponibles: FavoritoFilters;
  por_precio_alto: FavoritoFilters;
  por_precio_bajo: FavoritoFilters;
  esta_semana: FavoritoFilters;
  este_mes: FavoritoFilters;
}

/**
 * Interfaz para acciones masivas en favoritos
 */
export interface AccionMasivaFavoritos {
  favorito_ids: number[];
  accion: 'eliminar' | 'exportar';
  criterios?: {
    productos_inactivos?: boolean;
    productos_agotados?: boolean;
    antiguedad_dias?: number;
  };
}

/**
 * Interfaz para respuesta de acciones masivas
 */
export interface AccionMasivaFavoritosResponse {
  success: boolean;
  procesados: number;
  errores: number;
  detalles: Array<{
    favorito_id: number;
    exito: boolean;
    mensaje: string;
  }>;
  message: string;
}

/**
 * Constantes para el sistema de favoritos
 */
export const FAVORITO_CONSTANTS = {
  DEFAULT_PER_PAGE: 15,
  MAX_PER_PAGE: 100,
  MAX_FAVORITOS_POR_USUARIO: 500,
  DIAS_RECIENTES_DEFAULT: 7,
  DIAS_LIMPIEZA_DEFAULT: 90,
  MIN_PRECIO_FILTRO: 0,
  MAX_PRECIO_FILTRO: 999999,
} as const;

/**
 * Enum para tipos de ordenamiento
 */
export enum TipoOrdenamientoFavorito {
  FECHA_AGREGADO = 'created_at',
  NOMBRE_PRODUCTO = 'producto_nombre',
  PRECIO_PRODUCTO = 'producto_precio',
  USUARIO = 'user_id',
}

/**
 * Enum para direcciones de ordenamiento
 */
export enum DireccionOrdenamientoFavorito {
  ASCENDENTE = 'asc',
  DESCENDENTE = 'desc',
}

/**
 * Utilidades para trabajar con favoritos
 */
export class FavoritoUtils {
  /**
   * Formatea el tiempo transcurrido desde que se agregó a favoritos
   */
  static formatearTiempoAgregado(fechaCreacion: string): string {
    const fecha = new Date(fechaCreacion);
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();

    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const semanas = Math.floor(dias / 7);
    const meses = Math.floor(dias / 30);

    if (minutos < 60) return `hace ${minutos} minutos`;
    if (horas < 24) return `hace ${horas} horas`;
    if (dias < 7) return `hace ${dias} días`;
    if (semanas < 4) return `hace ${semanas} semanas`;
    return `hace ${meses} meses`;
  }

  /**
   * Calcula el ahorro potencial de un producto favorito
   */
  static calcularAhorro(precio: number, precioOferta?: number): number {
    if (!precioOferta || precioOferta >= precio) return 0;
    return precio - precioOferta;
  }

  /**
   * Calcula el porcentaje de descuento
   */
  static calcularPorcentajeDescuento(
    precio: number,
    precioOferta?: number
  ): number {
    if (!precioOferta || precioOferta >= precio) return 0;
    return Math.round(((precio - precioOferta) / precio) * 100);
  }

  /**
   * Verifica si un producto favorito está disponible
   */
  static estaDisponible(producto: ProductoFavorito): boolean {
    return producto.activo && producto.stock > 0;
  }

  /**
   * Obtiene el precio efectivo (con oferta si existe)
   */
  static getPrecioEfectivo(producto: ProductoFavorito): number {
    return producto.precio_oferta && producto.precio_oferta < producto.precio
      ? producto.precio_oferta
      : producto.precio;
  }

  /**
   * Formatea el precio para mostrar
   */
  static formatearPrecio(precio: number, moneda: string = 'S/'): string {
    return `${moneda} ${precio.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
    })}`;
  }

  /**
   * Obtiene el estado del producto favorito
   */
  static getEstadoProducto(producto: ProductoFavorito): {
    estado: 'disponible' | 'agotado' | 'inactivo';
    mensaje: string;
    color: string;
  } {
    if (!producto.activo) {
      return {
        estado: 'inactivo',
        mensaje: 'Producto no disponible',
        color: 'text-gray-500',
      };
    }

    if (producto.stock <= 0) {
      return {
        estado: 'agotado',
        mensaje: 'Sin stock',
        color: 'text-red-500',
      };
    }

    return {
      estado: 'disponible',
      mensaje: 'Disponible',
      color: 'text-green-500',
    };
  }

  /**
   * Genera un resumen de favoritos por categoría
   */
  static generarResumenPorCategoria(
    favoritos: Favorito[]
  ): Record<string, number> {
    const resumen: Record<string, number> = {};

    favoritos.forEach((favorito) => {
      if (favorito.producto?.categoria) {
        const categoria = favorito.producto.categoria.nombre;
        resumen[categoria] = (resumen[categoria] || 0) + 1;
      }
    });

    return resumen;
  }

  /**
   * Filtra favoritos por criterios específicos
   */
  static filtrarFavoritos(
    favoritos: Favorito[],
    criterios: {
      disponibles?: boolean;
      conOfertas?: boolean;
      categoria?: string;
      precioMin?: number;
      precioMax?: number;
    }
  ): Favorito[] {
    return favoritos.filter((favorito) => {
      const producto = favorito.producto;
      if (!producto) return false;

      if (criterios.disponibles && !FavoritoUtils.estaDisponible(producto)) {
        return false;
      }

      if (criterios.conOfertas && !producto.tiene_oferta) {
        return false;
      }

      if (
        criterios.categoria &&
        producto.categoria?.nombre !== criterios.categoria
      ) {
        return false;
      }

      const precioEfectivo = FavoritoUtils.getPrecioEfectivo(producto);
      if (criterios.precioMin && precioEfectivo < criterios.precioMin) {
        return false;
      }

      if (criterios.precioMax && precioEfectivo > criterios.precioMax) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calcula el valor total de una lista de favoritos
   */
  static calcularValorTotal(favoritos: Favorito[]): number {
    return favoritos.reduce((total, favorito) => {
      if (favorito.producto) {
        return total + FavoritoUtils.getPrecioEfectivo(favorito.producto);
      }
      return total;
    }, 0);
  }
}
