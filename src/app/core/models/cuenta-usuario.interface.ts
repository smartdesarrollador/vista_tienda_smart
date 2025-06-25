import {
  PaginationMeta,
  PaginationLinks,
  PaginatedResponse,
  BaseFilters,
} from './common.interface';
import { User } from './user.model';
import { Pedido } from './pedido.interface';
import { Favorito } from './favorito.interface';
import { Direccion } from './direccion.interface';
import { Notificacion } from './notificacion.interface';

/**
 * 🏠 INTERFACES PRINCIPALES
 */

/**
 * Información del cliente asociado al usuario
 */
export interface ClienteInfo {
  id: number;
  nombre_completo: string;
  verificado: boolean;
  limite_credito: number;
  estado: EstadoCliente;
  telefono?: string;
  dni?: string;
  miembro_desde: string;
}

/**
 * Estadísticas generales del usuario
 */
export interface EstadisticasUsuario {
  total_pedidos: number;
  pedidos_entregados: number;
  pedidos_pendientes: number;
  total_favoritos: number;
  total_direcciones: number;
  notificaciones_no_leidas: number;
  total_gastado: number;
  ticket_promedio: number;
}

/**
 * Preferencias del usuario
 */
export interface PreferenciasUsuario {
  metodo_pago_preferido: MetodoPagoPreferido | null;
  categoria_favorita: CategoriaFavorita | null;
}

export interface MetodoPagoPreferido {
  id: number;
  nombre: string;
  veces_usado: number;
}

export interface CategoriaFavorita {
  nombre: string;
  productos_favoritos: number;
}

/**
 * Dashboard completo del usuario
 */
export interface DashboardUsuario {
  usuario: User;
  cliente: ClienteInfo;
  estadisticas: EstadisticasUsuario;
  pedidos_recientes: Pedido[];
  favoritos_recientes: Favorito[];
  preferencias: PreferenciasUsuario;
}

/**
 * 📊 MÉTRICAS E HISTORIAL
 */

/**
 * Métricas del historial de compras
 */
export interface MetricasHistorial {
  total_compras: number;
  total_gastado: number;
  ticket_promedio: number;
  primera_compra?: string;
  ultima_compra?: string;
  compra_mayor: number;
  compra_menor: number;
  categoria_preferida: CategoriaPreferida | null;
  metodo_pago_preferido: MetodoPagoPreferido | null;
}

export interface CategoriaPreferida {
  nombre: string;
  productos_comprados: number;
}

/**
 * 💳 INFORMACIÓN DE CRÉDITO
 */

/**
 * Cuota de crédito pendiente
 */
export interface CuotaPendiente {
  id: number;
  pedido_numero: string;
  numero_cuota: number;
  monto_cuota: number;
  fecha_vencimiento: string;
  dias_vencimiento: number;
  esta_vencida: boolean;
}

/**
 * Historial de crédito
 */
export interface HistorialCredito {
  id: number;
  numero_pedido: string;
  total: number;
  estado: string;
  fecha: string;
  cuotas_total: number;
  cuotas_pagadas: number;
}

/**
 * Información completa de crédito
 */
export interface InformacionCredito {
  limite_credito: number;
  credito_usado: number;
  credito_disponible: number;
  porcentaje_usado: number;
  cuotas_pendientes: CuotaPendiente[];
  historial_credito: HistorialCredito[];
}

/**
 * 📈 ESTADÍSTICAS DE FAVORITOS
 */
export interface EstadisticasFavoritos {
  total_favoritos: number;
  con_ofertas: number;
  disponibles: number;
  valor_total: number;
}

/**
 * 🔧 FILTROS Y PARÁMETROS
 */

/**
 * Filtros para pedidos del usuario
 */
export interface FiltrosPedidosUsuario extends BaseFilters {
  estado?: EstadoPedido;
  fecha_desde?: string;
  fecha_hasta?: string;
  numero_pedido?: string;
  metodo_pago_id?: number;
  sort_by?: 'created_at' | 'total' | 'estado' | 'numero_pedido';
  sort_dir?: 'asc' | 'desc';
}

/**
 * Filtros para favoritos del usuario
 */
export interface FiltrosFavoritosUsuario extends BaseFilters {
  categoria_id?: number;
  disponibles?: boolean;
  con_ofertas?: boolean;
  sort_by?: 'created_at' | 'producto_nombre' | 'precio';
  sort_dir?: 'asc' | 'desc';
}

/**
 * Filtros para historial de compras
 */
export interface FiltrosHistorial extends BaseFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  metodo_pago_id?: number;
}

/**
 * Filtros para notificaciones
 */
export interface FiltrosNotificaciones extends BaseFilters {
  leido?: boolean;
  tipo?: TipoNotificacion;
}

/**
 * 📋 RESPUESTAS DE LA API
 */

/**
 * Respuesta del dashboard
 */
export interface DashboardResponse {
  status: string;
  message: string;
  data: DashboardUsuario;
}

/**
 * Respuesta de pedidos paginados
 */
export interface PedidosUsuarioResponse {
  status: string;
  message: string;
  data: {
    pedidos: Pedido[];
    pagination: PaginationMeta;
    filtros_aplicados: FiltrosPedidosUsuario;
  };
}

/**
 * Respuesta de favoritos paginados
 */
export interface FavoritosUsuarioResponse {
  status: string;
  message: string;
  data: {
    favoritos: Favorito[];
    pagination: PaginationMeta;
    estadisticas: EstadisticasFavoritos;
    filtros_aplicados: FiltrosFavoritosUsuario;
  };
}

/**
 * Respuesta del historial
 */
