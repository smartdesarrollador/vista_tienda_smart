/**
 * Ejemplo de uso de la interfaz ZonaDistrito y sus funciones utilitarias
 *
 * Este archivo muestra cómo utilizar correctamente las interfaces, DTOs y funciones
 * utilitarias del sistema de zona-distrito.
 */

import {
  ZonaDistrito,
  CreateZonaDistritoDto,
  UpdateZonaDistritoDto,
  FiltrosZonaDistrito,
  validarZonaDistrito,
  calcularEstadisticas,
  agruparPorZonaReparto,
  agruparPorDistrito,
  filtrarActivas,
  buscarAsignaciones,
  ordenarPorPrioridad,
  obtenerPrioridadInfo,
  formatearCostoEnvio,
  formatearTiempoAdicional,
  PRIORIDADES_ZONA_DISTRITO,
} from './zona-distrito.interface';

// ============================================================================
// EJEMPLOS DE CREACIÓN Y VALIDACIÓN
// ============================================================================

/**
 * Ejemplo: Crear una nueva asignación zona-distrito
 */
export function ejemploCrearAsignacion(): CreateZonaDistritoDto {
  const nuevaAsignacion: CreateZonaDistritoDto = {
    zona_reparto_id: 1,
    distrito_id: 5,
    costo_envio_personalizado: 7.5,
    tiempo_adicional: 10,
    activo: true,
    prioridad: 1, // Alta prioridad
  };

  // Validar antes de enviar
  const errores = validarZonaDistrito(nuevaAsignacion);
  if (errores.length > 0) {
    console.error('Errores de validación:', errores);
    throw new Error('Datos inválidos');
  }

  return nuevaAsignacion;
}

/**
 * Ejemplo: Actualizar una asignación existente
 */
