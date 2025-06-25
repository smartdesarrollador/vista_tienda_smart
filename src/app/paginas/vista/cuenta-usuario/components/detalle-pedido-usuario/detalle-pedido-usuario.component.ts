import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

import { CuentaUsuarioService } from '../../../../../core/services/cuenta-usuario.service';
import { Pedido } from '../../../../../core/models/pedido.interface';

/**
 * 📦 Tipo para el detalle completo del pedido
 */
type PedidoDetalle = Pedido & {
  numero_pedido?: string;
  factura_url?: string;
  descuento?: number;
  costo_envio?: number;
  igv?: number;
  direccion_envio?: {
    referencia?: string;
    direccion: string;
    distrito: string;
    provincia: string;
    departamento: string;
    telefono?: string;
  };
  metodo_pago?: {
    nombre: string;
    icono?: string;
  };
  referencia_pago?: string;
  codigo_seguimiento?: string;
  fecha_entrega_estimada?: string;
  fecha_confirmacion?: string;
  fecha_preparacion?: string;
  fecha_envio?: string;
  fecha_entrega?: string;
  fecha_cancelacion?: string;
};

/**
 * 📦 Interfaz para el timeline del pedido
 */
interface TimelineItem {
  fecha: string;
  titulo: string;
  descripcion: string;
  estado: 'completado' | 'actual' | 'pendiente';
  icono: string;
}

/**
 * 📋 Componente Detalle Pedido Usuario
 *
 * Características:
 * - Vista detallada completa del pedido
 * - Timeline visual del proceso
 * - Información de productos y cantidades
 * - Datos de facturación y envío
 * - Tracking de estado en tiempo real
 * - Opciones de descarga y acciones
 */
