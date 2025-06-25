import { Component, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../../../core/models/producto.interface';
import { ResenasProductoComponent } from '../resenas-producto/resenas-producto.component';

/**
 * Tipos de tabs disponibles
 */
type TabType = 'descripcion' | 'especificaciones' | 'resenas';

/**
 * Interface para la configuración de tabs
 */
interface TabConfig {
  id: TabType;
  label: string;
  icono: string;
  activo: boolean;
}

@Component({
  selector: 'app-tabs-informacion',
  standalone: true,
  imports: [CommonModule, ResenasProductoComponent],
  template: `
    <!-- Tabs de Información del Producto -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <!-- Tab Headers -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          @for (tab of tabs(); track tab.id) {
          <button
            type="button"
            (click)="seleccionarTab(tab.id)"
            class="group relative min-w-0 flex-1 overflow-hidden py-4 px-1 text-center text-sm font-medium transition-colors duration-200 focus:z-10"
            [class.text-blue-600]="tabActivo() === tab.id"
            [class.border-blue-500]="tabActivo() === tab.id"
            [class.text-gray-500]="tabActivo() !== tab.id"
            [class.border-transparent]="tabActivo() !== tab.id"
            [class.hover:text-gray-700]="tabActivo() !== tab.id"
            [attr.aria-current]="tabActivo() === tab.id ? 'page' : null"
          >
            <div class="flex items-center justify-center gap-2">
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                [innerHTML]="tab.icono"
              ></svg>
              <span class="hidden sm:block">{{ tab.label }}</span>
            </div>

            <!-- Indicador activo -->
            <span
              class="absolute inset-x-0 bottom-0 h-0.5 transition-colors duration-200"
              [class.bg-blue-500]="tabActivo() === tab.id"
              [class.bg-transparent]="tabActivo() !== tab.id"
              aria-hidden="true"
            ></span>
          </button>
          }
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Descripción -->
        @if (tabActivo() === 'descripcion') {
        <div
          class="space-y-4"
          role="tabpanel"
          aria-labelledby="descripcion-tab"
        >
          <h3 class="text-lg font-semibold text-gray-900">
            Descripción del Producto
          </h3>

          @if (producto().descripcion) {
          <div class="prose prose-gray max-w-none">
            <p class="text-gray-700 leading-relaxed whitespace-pre-line">
              {{ producto().descripcion }}
            </p>
          </div>
          } @else {
          <p class="text-gray-500 italic">
            No hay descripción disponible para este producto.
          </p>
          } @if (producto().caracteristicas &&
          (producto().caracteristicas?.length ?? 0) > 0) {
          <div class="mt-6">
            <h4 class="font-medium text-gray-900 mb-3">
              Características Principales:
            </h4>
            <ul class="space-y-2">
              @for (caracteristica of producto().caracteristicas!; track $index)
              {
              <li class="flex items-start gap-2">
                <svg
                  class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-gray-700">{{ caracteristica }}</span>
              </li>
              }
            </ul>
          </div>
          }
        </div>
        }

        <!-- Especificaciones -->
        @if (tabActivo() === 'especificaciones') {
        <div
          class="space-y-4"
          role="tabpanel"
          aria-labelledby="especificaciones-tab"
        >
          <h3 class="text-lg font-semibold text-gray-900">
            Especificaciones Técnicas
          </h3>

          <div class="overflow-hidden">
            <dl class="divide-y divide-gray-200">
              <!-- SKU -->
              <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500">SKU</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{ producto().sku }}
                </dd>
              </div>

              <!-- Marca -->
              @if (producto().marca) {
              <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500">Marca</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{ producto().marca }}
                </dd>
              </div>
              }

              <!-- Categoría -->
              @if (producto().categoria?.nombre) {
              <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500">Categoría</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{ producto().categoria?.nombre }}
                </dd>
              </div>
              }

              <!-- Estado -->
              <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500">Estado</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  @if (producto().stock > 0) {
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    En Stock ({{ producto().stock }} unidades)
                  </span>
                  } @else {
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                  >
                    Sin Stock
                  </span>
                  }
                </dd>
              </div>

              <!-- Peso -->
              @if (producto().peso != null && (producto().peso ?? 0) > 0) {
              <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500">Peso</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{ producto().peso }} kg
                </dd>
              </div>
              }

              <!-- Dimensiones -->
              @if (producto().dimensiones != null &&
              (producto().dimensiones?.length ?? 0) > 0) {
              <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500">Dimensiones</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{ producto().dimensiones }}
                </dd>
              </div>
              }

              <!-- Garantía -->
              @if (producto().garantia) {
              <div class="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm font-medium text-gray-500">Garantía</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{ producto().garantia }}
                </dd>
              </div>
              }
            </dl>
          </div>
        </div>
        }

        <!-- Reseñas -->
        @if (tabActivo() === 'resenas') {
        <div role="tabpanel" aria-labelledby="resenas-tab">
          <app-resenas-producto [producto]="producto()" />
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      /* Animaciones para cambio de tabs */
      [role='tabpanel'] {
        animation: fadeIn 0.3s ease-in-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Transiciones suaves */
      button {
        transition: all 0.2s ease-in-out;
      }

      /* Hover effects */
      button:hover span {
        color: inherit;
      }

      /* Responsive tabs */
      @media (max-width: 640px) {
        nav {
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        nav::-webkit-scrollbar {
          display: none;
        }
      }
    `,
  ],
})
export class TabsInformacionComponent {
  // Inputs
  producto = input.required<Producto>();

  // Estado local
  private readonly _tabActivo = signal<TabType>('descripcion');

  // Computed signals
  readonly tabActivo = computed(() => this._tabActivo());

  readonly tabs = computed((): TabConfig[] => [
    {
      id: 'descripcion',
      label: 'Descripción',
      icono: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />`,
      activo: this._tabActivo() === 'descripcion',
    },
    {
      id: 'especificaciones',
      label: 'Especificaciones',
      icono: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />`,
      activo: this._tabActivo() === 'especificaciones',
    },
    {
      id: 'resenas',
      label: 'Reseñas',
      icono: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />`,
      activo: this._tabActivo() === 'resenas',
    },
  ]);

  /**
   * Selecciona un tab específico
   */
  seleccionarTab(tab: TabType): void {
    this._tabActivo.set(tab);
  }
}
