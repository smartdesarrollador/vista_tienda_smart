import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import { Producto } from '../../../../../core/models/producto.interface';
import {
  VariacionProducto,
  AtributoProducto,
  ValorAtributo,
  VariacionSelector,
  VariacionSeleccionada,
} from '../../../../../core/models/variacion-producto.interface';

/**
 * Interface para eventos del selector de variaciones
 */
interface VariacionChangeEvent {
  variacionSeleccionada: VariacionProducto | null;
  precioActualizado: number;
  stockActualizado: number;
  imagenActualizada: string | null;
  esValida: boolean;
}

@Component({
  selector: 'app-variaciones-producto',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Selector de Variaciones del Producto -->
    @if (tieneVariaciones()) {
    <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <h3 class="text-lg font-semibold text-gray-900">
        Selecciona una Variación
      </h3>

      @if (cargandoVariaciones()) {
      <!-- Estado de Carga -->
      <div class="space-y-4">
        <div class="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
        <div class="grid grid-cols-4 gap-2">
          @for (item of [1, 2, 3, 4]; track item) {
          <div class="h-10 bg-gray-200 rounded animate-pulse"></div>
          }
        </div>
      </div>
      } @else if (errorVariaciones()) {
      <!-- Estado de Error -->
      <div class="text-center py-4">
        <p class="text-red-600 text-sm">{{ errorVariaciones() }}</p>
        <button
          type="button"
          (click)="recargarVariaciones()"
          class="mt-2 text-blue-600 hover:text-blue-700 text-sm underline"
        >
          Reintentar
        </button>
      </div>
      } @else {
      <!-- Selectores de Atributos -->
      <div class="space-y-6">
        @for (selector of selectoresAtributos(); track selector.atributo.id) {
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-3">
            {{ selector.atributo.nombre }}
            @if (esAtributoRequerido(selector.atributo)) {
            <span class="text-red-500">*</span>
            }
          </h4>

          <!-- Selector de Colores -->
          @if (selector.atributo.tipo === 'color') {
          <div class="flex flex-wrap gap-2">
            @for (valor of selector.valores; track valor.id) {
            <button
              type="button"
              (click)="seleccionarValorAtributo(selector.atributo.id, valor)"
              class="group relative w-10 h-10 rounded-lg border-2 transition-all duration-200"
              [class.border-blue-500]="
                esValorSeleccionado(selector.atributo.id, valor.id)
              "
              [class.border-gray-300]="
                !esValorSeleccionado(selector.atributo.id, valor.id)
              "
              [class.shadow-md]="
                esValorSeleccionado(selector.atributo.id, valor.id)
              "
              [disabled]="!esValorDisponible(valor)"
              [title]="valor.valor"
            >
              <!-- Color swatch -->
              <div
                class="w-full h-full rounded-md"
                [style.background-color]="valor.codigo_color || '#cccccc'"
                [class.opacity-50]="!esValorDisponible(valor)"
              ></div>

              <!-- Checkmark para seleccionado -->
              @if (esValorSeleccionado(selector.atributo.id, valor.id)) {
              <div class="absolute inset-0 flex items-center justify-center">
                <svg
                  class="w-4 h-4 text-white drop-shadow-sm"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              }

              <!-- Badge no disponible -->
              @if (!esValorDisponible(valor)) {
              <div
                class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
              ></div>
              }
            </button>
            }
          </div>
          }

          <!-- Selector de Tallas y Otros -->
          @else {
          <div class="flex flex-wrap gap-2">
            @for (valor of selector.valores; track valor.id) {
            <button
              type="button"
              (click)="seleccionarValorAtributo(selector.atributo.id, valor)"
              class="px-4 py-2 border rounded-lg text-sm font-medium transition-all duration-200"
              [class.border-blue-500]="
                esValorSeleccionado(selector.atributo.id, valor.id)
              "
              [class.bg-blue-50]="
                esValorSeleccionado(selector.atributo.id, valor.id)
              "
              [class.text-blue-700]="
                esValorSeleccionado(selector.atributo.id, valor.id)
              "
              [class.border-gray-300]="
                !esValorSeleccionado(selector.atributo.id, valor.id)
              "
              [class.text-gray-700]="
                !esValorSeleccionado(selector.atributo.id, valor.id)
              "
              [class.hover:border-gray-400]="
                !esValorSeleccionado(selector.atributo.id, valor.id) &&
                esValorDisponible(valor)
              "
              [class.opacity-50]="!esValorDisponible(valor)"
              [class.cursor-not-allowed]="!esValorDisponible(valor)"
              [disabled]="!esValorDisponible(valor)"
            >
              {{ valor.valor }}
              @if (!esValorDisponible(valor)) {
              <span class="ml-1 text-xs text-red-500">(Sin stock)</span>
              }
            </button>
            }
          </div>
          }

          <!-- Valor seleccionado -->
          @if (obtenerValorSeleccionado(selector.atributo.id)) {
          <p class="mt-2 text-sm text-gray-600">
            Seleccionado:
            <span class="font-medium text-gray-900">
              {{ obtenerValorSeleccionado(selector.atributo.id)?.valor }}
            </span>
          </p>
          }
        </div>
        }
      </div>

      <!-- Información de la Variación Seleccionada -->
      @if (variacionActual()) {
      <div class="bg-gray-50 rounded-lg p-4 space-y-3">
        <h4 class="font-medium text-gray-900">Variación Seleccionada</h4>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-600">SKU:</span>
            <span class="ml-2 font-medium">{{ variacionActual()!.sku }}</span>
          </div>
          <div>
            <span class="text-gray-600">Stock:</span>
            <span class="ml-2 font-medium">
              {{ variacionActual()!.stock }} unidades
            </span>
          </div>
          <div>
            <span class="text-gray-600">Precio:</span>
            <span class="ml-2 font-medium">
              {{ formatearPrecio(obtenerPrecioFinal()) }}
            </span>
          </div>
          @if (variacionActual()!.precio_oferta) {
          <div>
            <span class="text-gray-600">Descuento:</span>
            <span class="ml-2 font-medium text-green-600">
              {{ calcularPorcentajeDescuento() }}% OFF
            </span>
          </div>
          }
        </div>

        <!-- Estado de disponibilidad -->
        <div class="flex items-center gap-2">
          <div
            class="w-2 h-2 rounded-full"
            [class.bg-green-400]="variacionActual()!.stock > 5"
            [class.bg-yellow-400]="
              variacionActual()!.stock > 0 && variacionActual()!.stock <= 5
            "
            [class.bg-red-400]="variacionActual()!.stock === 0"
          ></div>
          <span class="text-sm">
            @if (variacionActual()!.stock > 5) { Disponible } @else if
            (variacionActual()!.stock > 0) { Stock limitado } @else { Sin stock
            }
          </span>
        </div>
      </div>
      }

      <!-- Mensaje de selección incompleta -->
      @if (!esSeleccionValida()) {
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <svg
            class="w-5 h-5 text-yellow-600 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.866-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div>
            <h5 class="text-yellow-800 font-medium">Selección Incompleta</h5>
            <p class="text-yellow-700 text-sm mt-1">
              Por favor selecciona todos los atributos requeridos para
              continuar.
            </p>
          </div>
        </div>
      </div>
      } }
    </div>
    }
  `,
  styles: [
    `
      /* Animaciones para selecciones */
      button {
        transition: all 0.2s ease-in-out;
      }

      /* Hover effects para colores */
      .group:hover .w-full {
        transform: scale(1.05);
      }

      /* Sombras para elementos seleccionados */
      .shadow-md {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }

      /* Animación para checkmark */
      svg {
        animation: checkmark 0.2s ease-in-out;
      }

      @keyframes checkmark {
        0% {
          transform: scale(0);
        }
        100% {
          transform: scale(1);
        }
      }
    `,
  ],
})
export class VariacionesProductoComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  // Inputs
  producto = input.required<Producto>();

  // Outputs
  variacionCambiada = output<VariacionChangeEvent>();

  // Estado local
  private readonly _cargandoVariaciones = signal(false);
  private readonly _errorVariaciones = signal<string | null>(null);
  private readonly _variacionesDisponibles = signal<VariacionProducto[]>([]);
  private readonly _atributos = signal<AtributoProducto[]>([]);
  private readonly _seleccionesActuales = signal<Record<number, ValorAtributo>>(
    {}
  );

  // Computed signals
  readonly cargandoVariaciones = computed(() => this._cargandoVariaciones());
  readonly errorVariaciones = computed(() => this._errorVariaciones());

  readonly tieneVariaciones = computed(() => {
    // Por ahora simulamos que solo algunos productos tienen variaciones
    const producto = this.producto();
    return (
      producto.variaciones_count !== undefined && producto.variaciones_count > 0
    );
  });

  readonly variacionesDisponibles = computed(() =>
    this._variacionesDisponibles()
  );

  readonly selectoresAtributos = computed((): VariacionSelector[] => {
    const atributos = this._atributos();
    const variaciones = this.variacionesDisponibles();

    return atributos.map((atributo) => {
      // Obtener valores únicos de este atributo de las variaciones disponibles
      const valoresUnicos = new Map<number, ValorAtributo>();

      variaciones.forEach((variacion) => {
        // Simulamos que las variaciones tienen valores de atributos
        atributo.valores?.forEach((valor) => {
          valoresUnicos.set(valor.id, valor);
        });
      });

      return {
        atributo,
        valores: Array.from(valoresUnicos.values()),
        valorSeleccionado: this._seleccionesActuales()[atributo.id] || null,
      };
    });
  });

  readonly variacionActual = computed((): VariacionProducto | null => {
    const selecciones = this._seleccionesActuales();
    const variaciones = this.variacionesDisponibles();

    // Buscar variación que coincida con todas las selecciones
    return (
      variaciones.find((variacion) => {
        // Aquí iría la lógica para comparar atributos de variación
        // Por ahora retornamos la primera variación disponible si hay selecciones
        return Object.keys(selecciones).length > 0;
      }) || null
    );
  });

  readonly esSeleccionValida = computed(() => {
    const atributosRequeridos = this._atributos().filter((attr) =>
      this.esAtributoRequerido(attr)
    );
    const selecciones = this._seleccionesActuales();

    return atributosRequeridos.every((attr) => selecciones[attr.id]);
  });

  ngOnInit(): void {
    if (this.tieneVariaciones()) {
      this.cargarVariaciones();
    }
  }

  /**
   * Carga las variaciones del producto
   */
  private cargarVariaciones(): void {
    this._cargandoVariaciones.set(true);
    this._errorVariaciones.set(null);

    // Simulación de carga de variaciones y atributos
    setTimeout(() => {
      try {
        // Datos simulados de variaciones
        const variacionesSimuladas: VariacionProducto[] = [
          {
            id: 1,
            producto_id: this.producto().id,
            sku: `${this.producto().sku}-ROJO-M`,
            precio: this.producto().precio,
            precio_oferta: this.producto().precio_oferta,
            stock: 10,
            activo: true,
            atributos: { color: 'rojo', talla: 'M' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 2,
            producto_id: this.producto().id,
            sku: `${this.producto().sku}-AZUL-L`,
            precio: this.producto().precio + 10,
            precio_oferta: null,
            stock: 5,
            activo: true,
            atributos: { color: 'azul', talla: 'L' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

        // Datos simulados de atributos
        const atributosSimulados: AtributoProducto[] = [
          {
            id: 1,
            nombre: 'Color',
            slug: 'color',
            tipo: 'color',
            descripcion: 'Color del producto',
            activo: true,
            orden: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            valores: [
              {
                id: 1,
                atributo_id: 1,
                valor: 'Rojo',
                codigo_color: '#dc2626',
                imagen: null,
                activo: true,
                orden: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 2,
                atributo_id: 1,
                valor: 'Azul',
                codigo_color: '#2563eb',
                imagen: null,
                activo: true,
                orden: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          },
          {
            id: 2,
            nombre: 'Talla',
            slug: 'talla',
            tipo: 'talla',
            descripcion: 'Talla del producto',
            activo: true,
            orden: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            valores: [
              {
                id: 3,
                atributo_id: 2,
                valor: 'M',
                codigo_color: null,
                imagen: null,
                activo: true,
                orden: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 4,
                atributo_id: 2,
                valor: 'L',
                codigo_color: null,
                imagen: null,
                activo: true,
                orden: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          },
        ];

        this._variacionesDisponibles.set(variacionesSimuladas);
        this._atributos.set(atributosSimulados);
      } catch (error) {
        this._errorVariaciones.set('Error al cargar variaciones');
        console.error('Error cargando variaciones:', error);
      } finally {
        this._cargandoVariaciones.set(false);
      }
    }, 500);
  }

  /**
   * Recarga las variaciones
   */
  recargarVariaciones(): void {
    this.cargarVariaciones();
  }

  /**
   * Selecciona un valor de atributo
   */
  seleccionarValorAtributo(atributoId: number, valor: ValorAtributo): void {
    if (!this.esValorDisponible(valor)) return;

    this._seleccionesActuales.update((selecciones) => ({
      ...selecciones,
      [atributoId]: valor,
    }));

    this.emitirCambioVariacion();
  }

  /**
   * Verifica si un valor está seleccionado
   */
  esValorSeleccionado(atributoId: number, valorId: number): boolean {
    return this._seleccionesActuales()[atributoId]?.id === valorId;
  }

  /**
   * Verifica si un valor está disponible
   */
  esValorDisponible(valor: ValorAtributo): boolean {
    // Aquí iría la lógica para verificar disponibilidad
    // Por ahora simulamos que todos están disponibles
    return true;
  }

  /**
   * Verifica si un atributo es requerido
   */
  esAtributoRequerido(atributo: AtributoProducto): boolean {
    // Por ahora consideramos todos los atributos como requeridos
    return true;
  }

  /**
   * Obtiene el valor seleccionado para un atributo
   */
  obtenerValorSeleccionado(atributoId: number): ValorAtributo | null {
    return this._seleccionesActuales()[atributoId] || null;
  }

  /**
   * Obtiene el precio final de la variación actual
   */
  obtenerPrecioFinal(): number {
    const variacion = this.variacionActual();
    if (variacion) {
      return variacion.precio_oferta || variacion.precio;
    }
    return this.producto().precio_oferta || this.producto().precio;
  }

  /**
   * Calcula el porcentaje de descuento
   */
  calcularPorcentajeDescuento(): number {
    const variacion = this.variacionActual();
    if (variacion && variacion.precio_oferta) {
      return Math.round(
        ((variacion.precio - variacion.precio_oferta) / variacion.precio) * 100
      );
    }
    return 0;
  }

  /**
   * Formatea el precio
   */
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(precio);
  }

  /**
   * Emite el evento de cambio de variación
   */
  private emitirCambioVariacion(): void {
    const variacion = this.variacionActual();
    const esValida = this.esSeleccionValida();

    const evento: VariacionChangeEvent = {
      variacionSeleccionada: variacion,
      precioActualizado: this.obtenerPrecioFinal(),
      stockActualizado: variacion?.stock || this.producto().stock,
      imagenActualizada: null, // Se puede implementar cambio de imágenes
      esValida,
    };

    this.variacionCambiada.emit(evento);
  }
}
