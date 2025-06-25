import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Producto } from '../../../../../core/models/producto.interface';
import { VariacionProducto } from '../../../../../core/models/variacion-producto.interface';

/**
 * Interface para eventos del carrito
 */
interface AgregarCarritoEvent {
  producto: Producto;
  variacion: VariacionProducto | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/**
 * Interface para configuración del componente
 */
interface ConfiguracionCarrito {
  mostrarSelectorCantidad: boolean;
  mostrarBotonComprarAhora: boolean;
  cantidadMaxima: number;
  cantidadMinima: number;
  permitirCantidadCero: boolean;
}

@Component({
  selector: 'app-agregar-carrito',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Controles para Agregar al Carrito -->
    <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <h3 class="text-lg font-semibold text-gray-900">Agregar al Carrito</h3>

      <!-- Selector de Cantidad -->
      @if (configuracion().mostrarSelectorCantidad) {
      <div class="space-y-3">
        <label for="cantidad" class="block text-sm font-medium text-gray-700">
          Cantidad
        </label>

        <div class="flex items-center gap-3">
          <!-- Botón decrementar -->
          <button
            type="button"
            (click)="decrementarCantidad()"
            [disabled]="!puedeDecrementar()"
            class="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            aria-label="Disminuir cantidad"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 12H4"
              />
            </svg>
          </button>

          <!-- Input de cantidad -->
          <div class="relative">
            <input
              id="cantidad"
              type="number"
              [value]="cantidad()"
              (input)="actualizarCantidad($event)"
              (blur)="validarCantidad()"
              [min]="configuracion().cantidadMinima"
              [max]="stockDisponible()"
              class="w-20 text-center border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            @if (mostrarErrorCantidad()) {
            <div
              class="absolute top-full left-0 mt-1 text-xs text-red-600 whitespace-nowrap"
            >
              {{ errorCantidad() }}
            </div>
            }
          </div>

          <!-- Botón incrementar -->
          <button
            type="button"
            (click)="incrementarCantidad()"
            [disabled]="!puedeIncrementar()"
            class="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            aria-label="Aumentar cantidad"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
        </div>

        <!-- Información de stock -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">
            {{ stockDisponible() }} disponibles
          </span>
          @if (mostrarLimiteStock()) {
          <span class="text-orange-600 font-medium">
            Máximo {{ configuracion().cantidadMaxima }} por pedido
          </span>
          }
        </div>
      </div>
      }

      <!-- Resumen de Precios -->
      <div class="bg-gray-50 rounded-lg p-4 space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Precio unitario:</span>
          <span class="font-medium">{{
            formatearPrecio(precioUnitario())
          }}</span>
        </div>

        @if (cantidad() > 1) {
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Cantidad:</span>
          <span class="font-medium">{{ cantidad() }}</span>
        </div>
        } @if (tieneDescuento()) {
        <div class="flex justify-between text-sm text-green-600">
          <span>Descuento total:</span>
          <span class="font-medium"
            >-{{ formatearPrecio(descuentoTotal()) }}</span
          >
        </div>
        }

        <hr class="border-gray-200" />

        <div class="flex justify-between text-base font-semibold">
          <span class="text-gray-900">Subtotal:</span>
          <span class="text-gray-900">{{ formatearPrecio(subtotal()) }}</span>
        </div>
      </div>

      <!-- Botones de Acción -->
      <div class="space-y-3">
        <!-- Botón Agregar al Carrito -->
        <button
          type="button"
          (click)="agregarAlCarrito()"
          [disabled]="!puedeAgregarCarrito()"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          @if (agregandoCarrito()) {
          <svg
            class="w-5 h-5 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Agregando... } @else {
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h7M17 18a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z"
            />
          </svg>
          @if (stockDisponible() === 0) { Sin Stock } @else { Agregar al Carrito
          } }
        </button>

        <!-- Botón Comprar Ahora -->
        @if (configuracion().mostrarBotonComprarAhora && stockDisponible() > 0)
        {
        <button
          type="button"
          (click)="comprarAhora()"
          [disabled]="!puedeComprarAhora()"
          class="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Comprar Ahora
        </button>
        }
      </div>

      <!-- Información Adicional -->
      <div class="space-y-3 text-sm text-gray-600">
        <!-- Envío -->
        <div class="flex items-center gap-2">
          <svg
            class="w-4 h-4 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          @if (calificaEnvioGratis()) {
          <span class="text-green-600 font-medium">¡Envío gratis!</span>
          } @else {
          <span>
            Envío gratis en compras mayores a {{ formatearPrecio(99) }}
          </span>
          }
        </div>

