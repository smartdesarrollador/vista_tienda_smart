export interface SeguimientoPedido {
  id: number;
  pedido_id: number;
  estado_anterior: EstadoPedido;
  estado_actual: EstadoPedido;
  observaciones?: string;
  usuario_cambio_id: number;
  latitud_seguimiento?: number;
  longitud_seguimiento?: number;
  tiempo_estimado_restante?: number;
  fecha_cambio: string;
  notificado_cliente: boolean;
  created_at: string;
  updated_at: string;

  // Información calculada
  estado_anterior_texto: string;
  estado_actual_texto: string;
  coordenadas_seguimiento?: CoordenadasSeguimiento;
  tiempo_transcurrido: TiempoTranscurrido;
  tiempo_estimado_texto?: string;
  fecha_cambio_formateada: string;
  tiene_ubicacion: boolean;
  es_cambio_positivo: boolean;

  // Relaciones
  pedido?: PedidoSeguimiento;
  usuario_cambio?: UsuarioCambio;

  // Estado del seguimiento
  estado_seguimiento: EstadoSeguimiento;
}

export interface PedidoSeguimiento {
  id: number;
  numero_pedido: string;
  estado: EstadoPedido;
  total: number;
}

export interface UsuarioCambio {
  id: number;
  nombre: string;
  email: string;
}

export interface CoordenadasSeguimiento {
  lat: number;
  lng: number;
}

export interface TiempoTranscurrido {
  minutos: number;
  texto: string;
}

export interface EstadoSeguimiento {
  es_estado_final: boolean;
  es_estado_activo: boolean;
  puede_cancelar: boolean;
  requiere_atencion: boolean;
}

export type EstadoPedido =
  | 'pendiente'
  | 'confirmado'
  | 'preparando'
  | 'listo'
  | 'enviado'
  | 'entregado'
  | 'cancelado'
  | 'devuelto';

// DTOs para crear y actualizar seguimientos
export interface CreateSeguimientoPedidoDto {
  pedido_id: number;
  estado_anterior: EstadoPedido;
  estado_actual: EstadoPedido;
  observaciones?: string;
  usuario_cambio_id: number;
  latitud_seguimiento?: number;
  longitud_seguimiento?: number;
  tiempo_estimado_restante?: number;
  fecha_cambio?: string;
  notificado_cliente?: boolean;
}

export interface UpdateSeguimientoPedidoDto {
  observaciones?: string;
  latitud_seguimiento?: number;
  longitud_seguimiento?: number;
  tiempo_estimado_restante?: number;
  notificado_cliente?: boolean;
}

// Filtros para búsqueda y paginación
export interface FiltrosSeguimientoPedido {
  pedido_id?: number;
  estado_actual?: EstadoPedido;
  usuario_cambio_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  notificado_cliente?: boolean;
  sin_notificar?: boolean;
  per_page?: number;
  page?: number;
}

// Respuestas de la API
export interface SeguimientoPedidoResponse {
  data: SeguimientoPedido;
}

export interface SeguimientosPedidoResponse {
  data: SeguimientoPedido[];
  links: {
    first: string;
    last: string;
    prev?: string;
    next?: string;
  };
  meta: {
    current_page: number;
    from?: number;
    last_page: number;
    links: Array<{
      url?: string;
      label: string;
      active: boolean;
    }>;
    path: string;
    per_page: number;
    to?: number;
    total: number;
  };
}

// Estadísticas de seguimientos
export interface EstadisticasSeguimiento {
  total_seguimientos: number;
  seguimientos_por_estado: Record<EstadoPedido, number>;
  seguimientos_hoy: number;
  seguimientos_pendientes_notificacion: number;
  tiempo_promedio_por_estado: Record<EstadoPedido, number>;
  seguimientos_con_ubicacion: number;
  seguimientos_recientes: SeguimientoPedido[];
}

// Constantes
export const ESTADOS_PEDIDO: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  listo: 'Listo para entregar',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  devuelto: 'Devuelto',
};

export const ESTADOS_ACTIVOS: EstadoPedido[] = [
  'confirmado',
  'preparando',
  'listo',
  'enviado',
];

export const ESTADOS_FINALES: EstadoPedido[] = [
  'entregado',
  'cancelado',
  'devuelto',
];

export const ESTADOS_CANCELABLES: EstadoPedido[] = [
  'pendiente',
  'confirmado',
  'preparando',
];

