export interface ProgramacionEntrega {
  id: number;
  pedido_id: number;
  repartidor_id: number;
  fecha_programada: string;
  hora_inicio_ventana: string;
  hora_fin_ventana: string;
  estado: EstadoProgramacion;
  orden_ruta: number;
  notas_repartidor?: string;
  hora_salida?: string;
  hora_llegada?: string;
  motivo_fallo?: string;
  created_at?: string;
  updated_at?: string;

  // Información calculada
  estado_texto: string;
  fecha_programada_formateada: string;
  ventana_entrega_texto: string;
  duracion_ventana_minutos: number;
  tiempo_transcurrido_entrega?: TiempoTranscurrido;
  orden_ruta_texto: string;

  // Estados y validaciones
  estado_programacion: EstadoProgramacionInfo;

  // Relaciones
  pedido?: PedidoProgramacion;
  repartidor?: RepartidorProgramacion;

  // Tiempos de entrega
  tiempos_entrega: TiemposEntrega;

  // Información de la ruta
  info_ruta: InfoRuta;
}

export interface TiempoTranscurrido {
  minutos: number;
  texto: string;
}

export interface EstadoProgramacionInfo {
  es_programacion_futura: boolean;
  es_programacion_hoy: boolean;
  es_programacion_pasada: boolean;
  esta_en_ventana: boolean;
  ventana_expirada: boolean;
  requiere_atencion: boolean;
  es_entrega_exitosa: boolean;
  tiene_retraso: boolean;
}

export interface PedidoProgramacion {
  id: number;
  numero_pedido: string;
  total: number;
  estado: string;
  datos_envio?: any;
}

export interface RepartidorProgramacion {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
}

export interface TiemposEntrega {
  hora_salida_formateada?: string;
  hora_llegada_formateada?: string;
  tiempo_total_entrega?: number;
  tiempo_total_texto?: string;
  puntualidad?: string;
}

export interface InfoRuta {
  es_primera_entrega: boolean;
  es_ultima_entrega: boolean;
  posicion_en_ruta: number;
  estado_ruta: string;
}

export interface ResumenRuta {
  repartidor_id: number;
  fecha: string;
  total_entregas: number;
  entregas_completadas: number;
  entregas_pendientes: number;
  entregas_fallidas: number;
}

export interface RutaRepartidorResponse {
  resumen: ResumenRuta;
  ruta: ProgramacionEntrega[];
}

// DTOs para operaciones CRUD
export interface CreateProgramacionEntregaDto {
  pedido_id: number;
  repartidor_id: number;
  fecha_programada: string;
  hora_inicio_ventana: string;
  hora_fin_ventana: string;
  orden_ruta?: number;
  notas_repartidor?: string;
}

export interface UpdateProgramacionEntregaDto
  extends Partial<Omit<CreateProgramacionEntregaDto, 'pedido_id'>> {}

export interface CambiarEstadoDto {
  estado: EstadoProgramacion;
  motivo_fallo?: string;
  notas_repartidor?: string;
}

export interface ReprogramarEntregaDto {
  nueva_fecha: string;
  nueva_hora_inicio: string;
  nueva_hora_fin: string;
  motivo_reprogramacion: string;
}

export interface RutaRepartidorDto {
  repartidor_id: number;
  fecha: string;
}

// Filtros y paginación
export interface FiltrosProgramacionEntrega {
  pedido_id?: number;
  repartidor_id?: number;
  estado?: EstadoProgramacion;
  fecha_programada?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  hoy?: boolean;
  per_page?: number;
  page?: number;
}

export interface PaginacionProgramacionEntrega {
  total: number;
  per_page: number;
  current_page: number;
  last_page?: number;
  from?: number;
  to?: number;
}

export interface ProgramacionEntregaResponse {
  data: ProgramacionEntrega[];
  meta: PaginacionProgramacionEntrega;
}

// Tipos y enums
export type EstadoProgramacion =
  | 'programado'
  | 'en_ruta'
  | 'entregado'
  | 'fallido'
  | 'reprogramado';

export type TipoPuntualidad =
  | 'Puntual'
  | 'Con retraso'
  | 'Entregado antes de tiempo';

export type EstadoRuta =
  | 'Pendiente'
  | 'En progreso'
  | 'Completado'
  | 'Falló'
  | 'Necesita reprogramación'
  | 'Indefinido';

// Constantes
export const ESTADOS_PROGRAMACION: Record<EstadoProgramacion, string> = {
  programado: 'Programado',
  en_ruta: 'En ruta',
  entregado: 'Entregado',
  fallido: 'Falló la entrega',
  reprogramado: 'Reprogramado',
};

