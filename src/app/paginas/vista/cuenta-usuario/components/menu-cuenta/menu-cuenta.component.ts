import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { User } from '../../../../../core/models/user.model';
import { EstadisticasUsuario } from '../../../../../core/models/cuenta-usuario.interface';

/**
 * 📋 Interfaz para items del menú
 */
interface MenuItem {
  id: string;
  titulo: string;
  icono: string;
  ruta: string;
  badge?: number;
  activo?: boolean;
  descripcion?: string;
}

/**
 * 📋 Componente de Menú de Cuenta
 *
 * Características:
 * - Navegación lateral responsive
 * - Badges dinámicos para notificaciones
 * - Avatar del usuario con información
 * - Indicador de sección activa
 * - Versión móvil optimizada
 */
@Component({
  selector: 'app-menu-cuenta',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div
      class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
    >
      <!-- 👤 Header del usuario -->
      <div class="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div class="flex items-center space-x-4">
          <!-- Avatar -->
          <div class="relative">
            <div
              class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm"
            >
              @if (usuario?.profile_image) {
              <img
                [src]="usuario?.profile_image"
                [alt]="usuario?.name"
                class="w-full h-full rounded-full object-cover"
              />
              } @else {
              <span class="text-2xl font-bold text-white">
                {{ inicialUsuario() }}
              </span>
              }
            </div>
            <!-- Indicador online -->
            <div
              class="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
            ></div>
          </div>

          <!-- Información del usuario -->
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-white truncate">
              {{ usuario?.name || 'Usuario' }}
            </h3>
            <p class="text-blue-100 text-sm truncate">
              {{ usuario?.email || 'email@ejemplo.com' }}
            </p>
            @if (estadisticas?.total_pedidos) {
            <div class="flex items-center mt-1">
              <svg
                class="w-4 h-4 text-blue-200 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-blue-100 text-xs">
                {{ estadisticas?.total_pedidos }} pedidos realizados
              </span>
            </div>
            }
          </div>
        </div>

        <!-- Estadísticas rápidas - Solo desktop -->
        @if (!esMobile && estadisticas) {
        <div class="mt-4 grid grid-cols-2 gap-3">
          <div class="bg-white bg-opacity-10 rounded-lg p-3 backdrop-blur-sm">
            <div class="text-2xl font-bold text-white">
              {{ estadisticas.pedidos_entregados }}
            </div>
            <div class="text-blue-100 text-xs">Entregados</div>
          </div>
          <div class="bg-white bg-opacity-10 rounded-lg p-3 backdrop-blur-sm">
            <div class="text-2xl font-bold text-white">
              {{ estadisticas.total_favoritos }}
            </div>
            <div class="text-blue-100 text-xs">Favoritos</div>
          </div>
        </div>
        }
      </div>

      <!-- 📋 Menú de navegación -->
      <nav class="py-2" role="navigation" aria-label="Navegación de cuenta">
        @for (item of menuItems(); track item.id) {
        <button
          (click)="seleccionarItem(item)"
          class="w-full flex items-center px-6 py-3 text-left transition-all duration-200 group hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
          [class.bg-blue-50]="item.activo"
          [class.border-r-3]="item.activo"
          [class.border-blue-600]="item.activo"
          type="button"
          [attr.aria-current]="item.activo ? 'page' : null"
        >
          <!-- Icono -->
          <div class="flex-shrink-0 mr-3">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              [class.bg-blue-100]="item.activo"
              [class.text-blue-600]="item.activo"
              [class.text-gray-500]="!item.activo"
              [class.group-hover:bg-gray-100]="!item.activo"
              [class.group-hover:text-gray-600]="!item.activo"
            >
              <svg class="w-5 h-5" [innerHTML]="item.icono"></svg>
            </div>
          </div>

          <!-- Contenido del item -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span
                class="font-medium transition-colors"
                [class.text-blue-600]="item.activo"
                [class.text-gray-900]="!item.activo"
                [class.group-hover:text-gray-900]="!item.activo"
              >
                {{ item.titulo }}
              </span>

              <!-- Badge -->
              @if (item.badge && item.badge > 0) {
              <span
                class="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[20px] text-center"
              >
                {{ item.badge > 99 ? '99+' : item.badge }}
              </span>
              }
            </div>

            <!-- Descripción (solo desktop) -->
            @if (!esMobile && item.descripcion) {
            <p
              class="text-sm text-gray-500 mt-1 group-hover:text-gray-600 transition-colors"
            >
              {{ item.descripcion }}
            </p>
            }
          </div>

          <!-- Indicador de navegación -->
          @if (!esMobile) {
          <div class="flex-shrink-0 ml-2">
            <svg
              class="w-4 h-4 transition-colors"
              [class.text-blue-600]="item.activo"
              [class.text-gray-400]="!item.activo"
              [class.group-hover:text-gray-500]="!item.activo"
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
          </div>
          }
        </button>
        }
      </nav>

      <!-- 📊 Resumen de estadísticas (solo móvil) -->
      @if (esMobile && estadisticas) {
      <div class="px-6 py-4 bg-gray-50 border-t">
        <h4 class="text-sm font-medium text-gray-900 mb-3">
          Resumen de actividad
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <div class="text-center">
            <div class="text-lg font-semibold text-gray-900">
              {{ estadisticas.total_pedidos }}
            </div>
            <div class="text-xs text-gray-500">Pedidos</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-gray-900">
              {{ estadisticas.total_favoritos }}
            </div>
            <div class="text-xs text-gray-500">Favoritos</div>
          </div>
        </div>
      </div>
      }

      <!-- 🚪 Botón de cerrar sesión -->
      <div class="p-4 border-t bg-gray-50">
        <button
          (click)="cerrarSesion()"
          class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            ></path>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      /* Borde izquierdo para item activo */
      .border-r-3 {
        border-right-width: 3px;
      }

      /* Smooth transitions */
      button {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Hover effects */
      button:hover .group-hover\\:bg-gray-100 {
        background-color: #f3f4f6;
      }

      /* Focus styles */
      button:focus {
        outline: 2px solid transparent;
        outline-offset: 2px;
        box-shadow: 0 0 0 2px #3b82f6;
      }
    `,
  ],
})
export class MenuCuentaComponent {
  @Input() usuario: User | null = null;
  @Input() estadisticas: EstadisticasUsuario | null = null;
  @Input() seccionActiva: string = 'dashboard';
  @Input() notificacionesNoLeidas: number = 0;
  @Input() esMobile: boolean = false;

  @Output() seccionSeleccionada = new EventEmitter<string>();

  // 🚦 Signal para la inicial del usuario
  protected readonly inicialUsuario = computed(() => {
    const nombre = this.usuario?.name;
    if (!nombre) return 'U';
    return nombre.charAt(0).toUpperCase();
  });

  // 📋 Signal para los items del menú
  protected readonly menuItems = computed<MenuItem[]>(() => [
    {
      id: 'dashboard',
      titulo: 'Dashboard',
      icono: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h0a2 2 0 012 2v0H8v0z"></path>`,
      ruta: '/mi-cuenta/dashboard',
      activo: this.seccionActiva === 'dashboard',
      descripcion: 'Resumen de tu actividad',
    },
    {
      id: 'pedidos',
      titulo: 'Mis Pedidos',
      icono: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>`,
      ruta: '/mi-cuenta/pedidos',
      activo: this.seccionActiva === 'pedidos',
      descripcion: 'Historial de compras',
      badge: this.estadisticas?.pedidos_pendientes,
    },
    {
      id: 'favoritos',
      titulo: 'Mis Favoritos',
      icono: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>`,
      ruta: '/mi-cuenta/favoritos',
      activo: this.seccionActiva === 'favoritos',
      descripcion: 'Productos guardados',
      badge: this.estadisticas?.total_favoritos,
    },
    {
      id: 'direcciones',
      titulo: 'Mis Direcciones',
      icono: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>`,
      ruta: '/mi-cuenta/direcciones',
      activo: this.seccionActiva === 'direcciones',
      descripcion: 'Administrar direcciones',
      badge: this.estadisticas?.total_direcciones,
    },
    {
      id: 'notificaciones',
      titulo: 'Notificaciones',
      icono: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5-5V9a4 4 0 00-8 0v3l-5 5h5m0 0v1a2 2 0 002 2h2a2 2 0 002-2v-1"></path>`,
      ruta: '/mi-cuenta/notificaciones',
      activo: this.seccionActiva === 'notificaciones',
      descripcion: 'Mensajes y alertas',
      badge: this.notificacionesNoLeidas,
    },
    {
      id: 'configuracion',
      titulo: 'Configuración',
      icono: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>`,
      ruta: '/mi-cuenta/configuracion',
      activo: this.seccionActiva === 'configuracion',
      descripcion: 'Preferencias de cuenta',
    },
  ]);

  /**
   * 📋 Seleccionar un item del menú
   */
  protected seleccionarItem(item: MenuItem): void {
    this.seccionSeleccionada.emit(item.id);
  }

  /**
   * 🚪 Cerrar sesión
   */
  protected cerrarSesion(): void {
    // TODO: Implementar lógica de cierre de sesión
    console.log('🚪 Cerrando sesión...');
  }
}
