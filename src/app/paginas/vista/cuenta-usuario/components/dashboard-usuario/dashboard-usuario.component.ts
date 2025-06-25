import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import {
  DashboardUsuario,
  EstadisticasUsuario,
  ClienteInfo,
  PreferenciasUsuario,
} from '../../../../../core/models/cuenta-usuario.interface';
import { Pedido } from '../../../../../core/models/pedido.interface';
import { Favorito } from '../../../../../core/models/favorito.interface';

/**
 * 📊 Interfaz para tarjetas de estadísticas rápidas
 */
interface EstadisticaCard {
  titulo: string;
  valor: string | number;
  icono: string;
  color: string;
  descripcion?: string;
  accion?: string;
  ruta?: string;
}

/**
 * 🚀 Interfaz para accesos rápidos
 */
interface AccesoRapido {
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
  color: string;
  badge?: number;
}

/**
 * 📊 Componente Dashboard Usuario
 *
 * Características:
 * - Resumen de estadísticas principales
 * - Accesos rápidos a secciones importantes
 * - Pedidos recientes con estado
 * - Favoritos destacados
 * - Vista responsive y optimizada
 */
@Component({
  selector: 'app-dashboard-usuario',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- 👋 Saludo personalizado -->
      <div
        class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
      >
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold mb-2">
              ¡Hola, {{ nombreUsuario() }}! 👋
            </h1>
            <p class="text-blue-100">Bienvenido de vuelta a tu cuenta</p>
            @if (clienteInfo()?.verificado) {
            <div class="flex items-center mt-2">
              <svg
                class="w-4 h-4 text-green-300 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <span class="text-green-300 text-sm font-medium"
                >Cuenta verificada</span
              >
            </div>
            }
          </div>

          <div class="hidden sm:block">
            <div class="text-right">
              <div class="text-2xl font-bold">
                {{ estadisticasCards()[0]?.valor || '0' }}
              </div>
              <div class="text-blue-200 text-sm">Pedidos totales</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 📊 Estadísticas principales -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (card of estadisticasCards(); track card.titulo) {
        <div
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between mb-4">
            <div
              [class]="
                'w-12 h-12 rounded-lg flex items-center justify-center ' +
                card.color
              "
            >
              <svg class="w-6 h-6 text-white" [innerHTML]="card.icono"></svg>
            </div>
            @if (card.accion) {
            <a
              [routerLink]="card.ruta"
              class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {{ card.accion }}
            </a>
            }
          </div>

          <div>
            <div class="text-2xl font-bold text-gray-900 mb-1">
              {{ card.valor }}
            </div>
            <div class="text-sm font-medium text-gray-700 mb-1">
              {{ card.titulo }}
            </div>
            @if (card.descripcion) {
            <div class="text-xs text-gray-500">
              {{ card.descripcion }}
            </div>
            }
          </div>
        </div>
        }
      </div>

      <!-- 🎯 Accesos rápidos -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-gray-900">Accesos rápidos</h2>
          <span class="text-sm text-gray-500">Acciones más utilizadas</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (acceso of accesosRapidos(); track acceso.titulo) {
          <a
            [routerLink]="acceso.ruta"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div
              [class]="
                'w-10 h-10 rounded-lg flex items-center justify-center mr-4 ' +
                acceso.color
              "
            >
              <svg class="w-5 h-5 text-white" [innerHTML]="acceso.icono"></svg>
            </div>

            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h3
                  class="font-medium text-gray-900 group-hover:text-blue-600 transition-colors"
                >
                  {{ acceso.titulo }}
                </h3>
                @if (acceso.badge && acceso.badge > 0) {
                <span
                  class="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full"
                >
                  {{ acceso.badge }}
                </span>
                }
              </div>
              <p class="text-sm text-gray-500 mt-1">
                {{ acceso.descripcion }}
              </p>
            </div>

            <svg
              class="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </a>
          }
        </div>
      </div>

      <!-- 📦 Actividad reciente -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Pedidos recientes -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                Pedidos recientes
              </h3>
              <a
                routerLink="/mi-cuenta/pedidos"
                class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Ver todos
              </a>
            </div>
          </div>

          <div class="divide-y divide-gray-200">
            @if (pedidosRecientes().length > 0) { @for (pedido of
            pedidosRecientes(); track pedido.id) {
            <div class="p-6 hover:bg-gray-50 transition-colors">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <span class="text-sm font-medium text-gray-900">
                    Pedido #{{ $any(pedido).numero_pedido || pedido.id }}
                  </span>
                  <div class="text-xs text-gray-500 mt-1">
                    {{ formatearFecha(pedido.created_at) }}
                  </div>
                </div>

                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  [ngClass]="getEstadoClass(pedido.estado)"
                >
                  {{ getEstadoTexto(pedido.estado) }}
                </span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-lg font-semibold text-gray-900">
                  S/ {{ pedido.total }}
                </span>

                <a
                  [routerLink]="['/mi-cuenta/pedidos', pedido.id]"
                  class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Ver detalle
                </a>
              </div>
            </div>
            } } @else {
            <div class="p-6 text-center">
              <svg
                class="w-12 h-12 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                ></path>
              </svg>
              <h4 class="text-lg font-medium text-gray-900 mb-2">
                No tienes pedidos aún
              </h4>
              <p class="text-gray-500 mb-4">
                ¡Explora nuestro catálogo y haz tu primera compra!
              </p>
              <a
                routerLink="/catalogo"
                class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ir al catálogo
              </a>
            </div>
            }
          </div>
        </div>

        <!-- Favoritos recientes -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                Favoritos recientes
              </h3>
              <a
                routerLink="/mi-cuenta/favoritos"
                class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Ver todos
              </a>
            </div>
          </div>

          <div class="divide-y divide-gray-200">
            @if (favoritosRecientes().length > 0) { @for (favorito of
            favoritosRecientes(); track favorito.id) {
            <div class="p-6 hover:bg-gray-50 transition-colors">
              <div class="flex items-center space-x-4">
                <div class="flex-shrink-0">
                  @if (favorito.producto?.imagen_principal) {
                  <img
                    [src]="favorito.producto?.imagen_principal"
                    [alt]="favorito.producto?.nombre"
                    class="w-12 h-12 rounded-lg object-cover"
                  />
                  } @else {
                  <div
                    class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center"
                  >
                    <svg
                      class="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </div>
                  }
                </div>

                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium text-gray-900 truncate">
                    {{ favorito.producto?.nombre }}
                  </h4>
                  <div class="flex items-center justify-between mt-1">
                    <span class="text-sm font-semibold text-gray-900">
                      S/ {{ favorito.producto?.precio }}
                    </span>
                    <button
                      class="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      type="button"
                    >
                      Agregar al carrito
                    </button>
                  </div>
                </div>
              </div>
            </div>
            } } @else {
            <div class="p-6 text-center">
              <svg
                class="w-12 h-12 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                ></path>
              </svg>
              <h4 class="text-lg font-medium text-gray-900 mb-2">
                No tienes favoritos
              </h4>
              <p class="text-gray-500 mb-4">
                Guarda productos que te interesen para encontrarlos fácilmente
              </p>
              <a
                routerLink="/catalogo"
                class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Explorar productos
              </a>
            </div>
            }
          </div>
        </div>
      </div>

      <!-- 🔄 Botón de actualizar -->
      <div class="flex justify-center">
        <button
          (click)="recargarDatos.emit()"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          type="button"
        >
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            ></path>
          </svg>
          Actualizar datos
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      /* Animaciones suaves */
      .transition-all {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Hover effects para tarjetas */
      .hover\\:shadow-md:hover {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }

      /* Estados de pedidos */
      .estado-pendiente {
        background-color: #fef3c7;
        color: #92400e;
      }

      .estado-confirmado {
        background-color: #dbeafe;
        color: #1e40af;
      }

      .estado-enviado {
        background-color: #d1fae5;
        color: #065f46;
      }

      .estado-entregado {
        background-color: #dcfce7;
        color: #166534;
      }

      .estado-cancelado {
        background-color: #fee2e2;
        color: #991b1b;
      }
    `,
  ],
})
export class DashboardUsuarioComponent {
  @Input() dashboardData: DashboardUsuario | null = null;
  @Input() isLoading: boolean = false;

  @Output() recargarDatos = new EventEmitter<void>();

  // 📊 Signals computados para datos derivados
  protected readonly nombreUsuario = computed(() => {
    return this.dashboardData?.usuario?.name || 'Usuario';
  });

  protected readonly clienteInfo = computed(() => {
    return this.dashboardData?.cliente || null;
  });

  protected readonly estadisticasCards = computed<EstadisticaCard[]>(() => {
    const stats = this.dashboardData?.estadisticas;
    if (!stats) return [];

    return [
      {
        titulo: 'Total de pedidos',
        valor: stats.total_pedidos,
        icono:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>',
        color: 'bg-blue-500',
        descripcion: `${stats.pedidos_entregados} entregados`,
        accion: 'Ver todos',
        ruta: '/mi-cuenta/pedidos',
      },
      {
        titulo: 'Favoritos',
        valor: stats.total_favoritos,
        icono:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>',
        color: 'bg-red-500',
        descripcion: 'Productos guardados',
        accion: 'Ver lista',
        ruta: '/mi-cuenta/favoritos',
      },
      {
        titulo: 'Direcciones',
        valor: stats.total_direcciones,
        icono:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>',
        color: 'bg-green-500',
        descripcion: 'Configuradas',
        accion: 'Gestionar',
        ruta: '/mi-cuenta/direcciones',
      },
      {
        titulo: 'Total gastado',
        valor: `S/ ${stats.total_gastado?.toFixed(2) || '0.00'}`,
        icono:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>',
        color: 'bg-purple-500',
        descripcion: `Promedio: S/ ${
          stats.ticket_promedio?.toFixed(2) || '0.00'
        }`,
      },
    ];
  });

  protected readonly accesosRapidos = computed<AccesoRapido[]>(() => {
    const stats = this.dashboardData?.estadisticas;

    return [
      {
        titulo: 'Hacer pedido',
        descripcion: 'Explorar catálogo y comprar',
        icono:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>',
        ruta: '/catalogo',
        color: 'bg-blue-500',
      },
      {
        titulo: 'Seguir pedidos',
        descripcion: 'Rastrear entregas en curso',
        icono:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"></path>',
        ruta: '/mi-cuenta/pedidos',
        color: 'bg-green-500',
        badge: stats?.pedidos_pendientes,
      },
      {
        titulo: 'Notificaciones',
        descripcion: 'Ver mensajes y alertas',
        icono:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5-5V9a4 4 0 00-8 0v3l-5 5h5m0 0v1a2 2 0 002 2h2a2 2 0 002-2v-1"></path>',
        ruta: '/mi-cuenta/notificaciones',
        color: 'bg-yellow-500',
        badge: stats?.notificaciones_no_leidas,
      },
    ];
  });

  protected readonly pedidosRecientes = computed(() => {
    return this.dashboardData?.pedidos_recientes?.slice(0, 3) || [];
  });

  protected readonly favoritosRecientes = computed(() => {
    return this.dashboardData?.favoritos_recientes?.slice(0, 3) || [];
  });

  /**
   * 📅 Formatear fecha para mostrar
   */
  protected formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * 🎨 Obtener clase CSS para el estado del pedido
   */
  protected getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      confirmado: 'bg-blue-100 text-blue-800',
      preparando: 'bg-orange-100 text-orange-800',
      enviado: 'bg-green-100 text-green-800',
      entregado: 'bg-emerald-100 text-emerald-800',
      cancelado: 'bg-red-100 text-red-800',
    };

    return clases[estado] || 'bg-gray-100 text-gray-800';
  }

  /**
   * 📝 Obtener texto legible para el estado
   */
  protected getEstadoTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      preparando: 'Preparando',
      enviado: 'Enviado',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    };

    return textos[estado] || estado;
  }
}