export const ESTADOS_PROGRAMACION_COLORES: Record<EstadoProgramacion, string> =
  {
    programado: 'text-blue-600',
    en_ruta: 'text-yellow-600',
    entregado: 'text-green-600',
    fallido: 'text-red-600',
    reprogramado: 'text-purple-600',
  };

export const ESTADOS_PROGRAMACION_BADGES: Record<EstadoProgramacion, string> = {
  programado: 'bg-blue-100 text-blue-800',
  en_ruta: 'bg-yellow-100 text-yellow-800',
  entregado: 'bg-green-100 text-green-800',
  fallido: 'bg-red-100 text-red-800',
  reprogramado: 'bg-purple-100 text-purple-800',
};

export const ESTADOS_RUTA_COLORES: Record<EstadoRuta, string> = {
  Pendiente: 'text-gray-600',
  'En progreso': 'text-blue-600',
  Completado: 'text-green-600',
  Falló: 'text-red-600',
  'Necesita reprogramación': 'text-purple-600',
  Indefinido: 'text-gray-400',
};

export const TRANSICIONES_VALIDAS: Record<
  EstadoProgramacion,
  EstadoProgramacion[]
> = {
  programado: ['en_ruta', 'fallido', 'reprogramado'],
  en_ruta: ['entregado', 'fallido'],
  entregado: [],
  fallido: ['reprogramado'],
  reprogramado: ['programado', 'en_ruta'],
};

// Funciones utilitarias
export function obtenerEstadoTexto(estado: EstadoProgramacion): string {
  return ESTADOS_PROGRAMACION[estado] || 'Estado desconocido';
}

export function obtenerEstadoColor(estado: EstadoProgramacion): string {
  return ESTADOS_PROGRAMACION_COLORES[estado] || 'text-gray-600';
}

export function obtenerEstadoBadge(estado: EstadoProgramacion): string {
  return ESTADOS_PROGRAMACION_BADGES[estado] || 'bg-gray-100 text-gray-800';
}

