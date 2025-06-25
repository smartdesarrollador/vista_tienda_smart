export interface HorarioZona {
  id: number;
  zona_reparto_id: number;
  dia_semana: DiaSemana;
  hora_inicio: string | null;
  hora_fin: string | null;
  activo: boolean;
  dia_completo: boolean;
  observaciones: string | null;
  created_at: string;
  updated_at: string;

  // Información calculada
  dia_semana_numero: number;
  horario_texto: string;
  duracion_horas: number | null;
  es_horario_valido: boolean;

  // Relaciones opcionales
  zona_reparto?: ZonaRepartoHorario;
  estado_actual?: EstadoActualHorario;
}

export interface ZonaRepartoHorario {
  id: number;
  nombre: string;
  slug: string;
  activo: boolean;
  disponible_24h: boolean;
}

export interface EstadoActualHorario {
  es_hoy: boolean;
  esta_abierto_ahora: boolean;
  minutos_para_apertura: number | null;
  minutos_para_cierre: number | null;
}

// DTOs para crear y actualizar
export interface CreateHorarioZonaDto {
  zona_reparto_id: number;
  dia_semana: DiaSemana;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  activo?: boolean;
  dia_completo?: boolean;
  observaciones?: string | null;
}

export interface UpdateHorarioZonaDto {
  hora_inicio?: string | null;
  hora_fin?: string | null;
  activo?: boolean;
  dia_completo?: boolean;
  observaciones?: string | null;
}

