/**
 * Ejemplo de uso de la interfaz HorarioZona y sus funciones utilitarias
 *
 * Este archivo muestra cómo utilizar correctamente las interfaces, DTOs y funciones
 * utilitarias del sistema de horario-zona.
 */

import {
  HorarioZona,
  CreateHorarioZonaDto,
  UpdateHorarioZonaDto,
  FiltrosHorarioZona,
  DiaSemana,
  validarHorarioZona,
  calcularEstadisticas,
  agruparPorZona,
  agruparPorDia,
  filtrarActivos,
  filtrarAbiertosAhora,
  buscarHorarios,
  ordenarPorDia,
  ordenarPorHora,
  formatearHorario,
  formatearDuracion,
  calcularDuracion,
  estaAbiertoAhora,
  obtenerDiaActual,
  obtenerDiaInfo,
  validarFormatoHora,
  DIAS_SEMANA,
  FRANJAS_HORARIAS,
} from './horario-zona.interface';

// ============================================================================
// EJEMPLOS DE CREACIÓN Y VALIDACIÓN
// ============================================================================

/**
 * Ejemplo: Crear un nuevo horario de zona
 */
export function ejemploCrearHorario(): CreateHorarioZonaDto {
  const nuevoHorario: CreateHorarioZonaDto = {
    zona_reparto_id: 1,
    dia_semana: 'lunes',
    hora_inicio: '11:00:00',
    hora_fin: '22:00:00',
    activo: true,
    dia_completo: false,
    observaciones: 'Horario normal para zona centro',
  };

  // Validar antes de enviar
  const errores = validarHorarioZona(nuevoHorario);
  if (errores.length > 0) {
    console.error('Errores de validación:', errores);
    throw new Error('Datos inválidos');
  }

  return nuevoHorario;
}

/**
 * Ejemplo: Crear horario de día completo (24 horas)
 */
export function ejemploCrearHorarioDiaCompleto(): CreateHorarioZonaDto {
  const horarioDiaCompleto: CreateHorarioZonaDto = {
    zona_reparto_id: 2,
    dia_semana: 'sabado',
    activo: true,
    dia_completo: true,
    observaciones: 'Servicio 24 horas los sábados',
  };

  const errores = validarHorarioZona(horarioDiaCompleto);
  if (errores.length > 0) {
    console.error('Errores de validación:', errores);
    throw new Error('Datos inválidos');
  }

  return horarioDiaCompleto;
}

/**
 * Ejemplo: Actualizar un horario existente
 */
export function ejemploActualizarHorario(): UpdateHorarioZonaDto {
  const actualizacion: UpdateHorarioZonaDto = {
    hora_inicio: '10:00:00',
    hora_fin: '23:00:00',
    observaciones: 'Horario extendido',
  };

  // Validar actualización
  const errores = validarHorarioZona(actualizacion);
  if (errores.length > 0) {
    console.error('Errores de validación:', errores);
    throw new Error('Datos de actualización inválidos');
  }

  return actualizacion;
}

// ============================================================================
// EJEMPLOS DE FILTRADO Y BÚSQUEDA
// ============================================================================

/**
 * Ejemplo: Configurar filtros para búsqueda
 */
export function ejemploFiltros(): FiltrosHorarioZona {
  return {
    zona_reparto_id: 1,
    dia_semana: 'lunes',
    activo: true,
    dia_completo: false,
    hora_inicio_desde: '08:00:00',
    hora_inicio_hasta: '12:00:00',
    abierto_ahora: true,
    page: 1,
    per_page: 15,
    sort_by: 'dia_semana',
    sort_direction: 'asc',
  };
}

/**
 * Ejemplo: Procesar y analizar horarios
 */
