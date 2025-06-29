import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductoService } from '../../../../../core/services/producto.service';
import { Producto } from '../../../../../core/models/producto.interface';
import {
  ProductoCardComponent,
  ProductoCardEventos,
  ProductoCardConfig,
} from '../../../../../shared/components/producto-card';

@Component({
  selector: 'app-productos-nuevos',
  standalone: true,
  imports: [CommonModule, ProductoCardComponent],
  template: `
    <!-- Sección de Productos Nuevos -->
    <section
      class="py-12 bg-gradient-to-br from-slate-50 to-blue-50"
      aria-labelledby="productos-nuevos-heading"
    >
      <div class="container mx-auto px-4">
        <!-- Encabezado de la Sección -->
        <div class="text-center mb-10">
          <div class="flex items-center justify-center mb-4">
            <div class="flex items-center space-x-2">
              <div class="bg-emerald-500 p-2 rounded-full">
                <svg
                  class="w-6 h-6 text-white"
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
              </div>
              <h2
                id="productos-nuevos-heading"
                class="text-3xl font-bold text-gray-900"
              >
                Productos Nuevos
              </h2>
            </div>
          </div>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre las últimas incorporaciones a nuestro catálogo
          </p>
        </div>

        <!-- Estado de Carga -->
        @if (isLoading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (item of [1,2,3,4]; track item) {
          <div class="animate-pulse">
            <div class="bg-gray-200 aspect-square rounded-xl mb-4"></div>
            <div class="h-4 bg-gray-200 rounded mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-5 bg-gray-200 rounded w-1/2"></div>
          </div>
          }
        </div>
        }

        <!-- Estado de Error -->
        @else if (hasError()) {
        <div class="text-center py-8">
          <div
            class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto"
          >
            <svg
              class="w-12 h-12 text-red-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 class="text-lg font-medium text-red-800 mb-2">
              Error al cargar productos
            </h3>
            <p class="text-red-600 mb-4">{{ errorMessage() }}</p>
            <button
              type="button"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              (click)="recargarProductos()"
            >
              Reintentar
            </button>
          </div>
        </div>
        }

        <!-- Grid de Productos Nuevos -->
        @else if (productosMostrados().length > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (producto of productosMostrados(); track trackByProducto($index,
          producto)) {
          <app-producto-card
            [producto]="producto"
            vista="grid"
            [configuracion]="configProductoCard"
            (onCarritoClick)="onCarritoClick($event)"
            (onFavoritoToggle)="onFavoritoToggle($event)"
            (onProductoClick)="onProductoClick($event)"
            (onVistaRapida)="onVistaRapida($event)"
            class="transform hover:scale-105 transition-transform duration-300 ease-in-out"
          />
          }
        </div>

        <!-- Botón Ver Más -->
        @if (hayMasProductos()) {
        <div class="text-center mt-10">
          <button
            type="button"
            class="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 inline-flex items-center space-x-2"
            (click)="onVerTodosProductos()"
          >
            <span>Ver todos los productos nuevos</span>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        } }

        <!-- Estado Vacío -->
        @else {
        <div class="text-center py-12">
          <div class="max-w-md mx-auto">
            <svg
              class="w-20 h-20 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              No hay productos nuevos disponibles
            </h3>
            <p class="text-gray-600 mb-4">
              Mantente atento, pronto tendremos nuevos productos increíbles.
            </p>
            <button
              type="button"
              class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              (click)="onVerCatalogo()"
            >
              Ver catálogo completo
            </button>
          </div>
        </div>
        }
      </div>
    </section>
  `,
  styles: `
    .line-clamp-2 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
  `,
})
export class ProductosNuevosComponent implements OnInit {
  // Inyección de dependencias
  private readonly productoService = inject(ProductoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  // Signals para el estado del componente
  readonly productos = signal<Producto[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Computed signals
  readonly productosNuevos = computed(() => this.productos());
  readonly productosMostrados = computed(() => this.productos().slice(0, 4));
  readonly hayMasProductos = computed(() => this.productos().length > 4);
  readonly isLoading = computed(() => this.loading());
  readonly hasError = computed(() => this.error() !== null);
  readonly errorMessage = computed(() => this.error() || '');

  // Configuración para ProductoCard con tema de productos nuevos
  readonly configProductoCard: ProductoCardConfig = {
    mostrarMarca: true,
    mostrarCategoria: true,
    mostrarDescripcion: true,
    mostrarRating: false,
    mostrarStock: true,
    mostrarBotonCarrito: true,
    mostrarAccionesRapidas: true,
    mostrarFavoritos: true,
    mostrarVistaRapida: true,
    stockBajo: 5,
    urlPorDefecto: 'productos/default.jpg',
    textoDestacado: 'Nuevo',
  };

  // Eventos de salida
  @Output() agregarAlCarritoClicked = new EventEmitter<Producto>();
  @Output() toggleFavoritoClicked = new EventEmitter<Producto>();
  @Output() vistaRapidaClicked = new EventEmitter<Producto>();

  ngOnInit(): void {
    this.cargarProductosNuevos();
  }

  /**
   * Cargar productos nuevos desde la API
   */
  private cargarProductosNuevos(): void {
    this.loading.set(true);
    this.error.set(null);

    // Filtros para obtener productos nuevos (ordenados por fecha de creación DESC)
    const filters = {
      activo: true,
      order_by: 'created_at' as const,
      order_direction: 'desc' as const,
      per_page: 12, // Traemos más para poder filtrar los mejores
      include_stats: true,
    };

    this.productoService
      .getProductos(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.productos.set(response.data || []);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar productos nuevos:', error);
          this.error.set('No se pudieron cargar los productos nuevos');
          this.productos.set([]);
          this.loading.set(false);
        },
      });
  }