// Filtros para búsqueda
export interface FiltrosHorarioZona {
  zona_reparto_id?: number;
  dia_semana?: DiaSemana;
  activo?: boolean;
  dia_completo?: boolean;
  hora_inicio_desde?: string;
  hora_inicio_hasta?: string;
  hora_fin_desde?: string;
  hora_fin_hasta?: string;
  duracion_min?: number;
  duracion_max?: number;
  abierto_ahora?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// Respuestas de la API
export interface HorarioZonaResponse {
  success: boolean;
  data: HorarioZona;
  message?: string;
}

export interface HorariosZonaResponse {
  data: HorarioZona[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

// Estadísticas
export interface EstadisticasHorarioZona {
  total_horarios: number;
  horarios_activos: number;
  horarios_inactivos: number;
  zonas_con_horarios: number;
  horarios_dia_completo: number;
  horarios_parciales: number;
  duracion_promedio: number;
  horarios_por_dia: Array<{
    dia_semana: DiaSemana;
    dia_numero: number;
    total_horarios: number;
    horarios_activos: number;
    duracion_promedio: number;
  }>;
  zonas_mas_horarios: Array<{
    zona_reparto_id: number;
    zona_nombre: string;
    total_horarios: number;
    horarios_activos: number;
    cobertura_semanal: number;
  }>;
  horarios_abiertos_ahora: number;
  cobertura_semanal_promedio: number;
  franjas_horarias_populares: Array<{
    franja: string;
    total_horarios: number;
    porcentaje: number;
  }>;
}

// Agrupación por zona de reparto
export interface HorariosPorZona {
  zona_reparto_id: number;
  zona_nombre: string;
  zona_slug: string;
  horarios: HorarioZona[];
  total_horarios: number;
  horarios_activos: number;
  cobertura_semanal: number;
  disponible_24h: boolean;
  horarios_por_dia: Record<DiaSemana, HorarioZona | null>;
}

// Agrupación por día de la semana
export interface HorariosPorDia {
  dia_semana: DiaSemana;
  dia_numero: number;
  horarios: HorarioZona[];
  total_horarios: number;
  horarios_activos: number;
  zonas_cubiertas: number;
  duracion_promedio: number;
}

// Resumen de cobertura semanal
export interface ResumenCoberturaSemanal {
  total_zonas: number;
  zonas_con_horarios: number;
  cobertura_porcentaje: number;
  dias_completos_cubiertos: DiaSemana[];
  dias_parcialmente_cubiertos: DiaSemana[];
  dias_sin_cobertura: DiaSemana[];
  horarios_conflictivos: Array<{
    zona_reparto_id: number;
    zona_nombre: string;
    dia_semana: DiaSemana;
    conflictos: string[];
  }>;
}

// Análisis de disponibilidad
export interface AnalisisDisponibilidad {
  ahora: {
    zonas_abiertas: number;
    zonas_cerradas: number;
    proxima_apertura: {
      zona_nombre: string;
      minutos: number;
      dia_semana: DiaSemana;
      hora: string;
    } | null;
    proximo_cierre: {
      zona_nombre: string;
      minutos: number;
      hora: string;
    } | null;
  };
  hoy: {
    zonas_que_abren: Array<{
      zona_nombre: string;
      hora_inicio: string;
      hora_fin: string;
    }>;
    zonas_cerradas: Array<{
      zona_nombre: string;
      razon: string;
    }>;
  };
  semana: {
    mejor_dia: DiaSemana;
    peor_dia: DiaSemana;
    horario_pico: string;
    horario_valle: string;
  };
}

// Tipos y constantes
export type DiaSemana =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

export const DIAS_SEMANA = [
  { value: 'lunes', label: 'Lunes', numero: 1, abrev: 'Lun' },
  { value: 'martes', label: 'Martes', numero: 2, abrev: 'Mar' },
  { value: 'miercoles', label: 'Miércoles', numero: 3, abrev: 'Mié' },
  { value: 'jueves', label: 'Jueves', numero: 4, abrev: 'Jue' },
  { value: 'viernes', label: 'Viernes', numero: 5, abrev: 'Vie' },
  { value: 'sabado', label: 'Sábado', numero: 6, abrev: 'Sáb' },
  { value: 'domingo', label: 'Domingo', numero: 7, abrev: 'Dom' },
] as const;

export const OPCIONES_ORDEN_HORARIO = [
  { value: 'dia_semana', label: 'Día de la semana' },
  { value: 'hora_inicio', label: 'Hora de inicio' },
  { value: 'hora_fin', label: 'Hora de fin' },
  { value: 'duracion_horas', label: 'Duración' },
  { value: 'zona_reparto_id', label: 'Zona de reparto' },
  { value: 'created_at', label: 'Fecha de creación' },
] as const;

export const DIRECCIONES_ORDEN_HORARIO = [
  { value: 'asc', label: 'Ascendente' },
  { value: 'desc', label: 'Descendente' },
] as const;

export const FRANJAS_HORARIAS = [
  {
    value: 'madrugada',
    label: 'Madrugada (00:00 - 06:00)',
    inicio: '00:00',
    fin: '06:00',
  },
  {
    value: 'mañana',
    label: 'Mañana (06:00 - 12:00)',
    inicio: '06:00',
    fin: '12:00',
  },
  {
    value: 'tarde',
    label: 'Tarde (12:00 - 18:00)',
    inicio: '12:00',
    fin: '18:00',
  },
  {
    value: 'noche',
    label: 'Noche (18:00 - 00:00)',
    inicio: '18:00',
    fin: '00:00',
  },
] as const;

export type OpcionOrdenHorario =
  (typeof OPCIONES_ORDEN_HORARIO)[number]['value'];
export type DireccionOrdenHorario =
  (typeof DIRECCIONES_ORDEN_HORARIO)[number]['value'];
export type FranjaHoraria = (typeof FRANJAS_HORARIAS)[number]['value'];

// Funciones utilitarias
export function validarHorarioZona(
  data: CreateHorarioZonaDto | UpdateHorarioZonaDto
): string[] {
  const errores: string[] = [];

  if ('zona_reparto_id' in data) {
    if (!data.zona_reparto_id || data.zona_reparto_id <= 0) {
      errores.push(
        'El ID de la zona de reparto es requerido y debe ser mayor a 0'
      );
    }
  }

  if ('dia_semana' in data) {
    if (
      !data.dia_semana ||
      !DIAS_SEMANA.some((d) => d.value === data.dia_semana)
    ) {
      errores.push('El día de la semana es requerido y debe ser válido');
    }
  }

  // Validaciones para horarios no de día completo
  if (!data.dia_completo) {
    if ('hora_inicio' in data && !data.hora_inicio) {
      errores.push('La hora de inicio es requerida cuando no es día completo');
    }

    if ('hora_fin' in data && !data.hora_fin) {
      errores.push('La hora de fin es requerida cuando no es día completo');
    }

    if (data.hora_inicio && data.hora_fin) {
      if (!validarFormatoHora(data.hora_inicio)) {
        errores.push('El formato de hora de inicio no es válido (HH:MM:SS)');
      }

      if (!validarFormatoHora(data.hora_fin)) {
        errores.push('El formato de hora de fin no es válido (HH:MM:SS)');
      }

      if (
        validarFormatoHora(data.hora_inicio) &&
        validarFormatoHora(data.hora_fin)
      ) {
        const inicio = convertirHoraAMinutos(data.hora_inicio);
        const fin = convertirHoraAMinutos(data.hora_fin);

        // Permitir horarios que cruzan medianoche
        if (inicio === fin) {
          errores.push('La hora de inicio y fin no pueden ser iguales');
        }
      }
    }
  }

  if (
    'observaciones' in data &&
    data.observaciones &&
    data.observaciones.length > 500
  ) {
    errores.push('Las observaciones no pueden exceder 500 caracteres');
  }

  return errores;
}

export function validarFormatoHora(hora: string): boolean {
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
  return regex.test(hora);
}

export function convertirHoraAMinutos(hora: string): number {
  const [horas, minutos, segundos] = hora.split(':').map(Number);
  return horas * 60 + minutos + segundos / 60;
}

export function convertirMinutosAHora(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const mins = Math.floor(minutos % 60);
  const segs = Math.floor((minutos % 1) * 60);

  return `${horas.toString().padStart(2, '0')}:${mins
    .toString()
    .padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
}

export function obtenerDiaInfo(dia: DiaSemana): (typeof DIAS_SEMANA)[number] {
  return DIAS_SEMANA.find((d) => d.value === dia) || DIAS_SEMANA[0];
}

export function obtenerDiaPorNumero(numero: number): DiaSemana {
  const dia = DIAS_SEMANA.find((d) => d.numero === numero);
  return dia?.value || 'lunes';
}

export function formatearHorario(horario: HorarioZona): string {
  if (horario.dia_completo) {
    return '24 horas';
  }

  if (!horario.hora_inicio || !horario.hora_fin) {
    return 'Horario no definido';
  }

  const inicio = horario.hora_inicio.substring(0, 5); // HH:MM
  const fin = horario.hora_fin.substring(0, 5); // HH:MM

  return `${inicio} - ${fin}`;
}

export function formatearDuracion(duracion: number | null): string {
  if (duracion === null) return 'No definida';
  if (duracion === 24) return '24 horas';

  const horas = Math.floor(duracion);
  const minutos = Math.round((duracion % 1) * 60);

  if (minutos === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${minutos}m`;
}

export function calcularDuracion(horaInicio: string, horaFin: string): number {
  const inicio = convertirHoraAMinutos(horaInicio);
  const fin = convertirHoraAMinutos(horaFin);

  let duracion = fin - inicio;

  // Si el horario cruza medianoche
  if (duracion < 0) {
    duracion += 24 * 60; // Agregar 24 horas en minutos
  }

  return duracion / 60; // Convertir a horas
}

export function esHorarioValido(horario: HorarioZona): boolean {
  if (horario.dia_completo) return true;
  return !!(horario.hora_inicio && horario.hora_fin);
}

export function estaAbiertoAhora(horario: HorarioZona): boolean {
  if (!horario.activo || !esHorarioValido(horario)) return false;

  const ahora = new Date();
  const diaActual = obtenerDiaActual();

  if (horario.dia_semana !== diaActual) return false;
  if (horario.dia_completo) return true;

  const horaActual = ahora.toTimeString().substring(0, 8); // HH:MM:SS
  const inicio = horario.hora_inicio!;
  const fin = horario.hora_fin!;

  // Horario normal (no cruza medianoche)
  if (inicio <= fin) {
    return horaActual >= inicio && horaActual <= fin;
  }

  // Horario que cruza medianoche
  return horaActual >= inicio || horaActual <= fin;
}

export function obtenerDiaActual(): DiaSemana {
  const diasIngles = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const diasEspanol: DiaSemana[] = [
    'domingo',
    'lunes',
    'martes',
    'miercoles',
    'jueves',
    'viernes',
    'sabado',
  ];

  const diaNumero = new Date().getDay();
  return diasEspanol[diaNumero];
}

export function agruparPorZona(horarios: HorarioZona[]): HorariosPorZona[] {
  const grupos = new Map<number, HorariosPorZona>();

  horarios.forEach((horario) => {
    const zonaId = horario.zona_reparto_id;

    if (!grupos.has(zonaId)) {
      grupos.set(zonaId, {
        zona_reparto_id: zonaId,
        zona_nombre: horario.zona_reparto?.nombre || `Zona ${zonaId}`,
        zona_slug: horario.zona_reparto?.slug || '',
        horarios: [],
        total_horarios: 0,
        horarios_activos: 0,
        cobertura_semanal: 0,
        disponible_24h: horario.zona_reparto?.disponible_24h || false,
        horarios_por_dia: {
          lunes: null,
          martes: null,
          miercoles: null,
          jueves: null,
          viernes: null,
          sabado: null,
          domingo: null,
        },
      });
    }

    const grupo = grupos.get(zonaId)!;
    grupo.horarios.push(horario);
    grupo.total_horarios++;

    if (horario.activo) {
      grupo.horarios_activos++;
    }

    grupo.horarios_por_dia[horario.dia_semana] = horario;
  });

  // Calcular cobertura semanal
  grupos.forEach((grupo) => {
    const diasConHorario = Object.values(grupo.horarios_por_dia).filter(
      (h) => h !== null
    ).length;
    grupo.cobertura_semanal = (diasConHorario / 7) * 100;
  });

  return Array.from(grupos.values()).sort((a, b) =>
    a.zona_nombre.localeCompare(b.zona_nombre)
  );
}

export function agruparPorDia(horarios: HorarioZona[]): HorariosPorDia[] {
  const grupos = new Map<DiaSemana, HorariosPorDia>();

  DIAS_SEMANA.forEach((dia) => {
    grupos.set(dia.value, {
      dia_semana: dia.value,
      dia_numero: dia.numero,
      horarios: [],
      total_horarios: 0,
      horarios_activos: 0,
      zonas_cubiertas: 0,
      duracion_promedio: 0,
    });
  });

  horarios.forEach((horario) => {
    const grupo = grupos.get(horario.dia_semana)!;
    grupo.horarios.push(horario);
    grupo.total_horarios++;

    if (horario.activo) {
      grupo.horarios_activos++;
    }
  });

  // Calcular estadísticas adicionales
  grupos.forEach((grupo) => {
    const zonasUnicas = new Set(grupo.horarios.map((h) => h.zona_reparto_id));
    grupo.zonas_cubiertas = zonasUnicas.size;

    const duraciones = grupo.horarios
      .filter((h) => h.duracion_horas !== null)
      .map((h) => h.duracion_horas!);

    grupo.duracion_promedio =
      duraciones.length > 0
        ? duraciones.reduce((sum, d) => sum + d, 0) / duraciones.length
        : 0;
  });

  return Array.from(grupos.values());
}

export function calcularEstadisticas(
  horarios: HorarioZona[]
): EstadisticasHorarioZona {
  const totalHorarios = horarios.length;
  const horariosActivos = horarios.filter((h) => h.activo).length;
  const horariosInactivos = totalHorarios - horariosActivos;
  const horariosDiaCompleto = horarios.filter((h) => h.dia_completo).length;
  const horariosParciales = totalHorarios - horariosDiaCompleto;

  // Zonas únicas
  const zonasUnicas = new Set(horarios.map((h) => h.zona_reparto_id));

  // Duración promedio
  const duraciones = horarios
    .filter((h) => h.duracion_horas !== null)
    .map((h) => h.duracion_horas!);
  const duracionPromedio =
    duraciones.length > 0
      ? duraciones.reduce((sum, d) => sum + d, 0) / duraciones.length
      : 0;

  // Horarios por día
  const horariosPorDia = agruparPorDia(horarios).map((grupo) => ({
    dia_semana: grupo.dia_semana,
    dia_numero: grupo.dia_numero,
    total_horarios: grupo.total_horarios,
    horarios_activos: grupo.horarios_activos,
    duracion_promedio: grupo.duracion_promedio,
  }));

  // Zonas con más horarios
  const zonaMap = new Map<
    number,
    { nombre: string; total: number; activos: number }
  >();
  horarios.forEach((h) => {
    const zonaId = h.zona_reparto_id;
    if (!zonaMap.has(zonaId)) {
      zonaMap.set(zonaId, {
        nombre: h.zona_reparto?.nombre || `Zona ${zonaId}`,
        total: 0,
        activos: 0,
      });
    }
    const zona = zonaMap.get(zonaId)!;
    zona.total++;
    if (h.activo) zona.activos++;
  });

  const zonasMasHorarios = Array.from(zonaMap.entries())
    .map(([id, data]) => ({
      zona_reparto_id: id,
      zona_nombre: data.nombre,
      total_horarios: data.total,
      horarios_activos: data.activos,
      cobertura_semanal: (data.total / 7) * 100,
    }))
    .sort((a, b) => b.total_horarios - a.total_horarios)
    .slice(0, 10);

  // Horarios abiertos ahora
  const horariosAbiertosAhora = horarios.filter((h) =>
    estaAbiertoAhora(h)
  ).length;

  // Cobertura semanal promedio
  const coberturasPorZona = agruparPorZona(horarios).map(
    (z) => z.cobertura_semanal
  );
  const coberturaSemanalPromedio =
    coberturasPorZona.length > 0
      ? coberturasPorZona.reduce((sum, c) => sum + c, 0) /
        coberturasPorZona.length
      : 0;

  // Franjas horarias populares
  const franjasMap = new Map<string, number>();
  horarios.forEach((h) => {
    if (h.hora_inicio) {
      const franja = obtenerFranjaHoraria(h.hora_inicio);
      franjasMap.set(franja, (franjasMap.get(franja) || 0) + 1);
    }
  });

  const franjasHorariasPopulares = Array.from(franjasMap.entries())
    .map(([franja, total]) => ({
      franja,
      total_horarios: total,
      porcentaje: totalHorarios > 0 ? (total / totalHorarios) * 100 : 0,
    }))
    .sort((a, b) => b.total_horarios - a.total_horarios);

  return {
    total_horarios: totalHorarios,
    horarios_activos: horariosActivos,
    horarios_inactivos: horariosInactivos,
    zonas_con_horarios: zonasUnicas.size,
    horarios_dia_completo: horariosDiaCompleto,
    horarios_parciales: horariosParciales,
    duracion_promedio: duracionPromedio,
    horarios_por_dia: horariosPorDia,
    zonas_mas_horarios: zonasMasHorarios,
    horarios_abiertos_ahora: horariosAbiertosAhora,
    cobertura_semanal_promedio: coberturaSemanalPromedio,
    franjas_horarias_populares: franjasHorariasPopulares,
  };
}

export function obtenerFranjaHoraria(hora: string): string {
  const horaNum = parseInt(hora.split(':')[0]);

  if (horaNum >= 0 && horaNum < 6) return 'Madrugada (00:00 - 06:00)';
  if (horaNum >= 6 && horaNum < 12) return 'Mañana (06:00 - 12:00)';
  if (horaNum >= 12 && horaNum < 18) return 'Tarde (12:00 - 18:00)';
  return 'Noche (18:00 - 00:00)';
}

export function filtrarPorZona(
  horarios: HorarioZona[],
  zonaRepartoId: number
): HorarioZona[] {
  return horarios.filter((h) => h.zona_reparto_id === zonaRepartoId);
}

export function filtrarPorDia(
  horarios: HorarioZona[],
  dia: DiaSemana
): HorarioZona[] {
  return horarios.filter((h) => h.dia_semana === dia);
}

export function filtrarActivos(horarios: HorarioZona[]): HorarioZona[] {
  return horarios.filter((h) => h.activo);
}

export function filtrarInactivos(horarios: HorarioZona[]): HorarioZona[] {
  return horarios.filter((h) => !h.activo);
}

export function filtrarDiaCompleto(horarios: HorarioZona[]): HorarioZona[] {
  return horarios.filter((h) => h.dia_completo);
}

export function filtrarHorariosParciales(
  horarios: HorarioZona[]
): HorarioZona[] {
  return horarios.filter((h) => !h.dia_completo);
}

export function filtrarAbiertosAhora(horarios: HorarioZona[]): HorarioZona[] {
  return horarios.filter((h) => estaAbiertoAhora(h));
}

export function filtrarPorFranja(
  horarios: HorarioZona[],
  franja: FranjaHoraria
): HorarioZona[] {
  const franjaInfo = FRANJAS_HORARIAS.find((f) => f.value === franja);
  if (!franjaInfo) return [];

  return horarios.filter((h) => {
    if (!h.hora_inicio) return false;
    const horaNum = parseInt(h.hora_inicio.split(':')[0]);
    const inicioFranja = parseInt(franjaInfo.inicio.split(':')[0]);
    const finFranja = parseInt(franjaInfo.fin.split(':')[0]);

    if (finFranja === 0) {
      // Franja noche que termina en medianoche
      return horaNum >= inicioFranja || horaNum < 24;
    }

    return horaNum >= inicioFranja && horaNum < finFranja;
  });
}

export function ordenarPorDia(
  horarios: HorarioZona[],
  direccion: 'asc' | 'desc' = 'asc'
): HorarioZona[] {
  return [...horarios].sort((a, b) => {
    const ordenA = a.dia_semana_numero;
    const ordenB = b.dia_semana_numero;
    return direccion === 'asc' ? ordenA - ordenB : ordenB - ordenA;
  });
}

export function ordenarPorHora(
  horarios: HorarioZona[],
  direccion: 'asc' | 'desc' = 'asc'
): HorarioZona[] {
  return [...horarios].sort((a, b) => {
    const horaA = a.hora_inicio || '00:00:00';
    const horaB = b.hora_inicio || '00:00:00';
    return direccion === 'asc'
      ? horaA.localeCompare(horaB)
      : horaB.localeCompare(horaA);
  });
}

export function ordenarPorDuracion(
  horarios: HorarioZona[],
  direccion: 'asc' | 'desc' = 'asc'
): HorarioZona[] {
  return [...horarios].sort((a, b) => {
    const duracionA = a.duracion_horas || 0;
    const duracionB = b.duracion_horas || 0;
    return direccion === 'asc' ? duracionA - duracionB : duracionB - duracionA;
  });
}

export function buscarHorarios(
  horarios: HorarioZona[],
  termino: string
): HorarioZona[] {
  const terminoLower = termino.toLowerCase();

  return horarios.filter((horario) => {
    const zonaNombre = horario.zona_reparto?.nombre?.toLowerCase() || '';
    const diaInfo = obtenerDiaInfo(horario.dia_semana);
    const diaLabel = diaInfo.label.toLowerCase();
    const observaciones = horario.observaciones?.toLowerCase() || '';
    const horarioTexto = horario.horario_texto.toLowerCase();

    return (
      zonaNombre.includes(terminoLower) ||
      diaLabel.includes(terminoLower) ||
      observaciones.includes(terminoLower) ||
      horarioTexto.includes(terminoLower)
    );
  });
}

export function validarHorarioUnico(
  horarios: HorarioZona[],
  zonaRepartoId: number,
  diaSemana: DiaSemana,
  excludeId?: number
): boolean {
  return !horarios.some(
    (h) =>
      h.zona_reparto_id === zonaRepartoId &&
      h.dia_semana === diaSemana &&
      h.id !== excludeId
  );
}

export function detectarConflictosHorarios(horarios: HorarioZona[]): Array<{
  zona_reparto_id: number;
  zona_nombre: string;
  dia_semana: DiaSemana;
  conflictos: string[];
}> {
  const conflictos: Array<{
    zona_reparto_id: number;
    zona_nombre: string;
    dia_semana: DiaSemana;
    conflictos: string[];
  }> = [];

  // Agrupar por zona y día
  const grupos = new Map<string, HorarioZona[]>();

  horarios.forEach((horario) => {
    const key = `${horario.zona_reparto_id}-${horario.dia_semana}`;
    if (!grupos.has(key)) {
      grupos.set(key, []);
    }
    grupos.get(key)!.push(horario);
  });

  grupos.forEach((horariosGrupo) => {
    if (horariosGrupo.length > 1) {
      const primer = horariosGrupo[0];
      const conflictosEncontrados: string[] = [];

      conflictosEncontrados.push(
        `Múltiples horarios definidos para el mismo día (${horariosGrupo.length} horarios)`
      );

      conflictos.push({
        zona_reparto_id: primer.zona_reparto_id,
        zona_nombre:
          primer.zona_reparto?.nombre || `Zona ${primer.zona_reparto_id}`,
        dia_semana: primer.dia_semana,
        conflictos: conflictosEncontrados,
      });
    }
  });

  return conflictos;
}

export function generarResumenCobertura(
  horarios: HorarioZona[],
  totalZonas: number
): ResumenCoberturaSemanal {
  const zonasConHorarios = new Set(horarios.map((h) => h.zona_reparto_id));
  const coberturaPorcentaje =
    totalZonas > 0 ? (zonasConHorarios.size / totalZonas) * 100 : 0;

  // Analizar cobertura por día
  const horariosPorDia = agruparPorDia(horarios);
  const diasCompletos: DiaSemana[] = [];
  const diasParciales: DiaSemana[] = [];
  const diasSinCobertura: DiaSemana[] = [];

  horariosPorDia.forEach((dia) => {
    if (dia.zonas_cubiertas === 0) {
      diasSinCobertura.push(dia.dia_semana);
    } else if (dia.zonas_cubiertas === totalZonas) {
      diasCompletos.push(dia.dia_semana);
    } else {
      diasParciales.push(dia.dia_semana);
    }
  });

  const conflictos = detectarConflictosHorarios(horarios);

  return {
    total_zonas: totalZonas,
    zonas_con_horarios: zonasConHorarios.size,
    cobertura_porcentaje: coberturaPorcentaje,
    dias_completos_cubiertos: diasCompletos,
    dias_parcialmente_cubiertos: diasParciales,
    dias_sin_cobertura: diasSinCobertura,
    horarios_conflictivos: conflictos,
  };
}

export function analizarDisponibilidad(
  horarios: HorarioZona[]
): AnalisisDisponibilidad {
  const horariosActivos = filtrarActivos(horarios);
  const abiertosAhora = filtrarAbiertosAhora(horariosActivos);
  const cerradosAhora = horariosActivos.filter((h) => !estaAbiertoAhora(h));

  // Análisis del momento actual
  const ahora = {
    zonas_abiertas: abiertosAhora.length,
    zonas_cerradas: cerradosAhora.length,
    proxima_apertura: null as any,
    proximo_cierre: null as any,
  };

  // Análisis del día actual
  const diaActual = obtenerDiaActual();
  const horariosHoy = filtrarPorDia(horariosActivos, diaActual);

  const hoy = {
    zonas_que_abren: horariosHoy.map((h) => ({
      zona_nombre: h.zona_reparto?.nombre || `Zona ${h.zona_reparto_id}`,
      hora_inicio: h.hora_inicio || '00:00:00',
      hora_fin: h.hora_fin || '23:59:59',
    })),
    zonas_cerradas: cerradosAhora
      .filter((h) => h.dia_semana === diaActual)
      .map((h) => ({
        zona_nombre: h.zona_reparto?.nombre || `Zona ${h.zona_reparto_id}`,
        razon: !h.activo ? 'Zona inactiva' : 'Fuera de horario',
      })),
  };

  // Análisis semanal
  const estadisticasPorDia = agruparPorDia(horariosActivos);
  const mejorDia = estadisticasPorDia.reduce((mejor, actual) =>
    actual.horarios_activos > mejor.horarios_activos ? actual : mejor
  );
  const peorDia = estadisticasPorDia.reduce((peor, actual) =>
    actual.horarios_activos < peor.horarios_activos ? actual : peor
  );

  const semana = {
    mejor_dia: mejorDia.dia_semana,
    peor_dia: peorDia.dia_semana,
    horario_pico: '12:00', // Simplificado - se podría calcular dinámicamente
    horario_valle: '03:00', // Simplificado - se podría calcular dinámicamente
  };

  return {
    ahora,
    hoy,
    semana,
  };
}

export function formatearHorarioCompleto(horario: HorarioZona): string {
  const diaInfo = obtenerDiaInfo(horario.dia_semana);
  const zonaNombre =
    horario.zona_reparto?.nombre || `Zona ${horario.zona_reparto_id}`;
  const horarioTexto = formatearHorario(horario);
  const estado = horario.activo ? 'Activo' : 'Inactivo';

  return `${zonaNombre} - ${diaInfo.label}: ${horarioTexto} (${estado})`;
}

export function obtenerProximoHorario(
  horarios: HorarioZona[],
  zonaRepartoId: number
): HorarioZona | null {
  const horariosZona = filtrarPorZona(filtrarActivos(horarios), zonaRepartoId);
  const diaActual = obtenerDiaActual();
  const diaNumeroActual = obtenerDiaInfo(diaActual).numero;

  // Buscar desde hoy hacia adelante
  for (let i = 0; i < 7; i++) {
    const diaNumero = ((diaNumeroActual - 1 + i) % 7) + 1;
    const dia = obtenerDiaPorNumero(diaNumero);
    const horarioDia = horariosZona.find((h) => h.dia_semana === dia);

    if (horarioDia && esHorarioValido(horarioDia)) {
      return horarioDia;
    }
  }

  return null;
}

export function calcularTiempoHastaProximaApertura(
  horario: HorarioZona
): number | null {
  if (!horario.activo || !esHorarioValido(horario) || horario.dia_completo) {
    return null;
  }

  const ahora = new Date();
  const diaActual = obtenerDiaActual();

  // Si es hoy y ya pasó la hora de apertura
  if (horario.dia_semana === diaActual) {
    const horaActual = ahora.toTimeString().substring(0, 8);
    if (horaActual >= horario.hora_inicio!) {
      return null; // Ya abrió o está abierto
    }
  }

  // Calcular días hasta el próximo horario
  const diaNumeroActual = obtenerDiaInfo(diaActual).numero;
  const diaNumeroHorario = obtenerDiaInfo(horario.dia_semana).numero;

  let diasHasta = diaNumeroHorario - diaNumeroActual;
  if (diasHasta < 0) {
    diasHasta += 7; // Próxima semana
  }

  const fechaApertura = new Date(ahora);
  fechaApertura.setDate(fechaApertura.getDate() + diasHasta);

  const [horas, minutos, segundos] = horario
    .hora_inicio!.split(':')
    .map(Number);
  fechaApertura.setHours(horas, minutos, segundos, 0);

  return Math.floor((fechaApertura.getTime() - ahora.getTime()) / (1000 * 60)); // Minutos
}