export function ejemploProcesarHorarios(horarios: HorarioZona[]) {
  console.log('=== PROCESAMIENTO DE HORARIOS ===');

  // 1. Filtrar solo los activos
  const activos = filtrarActivos(horarios);
  console.log(`Horarios activos: ${activos.length}`);

  // 2. Filtrar los que están abiertos ahora
  const abiertosAhora = filtrarAbiertosAhora(horarios);
  console.log(`Horarios abiertos ahora: ${abiertosAhora.length}`);

  // 3. Buscar por término
  const resultadosBusqueda = buscarHorarios(horarios, 'centro');
  console.log(
    `Resultados de búsqueda para "centro": ${resultadosBusqueda.length}`
  );

  // 4. Ordenar por día de la semana
  const ordenadosPorDia = ordenarPorDia(horarios, 'asc');
  console.log('Horarios ordenados por día de la semana');

  // 5. Ordenar por hora de inicio
  const ordenadosPorHora = ordenarPorHora(horarios, 'asc');
  console.log('Horarios ordenados por hora de inicio');

  // 6. Agrupar por zona de reparto
  const porZona = agruparPorZona(horarios);
  console.log(`Agrupados en ${porZona.length} zonas de reparto`);

  // 7. Agrupar por día de la semana
  const porDia = agruparPorDia(horarios);
  console.log(`Agrupados por ${porDia.length} días de la semana`);

  // 8. Calcular estadísticas
  const estadisticas = calcularEstadisticas(horarios);
  console.log('Estadísticas calculadas:', {
    total: estadisticas.total_horarios,
    activos: estadisticas.horarios_activos,
    duracionPromedio: estadisticas.duracion_promedio,
  });

  return {
    activos,
    abiertosAhora,
    resultadosBusqueda,
    ordenadosPorDia,
    ordenadosPorHora,
    porZona,
    porDia,
    estadisticas,
  };
}

// ============================================================================
// EJEMPLOS DE FORMATEO Y UTILIDADES
// ============================================================================

/**
 * Ejemplo: Formatear información de un horario
 */
export function ejemploFormatearHorario(horario: HorarioZona) {
  console.log('=== INFORMACIÓN DE HORARIO ===');

  // Información del día
  const diaInfo = obtenerDiaInfo(horario.dia_semana);
  console.log(`Día: ${diaInfo.label} (${diaInfo.abrev})`);

  // Formatear horario
  const horarioFormateado = formatearHorario(horario);
  console.log(`Horario: ${horarioFormateado}`);

  // Formatear duración
  const duracionFormateada = formatearDuracion(horario.duracion_horas);
  console.log(`Duración: ${duracionFormateada}`);

  // Estado actual
  const abierto = estaAbiertoAhora(horario);
  console.log(`Estado actual: ${abierto ? 'Abierto' : 'Cerrado'}`);

  // Información de la zona
  console.log('Zona de reparto:', horario.zona_reparto?.nombre);
  console.log('Observaciones:', horario.observaciones || 'Sin observaciones');

  return {
    dia: diaInfo,
    horario: horarioFormateado,
    duracion: duracionFormateada,
    abierto,
  };
}

/**
 * Ejemplo: Trabajar con días de la semana
 */
export function ejemploDiasSemana() {
  console.log('=== DÍAS DE LA SEMANA ===');

  // Mostrar todos los días
  DIAS_SEMANA.forEach((dia) => {
    console.log(`${dia.numero}: ${dia.label} (${dia.abrev}) - ${dia.value}`);
  });

  // Obtener día actual
  const diaActual = obtenerDiaActual();
  console.log(`Día actual: ${diaActual}`);

  // Obtener información del día actual
  const infoHoy = obtenerDiaInfo(diaActual);
  console.log(
    `Información de hoy: ${infoHoy.label} - Número: ${infoHoy.numero}`
  );

  return {
    todosDias: DIAS_SEMANA,
    diaActual,
    infoHoy,
  };
}

/**
 * Ejemplo: Trabajar con franjas horarias
 */
export function ejemploFranjasHorarias() {
  console.log('=== FRANJAS HORARIAS ===');

  FRANJAS_HORARIAS.forEach((franja) => {
    console.log(
      `${franja.value}: ${franja.label} (${franja.inicio} - ${franja.fin})`
    );
  });

  return FRANJAS_HORARIAS;
}

// ============================================================================
// EJEMPLO COMPLETO DE USO
// ============================================================================

/**
 * Ejemplo completo que muestra un flujo típico de trabajo
 */
