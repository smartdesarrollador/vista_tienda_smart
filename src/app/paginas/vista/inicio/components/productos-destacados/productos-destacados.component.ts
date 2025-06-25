import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductoService } from '../../../../../core/services/producto.service';
import { Producto } from '../../../../../core/models/producto.interface';
import { ProductoDetailComponent } from './components/producto-detail/producto-detail.component';
import {
  ProductoCardComponent,
  ProductoCardConfig,
  ProductoCardEventos,
  VistaProductoCard,
} from '../../../../../shared/components/producto-card';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-productos-destacados',
  standalone: true,
  imports: [CommonModule, ProductoDetailComponent, ProductoCardComponent],
  template: `
    <!-- Sección de Productos Destacados -->
    <section
      class="py-12 bg-white"
      aria-labelledby="productos-destacados-heading"
    >
      <div class="container mx-auto px-4">
        <!-- Encabezado de la Sección -->
        <div class="text-center mb-10">
          <h2
            id="productos-destacados-heading"
            class="text-3xl font-bold text-gray-900 mb-4"
          >
            Productos Destacados
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre nuestra selección especial de productos más populares y
            mejor valorados
          </p>
        </div>

        <!-- Estado de Carga -->
        @if (isLoading()) {
        <div class="relative">
          <div class="flex overflow-hidden">
            <div class="flex space-x-6 animate-pulse">
              @for (item of [1,2,3,4]; track item) {
              <div class="flex-none w-80">
                <div class="bg-gray-200 aspect-square rounded-xl mb-4"></div>
                <div class="h-4 bg-gray-200 rounded mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div class="h-5 bg-gray-200 rounded w-1/2"></div>
              </div>
              }
            </div>
          </div>
        </div>
        }

        <!-- Carrusel de Productos -->
        @else if (productosDestacados().length > 0) {
        <div class="relative">
          <!-- Contenedor del Carrusel -->
          <div class="overflow-hidden" #carruselContainer>
            <div
              class="flex transition-transform duration-300 ease-in-out"
              [style.transform]="
                'translateX(' + -currentIndex() * slideWidth() + 'px)'
              "
            >
              @for (producto of productosDestacados(); track
              trackByProducto($index, producto)) {
              <div class="flex-none w-80 px-3">
                <!-- Producto Card Reutilizable -->
                <app-producto-card
                  [producto]="producto"
                  [configuracion]="configProductoCard"
                  [vista]="'grid'"
                  (onCarritoClick)="onAgregarCarritoFromCard($event)"
                  (onFavoritoToggle)="onFavoritoToggleFromCard($event)"
                  (onVistaRapida)="onVistaRapidaFromCard($event)"
                  (onProductoClick)="onProductoClickFromCard($event)"
                />
              </div>
              }
            </div>
          </div>

          <!-- Navegación del Carrusel -->
          <button
            type="button"
            class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white hover:bg-gray-50 text-gray-900 p-2 rounded-full shadow-lg border border-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            [disabled]="!canSlidePrev()"
            (click)="slidePrev()"
            aria-label="Producto anterior"
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
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>

          <button
            type="button"
            class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white hover:bg-gray-50 text-gray-900 p-2 rounded-full shadow-lg border border-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            [disabled]="!canSlideNext()"
            (click)="slideNext()"
            aria-label="Producto siguiente"
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
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </button>

          <!-- Indicadores de página -->
          @if (totalSlides() > 1) {
          <div class="flex justify-center mt-6 space-x-2">
            @for (slide of Array(totalSlides()).fill(0); track $index) {
            <button
              type="button"
              class="w-2 h-2 rounded-full transition-colors duration-200"
              [class]="
                currentSlide() === $index ? 'bg-blue-600' : 'bg-gray-300'
              "
              (click)="goToSlide($index)"
              [attr.aria-label]="'Ir a página ' + ($index + 1)"
            ></button>
            }
          </div>
          }
        </div>

        <!-- Botón Ver Todos -->
        <div class="text-center mt-10">
          <button
            type="button"
            (click)="onVerTodosProductos()"
            class="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-medium transition-colors duration-200"
          >
            <span>Ver Todos los Productos</span>
            <svg
              class="ml-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              ></path>
            </svg>
          </button>
        </div>
        }

        <!-- Estado Vacío -->
        @else if (!isLoading() && productosDestacados().length === 0) {
        <div class="text-center py-12">
          <svg
            class="mx-auto w-16 h-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            ></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            No hay productos destacados disponibles
          </h3>
          <p class="text-gray-600">
            Los productos destacados se mostrarán aquí una vez que estén
            configurados.
          </p>
        </div>
        }

        <!-- Estado de Error -->
        @if (hasError()) {
        <div class="text-center py-12">
          <svg
            class="mx-auto w-16 h-16 text-red-400 mb-4"
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
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            Error al cargar productos destacados
          </h3>
          <p class="text-gray-600 mb-4">
            {{ errorMessage() }}
          </p>
          <button
            type="button"
            (click)="recargarProductos()"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <svg
              class="mr-2 w-4 h-4"
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
            Reintentar
          </button>
        </div>
        }
      </div>
    </section>

    <!-- Modal de Producto Detail -->
    @if (selectedProducto()) {
    <app-producto-detail
      [producto]="selectedProducto()!"
      [isOpen]="isModalOpen()"
      (close)="closeModal()"
      (agregarCarrito)="onAgregarCarritoFromModal($event)"
    />
    }
  `,
  styles: [
    `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class ProductosDestacadosComponent implements OnInit {
  // Servicios inyectados
  private readonly productoService = inject(ProductoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  // Signals para estado reactivo
  readonly productos = signal<Producto[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly currentIndex = signal<number>(0);
  readonly selectedProducto = signal<Producto | null>(null);
  readonly isModalOpen = signal<boolean>(false);

  // Configuración del carrusel
  private readonly slidesPerView = 4;
  readonly slideWidth = signal<number>(320); // 80 * 4 = 320px por slide

  // Array para template
  readonly Array = Array;

  // URL base para imágenes desde environment
  readonly baseUrlImagenes = environment.baseUrlImagenes;

  // Configuración para ProductoCard
  readonly configProductoCard: ProductoCardConfig = {
    mostrarMarca: true,
    mostrarCategoria: false, // No mostrar categoría en destacados para ahorrar espacio
    mostrarDescripcion: false, // No mostrar descripción en carrusel
    mostrarRating: true,
    mostrarStock: true,
    mostrarBotonCarrito: true,
    mostrarAccionesRapidas: true,
    mostrarFavoritos: true,
    mostrarVistaRapida: true,
    stockBajo: 5,
    urlPorDefecto: 'productos/default.jpg',
    textoDestacado: '⭐ Destacado',
  };

  // Computed signals
  readonly productosDestacados = computed(() => this.productos());
  readonly isLoading = computed(() => this.loading());
  readonly hasError = computed(() => this.error() !== null);
  readonly errorMessage = computed(() => this.error() || '');

  // Carrusel computed signals
  readonly totalSlides = computed(() =>
    Math.ceil(this.productosDestacados().length / this.slidesPerView)
  );
  readonly currentSlide = computed(() =>
    Math.floor(this.currentIndex() / this.slidesPerView)
  );
  readonly canSlidePrev = computed(() => this.currentIndex() > 0);
  readonly canSlideNext = computed(
    () =>
      this.currentIndex() <
      this.productosDestacados().length - this.slidesPerView
  );

  constructor() {
    // Auto-carga inicial cuando se inicializa el componente
  }

  ngOnInit(): void {
    this.cargarProductosDestacados();
  }

  /**
   * Carga los productos destacados desde el servicio
   */
  private cargarProductosDestacados(): void {
    this.error.set(null);
    this.loading.set(true);

    this.productoService
      .getProductosDestacados(12) // Cargar 12 productos destacados
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (productos) => {
          this.productos.set(productos);
          this.error.set(null);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar productos destacados:', error);
          this.error.set(
            'No se pudieron cargar los productos destacados. Por favor, intenta de nuevo.'
          );
          this.productos.set([]);
          this.loading.set(false);
        },
      });
  }

  /**
   * Función trackBy para optimizar el renderizado
   */
  trackByProducto(index: number, producto: Producto): number {
    return producto.id;
  }

  /**
   * Maneja el click en un producto desde ProductoCard
   */
  onProductoClickFromCard(evento: ProductoCardEventos): void {
    this.selectedProducto.set(evento.producto);
    this.isModalOpen.set(true);
  }

  /**
   * Maneja agregar al carrito desde ProductoCard
   */
  onAgregarCarritoFromCard(evento: ProductoCardEventos): void {
    console.log('Agregando al carrito desde destacados:', evento.producto);
    // TODO: Implementar lógica de carrito
  }

  /**
   * Maneja vista rápida desde ProductoCard
   */
  onVistaRapidaFromCard(evento: ProductoCardEventos): void {
    this.selectedProducto.set(evento.producto);
    this.isModalOpen.set(true);
  }

  /**
   * Maneja toggle favorito desde ProductoCard
   */
  onFavoritoToggleFromCard(evento: ProductoCardEventos): void {
    console.log('Toggle favorito desde destacados:', evento.producto);
    // TODO: Implementar lógica de favoritos
  }

  /**
   * Maneja agregar al carrito desde el modal
   */
  onAgregarCarritoFromModal(data: {
    producto: Producto;
    cantidad: number;
  }): void {
    // TODO: Implementar lógica de carrito
    console.log(
      'Agregando al carrito desde modal:',
      data.producto,
      'Cantidad:',
      data.cantidad
    );
    this.closeModal();
  }

  /**
   * Cierra el modal
   */
  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedProducto.set(null);
  }

  /**
   * Navega al catálogo completo
   */
  onVerTodosProductos(): void {
    // TODO: Implementar navegación al catálogo
    this.router.navigate(['/catalogo']);
    console.log('Navegar a catálogo completo');
  }

  /**
   * Recarga los productos
   */
  recargarProductos(): void {
    this.cargarProductosDestacados();
  }

  // Métodos del carrusel

  /**
   * Desliza al producto anterior
   */
  slidePrev(): void {
    if (this.canSlidePrev()) {
      this.currentIndex.update((index) => Math.max(0, index - 1));
    }
  }

  /**
   * Desliza al producto siguiente
   */
  slideNext(): void {
    if (this.canSlideNext()) {
      this.currentIndex.update((index) =>
        Math.min(
          this.productosDestacados().length - this.slidesPerView,
          index + 1
        )
      );
    }
  }

  /**
   * Va a un slide específico
   */
  goToSlide(slideIndex: number): void {
    const newIndex = slideIndex * this.slidesPerView;
    this.currentIndex.set(
      Math.min(newIndex, this.productosDestacados().length - this.slidesPerView)
    );
  }
}