export const COLORES_ESTADO: Record<EstadoPedido, string> = {
  pendiente: 'text-yellow-600 bg-yellow-100',
  confirmado: 'text-blue-600 bg-blue-100',
  preparando: 'text-orange-600 bg-orange-100',
  listo: 'text-purple-600 bg-purple-100',
  enviado: 'text-indigo-600 bg-indigo-100',
  entregado: 'text-green-600 bg-green-100',
  cancelado: 'text-red-600 bg-red-100',
  devuelto: 'text-gray-600 bg-gray-100',
};

export const ICONOS_ESTADO: Record<EstadoPedido, string> = {
  pendiente: 'clock',
  confirmado: 'check-circle',
  preparando: 'cog',
  listo: 'package',
  enviado: 'truck',
  entregado: 'check-circle-2',
  cancelado: 'x-circle',
  devuelto: 'rotate-ccw',
};

// Opciones de ordenamiento
export const OPCIONES_ORDEN_SEGUIMIENTO = [
  { value: 'fecha_cambio', label: 'Fecha de cambio' },
  { value: 'estado_actual', label: 'Estado actual' },
  { value: 'pedido_id', label: 'ID del pedido' },
  { value: 'usuario_cambio_id', label: 'Usuario que realizó el cambio' },
  { value: 'created_at', label: 'Fecha de creación' },
];

export const DIRECCIONES_ORDEN = [
  { value: 'asc', label: 'Ascendente' },
  { value: 'desc', label: 'Descendente' },
];

// Funciones utilitarias
export function obtenerTextoEstado(estado: EstadoPedido): string {
  return ESTADOS_PEDIDO[estado] || 'Estado desconocido';
}

export function obtenerColorEstado(estado: EstadoPedido): string {
  return COLORES_ESTADO[estado] || 'text-gray-600 bg-gray-100';
}

export function obtenerIconoEstado(estado: EstadoPedido): string {
  return ICONOS_ESTADO[estado] || 'help-circle';
}

export function esEstadoActivo(estado: EstadoPedido): boolean {
  return ESTADOS_ACTIVOS.includes(estado);
}

export function esEstadoFinal(estado: EstadoPedido): boolean {
  return ESTADOS_FINALES.includes(estado);
}

export function puedeCancelar(estado: EstadoPedido): boolean {
  return ESTADOS_CANCELABLES.includes(estado);
}

export function esCambioPositivo(
  estadoAnterior: EstadoPedido,
  estadoActual: EstadoPedido
): boolean {
  const ordenEstados: Record<EstadoPedido, number> = {
    pendiente: 1,
    confirmado: 2,
    preparando: 3,
    listo: 4,
    enviado: 5,
    entregado: 6,
    cancelado: 0,
    devuelto: 0,
  };

  const ordenAnterior = ordenEstados[estadoAnterior] || 0;
  const ordenActual = ordenEstados[estadoActual] || 0;

  return ordenActual > ordenAnterior;
}

export function formatearTiempo(minutos: number): string {
  if (minutos < 60) {
    return `${minutos} minutos`;
  }

  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  if (minutosRestantes === 0) {
    return `${horas} hora${horas > 1 ? 's' : ''}`;
  }

  return `${horas}h ${minutosRestantes}min`;
}

export function calcularTiempoTranscurrido(
  fechaCambio: string
): TiempoTranscurrido {
  const fecha = new Date(fechaCambio);
  const ahora = new Date();
  const diferencia = Math.floor(
    (ahora.getTime() - fecha.getTime()) / (1000 * 60)
  );

  return {
    minutos: diferencia,
    texto: formatearTiempo(diferencia),
  };
}

export function tieneUbicacion(seguimiento: SeguimientoPedido): boolean {
  return (
    seguimiento.latitud_seguimiento !== null &&
    seguimiento.latitud_seguimiento !== undefined &&
    seguimiento.longitud_seguimiento !== null &&
    seguimiento.longitud_seguimiento !== undefined
  );
}

export function requiereAtencion(seguimiento: SeguimientoPedido): boolean {
  return (
    (esEstadoFinal(seguimiento.estado_actual) &&
      ['cancelado', 'devuelto'].includes(seguimiento.estado_actual)) ||
    (seguimiento.tiempo_estimado_restante !== null &&
      seguimiento.tiempo_estimado_restante !== undefined &&
      seguimiento.tiempo_estimado_restante < 0)
  );
}