export function ejemploCompletoUso() {
  console.log('=== EJEMPLO COMPLETO DE USO ===');

  // 1. Crear datos de ejemplo
  const horariosEjemplo: HorarioZona[] = [
    {
      id: 1,
      zona_reparto_id: 1,
      dia_semana: 'lunes',
      hora_inicio: '11:00:00',
      hora_fin: '22:00:00',
      activo: true,
      dia_completo: false,
      observaciones: 'Horario normal para zona centro',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      dia_semana_numero: 1,
      horario_texto: '11:00:00 - 22:00:00',
      duracion_horas: 11,
      es_horario_valido: true,
      zona_reparto: {
        id: 1,
        nombre: 'Zona Centro',
        slug: 'zona-centro',
        activo: true,
        disponible_24h: false,
      },
      estado_actual: {
        es_hoy: false,
        esta_abierto_ahora: false,
        minutos_para_apertura: 1440,
        minutos_para_cierre: null,
      },
    },
    {
      id: 2,
      zona_reparto_id: 2,
      dia_semana: 'sabado',
      hora_inicio: null,
      hora_fin: null,
      activo: true,
      dia_completo: true,
      observaciones: 'Servicio 24 horas',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      dia_semana_numero: 6,
      horario_texto: '24 horas',
      duracion_horas: 24,
      es_horario_valido: true,
      zona_reparto: {
        id: 2,
        nombre: 'Zona Sur',
        slug: 'zona-sur',
        activo: true,
        disponible_24h: true,
      },
      estado_actual: {
        es_hoy: false,
        esta_abierto_ahora: false,
        minutos_para_apertura: null,
        minutos_para_cierre: null,
      },
    },
  ];

  // 2. Procesar horarios
  const resultados = ejemploProcesarHorarios(horariosEjemplo);

  // 3. Formatear primer horario
  if (horariosEjemplo.length > 0) {
    ejemploFormatearHorario(horariosEjemplo[0]);
  }

  // 4. Mostrar días de la semana
  ejemploDiasSemana();

  // 5. Mostrar franjas horarias
  ejemploFranjasHorarias();

  return resultados;
}

// ============================================================================
// EJEMPLOS DE VALIDACIÓN AVANZADA
// ============================================================================

/**
 * Ejemplo: Validaciones personalizadas
 */
export function ejemploValidacionesPersonalizadas() {
  console.log('=== VALIDACIONES PERSONALIZADAS ===');

  // Datos con errores intencionados
  const datosInvalidos: CreateHorarioZonaDto = {
    zona_reparto_id: 0, // Error: debe ser mayor a 0
    dia_semana: 'invalid' as DiaSemana, // Error: día inválido
    hora_inicio: '25:00:00', // Error: formato inválido
    hora_fin: '10:00:00', // Error: menor que hora inicio
    dia_completo: false,
  };

  const errores = validarHorarioZona(datosInvalidos);
  console.log('Errores encontrados:', errores);

  // Datos válidos
  const datosValidos: CreateHorarioZonaDto = {
    zona_reparto_id: 1,
    dia_semana: 'lunes',
    hora_inicio: '09:00:00',
    hora_fin: '18:00:00',
    activo: true,
    dia_completo: false,
    observaciones: 'Horario de oficina',
  };

  const erroresValidos = validarHorarioZona(datosValidos);
  console.log('Errores en datos válidos:', erroresValidos); // Debe ser array vacío

  return {
    erroresInvalidos: errores,
    erroresValidos: erroresValidos,
  };
}

/**
 * Ejemplo: Validar formato de hora
 */
export function ejemploValidarHoras() {
  console.log('=== VALIDACIÓN DE HORAS ===');

  const horasTest = [
    '09:00:00', // Válida
    '23:59:59', // Válida
    '00:00:00', // Válida
    '24:00:00', // Inválida
    '09:60:00', // Inválida
    '09:00', // Inválida (falta segundos)
    'invalid', // Inválida
  ];

  horasTest.forEach((hora) => {
    const esValida = validarFormatoHora(hora);
    console.log(`${hora}: ${esValida ? 'Válida' : 'Inválida'}`);
  });

  return horasTest.map((hora) => ({
    hora,
    valida: validarFormatoHora(hora),
  }));
}

/**
 * Ejemplo: Calcular duración entre horas
 */
export function ejemploCalcularDuracion() {
  console.log('=== CÁLCULO DE DURACIÓN ===');

  const ejemplosDuracion = [
    { inicio: '09:00:00', fin: '17:00:00' }, // 8 horas
    { inicio: '22:00:00', fin: '06:00:00' }, // 8 horas (cruza medianoche)
    { inicio: '11:30:00', fin: '14:45:00' }, // 3.25 horas
    { inicio: '00:00:00', fin: '23:59:59' }, // ~24 horas
  ];

  ejemplosDuracion.forEach(({ inicio, fin }) => {
    const duracion = calcularDuracion(inicio, fin);
    const duracionFormateada = formatearDuracion(duracion);
    console.log(
      `${inicio} - ${fin}: ${duracionFormateada} (${duracion.toFixed(2)}h)`
    );
  });

  return ejemplosDuracion.map(({ inicio, fin }) => ({
    inicio,
    fin,
    duracion: calcularDuracion(inicio, fin),
    duracionFormateada: formatearDuracion(calcularDuracion(inicio, fin)),
  }));
}

