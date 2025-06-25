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

/**
 * Interface para los eventos de agregar al carrito
 */
export interface AgregarCarritoEvent {
  productoId: number;
  cantidad: number;
}

@Component({
  selector: 'app-informacion-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Información del Producto -->
    <div class="space-y-6">
      <!-- Encabezado del Producto -->
      <div class="space-y-3">
        <!-- Marca -->
        @if (producto().marca) {
        <p class="text-sm font-medium text-blue-600 uppercase tracking-wide">
          {{ producto().marca }}
        </p>
        }

        <!-- Nombre del Producto -->
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
          {{ producto().nombre }}
        </h1>

        <!-- SKU y Disponibilidad -->
        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span
            >SKU: <span class="font-medium">{{ producto().sku }}</span></span
          >
          <span class="text-gray-300">|</span>
          <div class="flex items-center gap-2">
            <div
              class="w-2 h-2 rounded-full"
              [class.bg-green-400]="producto().stock > 5"
              [class.bg-yellow-400]="
                producto().stock > 0 && producto().stock <= 5
              "
              [class.bg-red-400]="producto().stock === 0"
            ></div>
            <span>
              @if (producto().stock > 5) { En stock } @else if (producto().stock
              > 0) { Últimas {{ producto().stock }} unidades } @else { Sin stock
              }
            </span>
          </div>
        </div>

        <!-- Categoría -->
        @if (producto().categoria?.nombre) {
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <span>Categoría:</span>
          <span class="font-medium text-blue-600">{{
            producto().categoria?.nombre
          }}</span>
        </div>
        }
      </div>

      <!-- Precios -->
      <div class="space-y-2">
        @if (precioOfertaFormateado()) {
        <!-- Precio con oferta -->
        <div class="flex items-center gap-3">
          <span class="text-3xl font-bold text-red-600">
            {{ precioOfertaFormateado() }}
          </span>
          @if (porcentajeDescuento()) {
          <span
            class="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded"
          >
            {{ porcentajeDescuento() }}% OFF
          </span>
          }
        </div>
        <div class="flex items-center gap-2">
          <span class="text-lg text-gray-500 line-through">
            {{ precioFormateado() }}
          </span>
          <span class="text-sm text-green-600 font-medium">
            Ahorras {{ ahorroFormateado() }}
          </span>
        </div>
        } @else {
        <!-- Precio normal -->
        <div class="text-3xl font-bold text-gray-900">
          {{ precioFormateado() }}
        </div>
        }
      </div>

      <!-- Simulador de Cuotas -->
      <div class="bg-gray-50 rounded-lg p-4 space-y-3">
        <h3 class="text-sm font-medium text-gray-900">
          Simula el valor de tu cuota
        </h3>

        <div
          class="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
        >
          <!-- Selector de Meses -->
          <div class="relative">
            <select
              [value]="mesesSeleccionados()"
              (change)="onCambiarMeses($event)"
              class="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              @for (opcion of opcionesCuotas; track opcion.meses) {
              <option [value]="opcion.meses">{{ opcion.label }}</option>
              }
            </select>

            <!-- Icono del dropdown -->
            <div
              class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
            >
              <svg
                class="w-4 h-4 text-gray-400"
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
            </div>
          </div>

          <!-- Monto Mensual -->
          <div class="flex items-center gap-2">
            <span class="text-xl font-bold text-blue-600">
              {{ cuotaMensual() }}
            </span>
            <span class="text-sm text-gray-600 font-medium">Mensual</span>
          </div>
        </div>

        <!-- Información adicional -->
        <div class="text-xs text-gray-500">
          <p>
            * Cuotas calculadas con intereses. Solo para fines informativos.
          </p>
        </div>
      </div>

      <!-- Descripción Corta -->
      @if (producto().descripcion) {
      <div class="prose prose-gray prose-sm max-w-none">
        <p class="text-gray-600 leading-relaxed">
          {{ producto().descripcion }}
        </p>
      </div>
      }

      <!-- Selector de Cantidad y Botones -->
      <div class="space-y-4">
        <!-- Selector de Cantidad -->
        <div class="flex items-center gap-4">
          <label for="cantidad" class="text-sm font-medium text-gray-700">
            Cantidad:
          </label>
          <div class="flex items-center border border-gray-300 rounded-lg">
            <button
              type="button"
              (click)="decrementarCantidad()"
              [disabled]="cantidad() <= 1"
              class="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Decrementar cantidad"
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

            <input
              id="cantidad"
              type="number"
              [value]="cantidad()"
              (input)="actualizarCantidad($event)"
              [min]="1"
              [max]="producto().stock"
              class="w-16 text-center border-0 focus:ring-0 focus:outline-none"
              readonly
            />

            <button
              type="button"
              (click)="incrementarCantidad()"
              [disabled]="cantidad() >= producto().stock"
              class="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Incrementar cantidad"
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

          @if (producto().stock > 0) {
          <span class="text-sm text-gray-500">
            {{ producto().stock }} disponibles
          </span>
          }
        </div>

        <!-- Botones de Acción -->
        <div class="space-y-3">
          <!-- Botón Agregar al Carrito -->
          <button
            type="button"
            (click)="onAgregarAlCarrito()"
            [disabled]="producto().stock === 0 || agregandoCarrito()"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            @if (producto().stock === 0) { Sin Stock } @else { Agregar al
            Carrito } }
          </button>

          <!-- Botón Comprar Ahora -->
          @if (producto().stock > 0) {
          <button
            type="button"
            (click)="comprarAhora()"
            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
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
      </div>

      <!-- Información Adicional -->
      <div class="border-t border-gray-200 pt-6 space-y-4">
        <!-- Envío -->
        <div class="flex items-start gap-3">
          <svg
            class="w-5 h-5 text-green-600 mt-0.5"
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
          <div>
            <p class="font-medium text-gray-900">Envío gratuito</p>
            <p class="text-sm text-gray-600">En compras mayores a S/ 99</p>
          </div>
        </div>

        <!-- Garantía -->
        @if (producto().garantia) {
        <div class="flex items-start gap-3">
          <svg
            class="w-5 h-5 text-blue-600 mt-0.5"
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
          <div>
            <p class="font-medium text-gray-900">Garantía</p>
            <p class="text-sm text-gray-600">{{ producto().garantia }}</p>
          </div>
        </div>
        }

        <!-- Devoluciones -->
        <div class="flex items-start gap-3">
          <svg
            class="w-5 h-5 text-orange-600 mt-0.5"
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
          <div>
            <p class="font-medium text-gray-900">Devoluciones fáciles</p>
            <p class="text-sm text-gray-600">
              30 días para cambios y devoluciones
            </p>
          </div>
        </div>
      </div>
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

      /* Estilos para el input de cantidad */
      input[type='number']::-webkit-outer-spin-button,
      input[type='number']::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      input[type='number'] {
        -moz-appearance: textfield;
      }

      /* Animación para el spinner */
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
    `,
  ],
})
export class InformacionProductoComponent {
  private readonly platformId = inject(PLATFORM_ID);

  // Inputs
  producto = input.required<Producto>();
  precioFormateado = input.required<string>();
  precioOfertaFormateado = input<string | null>(null);
  porcentajeDescuento = input<number | null>(null);

  // Outputs
  agregarAlCarrito = output<AgregarCarritoEvent>();

  // Estado local
  private readonly _cantidad = signal(1);
  private readonly _agregandoCarrito = signal(false);
  private readonly _mesesSeleccionados = signal(3);

  // Computed signals
  readonly cantidad = computed(() => this._cantidad());
  readonly agregandoCarrito = computed(() => this._agregandoCarrito());
  readonly mesesSeleccionados = computed(() => this._mesesSeleccionados());

  // Opciones de cuotas mock
  readonly opcionesCuotas = [
    { meses: 3, label: '3 meses' },
    { meses: 6, label: '6 meses' },
    { meses: 9, label: '9 meses' },
    { meses: 12, label: '12 meses' },
    { meses: 18, label: '18 meses' },
    { meses: 24, label: '24 meses' },
  ];

  readonly ahorroFormateado = computed(() => {
    const producto = this.producto();
    const precioOferta = this.precioOfertaFormateado();

    if (!precioOferta || !producto.precio_oferta) return '';

    const ahorro = producto.precio - producto.precio_oferta;
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(ahorro);
  });

  readonly cuotaMensual = computed(() => {
    const producto = this.producto();
    const meses = this._mesesSeleccionados();

    // Usar precio de oferta si existe, sino precio normal
    const precioBase = producto.precio_oferta || producto.precio;

    // Simular interés según cantidad de meses (mock)
    let factorInteres = 1;
    switch (meses) {
      case 3:
        factorInteres = 1.05; // 5% de interés
        break;
      case 6:
        factorInteres = 1.12; // 12% de interés
        break;
      case 9:
        factorInteres = 1.18; // 18% de interés
        break;
      case 12:
        factorInteres = 1.25; // 25% de interés
        break;
      case 18:
        factorInteres = 1.35; // 35% de interés
        break;
      case 24:
        factorInteres = 1.45; // 45% de interés
        break;
    }

    const montoTotal = precioBase * factorInteres;
    const cuotaMensual = montoTotal / meses;

    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cuotaMensual);
  });

  /**
   * Incrementa la cantidad
   */
  incrementarCantidad(): void {
    const cantidadActual = this._cantidad();
    const stock = this.producto().stock;

    if (cantidadActual < stock) {
      this._cantidad.set(cantidadActual + 1);
    }
  }

  /**
   * Decrementa la cantidad
   */
  decrementarCantidad(): void {
    const cantidadActual = this._cantidad();

    if (cantidadActual > 1) {
      this._cantidad.set(cantidadActual - 1);
    }
  }

  /**
   * Actualiza la cantidad desde el input
   */
  actualizarCantidad(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nuevaCantidad = parseInt(input.value, 10);
    const stock = this.producto().stock;

    if (!isNaN(nuevaCantidad) && nuevaCantidad >= 1 && nuevaCantidad <= stock) {
      this._cantidad.set(nuevaCantidad);
    } else {
      // Restaurar el valor válido
      input.value = this._cantidad().toString();
    }
  }

  /**
   * Agrega el producto al carrito
   */
  onAgregarAlCarrito(): void {
    const producto = this.producto();
    const cantidad = this._cantidad();

    if (producto.stock === 0) return;

    this._agregandoCarrito.set(true);

    // Simular delay de API
    setTimeout(() => {
      this.agregarAlCarrito.emit({
        productoId: producto.id,
        cantidad: cantidad,
      });

      this._agregandoCarrito.set(false);

      // Mostrar mensaje de éxito (puede implementarse con un toast service)
      if (isPlatformBrowser(this.platformId)) {
        console.log(
          `Producto ${producto.nombre} agregado al carrito (${cantidad} unidades)`
        );
      }
    }, 1000);
  }

  /**
   * Comprar ahora (ir directamente al checkout)
   */
  comprarAhora(): void {
    // Primero agregar al carrito y luego redirigir al checkout
    this.onAgregarAlCarrito();

    // TODO: Implementar redirección al checkout
    setTimeout(() => {
      console.log('Redirigir al checkout');
    }, 1500);
  }

  /**
   * Cambia la cantidad de meses para el cálculo de cuotas
   */
  onCambiarMeses(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const meses = parseInt(select.value, 10);

    if (!isNaN(meses)) {
      this._mesesSeleccionados.set(meses);
    }
  }
}