export function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function agruparSeguimientosPorEstado(
  seguimientos: SeguimientoPedido[]
): Record<EstadoPedido, SeguimientoPedido[]> {
  return seguimientos.reduce((grupos, seguimiento) => {
    const estado = seguimiento.estado_actual;
    if (!grupos[estado]) {
      grupos[estado] = [];
    }
    grupos[estado].push(seguimiento);
    return grupos;
  }, {} as Record<EstadoPedido, SeguimientoPedido[]>);
}

export function agruparSeguimientosPorPedido(
  seguimientos: SeguimientoPedido[]
): Record<number, SeguimientoPedido[]> {
  return seguimientos.reduce((grupos, seguimiento) => {
    const pedidoId = seguimiento.pedido_id;
    if (!grupos[pedidoId]) {
      grupos[pedidoId] = [];
    }
    grupos[pedidoId].push(seguimiento);
    return grupos;
  }, {} as Record<number, SeguimientoPedido[]>);
}

export function filtrarSeguimientos(
  seguimientos: SeguimientoPedido[],
  filtros: Partial<FiltrosSeguimientoPedido>
): SeguimientoPedido[] {
  return seguimientos.filter((seguimiento) => {
    if (filtros.pedido_id && seguimiento.pedido_id !== filtros.pedido_id) {
      return false;
    }

    if (
      filtros.estado_actual &&
      seguimiento.estado_actual !== filtros.estado_actual
    ) {
      return false;
    }

    if (
      filtros.usuario_cambio_id &&
      seguimiento.usuario_cambio_id !== filtros.usuario_cambio_id
    ) {
      return false;
    }

    if (filtros.fecha_desde) {
      const fechaCambio = new Date(seguimiento.fecha_cambio);
      const fechaDesde = new Date(filtros.fecha_desde);
      if (fechaCambio < fechaDesde) {
        return false;
      }
    }

    if (filtros.fecha_hasta) {
      const fechaCambio = new Date(seguimiento.fecha_cambio);
      const fechaHasta = new Date(filtros.fecha_hasta);
      if (fechaCambio > fechaHasta) {
        return false;
      }
    }

    if (
      filtros.notificado_cliente !== undefined &&
      seguimiento.notificado_cliente !== filtros.notificado_cliente
    ) {
      return false;
    }

    return true;
  });
}

export function buscarSeguimientos(
  seguimientos: SeguimientoPedido[],
  termino: string
): SeguimientoPedido[] {
  const terminoLower = termino.toLowerCase();

  return seguimientos.filter(
    (seguimiento) =>
      seguimiento.observaciones?.toLowerCase().includes(terminoLower) ||
      seguimiento.estado_anterior_texto.toLowerCase().includes(terminoLower) ||
      seguimiento.estado_actual_texto.toLowerCase().includes(terminoLower) ||
      seguimiento.pedido?.numero_pedido.toLowerCase().includes(terminoLower) ||
      seguimiento.usuario_cambio?.nombre.toLowerCase().includes(terminoLower) ||
      seguimiento.usuario_cambio?.email.toLowerCase().includes(terminoLower)
  );
}

export function ordenarSeguimientos(
  seguimientos: SeguimientoPedido[],
  campo: keyof SeguimientoPedido,
  direccion: 'asc' | 'desc' = 'desc'
): SeguimientoPedido[] {
  return [...seguimientos].sort((a, b) => {
    const valorA = a[campo];
    const valorB = b[campo];

    if (valorA === null || valorA === undefined) return 1;
    if (valorB === null || valorB === undefined) return -1;

    let comparacion = 0;
    if (valorA < valorB) comparacion = -1;
    if (valorA > valorB) comparacion = 1;

    return direccion === 'asc' ? comparacion : -comparacion;
  });
}

