import {
  Component,
  input,
  output,
  computed,
  signal,
  OnInit,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../../../../../core/models/producto.interface';
import { environment } from '../../../../../../../../environments/environment';

@Component({
  selector: 'app-producto-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Modal Overlay -->
    @if (isOpen()) {
    <div
      class="fixed inset-0 z-50 overflow-y-auto"
      [class.opacity-100]="isOpen()"
      [class.opacity-0]="!isOpen()"
    >
      <!-- Background Overlay -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        (click)="onCloseModal()"
      ></div>

      <!-- Modal Container -->
      <div class="flex items-center justify-center min-h-screen p-4">
        <div
          class="relative bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-screen overflow-hidden transform transition-all duration-300"
          [class.scale-100]="isOpen()"
          [class.scale-95]="!isOpen()"
          (click)="$event.stopPropagation()"
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-6 ">
            <!--  <h2 class="text-2xl font-bold text-gray-900">
              Detalle del Producto
            </h2> -->
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              (click)="onCloseModal()"
              aria-label="Cerrar modal"
            >
              <svg
                class="w-6 h-6"
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
            </button>
          </div>

          <!-- Modal Body -->
          <div class="max-h-96 overflow-y-auto p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Imagen del Producto -->
              <div class="space-y-4">
                <div
                  class="aspect-square bg-gray-100 rounded-xl overflow-hidden"
                >
                  @if (producto().imagen_principal) {
                  <img
                    [src]="imagenCompleta()"
                    [alt]="producto().nombre"
                    class="w-full h-full object-cover"
                  />
                  } @else {
                  <div
                    class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
                  >
                    <svg
                      class="w-24 h-24 text-gray-400"
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
              </div>

              <!-- Información del Producto -->
              <div class="space-y-6">
                <!-- Nombre y SKU -->
                <div>
                  <h1 class="text-3xl font-bold text-gray-900 mb-2">
                    {{ producto().nombre }}
                  </h1>
                  @if (producto().sku) {
                  <p class="text-sm text-gray-500">SKU: {{ producto().sku }}</p>
                  }
                </div>

                <!-- Precios -->
                <div class="space-y-2">
                  @if (tieneDescuento()) {
                  <div class="flex items-center space-x-3">
                    <span class="text-3xl font-bold text-primary-600">
                      S/ {{ producto().precio_oferta | number : '1.2-2' }}
                    </span>
                    <span class="text-lg text-gray-500 line-through">
                      S/ {{ producto().precio | number : '1.2-2' }}
                    </span>
                    <span
                      class="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded"
                    >
                      -{{ porcentajeDescuento() }}% OFF
                    </span>
                  </div>
                  } @else {
                  <span class="text-3xl font-bold text-gray-900">
                    S/ {{ producto().precio | number : '1.2-2' }}
                  </span>
                  }
                </div>

                <!-- Stock -->
                <div class="flex items-center space-x-2">
                  <span class="text-sm font-medium text-gray-700"
                    >Disponibilidad:</span
                  >
                  @if (producto().stock > 0) {
                  <span class="text-sm text-green-600 font-medium">
                    {{ producto().stock }} en stock
                  </span>
                  } @else {
                  <span class="text-sm text-red-600 font-medium">
                    Agotado
                  </span>
                  }
                </div>

                <!-- Descripción -->
                @if (producto().descripcion) {
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">
                    Descripción
                  </h3>
                  <p class="text-gray-600 leading-relaxed">
                    {{ producto().descripcion }}
                  </p>
                </div>
                }

                <!-- Información adicional -->
                <div
                  class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200"
                >
                  @if (producto().marca) {
                  <div>
                    <span class="text-sm font-medium text-gray-700"
                      >Marca:</span
                    >
                    <p class="text-sm text-gray-600">{{ producto().marca }}</p>
                  </div>
                  } @if (producto().modelo) {
                  <div>
                    <span class="text-sm font-medium text-gray-700"
                      >Modelo:</span
                    >
                    <p class="text-sm text-gray-600">{{ producto().modelo }}</p>
                  </div>
                  } @if (producto().garantia) {
                  <div>
                    <span class="text-sm font-medium text-gray-700"
                      >Garantía:</span
                    >
                    <p class="text-sm text-gray-600">
                      {{ producto().garantia }}
                    </p>
                  </div>
                  } @if (producto().rating_promedio) {
                  <div>
                    <span class="text-sm font-medium text-gray-700"
                      >Calificación:</span
                    >
                    <div class="flex items-center space-x-1">
                      <div class="flex items-center">
                        @for (star of estrellas(); track $index) {
                        <svg
                          class="w-4 h-4"
                          [class]="star ? 'text-yellow-400' : 'text-gray-300'"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                          ></path>
                        </svg>
                        }
                      </div>
                      <span class="text-sm text-gray-600">
                        ({{ producto().rating_promedio | number : '1.1-1' }})
                      </span>
                    </div>
                  </div>
                  }
                </div>

                <!-- Selector de Cantidad -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad
                  </label>
                  <div class="flex items-center space-x-3">
                    <button
                      type="button"
                      class="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      [disabled]="cantidad() <= 1"
                      (click)="decrementarCantidad()"
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
                        ></path>
                      </svg>
                    </button>
                    <span
                      class="px-4 py-2 border border-gray-300 rounded-lg min-w-[60px] text-center"
                    >
                      {{ cantidad() }}
                    </span>
                    <button
                      type="button"
                      class="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      [disabled]="cantidad() >= producto().stock"
                      (click)="incrementarCantidad()"
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
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div
            class="flex items-center justify-end space-x-4 p-6 border-t border-gray-200"
          >
            <!--  <button
              type="button"
              class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              (click)="onCloseModal()"
            >
              Cancelar
            </button> -->
            <button
              type="button"
              class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="producto().stock <= 0"
              (click)="onAgregarCarrito()"
            >
              Agregar al Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
      /* Asegurar que el modal aparezca encima de todo */
      :host {
        z-index: 1000;
      }
    `,
  ],
})
export class ProductoDetailComponent implements OnInit {
  // Inputs usando la nueva API de signals
  producto = input.required<Producto>();
  isOpen = input<boolean>(false);

  // Outputs
  close = output<void>();
  agregarCarrito = output<{ producto: Producto; cantidad: number }>();

  // Signal para cantidad
  readonly cantidad = signal<number>(1);

  // Computed signals
  readonly imagenCompleta = computed(() => {
    const imagen = this.producto().imagen_principal;
    if (!imagen) return '';

    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
      return imagen;
    }

    const baseUrl = environment.urlDominioApi.replace('/api', '');
    const imagenPath = imagen.startsWith('/') ? imagen : `/${imagen}`;

    return `${baseUrl}${imagenPath}`;
  });

  readonly tieneDescuento = computed(() => {
    const producto = this.producto();
    return !!(
      producto.precio_oferta && producto.precio_oferta < producto.precio
    );
  });

  readonly porcentajeDescuento = computed(() => {
    if (!this.tieneDescuento()) return 0;

    const producto = this.producto();
    const descuento =
      ((producto.precio - producto.precio_oferta!) / producto.precio) * 100;
    return Math.round(descuento);
  });

  readonly estrellas = computed(() => {
    const rating = this.producto().rating_promedio || 0;
    return Array.from({ length: 5 }, (_, i) => i < Math.floor(rating));
  });

  private readonly elementRef = inject(ElementRef);

  ngOnInit(): void {
    // Prevenir scroll del body cuando el modal está abierto
    if (this.isOpen()) {
      document.body.classList.add('overflow-hidden');
    }
  }

  /**
   * Incrementa la cantidad
   */
  incrementarCantidad(): void {
    if (this.cantidad() < this.producto().stock) {
      this.cantidad.update((c) => c + 1);
    }
  }

  /**
   * Decrementa la cantidad
   */
  decrementarCantidad(): void {
    if (this.cantidad() > 1) {
      this.cantidad.update((c) => c - 1);
    }
  }

  /**
   * Maneja el cierre del modal
   */
  onCloseModal(): void {
    document.body.classList.remove('overflow-hidden');
    this.cantidad.set(1); // Reset cantidad
    this.close.emit();
  }

  /**
   * Maneja agregar al carrito
   */
  onAgregarCarrito(): void {
    if (this.producto().stock <= 0) return;

    this.agregarCarrito.emit({
      producto: this.producto(),
      cantidad: this.cantidad(),
    });
  }
}
