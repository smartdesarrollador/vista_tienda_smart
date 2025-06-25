import {
  Component,
  input,
  signal,
  computed,
  inject,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import { Producto } from '../../../../../core/models/producto.interface';
import { ProductoService } from '../../../../../core/services/producto.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-productos-relacionados',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    <!-- Productos Relacionados -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">
          Productos Relacionados
        </h3>

        @if (cargando()) {
        <!-- Skeleton Loading -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (item of [1, 2, 3, 4]; track item) {
          <div class="space-y-3">
            <div
              class="aspect-square bg-gray-200 rounded-lg animate-pulse"
            ></div>
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div class="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div class="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
          }
        </div>
        } @else if (error()) {
        <!-- Estado de Error -->
        <div class="text-center py-8">
          <svg
            class="w-12 h-12 text-gray-300 mx-auto mb-4"
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
          <p class="text-gray-500">
            No se pudieron cargar los productos relacionados.
          </p>
        </div>
        } @else if (productosRelacionados().length === 0) {
        <!-- Sin Productos -->
        <div class="text-center py-8">
          <svg
            class="w-12 h-12 text-gray-300 mx-auto mb-4"
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
          <p class="text-gray-500">
            No hay productos relacionados disponibles.
          </p>
        </div>
        } @else {
        <!-- Grid de Productos -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (producto of productosRelacionados(); track producto.id) {
          <div
            class="group cursor-pointer transform transition-all duration-200 hover:scale-105"
            (click)="navegarAProducto(producto)"
          >
            <!-- Imagen del Producto -->
            <div
              class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3"
            >
              @if (producto.imagen_principal) {
              <img
                [ngSrc]="getImagenUrl(producto.imagen_principal)"
                [alt]="producto.nombre"
                [width]="300"
                [height]="300"
                class="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
              } @else {
              <!-- Placeholder -->
              <div class="w-full h-full flex items-center justify-center">
                <svg
                  class="w-16 h-16 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              }

              <!-- Badge de Oferta -->
              @if (producto.precio_oferta) {
              <div class="absolute top-2 left-2">
                <span
                  class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded"
                >
                  {{ calcularDescuento(producto) }}% OFF
                </span>
              </div>
              }

              <!-- Badge de Stock -->
              @if (producto.stock === 0) {
              <div
                class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
              >
                <span
                  class="bg-red-600 text-white font-medium px-3 py-1 rounded"
                >
                  Sin Stock
                </span>
              </div>
              }
            </div>

            <!-- Información del Producto -->
            <div class="space-y-2">
              <!-- Marca -->
              @if (producto.marca) {
              <p class="text-xs text-blue-600 font-medium uppercase">
                {{ producto.marca }}
              </p>
              }

              <!-- Nombre -->
              <h4
                class="font-medium text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors duration-200"
              >
                {{ producto.nombre }}
              </h4>

              <!-- Precio -->
              <div class="space-y-1">
                @if (producto.precio_oferta) {
                <div class="flex items-center gap-2">
                  <span class="font-bold text-red-600 text-lg">
                    {{ formatearPrecio(producto.precio_oferta) }}
                  </span>
                </div>
                <span class="text-sm text-gray-500 line-through">
                  {{ formatearPrecio(producto.precio) }}
                </span>
                } @else {
                <span class="font-bold text-gray-900 text-lg">
                  {{ formatearPrecio(producto.precio) }}
                </span>
                }
              </div>

              <!-- Rating (si está disponible) -->
              @if (producto.rating_promedio) {
              <div class="flex items-center gap-1">
                <div class="flex">
                  @for (estrella of [1, 2, 3, 4, 5]; track estrella) {
                  <svg
                    class="w-3 h-3"
                    [class.text-yellow-400]="
                      estrella <= Math.round(producto.rating_promedio!)
                    "
                    [class.text-gray-300]="
                      estrella > Math.round(producto.rating_promedio!)
                    "
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </svg>
                  }
                </div>
                <span class="text-xs text-gray-500">
                  ({{ producto.total_comentarios || 0 }})
                </span>
              </div>
              }
            </div>
          </div>
          }
        </div>

        <!-- Botón Ver Más -->
        @if (productosRelacionados().length >= 4) {
        <div class="text-center mt-6">
          <button
            type="button"
            (click)="verMasProductos()"
            class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Ver Más Productos
          </button>
        </div>
        } }
      </div>
    </div>
  `,
  styles: [
    `
      /* Animaciones para hover */
      .group:hover img {
        transform: scale(1.05);
      }

      /* Texto truncado */
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      /* Transiciones suaves */
      * {
        transition: all 0.2s ease-in-out;
      }

      /* Badge animations */
      .absolute span {
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `,
  ],
})
export class ProductosRelacionadosComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly productoService = inject(ProductoService);
  private readonly destroyRef = inject(DestroyRef);

  // Inputs
  producto = input.required<Producto>();

  // Estado local
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _productosRelacionados = signal<Producto[]>([]);

  // Computed signals
  readonly cargando = computed(() => this._cargando());
  readonly error = computed(() => this._error());
  readonly productosRelacionados = computed(() =>
    this._productosRelacionados()
  );

  ngOnInit(): void {
    this.cargarProductosRelacionados();
  }

  /**
   * Carga productos relacionados basados en la categoría
   */
  private cargarProductosRelacionados(): void {
    const producto = this.producto();

    if (!producto.categoria_id) {
      this._error.set(
        'No se puede cargar productos relacionados sin categoría'
      );
      return;
    }

    this._cargando.set(true);
    this._error.set(null);

    this.productoService
      .getProductos({
        categoria_id: producto.categoria_id,
        activo: true,
        per_page: 8, // Cargar más productos para filtrar
      })
      .pipe(
        tap((response) => {
          // Filtrar el producto actual y tomar los primeros 4
          const relacionados = response.data
            .filter((p) => p.id !== producto.id)
            .slice(0, 4);

          this._productosRelacionados.set(relacionados);
        }),
        catchError((error) => {
          console.error('Error al cargar productos relacionados:', error);
          this._error.set('Error al cargar productos relacionados');
          return of(null);
        }),
        finalize(() => {
          this._cargando.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Genera la URL completa de la imagen
   */
  getImagenUrl(imagen: string): string {
    if (!imagen) return '';

    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
      return imagen;
    }

    const baseUrl = environment.urlDominioApi.replace('/api', '');
    const imagenPath = imagen.startsWith('/') ? imagen : `/${imagen}`;

    return `${baseUrl}${imagenPath}`;
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
   * Calcula el porcentaje de descuento
   */
  calcularDescuento(producto: Producto): number {
    if (!producto.precio_oferta) return 0;

    const descuento =
      ((producto.precio - producto.precio_oferta) / producto.precio) * 100;
    return Math.round(descuento);
  }

  /**
   * Navega al detalle del producto
   */
  navegarAProducto(producto: Producto): void {
    this.router.navigate(['/producto', producto.slug]);
  }

  /**
   * Navega al catálogo con filtro de categoría
   */
  verMasProductos(): void {
    const producto = this.producto();
    if (producto.categoria?.slug) {
      this.router.navigate(['/catalogo'], {
        queryParams: { categoria: producto.categoria.slug },
      });
    } else {
      this.router.navigate(['/catalogo']);
    }
  }

  // Exponer Math para el template
  readonly Math = Math;
}