export function ejemploActualizarAsignacion(): UpdateZonaDistritoDto {
  const actualizacion: UpdateZonaDistritoDto = {
    costo_envio_personalizado: 8.0,
    tiempo_adicional: 5,
    prioridad: 2, // Cambiar a prioridad media
  };

  // Validar actualización
  const errores = validarZonaDistrito(actualizacion);
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
export function ejemploFiltros(): FiltrosZonaDistrito {
  return {
    zona_reparto_id: 1,
    activo: true,
    prioridad: 1,
    costo_min: 5.0,
    costo_max: 10.0,
    page: 1,
    per_page: 15,
    sort_by: 'prioridad',
    sort_direction: 'asc',
  };
}

/**
 * Ejemplo: Filtrar y procesar asignaciones
 */
export function ejemploProcesarAsignaciones(asignaciones: ZonaDistrito[]) {
  console.log('=== PROCESAMIENTO DE ASIGNACIONES ===');

  // 1. Filtrar solo las activas
  const activas = filtrarActivas(asignaciones);
  console.log(`Asignaciones activas: ${activas.length}`);

  // 2. Buscar por término
  const resultadosBusqueda = buscarAsignaciones(asignaciones, 'Lima');
  console.log(
    `Resultados de búsqueda para "Lima": ${resultadosBusqueda.length}`
  );

  // 3. Ordenar por prioridad
  const ordenadas = ordenarPorPrioridad(asignaciones, 'asc');
  console.log('Asignaciones ordenadas por prioridad');

  // 4. Agrupar por zona de reparto
  const porZona = agruparPorZonaReparto(asignaciones);
  console.log(`Agrupadas en ${porZona.length} zonas de reparto`);

  // 5. Agrupar por distrito
  const porDistrito = agruparPorDistrito(asignaciones);
  console.log(`Agrupadas en ${porDistrito.length} distritos`);

  // 6. Calcular estadísticas
  const estadisticas = calcularEstadisticas(asignaciones);
  console.log('Estadísticas calculadas:', {
    total: estadisticas.total_asignaciones,
    activas: estadisticas.asignaciones_activas,
    costoPromedio: estadisticas.costo_promedio,
  });

  return {
    activas,
    resultadosBusqueda,
    ordenadas,
    porZona,
    porDistrito,
    estadisticas,
  };
}

// ============================================================================
// EJEMPLOS DE FORMATEO Y UTILIDADES
// ============================================================================

/**
 * Ejemplo: Formatear información de una asignación
 */
export function ejemploFormatearAsignacion(asignacion: ZonaDistrito) {
  console.log('=== INFORMACIÓN DE ASIGNACIÓN ===');

  // Información de prioridad
  const prioridadInfo = obtenerPrioridadInfo(asignacion.prioridad);
  console.log(`Prioridad: ${prioridadInfo.label} (${prioridadInfo.color})`);

  // Formatear costo
  const costoFormateado = formatearCostoEnvio(asignacion.costo_envio_efectivo);
  console.log(`Costo de envío: ${costoFormateado}`);

  // Formatear tiempo adicional
  const tiempoFormateado = formatearTiempoAdicional(
    asignacion.tiempo_adicional
  );
  console.log(`Tiempo adicional: ${tiempoFormateado}`);

  // Información completa
  console.log('Zona de reparto:', asignacion.zona_reparto?.nombre);
  console.log('Distrito:', asignacion.distrito?.nombre);
  console.log('Provincia:', asignacion.distrito?.provincia?.nombre);
  console.log(
    'Departamento:',
    asignacion.distrito?.provincia?.departamento?.nombre
  );

  return {
    prioridad: prioridadInfo,
    costo: costoFormateado,
    tiempo: tiempoFormateado,
  };
}

/**
 * Ejemplo: Trabajar con constantes
 */
export function ejemploConstantes() {
  console.log('=== CONSTANTES DISPONIBLES ===');

  // Mostrar todas las prioridades
  PRIORIDADES_ZONA_DISTRITO.forEach((prioridad) => {
    console.log(`${prioridad.value}: ${prioridad.label} (${prioridad.color})`);
  });

  // Obtener prioridad específica
  const prioridadAlta = PRIORIDADES_ZONA_DISTRITO.find((p) => p.value === 1);
  console.log('Prioridad alta:', prioridadAlta);

  return PRIORIDADES_ZONA_DISTRITO;
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
  const asignacionesEjemplo: ZonaDistrito[] = [
    {
      id: 1,
      zona_reparto_id: 1,
      distrito_id: 1,
      costo_envio_personalizado: null,
      tiempo_adicional: 0,
      activo: true,
      prioridad: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      prioridad_texto: 'Alta',
      tiempo_adicional_texto: 'Sin tiempo adicional',
      costo_envio_efectivo: 5.0,
      costo_envio_formateado: 'S/ 5.00',
      zona_reparto: {
        id: 1,
        nombre: 'Zona Centro',
        slug: 'zona-centro',
        costo_envio: 5.0,
        tiempo_entrega_min: 25,
        tiempo_entrega_max: 45,
        activo: true,
        disponible_24h: false,
      },
      distrito: {
        id: 1,
        nombre: 'Lince',
        codigo: 'LIM0114',
        activo: true,
        disponible_delivery: true,
        provincia: {
          id: 1,
          nombre: 'Lima',
          departamento: {
            id: 1,
            nombre: 'Lima',
          },
        },
      },
    },
  ];

  // 2. Procesar asignaciones
  const resultados = ejemploProcesarAsignaciones(asignacionesEjemplo);

  // 3. Formatear primera asignación
  if (asignacionesEjemplo.length > 0) {
    ejemploFormatearAsignacion(asignacionesEjemplo[0]);
  }

  // 4. Mostrar constantes
  ejemploConstantes();

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
  const datosInvalidos: CreateZonaDistritoDto = {
    zona_reparto_id: 0, // Error: debe ser mayor a 0
    distrito_id: -1, // Error: debe ser mayor a 0
    costo_envio_personalizado: -5, // Error: no puede ser negativo
    tiempo_adicional: 200, // Error: fuera del rango permitido
    prioridad: 5, // Error: debe ser 1, 2 o 3
  };

  const errores = validarZonaDistrito(datosInvalidos);
  console.log('Errores encontrados:', errores);

  // Datos válidos
  const datosValidos: CreateZonaDistritoDto = {
    zona_reparto_id: 1,
    distrito_id: 1,
    costo_envio_personalizado: 7.5,
    tiempo_adicional: 10,
    prioridad: 1,
    activo: true,
  };

  const erroresValidos = validarZonaDistrito(datosValidos);
  console.log('Errores en datos válidos:', erroresValidos); // Debe ser array vacío

  return {
    erroresInvalidos: errores,
    erroresValidos: erroresValidos,
  };
}

/**
 * Ejemplo de uso en un componente Angular (pseudocódigo)
 */
export const ejemploComponenteAngular = `
// En un componente Angular
import { Component, inject, signal } from '@angular/core';
import { ZonaDistritoService } from '../core/services/zona-distrito.service';
import { 
  ZonaDistrito, 
  FiltrosZonaDistrito,
  PRIORIDADES_ZONA_DISTRITO 
} from '../core/models/zona-distrito.interface';

@Component({
  selector: 'app-zona-distrito-list',
  template: \`
    <div class="zona-distrito-container">
      <h2>Gestión de Zonas-Distrito</h2>
      
      <!-- Filtros -->
      <div class="filtros">
        <select [(ngModel)]="filtros().prioridad">
          <option value="">Todas las prioridades</option>
          @for (prioridad of prioridades; track prioridad.value) {
            <option [value]="prioridad.value">{{prioridad.label}}</option>
          }
        </select>
      </div>
      
      <!-- Lista -->
      <div class="asignaciones-list">
        @for (asignacion of zonaDistritoService.zonasDistritos(); track asignacion.id) {
          <div class="asignacion-card">
            <h3>{{asignacion.zona_reparto?.nombre}} → {{asignacion.distrito?.nombre}}</h3>
            <p>Costo: {{asignacion.costo_envio_formateado}}</p>
            <p>Prioridad: {{asignacion.prioridad_texto}}</p>
          </div>
        }
      </div>
      
      <!-- Loading -->
      @if (zonaDistritoService.cargando()) {
        <div class="loading">Cargando...</div>
      }
      
      <!-- Error -->
      @if (zonaDistritoService.error()) {
        <div class="error">{{zonaDistritoService.error()}}</div>
      }
    </div>
  \`
})
export class ZonaDistritoListComponent {
  private readonly zonaDistritoService = inject(ZonaDistritoService);
  
  readonly filtros = signal<FiltrosZonaDistrito>({});
  readonly prioridades = PRIORIDADES_ZONA_DISTRITO;
  
  ngOnInit() {
    this.cargarAsignaciones();
  }
  
  private cargarAsignaciones() {
    this.zonaDistritoService.obtenerZonasDistritos(this.filtros()).subscribe();
  }
}
`;

console.log('Ejemplo de componente Angular:', ejemploComponenteAngular);