/**
 * Ejemplo de uso en un componente Angular (pseudocódigo)
 */
export const ejemploComponenteAngular = `
// En un componente Angular
import { Component, inject, signal } from '@angular/core';
import { HorarioZonaService } from '../core/services/horario-zona.service';
import { 
  HorarioZona, 
  FiltrosHorarioZona,
  DiaSemana,
  DIAS_SEMANA,
  formatearHorario,
  estaAbiertoAhora 
} from '../core/models/horario-zona.interface';

@Component({
  selector: 'app-horario-zona-list',
  template: \`
    <div class="horario-zona-container">
      <h2>Gestión de Horarios por Zona</h2>
      
      <!-- Filtros -->
      <div class="filtros">
        <select [(ngModel)]="filtros().dia_semana">
          <option value="">Todos los días</option>
          @for (dia of diasSemana; track dia.value) {
            <option [value]="dia.value">{{dia.label}}</option>
          }
        </select>
        
        <label>
          <input type="checkbox" [(ngModel)]="filtros().abierto_ahora">
          Solo abiertos ahora
        </label>
      </div>
      
      <!-- Lista de horarios -->
      <div class="horarios-list">
        @for (horario of horarioZonaService.horariosZona(); track horario.id) {
          <div class="horario-card" [class.abierto]="estaAbierto(horario)">
            <h3>{{horario.zona_reparto?.nombre}}</h3>
            <p><strong>{{obtenerDiaLabel(horario.dia_semana)}}</strong></p>
            <p>{{formatearHorario(horario)}}</p>
            <p class="estado">
              {{estaAbierto(horario) ? 'Abierto' : 'Cerrado'}}
            </p>
            @if (horario.observaciones) {
              <p class="observaciones">{{horario.observaciones}}</p>
            }
          </div>
        }
      </div>
      
      <!-- Estadísticas -->
      @if (horarioZonaService.estadisticasCalculadas(); as stats) {
        <div class="estadisticas">
          <h3>Estadísticas</h3>
          <p>Total horarios: {{stats.total_horarios}}</p>
          <p>Horarios activos: {{stats.horarios_activos}}</p>
          <p>Zonas abiertas ahora: {{horarioZonaService.zonasAbiertas()}}</p>
          <p>Cobertura semanal: {{horarioZonaService.coberturaSemanal().toFixed(1)}}%</p>
        </div>
      }
      
      <!-- Loading -->
      @if (horarioZonaService.cargando()) {
        <div class="loading">Cargando horarios...</div>
      }
      
      <!-- Error -->
      @if (horarioZonaService.error()) {
        <div class="error">{{horarioZonaService.error()}}</div>
      }
    </div>
  \`,
  styles: [\`
    .horario-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      margin: 8px 0;
      transition: all 0.3s ease;
    }
    
    .horario-card.abierto {
      border-color: #10b981;
      background-color: #f0fdf4;
    }
    
    .estado {
      font-weight: bold;
      color: #ef4444;
    }
    
    .horario-card.abierto .estado {
      color: #10b981;
    }
    
    .observaciones {
      font-style: italic;
      color: #6b7280;
    }
    
    .estadisticas {
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      margin-top: 24px;
    }
  \`]
})
export class HorarioZonaListComponent {
  private readonly horarioZonaService = inject(HorarioZonaService);
  
  readonly filtros = signal<FiltrosHorarioZona>({});
  readonly diasSemana = DIAS_SEMANA;
  
  ngOnInit() {
    this.cargarHorarios();
  }
  
  private cargarHorarios() {
    this.horarioZonaService.obtenerHorariosZona(this.filtros()).subscribe();
  }
  
  formatearHorario(horario: HorarioZona): string {
    return formatearHorario(horario);
  }
  
  estaAbierto(horario: HorarioZona): boolean {
    return estaAbiertoAhora(horario);
  }
  
  obtenerDiaLabel(dia: DiaSemana): string {
    return DIAS_SEMANA.find(d => d.value === dia)?.label || dia;
  }
}
`;

console.log('Ejemplo de componente Angular:', ejemploComponenteAngular);