  /**
   * TrackBy function para optimizar el renderizado
   */
  trackByProducto(index: number, producto: Producto): number {
    return producto.id;
  }

  // Eventos del ProductoCard
  onCarritoClick(evento: ProductoCardEventos): void {
    console.log('Agregando al carrito desde ProductoCard:', evento.producto);
    this.agregarAlCarritoClicked.emit(evento.producto);
  }

  onFavoritoToggle(evento: ProductoCardEventos): void {
    console.log('Toggle favorito desde ProductoCard:', evento.producto);
    this.toggleFavoritoClicked.emit(evento.producto);
  }

  onProductoClick(evento: ProductoCardEventos): void {
    console.log('Click en producto desde ProductoCard:', evento.producto);
    // Navegar a la página de detalle del producto
    this.router.navigate(['/producto', evento.producto.slug]);
  }

  onVistaRapida(evento: ProductoCardEventos): void {
    console.log('Vista rápida desde ProductoCard:', evento.producto);
    this.vistaRapidaClicked.emit(evento.producto);
  }

  // Métodos de utilidad
  esFavorito(productoId: number): boolean {
    // TODO: Implementar lógica real de favoritos
    // console.log('Comprobando si es favorito (lógica dummy):', productoId);
    return false;
  }

  /**
   * Obtener URL completa de la imagen
   */
  getImagenCompleta(imagen: string): string {
    if (!imagen) return '';

    // Si ya es una URL completa, retornarla tal como está
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
      return imagen;
    }

    // Si es una ruta relativa, construir la URL completa
    return `${this.productoService.baseUrlImagenes}${imagen}`;
  }

  /**
   * Verificar si el producto tiene descuento
   */
  tieneDescuento(producto: Producto): boolean {
    return (
      producto.precio_oferta !== null &&
      producto.precio_oferta !== undefined &&
      producto.precio_oferta > 0 &&
      producto.precio_oferta < producto.precio
    );
  }

  /**
   * Calcular porcentaje de descuento
   */
  calcularPorcentajeDescuento(producto: Producto): number {
    if (!this.tieneDescuento(producto)) return 0;

    const descuento =
      ((producto.precio - (producto.precio_oferta || 0)) / producto.precio) *
      100;
    return Math.round(descuento);
  }

  /**
   * Obtener fecha relativa (ej: "hace 2 días")
   */
  getFechaRelativa(fecha: string): string {
    const ahora = new Date();
    const fechaProducto = new Date(fecha);
    const diferencia = ahora.getTime() - fechaProducto.getTime();
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (dias === 0) return 'hoy';
    if (dias === 1) return 'ayer';
    if (dias < 7) return `hace ${dias} días`;
    if (dias < 30) return `hace ${Math.floor(dias / 7)} semanas`;
    if (dias < 365) return `hace ${Math.floor(dias / 30)} meses`;
    return `hace ${Math.floor(dias / 365)} años`;
  }

  /**
   * Recargar productos en caso de error
   */
  recargarProductos(): void {
    this.cargarProductosNuevos();
  }

  /**
   * Navegar a la página de todos los productos nuevos
   */
  onVerTodosProductos(): void {
    // Navegar al catálogo con filtro de productos nuevos
    this.router.navigate(['/catalogo'], {
      queryParams: {
        orden: 'recientes',
        page: 1,
      },
    });
  }

  /**
   * Navegar al catálogo general
   */
  onVerCatalogo(): void {
    this.router.navigate(['/productos']);
  }

  // Métodos legacy para compatibilidad (se pueden eliminar después)
  onQuickView(event: Event, producto: Producto): void {
    event.stopPropagation();
    this.vistaRapidaClicked.emit(producto);
  }

  onAgregarCarrito(event: Event, producto: Producto): void {
    event.stopPropagation();
    if (producto.stock === 0) {
      console.log('Producto agotado');
      return;
    }
    this.agregarAlCarritoClicked.emit(producto);
  }
}
