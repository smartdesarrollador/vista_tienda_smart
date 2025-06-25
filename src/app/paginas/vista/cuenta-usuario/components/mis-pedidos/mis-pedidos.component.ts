import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
} from '@angular/forms';

import { CuentaUsuarioService } from '../../../../../core/services/cuenta-usuario.service';
import {
  FiltrosPedidosUsuario,
  EstadoPedido,
  OrdenamientoPedidos,
} from '../../../../../core/models/cuenta-usuario.interface';
import { Pedido } from '../../../../../core/models/pedido.interface';
import { PaginationMeta } from '../../../../../core/models/common.interface';

// Tipo para pedidos con propiedades adicionales usando intersección
type PedidoExtendido = Pedido & {
  factura_url?: string;
  numero_pedido?: string;
  numero_items?: number;
  codigo_rastreo?: string;
};

/**
 * 📦 Componente Mis Pedidos
 *
 * Características:
 * - Lista paginada de pedidos del usuario
 * - Filtros avanzados (estado, fecha, monto, método de pago)
 * - Búsqueda por número de pedido
 * - Ordenamiento configurable
 * - Vista detallada de cada pedido
 * - Acciones: ver detalle, cancelar, recomprar
 */
@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- 📄 Header con título y estadísticas -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
            <p class="text-gray-600 mt-1">
              Gestiona y revisa el historial de tus compras
            </p>
          </div>

          @if (estadisticasResumen()) {
          <div class="mt-4 sm:mt-0 flex space-x-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">
                {{ estadisticasResumen()?.total }}
              </div>
              <div class="text-sm text-gray-500">Total</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">
                {{ estadisticasResumen()?.entregados }}
              </div>
              <div class="text-sm text-gray-500">Entregados</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-600">
                {{ estadisticasResumen()?.pendientes }}
              </div>
              <div class="text-sm text-gray-500">Pendientes</div>
            </div>
          </div>
          }
        </div>
      </div>

      <!-- 🔍 Barra de búsqueda y filtros -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form [formGroup]="filtrosForm" class="space-y-4">
          <!-- Búsqueda principal -->
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <label
                for="busqueda"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Buscar pedido
              </label>
              <div class="relative">
                <input
                  id="busqueda"
                  type="text"
                  formControlName="numero_pedido"
                  placeholder="Número de pedido, ej: #ORD-12345"
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  (input)="onBusquedaChange($event)"
                />
                <svg
                  class="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
            </div>

            <div class="sm:w-48">
              <label
                for="estado"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Estado
              </label>
              <select
                id="estado"
                formControlName="estado"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                (change)="aplicarFiltros()"
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="preparando">Preparando</option>
                <option value="enviado">Enviado</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <!-- Filtros avanzados (colapsables) -->
          <div class="border-t pt-4">
            <button
              type="button"
              (click)="toggleFiltrosAvanzados()"
              class="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span>Filtros avanzados</span>
              <svg
                class="ml-2 w-4 h-4 transition-transform"
                [class.rotate-180]="mostrarFiltrosAvanzados()"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>

            @if (mostrarFiltrosAvanzados()) {
            <div
              class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <!-- Fecha desde -->
              <div>
                <label
                  for="fechaDesde"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Desde
                </label>
                <input
                  id="fechaDesde"
                  type="date"
                  formControlName="fecha_desde"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  (change)="aplicarFiltros()"
                />
              </div>

              <!-- Fecha hasta -->
              <div>
                <label
                  for="fechaHasta"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Hasta
                </label>
                <input
                  id="fechaHasta"
                  type="date"
                  formControlName="fecha_hasta"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  (change)="aplicarFiltros()"
                />
              </div>

              <!-- Ordenamiento -->
              <div>
                <label
                  for="ordenamiento"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Ordenar por
                </label>
                <select
                  id="ordenamiento"
                  formControlName="sort_by"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  (change)="aplicarFiltros()"
                >
                  <option value="created_at">Fecha de pedido</option>
                  <option value="total">Monto total</option>
                  <option value="estado">Estado</option>
                  <option value="numero_pedido">Número de pedido</option>
                </select>
              </div>

              <!-- Dirección -->
              <div>
                <label
                  for="direccion"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Dirección
                </label>
                <select
                  id="direccion"
                  formControlName="sort_dir"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  (change)="aplicarFiltros()"
                >
                  <option value="desc">Más reciente</option>
                  <option value="asc">Más antiguo</option>
                </select>
              </div>
            </div>

            <!-- Botones de acción para filtros -->
            <div class="mt-4 flex justify-between">
              <button
                type="button"
                (click)="limpiarFiltros()"
                class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Limpiar filtros
              </button>

              <div class="text-sm text-gray-500">
                {{ totalPedidos() }} pedido{{
                  totalPedidos() !== 1 ? 's' : ''
                }}
                encontrado{{ totalPedidos() !== 1 ? 's' : '' }}
              </div>
            </div>
            }
          </div>
        </form>
      </div>

      <!-- 📋 Lista de pedidos -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        @if (isLoading()) {
        <!-- Estado de carga -->
        <div class="p-8 text-center">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"
          ></div>
          <p class="text-gray-600 mt-4">Cargando pedidos...</p>
        </div>
        } @else if (errorMessage()) {
        <!-- Estado de error -->
        <div class="p-8 text-center">
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
            Error al cargar pedidos
          </h3>
          <p class="text-gray-600 mb-4">{{ errorMessage() }}</p>
          <button
            (click)="cargarPedidos()"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Intentar nuevamente
          </button>
        </div>
        } @else if (pedidos().length === 0) {
        <!-- Estado vacío -->
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
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              ></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
          <p class="text-gray-600 mb-4">
            @if (tieneFilttrosActivos()) { No se encontraron pedidos con los
            filtros aplicados. } @else { Aún no has realizado ningún pedido.
            ¡Explora nuestro catálogo! }
          </p>

          @if (tieneFilttrosActivos()) {
          <button
            (click)="limpiarFiltros()"
            class="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors mr-2"
          >
            Limpiar filtros
          </button>
          }

          <a
            routerLink="/catalogo"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir al catálogo
          </a>
        </div>
        } @else {
        <!-- Lista de pedidos -->
        <div class="divide-y divide-gray-200">
          @for (pedido of pedidos(); track pedido.id) {
          <div class="p-6 hover:bg-gray-50 transition-colors">
            <!-- Header del pedido -->
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4"
            >
              <div class="flex items-center space-x-4">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">
                    Pedido #{{ pedido.id }}
                  </h3>
                  <p class="text-sm text-gray-500">
                    {{ formatearFecha(pedido.created_at) }}
                  </p>
                </div>

                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  [ngClass]="getEstadoClass(pedido.estado)"
                >
                  {{ getEstadoTexto(pedido.estado) }}
                </span>
              </div>

              <div class="mt-4 sm:mt-0 flex items-center space-x-4">
                <div class="text-right">
                  <div class="text-xl font-bold text-gray-900">
                    S/ {{ pedido.total }}
                  </div>
                  @if (pedido.tipo_pago) {
                  <div class="text-sm text-gray-500">
                    {{ pedido.tipo_pago }}
                  </div>
                  }
                </div>
              </div>
            </div>

            <!-- Información adicional del pedido -->
            <div
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4"
            >
              <div>
                <span class="text-sm font-medium text-gray-500">Items:</span>
                <span class="text-sm text-gray-900 ml-1">{{
                  pedido.numero_items || 0
                }}</span>
              </div>

              @if (pedido.estimado_entrega) {
              <div>
                <span class="text-sm font-medium text-gray-500"
                  >Entrega estimada:</span
                >
                <span class="text-sm text-gray-900 ml-1">{{
                  formatearFecha(pedido.estimado_entrega)
                }}</span>
              </div>
              } @if (pedido.codigo_rastreo) {
              <div>
                <span class="text-sm font-medium text-gray-500">Código:</span>
                <span class="text-sm text-gray-900 ml-1">{{
                  pedido.codigo_rastreo
                }}</span>
              </div>
              }
            </div>

            <!-- Acciones del pedido -->
            <div class="flex flex-wrap gap-2">
              <a
                [routerLink]="['/mi-cuenta/pedidos', pedido.id]"
                class="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg
                  class="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  ></path>
                </svg>
                Ver detalle
              </a>

              @if (puedeRecomprar(pedido)) {
              <button
                (click)="recomprarPedido(pedido)"
                class="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                type="button"
              >
                <svg
                  class="w-4 h-4 mr-1"
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
              } @if (puedeCancelar(pedido)) {
              <button
                (click)="cancelarPedido(pedido)"
                class="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                type="button"
              >
                <svg
                  class="w-4 h-4 mr-1"
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
                Cancelar
              </button>
              } @if (pedido.factura_url) {
              <a
                [href]="pedido.factura_url"
                target="_blank"
                class="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg
                  class="w-4 h-4 mr-1"
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
              }
            </div>
          </div>
          }
        </div>

        <!-- 📄 Paginación -->
        @if (paginacion() && paginacion()!.last_page > 1) {
        <div class="px-6 py-4 bg-gray-50 border-t">
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between"
          >
            <!-- Información de paginación -->
            <div class="text-sm text-gray-700 mb-4 sm:mb-0">
              Mostrando {{ paginacion()!.from }} a {{ paginacion()!.to }} de
              {{ paginacion()!.total }} pedidos
            </div>

            <!-- Controles de paginación -->
            <div class="flex items-center space-x-2">
              <button
                (click)="cambiarPagina(paginacion()!.current_page - 1)"
                [disabled]="paginacion()!.current_page === 1"
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                type="button"
              >
                Anterior
              </button>

              @for (page of getPaginasVisibles(); track page) { @if (page ===
              '...') {
              <span class="px-3 py-2 text-sm text-gray-500">...</span>
              } @else {
              <button
                (click)="cambiarPagina(+page)"
                [class.bg-blue-600]="page === paginacion()!.current_page"
                [class.text-white]="page === paginacion()!.current_page"
                [class.text-gray-700]="page !== paginacion()!.current_page"
                [class.bg-white]="page !== paginacion()!.current_page"
                class="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                type="button"
              >
                {{ page }}
              </button>
              } }

              <button
                (click)="cambiarPagina(paginacion()!.current_page + 1)"
                [disabled]="
                  paginacion()!.current_page === paginacion()!.last_page
                "
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                type="button"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
        } }
      </div>
    </div>
  `,
  styles: [
    `
      /* Animaciones para transiciones suaves */
      .transition-all {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Rotación del icono de filtros */
      .rotate-180 {
        transform: rotate(180deg);
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

      /* Hover effects mejorados */
      .hover\\:bg-gray-50:hover {
        background-color: #f9fafb;
      }

      /* Focus states para accesibilidad */
      input:focus,
      select:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    `,
  ],
})
export class MisPedidosComponent implements OnInit {
  private readonly cuentaUsuarioService = inject(CuentaUsuarioService);
  private readonly fb = inject(FormBuilder);

  // 🚦 Signals para gestión de estado
  protected readonly pedidos = signal<PedidoExtendido[]>([]);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly paginacion = signal<PaginationMeta | null>(null);
  protected readonly mostrarFiltrosAvanzados = signal<boolean>(false);
  protected readonly totalPedidos = signal<number>(0);

  // 📊 Form para filtros
  protected readonly filtrosForm: FormGroup = this.fb.group({
    numero_pedido: [''],
    estado: [''],
    fecha_desde: [''],
    fecha_hasta: [''],
    sort_by: ['created_at'],
    sort_dir: ['desc'],
  });

  // 📊 Signals computados
  protected readonly estadisticasResumen = computed(() => {
    const pedidosData = this.pedidos();
    if (pedidosData.length === 0) return null;

    return {
      total: this.totalPedidos(),
      entregados: pedidosData.filter((p) => p.estado === 'entregado').length,
      pendientes: pedidosData.filter((p) =>
        ['pendiente', 'confirmado', 'preparando', 'enviado'].includes(p.estado)
      ).length,
    };
  });

  protected readonly tieneFilttrosActivos = computed(() => {
    const form = this.filtrosForm.value;
    return !!(
      form.numero_pedido ||
      form.estado ||
      form.fecha_desde ||
      form.fecha_hasta
    );
  });

  ngOnInit(): void {
    this.cargarPedidos();
    this.configurarFormulario();
  }

  /**
   * ⚙️ Configurar el formulario de filtros
   */
  private configurarFormulario(): void {
    // Aplicar filtros automáticamente en algunos campos
    this.filtrosForm.get('estado')?.valueChanges.subscribe(() => {
      this.aplicarFiltros();
    });
  }

  /**
   * 📂 Cargar pedidos con filtros
   */
  protected cargarPedidos(pagina: number = 1): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filtros = {
      ...this.filtrosForm.value,
      page: pagina,
      per_page: 10,
    };

    // Limpiar filtros vacíos
    Object.keys(filtros).forEach((key) => {
      if (filtros[key] === '' || filtros[key] === null) {
        delete filtros[key];
      }
    });

    this.cuentaUsuarioService.getPedidos(filtros).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.pedidos.set(
            response.data.pedidos.map((pedido: any) => pedido) || []
          );
          if (response.data.pagination) {
            this.paginacion.set(response.data.pagination);
            this.totalPedidos.set(response.data.pagination.total || 0);
          }
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          'Error al cargar los pedidos. Por favor, intenta nuevamente.'
        );
        this.isLoading.set(false);
        console.error('Error cargando pedidos:', error);
      },
    });
  }

  /**
   * 🔍 Manejar cambio en búsqueda con debounce
   */
  private searchTimeout: any;
  protected onBusquedaChange(event: any): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.aplicarFiltros();
    }, 500);
  }

  /**
   * 🎛️ Aplicar filtros
   */
  protected aplicarFiltros(): void {
    this.cargarPedidos(1);
  }

  /**
   * 🧹 Limpiar todos los filtros
   */
  protected limpiarFiltros(): void {
    this.filtrosForm.reset({
      numero_pedido: '',
      estado: '',
      fecha_desde: '',
      fecha_hasta: '',
      sort_by: 'created_at',
      sort_dir: 'desc',
    });
    this.cargarPedidos(1);
  }

  /**
   * 🔄 Toggle filtros avanzados
   */
  protected toggleFiltrosAvanzados(): void {
    this.mostrarFiltrosAvanzados.update((show) => !show);
  }

  /**
   * 📄 Cambiar página
   */
  protected cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= (this.paginacion()?.last_page || 1)) {
      this.cargarPedidos(pagina);
    }
  }

  /**
   * 📄 Obtener páginas visibles para paginación
   */
  protected getPaginasVisibles(): (number | string)[] {
    const pag = this.paginacion();
    if (!pag) return [];

    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, pag.current_page - delta);
      i <= Math.min(pag.last_page - 1, pag.current_page + delta);
      i++
    ) {
      range.push(i);
    }

    if (pag.current_page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (pag.current_page + delta < pag.last_page - 1) {
      rangeWithDots.push('...', pag.last_page);
    } else {
      rangeWithDots.push(pag.last_page);
    }

    return rangeWithDots;
  }

  /**
   * 📅 Formatear fecha
   */
  protected formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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
  protected puedeRecomprar(pedido: Pedido): boolean {
    return ['entregado', 'cancelado'].includes(pedido.estado);
  }

  /**
   * ❌ Verificar si se puede cancelar
   */
  protected puedeCancelar(pedido: Pedido): boolean {
    return ['pendiente', 'confirmado'].includes(pedido.estado);
  }

  /**
   * 🔄 Recomprar pedido
   */
  protected recomprarPedido(pedido: Pedido): void {
    // TODO: Implementar lógica de recompra
    console.log('🔄 Recomprar pedido:', pedido.id);
  }

  /**
   * ❌ Cancelar pedido
   */
  protected cancelarPedido(pedido: Pedido): void {
    if (
      confirm(`¿Estás seguro de que deseas cancelar el pedido #${pedido.id}?`)
    ) {
      // TODO: Implementar lógica de cancelación
      console.log('❌ Cancelar pedido:', pedido.id);
    }
  }
}