@Component({
  selector: 'app-detalle-pedido-usuario',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      @if (isLoading()) {
      <!-- Estado de carga -->
      <div class="flex items-center justify-center py-12">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
        <span class="ml-3 text-gray-600">Cargando detalle del pedido...</span>
      </div>
      } @else if (errorMessage()) {
      <!-- Estado de error -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center"
      >
        <div
          class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            class="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          Error al cargar el pedido
        </h3>
        <p class="text-gray-600 mb-4">{{ errorMessage() }}</p>
        <div class="space-x-3">
          <button
            (click)="cargarDetallePedido()"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Intentar nuevamente
          </button>
          <a
            routerLink="/mi-cuenta/pedidos"
            class="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Volver a pedidos
          </a>
        </div>
      </div>
      } @else if (pedido()) {
      <!-- Header del pedido -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div
          class="flex flex-col lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="flex items-center space-x-4 mb-4 lg:mb-0">
            <!-- Botón volver -->
            <a
              routerLink="/mi-cuenta/pedidos"
              class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Volver a pedidos"
            >
              <svg
                class="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                ></path>
              </svg>
            </a>

            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                Pedido #{{ pedido()?.numero_pedido || pedido()?.id }}
              </h1>
              <p class="text-gray-600">
                Realizado el {{ formatearFecha(pedido()!.created_at) }}
              </p>
            </div>

            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
              [ngClass]="getEstadoClass(pedido()!.estado)"
            >
              {{ getEstadoTexto(pedido()!.estado) }}
            </span>
          </div>

          <!-- Acciones del pedido -->
          <div class="flex flex-wrap gap-2">
            @if (pedido()?.factura_url) {
            <a
              [href]="pedido()?.factura_url"
              target="_blank"
              class="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              Descargar factura
            </a>
            } @if (puedeRecomprar()) {
            <button
              (click)="recomprarPedido()"
              class="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
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
              Recomprar
            </button>
            } @if (puedeCancelar()) {
            <button
              (click)="cancelarPedido()"
              class="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
              Cancelar pedido
            </button>
            }
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Columna principal: Productos y timeline -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Lista de productos -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-6 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">
                Productos ({{ pedido()?.detalles?.length || 0 }})
              </h2>
            </div>

            <div class="divide-y divide-gray-200">
              @if (pedido()?.detalles && pedido()!.detalles!.length > 0) { @for
              (detalle of pedido()!.detalles!; track detalle.id) {
              <div class="p-6 flex items-start space-x-4">
                <!-- Imagen del producto -->
                <div class="flex-shrink-0">
                  @if (detalle.producto?.imagen_principal) {
                  <img
                    [src]="detalle.producto?.imagen_principal"
                    [alt]="detalle.producto?.nombre"
                    class="w-16 h-16 rounded-lg object-cover"
                  />
                  } @else {
                  <div
                    class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center"
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </div>
                  }
                </div>

                <!-- Información del producto -->
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-medium text-gray-900">
                    {{ detalle.producto?.nombre }}
                  </h3>

                  @if ($any(detalle.producto)?.descripcion_corta) {
                  <p class="text-sm text-gray-600 mt-1">
                    {{ $any(detalle.producto)?.descripcion_corta }}
                  </p>
                  }

                  <!-- Variaciones/opciones -->
                  @if ($any(detalle).variacion_detalle) {
                  <div class="mt-2 text-sm text-gray-500">
                    {{ $any(detalle).variacion_detalle }}
                  </div>
                  }

                  <!-- Precio y cantidad -->
                  <div class="mt-3 flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                      <span class="text-sm text-gray-500">
                        Cantidad:
                        <span class="font-medium text-gray-900">{{
                          detalle.cantidad
                        }}</span>
                      </span>
                      <span class="text-sm text-gray-500">
                        Precio:
                        <span class="font-medium text-gray-900"
                          >S/ {{ detalle.precio_unitario }}</span
                        >
                      </span>
                    </div>

                    <div class="text-lg font-semibold text-gray-900">
                      S/ {{ detalle.subtotal }}
                    </div>
                  </div>
                </div>
              </div>
              } } @else {
              <div class="p-6 text-center text-gray-500">
                No hay productos en este pedido
              </div>
              }
            </div>
          </div>

          <!-- Timeline del pedido -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-6">
              Estado del pedido
            </h2>

            <div class="relative">
              @for (item of timelineItems(); track $index) {
              <div class="relative flex items-start pb-8 last:pb-0">
                <!-- Línea conectora -->
                @if (!$last) {
                <div
                  class="absolute left-4 top-8 w-0.5 h-full bg-gray-200"
                ></div>
                }

                <!-- Icono del estado -->
                <div
                  class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 mr-4"
                  [class.bg-green-500]="item.estado === 'completado'"
                  [class.border-green-500]="item.estado === 'completado'"
                  [class.bg-blue-500]="item.estado === 'actual'"
                  [class.border-blue-500]="item.estado === 'actual'"
                  [class.bg-gray-200]="item.estado === 'pendiente'"
                  [class.border-gray-300]="item.estado === 'pendiente'"
                >
                  <svg
                    class="w-4 h-4"
                    [class.text-white]="item.estado !== 'pendiente'"
                    [class.text-gray-500]="item.estado === 'pendiente'"
                    [innerHTML]="item.icono"
                  ></svg>
                </div>

                <!-- Contenido del timeline -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <h3
                      class="text-sm font-medium"
                      [class.text-gray-900]="item.estado !== 'pendiente'"
                      [class.text-gray-500]="item.estado === 'pendiente'"
                    >
                      {{ item.titulo }}
                    </h3>

                    @if (item.fecha) {
                    <span class="text-xs text-gray-500">
                      {{ formatearFecha(item.fecha) }}
                    </span>
                    }
                  </div>

                  <p
                    class="text-sm mt-1"
                    [class.text-gray-600]="item.estado !== 'pendiente'"
                    [class.text-gray-400]="item.estado === 'pendiente'"
                  >
                    {{ item.descripcion }}
                  </p>
                </div>
              </div>
              }
            </div>
          </div>
        </div>

        <!-- Columna lateral: Información del pedido -->
        <div class="space-y-6">
          <!-- Resumen del pedido -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              Resumen del pedido
            </h2>

            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">Subtotal:</span>
                <span class="font-medium"
                  >S/ {{ pedido()!.subtotal || '0.00' }}</span
                >
              </div>

              @if (pedido()?.descuento && pedido()!.descuento! > 0) {
              <div class="flex justify-between text-green-600">
                <span>Descuento:</span>
                <span>-S/ {{ pedido()?.descuento }}</span>
              </div>
              } @if (pedido()?.costo_envio) {
              <div class="flex justify-between">
                <span class="text-gray-600">Envío:</span>
                <span class="font-medium">S/ {{ pedido()?.costo_envio }}</span>
              </div>
              } @if (pedido()?.igv && pedido()!.igv! > 0) {
              <div class="flex justify-between">
                <span class="text-gray-600">IGV:</span>
                <span class="font-medium">S/ {{ pedido()?.igv }}</span>
              </div>
              }

              <div class="border-t pt-3">
                <div class="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>S/ {{ pedido()!.total }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Información de envío -->
          @if (pedido()?.direccion_envio) {
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              Dirección de envío
            </h2>

            <div class="text-sm space-y-2">
              <div class="font-medium">
                {{
                  pedido()?.direccion_envio?.referencia || 'Dirección principal'
                }}
              </div>
              <div class="text-gray-600">
                {{ pedido()?.direccion_envio?.direccion }}
              </div>
              <div class="text-gray-600">
                {{ pedido()?.direccion_envio?.distrito }},
                {{ pedido()?.direccion_envio?.provincia }}
              </div>
              <div class="text-gray-600">
                {{ pedido()?.direccion_envio?.departamento }}
              </div>

              @if (pedido()?.direccion_envio?.telefono) {
              <div class="text-gray-600 mt-3">
                <strong>Teléfono:</strong>
                {{ pedido()?.direccion_envio?.telefono }}
              </div>
              }
            </div>
          </div>
          }

          <!-- Información de pago -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              Método de pago
            </h2>

            <div class="flex items-center space-x-3">
              @if (pedido()?.metodo_pago?.icono) {
              <img
                [src]="pedido()?.metodo_pago?.icono"
                [alt]="pedido()?.metodo_pago?.nombre"
                class="w-8 h-8"
              />
              } @else {
              <div
                class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center"
              >
                <svg
                  class="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  ></path>
                </svg>
              </div>
              }

              <div>
                <div class="font-medium">
                  {{ pedido()?.metodo_pago?.nombre || 'No especificado' }}
                </div>
                @if (pedido()?.referencia_pago) {
                <div class="text-sm text-gray-500">
                  Ref: {{ pedido()?.referencia_pago }}
                </div>
                }
              </div>
            </div>
          </div>

          <!-- Tracking information -->
          @if (pedido()?.codigo_seguimiento) {
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              Código de seguimiento
            </h2>

            <div class="bg-gray-50 rounded-lg p-3">
              <div class="font-mono text-sm font-medium text-center">
                {{ pedido()?.codigo_seguimiento }}
              </div>
            </div>

            @if (pedido()?.fecha_entrega_estimada) {
            <div class="mt-3 text-sm text-gray-600">
              <strong>Entrega estimada:</strong>
              {{ formatearFecha(pedido()!.fecha_entrega_estimada!) }}
            </div>
            }
          </div>
          }
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      /* Animaciones para el timeline */
      .timeline-item {
        transition: all 0.3s ease;
      }

      /* Estados de pedidos personalizados */
      .estado-pendiente {
        @apply bg-yellow-100 text-yellow-800;
      }
      .estado-confirmado {
        @apply bg-blue-100 text-blue-800;
      }
      .estado-preparando {
        @apply bg-orange-100 text-orange-800;
      }
      .estado-enviado {
        @apply bg-green-100 text-green-800;
      }
      .estado-entregado {
        @apply bg-emerald-100 text-emerald-800;
      }
      .estado-cancelado {
        @apply bg-red-100 text-red-800;
      }

      /* Responsive improvements */
      @media (max-width: 640px) {
        .timeline-item {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class DetallePedidoUsuarioComponent implements OnInit {
  private readonly cuentaUsuarioService = inject(CuentaUsuarioService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // 🚦 Signals para gestión de estado
  protected readonly pedido = signal<PedidoDetalle | null>(null);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);

  // 📊 Signals computados
  protected readonly timelineItems = computed<TimelineItem[]>(() => {
    const p = this.pedido();
    if (!p) return [];

    const items: TimelineItem[] = [
      {
        fecha: p.created_at,
        titulo: 'Pedido realizado',
        descripcion: 'Tu pedido ha sido recibido y está siendo procesado',
        estado: 'completado',
        icono:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
      },
    ];

    // Agregar estados según el progreso
    if (['aprobado', 'en_proceso', 'enviado', 'entregado'].includes(p.estado)) {
      items.push({
        fecha: p.fecha_confirmacion || '',
        titulo: 'Pedido confirmado',
        descripcion: 'Hemos confirmado tu pedido y comenzaremos a prepararlo',
        estado: 'completado',
        icono:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>',
      });
    }

    if (['en_proceso', 'enviado', 'entregado'].includes(p.estado)) {
      items.push({
        fecha: p.fecha_preparacion || '',
        titulo: 'Preparando pedido',
        descripcion: 'Tu pedido está siendo empacado y preparado para el envío',
        estado: p.estado === 'en_proceso' ? 'actual' : 'completado',
        icono:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>',
      });
    }

    if (['enviado', 'entregado'].includes(p.estado)) {
      items.push({
        fecha: p.fecha_envio || '',
        titulo: 'Pedido enviado',
        descripcion: 'Tu pedido está en camino. Pronto lo recibirás',
        estado: p.estado === 'enviado' ? 'actual' : 'completado',
        icono:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>',
      });
    }

    if (p.estado === 'entregado') {
      items.push({
        fecha: p.fecha_entrega || '',
        titulo: 'Pedido entregado',
        descripcion: '¡Tu pedido ha sido entregado exitosamente!',
        estado: 'completado',
        icono:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
      });
    }

    if (p.estado === 'cancelado') {
      items.push({
        fecha: p.fecha_cancelacion || '',
        titulo: 'Pedido cancelado',
        descripcion: 'El pedido ha sido cancelado',
        estado: 'completado',
        icono:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>',
      });
    }

    return items;
  });

  ngOnInit(): void {
    this.cargarDetallePedido();
  }

  /**
   * 📂 Cargar detalle del pedido
   */
  protected cargarDetallePedido(): void {
    const pedidoId = this.activatedRoute.snapshot.params['id'];

    if (!pedidoId) {
      this.router.navigate(['/mi-cuenta/pedidos']);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.cuentaUsuarioService.getPedidoDetalle(+pedidoId).subscribe({
      next: (response) => {
        if (response.success) {
          this.pedido.set(response.data.pedido);
        } else {
          this.errorMessage.set('No se pudo cargar el detalle del pedido');
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          'Error al cargar el pedido. Verifica que el número sea correcto.'
        );
        this.isLoading.set(false);
        console.error('Error cargando detalle del pedido:', error);
      },
    });
  }

  /**
   * 📅 Formatear fecha
   */
  protected formatearFecha(fecha: string): string {
    if (!fecha) return '';

    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * 🎨 Obtener clase CSS para estado
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
   * 📝 Obtener texto del estado
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

  /**
   * ✅ Verificar si se puede recomprar
   */
  protected puedeRecomprar(): boolean {
    const p = this.pedido();
    return p ? ['entregado', 'cancelado'].includes(p.estado) : false;
  }

  /**
   * ❌ Verificar si se puede cancelar
   */
  protected puedeCancelar(): boolean {
    const p = this.pedido();
    return p ? ['pendiente', 'confirmado'].includes(p.estado) : false;
  }

  /**
   * 🔄 Recomprar pedido
   */
  protected recomprarPedido(): void {
    const p = this.pedido();
    if (p) {
      // TODO: Implementar lógica de recompra
      console.log('🔄 Recomprar pedido:', p.numero_pedido || p.id);
    }
  }

  /**
   * ❌ Cancelar pedido
   */
  protected cancelarPedido(): void {
    const p = this.pedido();
    if (
      p &&
      confirm(
        `¿Estás seguro de que deseas cancelar el pedido #${
          p.numero_pedido || p.id
        }?`
      )
    ) {
      // TODO: Implementar lógica de cancelación
      console.log('❌ Cancelar pedido:', p.numero_pedido || p.id);
    }
  }
}