export interface HistorialResponse {
  status: string;
  message: string;
  data: {
    historial: Pedido[];
    pagination: PaginationMeta;
    metricas: MetricasHistorial;
    filtros_aplicados: FiltrosHistorial;
  };
}

/**
 * Respuesta de direcciones
 */
export interface DireccionesUsuarioResponse {
  status: string;
  message: string;
  data: {
    direcciones: Direccion[];
    total: number;
    predeterminada: number | null;
  };
}

/**
 * Respuesta de notificaciones
 */
export interface NotificacionesUsuarioResponse {
  status: string;
  message: string;
  data: {
    notificaciones: Notificacion[];
    pagination: PaginationMeta;
    no_leidas: number;
  };
}

/**
 * Respuesta de información de crédito
 */
export interface CreditoResponse {
  status: string;
  message: string;
  data: InformacionCredito;
}

/**
 * Respuesta simple para acciones
 */
export interface SimpleResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * 🏷️ ENUMS Y TIPOS
 */

/**
 * Estados del cliente
 */
export type EstadoCliente = 'activo' | 'inactivo' | 'suspendido' | 'bloqueado';

/**
 * Estados de pedido
 */
export type EstadoPedido =
  | 'pendiente'
  | 'confirmado'
  | 'preparando'
  | 'enviado'
  | 'entregado'
  | 'cancelado';

/**
 * Tipos de notificación
 */
export type TipoNotificacion =
  | 'pedido'
  | 'promocion'
  | 'sistema'
  | 'credito'
  | 'envio';

/**
 * Opciones de ordenamiento para pedidos
 */
export type OrdenamientoPedidos =
  | 'created_at'
  | 'total'
  | 'estado'
  | 'numero_pedido';

/**
 * Opciones de ordenamiento para favoritos
 */
export type OrdenamientoFavoritos = 'created_at' | 'producto_nombre' | 'precio';

/**
 * 📊 INTERFACES PARA MÉTRICAS ADICIONALES
 */

/**
 * Resumen de actividad del usuario
 */
export interface ResumenActividad {
  ultimos_pedidos: number;
  productos_favoritos_nuevos: number;
  notificaciones_recientes: number;
  credito_utilizado_mes: number;
}

/**
 * Comparación de períodos
 */
export interface ComparacionPeriodos {
  periodo_actual: MetricasPeriodo;
  periodo_anterior: MetricasPeriodo;
  variacion_porcentual: number;
}

export interface MetricasPeriodo {
  pedidos: number;
  total_gastado: number;
  ticket_promedio: number;
  productos_favoritos: number;
}

/**
 * Tendencias del usuario
 */
export interface TendenciasUsuario {
  frecuencia_compra: FrecuenciaCompra;
  categorias_preferidas: CategoriaConPorcentaje[];
  metodos_pago_uso: MetodoPagoConPorcentaje[];
  horarios_compra_preferidos: HorarioCompra[];
}

export interface FrecuenciaCompra {
  dias_promedio_entre_compras: number;
  clasificacion: 'frecuente' | 'regular' | 'ocasional' | 'nuevo';
}

export interface CategoriaConPorcentaje {
  categoria: string;
  porcentaje: number;
  total_compras: number;
}

export interface MetodoPagoConPorcentaje {
  metodo: string;
  porcentaje: number;
  veces_usado: number;
}

export interface HorarioCompra {
  hora: number;
  cantidad_compras: number;
}

/**
 * 🎯 CONFIGURACIONES Y PREFERENCIAS
 */

/**
 * Configuraciones de privacidad
 */
export interface ConfiguracionPrivacidad {
  mostrar_historial_publico: boolean;
  permitir_recomendaciones: boolean;
  recibir_notificaciones_email: boolean;
  recibir_notificaciones_push: boolean;
  compartir_estadisticas: boolean;
}

/**
 * Preferencias de notificaciones
 */
export interface PreferenciasNotificaciones {
  pedidos: boolean;
  promociones: boolean;
  credito: boolean;
  envios: boolean;
  sistema: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

/**
 * 🔄 DTOs PARA ACTUALIZACIONES
 */

/**
 * DTO para actualizar preferencias
 */
export interface ActualizarPreferenciasDto {
  privacidad?: Partial<ConfiguracionPrivacidad>;
  notificaciones?: Partial<PreferenciasNotificaciones>;
  metodo_pago_preferido_id?: number;
}

/**
 * DTO para marcar notificaciones
 */
export interface MarcarNotificacionDto {
  notificacion_id: number;
  leido: boolean;
}

/**
 * 📱 INTERFACES PARA APLICACIÓN MÓVIL
 */

/**
 * Dashboard optimizado para móvil
 */
export interface DashboardMovil {
  usuario_basico: UsuarioBasico;
  resumen_actividad: ResumenActividad;
  accesos_rapidos: AccesoRapido[];
  notificaciones_importantes: Notificacion[];
}

export interface UsuarioBasico {
  nombre: string;
  email: string;
  imagen_perfil?: string;
  nivel_cliente: string;
}

export interface AccesoRapido {
  tipo: 'pedidos' | 'favoritos' | 'direcciones' | 'credito';
  titulo: string;
  icono: string;
  valor: string | number;
  ruta: string;
}

/**
 * 🔔 Interfaz para notificaciones de usuario
 */
export interface NotificacionUsuario {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  leido: boolean;
  fecha: string;
  accion_url?: string;
  accion_texto?: string;
  datos_adicionales?: any;
}

/**
 * 📦 EXPORTS UNIFICADOS
 */
export {
  // Re-exportar interfaces relacionadas que podrían necesitarse
  type User,
  type Pedido,
  type Favorito,
  type Direccion,
} from './index';