export function calcularEstadisticas(
  seguimientos: SeguimientoPedido[]
): EstadisticasSeguimiento {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const seguimientosHoy = seguimientos.filter((s) => {
    const fechaCambio = new Date(s.fecha_cambio);
    fechaCambio.setHours(0, 0, 0, 0);
    return fechaCambio.getTime() === hoy.getTime();
  });

  const seguimientosPorEstado = seguimientos.reduce((acc, seguimiento) => {
    acc[seguimiento.estado_actual] = (acc[seguimiento.estado_actual] || 0) + 1;
    return acc;
  }, {} as Record<EstadoPedido, number>);

  const seguimientosPendientesNotificacion = seguimientos.filter(
    (s) => !s.notificado_cliente
  );

  const seguimientosConUbicacion = seguimientos.filter((s) =>
    tieneUbicacion(s)
  );

  const seguimientosRecientes = ordenarSeguimientos(
    seguimientos,
    'fecha_cambio',
    'desc'
  ).slice(0, 10);

  // Calcular tiempo promedio por estado (simplificado)
  const tiempoPromedioPorEstado = Object.keys(ESTADOS_PEDIDO).reduce(
    (acc, estado) => {
      const seguimientosEstado = seguimientos.filter(
        (s) => s.estado_actual === estado
      );
      const tiempoPromedio =
        seguimientosEstado.length > 0
          ? seguimientosEstado.reduce(
              (sum, s) => sum + s.tiempo_transcurrido.minutos,
              0
            ) / seguimientosEstado.length
          : 0;
      acc[estado as EstadoPedido] = Math.round(tiempoPromedio);
      return acc;
    },
    {} as Record<EstadoPedido, number>
  );

  return {
    total_seguimientos: seguimientos.length,
    seguimientos_por_estado: seguimientosPorEstado,
    seguimientos_hoy: seguimientosHoy.length,
    seguimientos_pendientes_notificacion:
      seguimientosPendientesNotificacion.length,
    tiempo_promedio_por_estado: tiempoPromedioPorEstado,
    seguimientos_con_ubicacion: seguimientosConUbicacion.length,
    seguimientos_recientes: seguimientosRecientes,
  };
}

export function validarCreateSeguimientoPedido(
  dto: CreateSeguimientoPedidoDto
): string[] {
  const errores: string[] = [];

  if (!dto.pedido_id || dto.pedido_id <= 0) {
    errores.push('El ID del pedido es requerido y debe ser mayor a 0');
  }

  if (
    !dto.estado_anterior ||
    !Object.keys(ESTADOS_PEDIDO).includes(dto.estado_anterior)
  ) {
    errores.push('El estado anterior es requerido y debe ser válido');
  }

  if (
    !dto.estado_actual ||
    !Object.keys(ESTADOS_PEDIDO).includes(dto.estado_actual)
  ) {
    errores.push('El estado actual es requerido y debe ser válido');
  }

  if (!dto.usuario_cambio_id || dto.usuario_cambio_id <= 0) {
    errores.push(
      'El ID del usuario que realiza el cambio es requerido y debe ser mayor a 0'
    );
  }

  if (dto.observaciones && dto.observaciones.length > 500) {
    errores.push('Las observaciones no pueden exceder los 500 caracteres');
  }

  if (
    dto.latitud_seguimiento !== undefined &&
    (dto.latitud_seguimiento < -90 || dto.latitud_seguimiento > 90)
  ) {
    errores.push('La latitud debe estar entre -90 y 90 grados');
  }

  if (
    dto.longitud_seguimiento !== undefined &&
    (dto.longitud_seguimiento < -180 || dto.longitud_seguimiento > 180)
  ) {
    errores.push('La longitud debe estar entre -180 y 180 grados');
  }

  if (
    dto.tiempo_estimado_restante !== undefined &&
    dto.tiempo_estimado_restante < 0
  ) {
    errores.push('El tiempo estimado restante no puede ser negativo');
  }

  return errores;
}

export function validarUpdateSeguimientoPedido(
  dto: UpdateSeguimientoPedidoDto
): string[] {
  const errores: string[] = [];

  if (dto.observaciones && dto.observaciones.length > 500) {
    errores.push('Las observaciones no pueden exceder los 500 caracteres');
  }

  if (
    dto.latitud_seguimiento !== undefined &&
    (dto.latitud_seguimiento < -90 || dto.latitud_seguimiento > 90)
  ) {
    errores.push('La latitud debe estar entre -90 y 90 grados');
  }

  if (
    dto.longitud_seguimiento !== undefined &&
    (dto.longitud_seguimiento < -180 || dto.longitud_seguimiento > 180)
  ) {
    errores.push('La longitud debe estar entre -180 y 180 grados');
  }

  if (
    dto.tiempo_estimado_restante !== undefined &&
    dto.tiempo_estimado_restante < 0
  ) {
    errores.push('El tiempo estimado restante no puede ser negativo');
  }

  return errores;
}