        <!-- Devoluciones -->
        <div class="flex items-center gap-2">
          <svg
            class="w-4 h-4 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>30 días para cambios y devoluciones</span>
        </div>

        <!-- Garantía -->
        @if (producto().garantia) {
        <div class="flex items-center gap-2">
          <svg
            class="w-4 h-4 text-orange-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span>Garantía: {{ producto().garantia }}</span>
        </div>
        }
      </div>

      <!-- Mensaje de éxito -->
      @if (mostrarMensajeExito()) {
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <svg
            class="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="text-green-800 font-medium">
            ¡Producto agregado al carrito!
          </span>
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      /* Animaciones para botones */
      button {
        transition: all 0.2s ease-in-out;
      }

      button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      /* Estilos para input number */
      input[type='number']::-webkit-outer-spin-button,
      input[type='number']::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      input[type='number'] {
        -moz-appearance: textfield;
      }

      /* Animación para spinner */
      .animate-spin {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      /* Transiciones suaves */
      .transition-all {
        transition: all 0.2s ease-in-out;
      }
    `,
  ],
})
export class AgregarCarritoComponent {
  private readonly platformId = inject(PLATFORM_ID);

  // Inputs
  producto = input.required<Producto>();
  variacionSeleccionada = input<VariacionProducto | null>(null);
  configuracionCarrito = input<Partial<ConfiguracionCarrito>>({});

  // Outputs
  productoAgregado = output<AgregarCarritoEvent>();
  comprarAhoraClick = output<AgregarCarritoEvent>();
  cantidadCambiada = output<number>();

  // Estado local
  private readonly _cantidad = signal(1);
  private readonly _agregandoCarrito = signal(false);
  private readonly _errorCantidad = signal<string | null>(null);
  private readonly _mostrarMensajeExito = signal(false);

  // Configuración por defecto
  private readonly configuracionDefecto: ConfiguracionCarrito = {
    mostrarSelectorCantidad: true,
    mostrarBotonComprarAhora: true,
    cantidadMaxima: 10,
    cantidadMinima: 1,
    permitirCantidadCero: false,
  };

  // Computed signals
  readonly cantidad = computed(() => this._cantidad());
  readonly agregandoCarrito = computed(() => this._agregandoCarrito());
  readonly errorCantidad = computed(() => this._errorCantidad());
  readonly mostrarMensajeExito = computed(() => this._mostrarMensajeExito());

  readonly configuracion = computed(
    (): ConfiguracionCarrito => ({
      ...this.configuracionDefecto,
      ...this.configuracionCarrito(),
    })
  );

  readonly stockDisponible = computed(() => {
    const variacion = this.variacionSeleccionada();
    return variacion ? variacion.stock : this.producto().stock;
  });

  readonly precioUnitario = computed(() => {
    const variacion = this.variacionSeleccionada();
    if (variacion) {
      return variacion.precio_oferta || variacion.precio;
    }
    return this.producto().precio_oferta || this.producto().precio;
  });

  readonly subtotal = computed(() => {
    return this.precioUnitario() * this.cantidad();
  });

  readonly tieneDescuento = computed(() => {
    const variacion = this.variacionSeleccionada();
    if (variacion) {
      return variacion.precio_oferta !== null;
    }
    return this.producto().precio_oferta !== null;
  });

  readonly descuentoTotal = computed(() => {
    if (!this.tieneDescuento()) return 0;

    const variacion = this.variacionSeleccionada();
    if (variacion) {
      return (
        (variacion.precio - (variacion.precio_oferta || 0)) * this.cantidad()
      );
    }
    return (
      (this.producto().precio - (this.producto().precio_oferta || 0)) *
      this.cantidad()
    );
  });

  readonly mostrarErrorCantidad = computed(() => this.errorCantidad() !== null);

  readonly mostrarLimiteStock = computed(() => {
    return this.stockDisponible() > this.configuracion().cantidadMaxima;
  });

  readonly calificaEnvioGratis = computed(() => {
    return this.subtotal() >= 99; // Monto mínimo para envío gratis
  });

  readonly puedeDecrementar = computed(() => {
    const config = this.configuracion();
    return this.cantidad() > config.cantidadMinima;
  });

  readonly puedeIncrementar = computed(() => {
    const config = this.configuracion();
    const maxPermitido = Math.min(
      this.stockDisponible(),
      config.cantidadMaxima
    );
    return this.cantidad() < maxPermitido;
  });

  readonly puedeAgregarCarrito = computed(() => {
    return (
      this.stockDisponible() > 0 &&
      this.cantidad() > 0 &&
      this.cantidad() <= this.stockDisponible() &&
      !this.agregandoCarrito() &&
      !this.errorCantidad()
    );
  });

  readonly puedeComprarAhora = computed(() => {
    return this.puedeAgregarCarrito();
  });

  /**
   * Incrementa la cantidad
   */
  incrementarCantidad(): void {
    if (this.puedeIncrementar()) {
      this._cantidad.update((cantidad) => cantidad + 1);
      this._errorCantidad.set(null);
      this.emitirCambioCantidad();
    }
  }

  /**
   * Decrementa la cantidad
   */
  decrementarCantidad(): void {
    if (this.puedeDecrementar()) {
      this._cantidad.update((cantidad) => cantidad - 1);
      this._errorCantidad.set(null);
      this.emitirCambioCantidad();
    }
  }

  /**
   * Actualiza la cantidad desde el input
   */
  actualizarCantidad(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nuevaCantidad = parseInt(input.value, 10);

    if (isNaN(nuevaCantidad)) {
      this._errorCantidad.set('Cantidad inválida');
      return;
    }

    this._cantidad.set(nuevaCantidad);
    this.validarCantidad();
    this.emitirCambioCantidad();
  }

  /**
   * Valida la cantidad actual
   */
  validarCantidad(): void {
    const cantidad = this.cantidad();
    const config = this.configuracion();
    const stock = this.stockDisponible();

    if (cantidad < config.cantidadMinima) {
      this._errorCantidad.set(`Mínimo ${config.cantidadMinima} unidades`);
      this._cantidad.set(config.cantidadMinima);
    } else if (cantidad > stock) {
      this._errorCantidad.set(`Solo ${stock} disponibles`);
      this._cantidad.set(stock);
    } else if (cantidad > config.cantidadMaxima) {
      this._errorCantidad.set(`Máximo ${config.cantidadMaxima} por pedido`);
      this._cantidad.set(config.cantidadMaxima);
    } else {
      this._errorCantidad.set(null);
    }
  }

  /**
   * Agrega el producto al carrito
   */
  agregarAlCarrito(): void {
    if (!this.puedeAgregarCarrito()) return;

    this._agregandoCarrito.set(true);

    // Simular proceso de agregar al carrito
    setTimeout(() => {
      const evento: AgregarCarritoEvent = {
        producto: this.producto(),
        variacion: this.variacionSeleccionada(),
        cantidad: this.cantidad(),
        precioUnitario: this.precioUnitario(),
        subtotal: this.subtotal(),
      };

      this.productoAgregado.emit(evento);
      this._agregandoCarrito.set(false);
      this.mostrarExito();

      if (isPlatformBrowser(this.platformId)) {
        console.log('Producto agregado al carrito:', evento);
      }
    }, 800);
  }

  /**
   * Comprar ahora (redirige a checkout)
   */
  comprarAhora(): void {
    if (!this.puedeComprarAhora()) return;

    const evento: AgregarCarritoEvent = {
      producto: this.producto(),
      variacion: this.variacionSeleccionada(),
      cantidad: this.cantidad(),
      precioUnitario: this.precioUnitario(),
      subtotal: this.subtotal(),
    };

    this.comprarAhoraClick.emit(evento);
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
   * Emite el cambio de cantidad
   */
  private emitirCambioCantidad(): void {
    this.cantidadCambiada.emit(this.cantidad());
  }

  /**
   * Muestra mensaje de éxito temporal
   */
  private mostrarExito(): void {
    this._mostrarMensajeExito.set(true);
    setTimeout(() => {
      this._mostrarMensajeExito.set(false);
    }, 3000);
  }
}