export function obtenerColorEstadoRuta(estadoRuta: EstadoRuta): string {
  return ESTADOS_RUTA_COLORES[estadoRuta] || 'text-gray-600';
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

export function formatearVentanaEntrega(
  horaInicio: string,
  horaFin: string
): string {
  if (!horaInicio || !horaFin) {
    return 'Ventana no definida';
  }
  return `${horaInicio} - ${horaFin}`;
}

export function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatearHora(fecha: string): string {
  return new Date(fecha).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function esProgramacionFutura(fechaProgramada: string): boolean {
  return new Date(fechaProgramada) > new Date();
}

export function esProgramacionHoy(fechaProgramada: string): boolean {
  const hoy = new Date();
  const fecha = new Date(fechaProgramada);
  return fecha.toDateString() === hoy.toDateString();
}

export function esProgramacionPasada(fechaProgramada: string): boolean {
  const hoy = new Date();
  const fecha = new Date(fechaProgramada);
  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);
  return fecha < hoy;
}

export function estaEnVentana(
  fechaProgramada: string,
  horaInicio: string,
  horaFin: string
): boolean {
  if (!esProgramacionHoy(fechaProgramada) || !horaInicio || !horaFin) {
    return false;
  }

  const ahora = new Date();
  const horaActual = ahora.toTimeString().slice(0, 8);

  return horaActual >= horaInicio && horaActual <= horaFin;
}

export function esVentanaExpirada(
  fechaProgramada: string,
  horaFin: string
): boolean {
  if (!esProgramacionHoy(fechaProgramada) || !horaFin) {
    return false;
  }

  const ahora = new Date();
  const horaActual = ahora.toTimeString().slice(0, 8);

  return horaActual > horaFin;
}

export function requiereAtencion(programacion: ProgramacionEntrega): boolean {
  return (
    programacion.estado === 'fallido' ||
    programacion.estado === 'reprogramado' ||
    (esVentanaExpirada(
      programacion.fecha_programada,
      programacion.hora_fin_ventana
    ) &&
      programacion.estado !== 'entregado')
  );
}

export function esEntregaExitosa(programacion: ProgramacionEntrega): boolean {
  return programacion.estado === 'entregado' && !!programacion.hora_llegada;
}

export function tieneRetraso(programacion: ProgramacionEntrega): boolean {
  if (!programacion.hora_llegada || !programacion.hora_fin_ventana) {
    return false;
  }

  const horaLlegada = formatearHora(programacion.hora_llegada);
  return horaLlegada > programacion.hora_fin_ventana;
}

export function calcularDuracionVentana(
  horaInicio: string,
  horaFin: string
): number {
  if (!horaInicio || !horaFin) {
    return 0;
  }

  const inicio = new Date(`2000-01-01T${horaInicio}`);
  const fin = new Date(`2000-01-01T${horaFin}`);

  return Math.abs(fin.getTime() - inicio.getTime()) / (1000 * 60);
}

export function calcularTiempoTranscurrido(
  horaSalida: string
): TiempoTranscurrido | null {
  if (!horaSalida) {
    return null;
  }

  const salida = new Date(horaSalida);
  const ahora = new Date();
  const minutos = Math.floor(
    (ahora.getTime() - salida.getTime()) / (1000 * 60)
  );

  return {
    minutos,
    texto: formatearTiempo(minutos),
  };
}

export function calcularTiempoTotalEntrega(
  horaSalida?: string,
  horaLlegada?: string
): number | null {
  if (!horaSalida || !horaLlegada) {
    return null;
  }

  const salida = new Date(horaSalida);
  const llegada = new Date(horaLlegada);

  return Math.floor((llegada.getTime() - salida.getTime()) / (1000 * 60));
}

export function obtenerPuntualidad(
  programacion: ProgramacionEntrega
): string | null {
  if (!esEntregaExitosa(programacion)) {
    return null;
  }

  if (tieneRetraso(programacion)) {
    return 'Con retraso';
  }

  if (
    estaEnVentana(
      programacion.fecha_programada,
      programacion.hora_inicio_ventana,
      programacion.hora_fin_ventana
    )
  ) {
    return 'Puntual';
  }

  return 'Entregado antes de tiempo';
}

export function esTransicionValida(
  estadoActual: EstadoProgramacion,
  nuevoEstado: EstadoProgramacion
): boolean {
  return TRANSICIONES_VALIDAS[estadoActual]?.includes(nuevoEstado) || false;
}

export function obtenerTransicionesPosibles(
  estadoActual: EstadoProgramacion
): EstadoProgramacion[] {
  return TRANSICIONES_VALIDAS[estadoActual] || [];
}

export function agruparPorEstado(
  programaciones: ProgramacionEntrega[]
): Record<EstadoProgramacion, ProgramacionEntrega[]> {
  return programaciones.reduce((acc, programacion) => {
    if (!acc[programacion.estado]) {
      acc[programacion.estado] = [];
    }
    acc[programacion.estado].push(programacion);
    return acc;
  }, {} as Record<EstadoProgramacion, ProgramacionEntrega[]>);
}

export function agruparPorRepartidor(
  programaciones: ProgramacionEntrega[]
): Record<number, ProgramacionEntrega[]> {
  return programaciones.reduce((acc, programacion) => {
    if (!acc[programacion.repartidor_id]) {
      acc[programacion.repartidor_id] = [];
    }
    acc[programacion.repartidor_id].push(programacion);
    return acc;
  }, {} as Record<number, ProgramacionEntrega[]>);
}

export function agruparPorFecha(
  programaciones: ProgramacionEntrega[]
): Record<string, ProgramacionEntrega[]> {
  return programaciones.reduce((acc, programacion) => {
    const fecha = formatearFecha(programacion.fecha_programada);
    if (!acc[fecha]) {
      acc[fecha] = [];
    }
    acc[fecha].push(programacion);
    return acc;
  }, {} as Record<string, ProgramacionEntrega[]>);
}

export function filtrarPorEstado(
  programaciones: ProgramacionEntrega[],
  estado: EstadoProgramacion
): ProgramacionEntrega[] {
  return programaciones.filter((p) => p.estado === estado);
}

export function filtrarPorRepartidor(
  programaciones: ProgramacionEntrega[],
  repartidorId: number
): ProgramacionEntrega[] {
  return programaciones.filter((p) => p.repartidor_id === repartidorId);
}

export function filtrarPorFecha(
  programaciones: ProgramacionEntrega[],
  fecha: string
): ProgramacionEntrega[] {
  return programaciones.filter(
    (p) => formatearFecha(p.fecha_programada) === fecha
  );
}

export function filtrarQueRequierenAtencion(
  programaciones: ProgramacionEntrega[]
): ProgramacionEntrega[] {
  return programaciones.filter((p) => requiereAtencion(p));
}

export function filtrarEntregasHoy(
  programaciones: ProgramacionEntrega[]
): ProgramacionEntrega[] {
  return programaciones.filter((p) => esProgramacionHoy(p.fecha_programada));
}

export function filtrarEntregasPendientes(
  programaciones: ProgramacionEntrega[]
): ProgramacionEntrega[] {
  return programaciones.filter((p) =>
    ['programado', 'en_ruta'].includes(p.estado)
  );
}

export function ordenarPorRuta(
  programaciones: ProgramacionEntrega[]
): ProgramacionEntrega[] {
  return [...programaciones].sort((a, b) => {
    // Primero por fecha
    const fechaA = new Date(a.fecha_programada);
    const fechaB = new Date(b.fecha_programada);
    if (fechaA.getTime() !== fechaB.getTime()) {
      return fechaA.getTime() - fechaB.getTime();
    }
    // Luego por orden de ruta
    return a.orden_ruta - b.orden_ruta;
  });
}

export function ordenarPorFecha(
  programaciones: ProgramacionEntrega[],
  direccion: 'asc' | 'desc' = 'desc'
): ProgramacionEntrega[] {
  return [...programaciones].sort((a, b) => {
    const fechaA = new Date(a.fecha_programada);
    const fechaB = new Date(b.fecha_programada);
    return direccion === 'asc'
      ? fechaA.getTime() - fechaB.getTime()
      : fechaB.getTime() - fechaA.getTime();
  });
}

export function buscarProgramaciones(
  programaciones: ProgramacionEntrega[],
  termino: string
): ProgramacionEntrega[] {
  if (!termino.trim()) return programaciones;

  const terminoLower = termino.toLowerCase();

  return programaciones.filter(
    (programacion) =>
      programacion.pedido?.numero_pedido
        ?.toLowerCase()
        .includes(terminoLower) ||
      programacion.repartidor?.nombre?.toLowerCase().includes(terminoLower) ||
      programacion.repartidor?.email?.toLowerCase().includes(terminoLower) ||
      programacion.estado_texto.toLowerCase().includes(terminoLower) ||
      programacion.notas_repartidor?.toLowerCase().includes(terminoLower)
  );
}

export function obtenerEstadisticasRuta(
  programaciones: ProgramacionEntrega[]
): {
  total: number;
  programadas: number;
  en_ruta: number;
  entregadas: number;
  fallidas: number;
  reprogramadas: number;
  tasa_exito: number;
  tiempo_promedio_entrega: number;
} {
  const total = programaciones.length;
  const programadas = filtrarPorEstado(programaciones, 'programado').length;
  const en_ruta = filtrarPorEstado(programaciones, 'en_ruta').length;
  const entregadas = filtrarPorEstado(programaciones, 'entregado').length;
  const fallidas = filtrarPorEstado(programaciones, 'fallido').length;
  const reprogramadas = filtrarPorEstado(programaciones, 'reprogramado').length;

  const tasa_exito = total > 0 ? (entregadas / total) * 100 : 0;

  const tiemposEntrega = programaciones
    .filter((p) => p.tiempos_entrega.tiempo_total_entrega)
    .map((p) => p.tiempos_entrega.tiempo_total_entrega!);

  const tiempo_promedio_entrega =
    tiemposEntrega.length > 0
      ? tiemposEntrega.reduce((sum, tiempo) => sum + tiempo, 0) /
        tiemposEntrega.length
      : 0;

  return {
    total,
    programadas,
    en_ruta,
    entregadas,
    fallidas,
    reprogramadas,
    tasa_exito,
    tiempo_promedio_entrega,
  };
}

export function validarVentanaEntrega(
  horaInicio: string,
  horaFin: string
): {
  valida: boolean;
  errores: string[];
} {
  const errores: string[] = [];

  if (!horaInicio) {
    errores.push('La hora de inicio es requerida');
  }

  if (!horaFin) {
    errores.push('La hora de fin es requerida');
  }

  if (horaInicio && horaFin && horaInicio >= horaFin) {
    errores.push('La hora de fin debe ser posterior a la hora de inicio');
  }

  const duracion = calcularDuracionVentana(horaInicio, horaFin);
  if (duracion < 30) {
    errores.push('La ventana de entrega debe ser de al menos 30 minutos');
  }

  if (duracion > 480) {
    // 8 horas
    errores.push('La ventana de entrega no puede ser mayor a 8 horas');
  }

  return {
    valida: errores.length === 0,
    errores,
  };
}

export function validarFechaProgramacion(fecha: string): {
  valida: boolean;
  errores: string[];
} {
  const errores: string[] = [];

  if (!fecha) {
    errores.push('La fecha de programación es requerida');
    return { valida: false, errores };
  }

  const fechaProgramada = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (fechaProgramada < hoy) {
    errores.push('La fecha de programación no puede ser anterior a hoy');
  }

  const maxFecha = new Date();
  maxFecha.setDate(maxFecha.getDate() + 30); // Máximo 30 días en el futuro

  if (fechaProgramada > maxFecha) {
    errores.push(
      'La fecha de programación no puede ser mayor a 30 días en el futuro'
    );
  }

  return {
    valida: errores.length === 0,
    errores,
  };
}
