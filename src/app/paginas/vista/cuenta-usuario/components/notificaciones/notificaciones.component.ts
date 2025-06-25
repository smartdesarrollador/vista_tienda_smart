import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { CuentaUsuarioService } from '../../../../../core/services/cuenta-usuario.service';
import { NotificacionUsuario } from '../../../../../core/models/cuenta-usuario.interface';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Notificaciones</h1>
            <p class="text-gray-600 mt-1">
              Mantente al día con tus pedidos y ofertas
            </p>
          </div>

          @if (noLeidas() > 0) {
          <button
            (click)="marcarTodasLeidas()"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Marcar todas como leídas
          </button>
          }
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex space-x-4">
          <button
            (click)="filtroActivo.set('todas')"
            [class.bg-blue-600]="filtroActivo() === 'todas'"
            [class.text-white]="filtroActivo() === 'todas'"
            [class.bg-gray-100]="filtroActivo() !== 'todas'"
            class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
          >
            Todas ({{ notificaciones().length }})
          </button>

          <button
            (click)="filtroActivo.set('no_leidas')"
            [class.bg-blue-600]="filtroActivo() === 'no_leidas'"
            [class.text-white]="filtroActivo() === 'no_leidas'"
            [class.bg-gray-100]="filtroActivo() !== 'no_leidas'"
            class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
          >
            No leídas ({{ noLeidas() }})
          </button>
        </div>
      </div>

      <!-- Lista de notificaciones -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        @if (isLoading()) {
        <div class="p-8 text-center">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"
          ></div>
          <p class="text-gray-600 mt-4">Cargando notificaciones...</p>
        </div>
        } @else if (notificacionesFiltradas().length === 0) {
        <div class="p-8 text-center">
          <div
            class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 17h5l-5 5v-5zM4 19h6v2H4v-2zM4 15h8v2H4v-2zM4 11h10v2H4v-2zM4 7h12v2H4V7z"
              ></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            No hay notificaciones
          </h3>
          <p class="text-gray-600">
            {{
              filtroActivo() === 'no_leidas'
                ? 'No tienes notificaciones sin leer'
                : 'No tienes notificaciones aún'
            }}
          </p>
        </div>
        } @else {
        <div class="divide-y divide-gray-200">
          @for (notificacion of notificacionesFiltradas(); track
          notificacion.id) {
          <div
            class="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
            [class.bg-blue-50]="!notificacion.leido"
            (click)="marcarComoLeida(notificacion)"
          >
            <div class="flex items-start space-x-4">
              <!-- Icono -->
              <div
                class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                [ngClass]="getTipoIconoClass(notificacion.tipo)"
              >
                <svg
                  class="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  [innerHTML]="getTipoIcono(notificacion.tipo)"
                ></svg>
              </div>

              <!-- Contenido -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-medium text-gray-900 truncate">
                    {{ notificacion.titulo }}
                  </h3>

                  <div class="flex items-center space-x-2 ml-4">
                    @if (!notificacion.leido) {
                    <span class="w-2 h-2 bg-blue-600 rounded-full"></span>
                    }
                    <span class="text-xs text-gray-500 whitespace-nowrap">
                      {{ formatearFecha(notificacion.fecha) }}
                    </span>
                  </div>
                </div>

                <p class="text-sm text-gray-600 mt-1">
                  {{ notificacion.mensaje }}
                </p>

                @if (notificacion.accion_url) {
                <button
                  (click)="ejecutarAccion(notificacion, $event)"
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  {{ notificacion.accion_texto || 'Ver más' }}
                </button>
                }
              </div>
            </div>
          </div>
          }
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .transition-colors {
        transition: color 0.2s, background-color 0.2s;
      }
    `,
  ],
})
export class NotificacionesComponent implements OnInit {
  private readonly cuentaUsuarioService = inject(CuentaUsuarioService);

  protected readonly notificaciones = signal<NotificacionUsuario[]>([]);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly filtroActivo = signal<'todas' | 'no_leidas'>('todas');

  protected readonly noLeidas = signal<number>(0);
  protected readonly notificacionesFiltradas = signal<NotificacionUsuario[]>(
    []
  );

  ngOnInit(): void {
    this.cargarNotificaciones();

    // Actualizar filtros cuando cambien las notificaciones o el filtro
    this.actualizarFiltros();
  }

  private cargarNotificaciones(): void {
    this.isLoading.set(true);

    this.cuentaUsuarioService.getNotificaciones().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.notificaciones.set(
            response.data.notificaciones.map((notif: any) => ({
              ...notif,
              fecha: notif.created_at,
            }))
          );
          this.actualizarFiltros();
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando notificaciones:', error);
        this.isLoading.set(false);
      },
    });
  }

  private actualizarFiltros(): void {
    const notifs = this.notificaciones();
    this.noLeidas.set(notifs.filter((n) => !n.leido).length);

    const filtro = this.filtroActivo();
    if (filtro === 'no_leidas') {
      this.notificacionesFiltradas.set(notifs.filter((n) => !n.leido));
    } else {
      this.notificacionesFiltradas.set(notifs);
    }
  }

  protected marcarComoLeida(notificacion: NotificacionUsuario): void {
    if (!notificacion.leido) {
      this.cuentaUsuarioService
        .marcarNotificacionLeida(notificacion.id)
        .subscribe({
          next: (response) => {
            if (response.success) {
              notificacion.leido = true;
              this.actualizarFiltros();
            }
          },
        });
    }
  }

  protected marcarTodasLeidas(): void {
    this.cuentaUsuarioService.marcarTodasNotificacionesLeidas().subscribe({
      next: (response) => {
        if (response.success) {
          this.cargarNotificaciones();
        }
      },
    });
  }

  protected ejecutarAccion(
    notificacion: NotificacionUsuario,
    event: Event
  ): void {
    event.stopPropagation();
    if (notificacion.accion_url) {
      // TODO: Navegar o ejecutar acción
      console.log('Ejecutar acción:', notificacion.accion_url);
    }
  }

  protected getTipoIconoClass(tipo: string): string {
    const clases: { [key: string]: string } = {
      pedido: 'bg-blue-100 text-blue-600',
      promocion: 'bg-green-100 text-green-600',
      sistema: 'bg-gray-100 text-gray-600',
      pago: 'bg-yellow-100 text-yellow-600',
    };
    return clases[tipo] || 'bg-gray-100 text-gray-600';
  }

  protected getTipoIcono(tipo: string): string {
    const iconos: { [key: string]: string } = {
      pedido:
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>',
      promocion:
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>',
      sistema:
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
      pago: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>',
    };
    return iconos[tipo] || iconos['sistema'];
  }

  protected formatearFecha(fecha: string): string {
    const now = new Date();
    const date = new Date(fecha);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Hace unos minutos';
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    if (diffInHours < 48) return 'Ayer';

    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }
}
