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
import { FiltrosFavoritosUsuario } from '../../../../../core/models/cuenta-usuario.interface';
import { Producto } from '../../../../../core/models/producto.interface';
import { PaginationMeta } from '../../../../../core/models/common.interface';
import { environment } from '../../../../../../environments/environment';

/**
 * ❤️ Componente Mis Favoritos
 *
 * Características:
 * - Lista de productos favoritos en grilla responsive
 * - Filtros por categoría y ordenamiento
 * - Búsqueda por nombre de producto
 * - Agregar/quitar favoritos
 * - Acciones: ver producto, agregar al carrito
 * - Compartir lista de favoritos
 */
@Component({
  selector: 'app-mis-favoritos',
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
            <h1 class="text-2xl font-bold text-gray-900">Mis Favoritos</h1>
            <p class="text-gray-600 mt-1">
              Productos que has marcado como favoritos
            </p>
          </div>

          <div class="mt-4 sm:mt-0 flex items-center space-x-4">
            @if (totalFavoritos() > 0) {
            <div class="text-center">
              <div class="text-2xl font-bold text-red-500">
                {{ totalFavoritos() }}
              </div>
              <div class="text-sm text-gray-500">Favoritos</div>
            </div>
            } @if (totalFavoritos() > 0) {
            <button
              (click)="compartirFavoritos()"
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                ></path>
              </svg>
              Compartir lista
            </button>
            }
          </div>
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
                Buscar en favoritos
              </label>
              <div class="relative">
                <input
                  id="busqueda"
                  type="text"
                  formControlName="search"
                  placeholder="Nombre del producto..."
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
                for="categoria"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Categoría
              </label>
              <select
                id="categoria"
                formControlName="categoria_id"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                (change)="aplicarFiltros()"
              >
                <option value="">Todas las categorías</option>
                @if (categoriasDisponibles()) { @for (categoria of
                categoriasDisponibles(); track categoria.id) {
                <option [value]="categoria.id">{{ categoria.nombre }}</option>
                } }
              </select>
            </div>

            <div class="sm:w-48">
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
                <option value="created_at">Más recientes</option>
                <option value="nombre">Nombre A-Z</option>
                <option value="precio_menor">Precio menor</option>
                <option value="precio_mayor">Precio mayor</option>
              </select>
            </div>
          </div>

          <!-- Filtros rápidos -->
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              (click)="limpiarFiltros()"
              class="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Limpiar filtros
            </button>

            <div class="text-sm text-gray-500 flex items-center">
              {{ favoritos().length }} de {{ totalFavoritos() }} favorito{{
                totalFavoritos() !== 1 ? 's' : ''
              }}
            </div>
          </div>
        </form>
      </div>

      <!-- 📋 Grilla de productos favoritos -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        @if (isLoading()) {
        <!-- Estado de carga -->
        <div class="p-12 text-center">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"
          ></div>
          <p class="text-gray-600 mt-4">Cargando favoritos...</p>
        </div>
        } @else if (errorMessage()) {
        <!-- Estado de error -->
        <div class="p-12 text-center">
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
            Error al cargar favoritos
          </h3>
          <p class="text-gray-600 mb-4">{{ errorMessage() }}</p>
          <button
            (click)="cargarFavoritos()"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Intentar nuevamente
          </button>
        </div>
        } @else if (favoritos().length === 0) {
        <!-- Estado vacío -->
        <div class="p-12 text-center">
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
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              ></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            No tienes favoritos
          </h3>
          <p class="text-gray-600 mb-6">
            @if (tieneFilttrosActivos()) { No se encontraron productos con los
            filtros aplicados. } @else { Explora nuestro catálogo y marca
            productos como favoritos para verlos aquí. }
          </p>

          @if (tieneFilttrosActivos()) {
          <button
            (click)="limpiarFiltros()"
            class="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors mr-3"
          >
            Limpiar filtros
          </button>
          }

          <a
            routerLink="/catalogo"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Explorar catálogo
          </a>
        </div>
        } @else {
        <!-- Grilla de productos -->
        <div class="p-6">
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            @for (producto of favoritos(); track producto.id) {
            <div
              class="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
            >
              <!-- Imagen del producto -->
              <div class="relative aspect-square overflow-hidden">
                @if (producto.imagen_principal) {
                <img
                  [src]="getImagenUrl(producto.imagen_principal)"
                  [alt]="producto.nombre"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                } @else {
                <div
                  class="w-full h-full bg-gray-200 flex items-center justify-center"
                >
                  <svg
                    class="w-12 h-12 text-gray-400"
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

                <!-- Botón de favorito -->
                <button
                  (click)="toggleFavorito(producto)"
                  class="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                  [title]="'Quitar de favoritos'"
                  type="button"
                >
                  <svg
                    class="w-5 h-5 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    ></path>
                  </svg>
                </button>

                <!-- Etiquetas de descuento -->
                @if ($any(producto).descuento && $any(producto).descuento > 0) {
                <div
                  class="absolute top-3 left-3 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded"
                >
                  -{{ $any(producto).descuento }}%
                </div>
                }

                <!-- Overlay con acciones -->
                <div
                  class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100"
                >
                  <div class="space-x-2">
                    <a
                      [routerLink]="['/producto', producto.slug]"
                      class="px-3 py-1.5 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Ver producto
                    </a>

                    @if (producto.stock && producto.stock > 0) {
                    <button
                      (click)="agregarAlCarrito(producto)"
                      class="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      type="button"
                    >
                      Agregar al carrito
                    </button>
                    }
                  </div>
                </div>
              </div>

              <!-- Información del producto -->
              <div class="p-4">
                <!-- Categoría -->
                @if (producto.categoria) {
                <span
                  class="text-xs text-blue-600 font-medium uppercase tracking-wide"
                >
                  {{ producto.categoria.nombre }}
                </span>
                }

                <!-- Nombre -->
                <h3 class="text-sm font-medium text-gray-900 mt-1 line-clamp-2">
                  <a
                    [routerLink]="['/producto', producto.slug]"
                    class="hover:text-blue-600 transition-colors"
                  >
                    {{ producto.nombre }}
                  </a>
                </h3>

                <!-- Precio -->
                <div class="mt-2 flex items-center justify-between">
                  <div>
                    @if ($any(producto).precio_descuento &&
                    $any(producto).precio_descuento < producto.precio) {
                    <div class="flex items-center space-x-2">
                      <span class="text-lg font-bold text-red-600">
                        S/ {{ $any(producto).precio_descuento }}
                      </span>
                      <span class="text-sm text-gray-500 line-through">
                        S/ {{ producto.precio }}
                      </span>
                    </div>
                    } @else {
                    <span class="text-lg font-bold text-gray-900">
                      S/ {{ producto.precio }}
                    </span>
                    }
                  </div>

                  <!-- Estado de stock -->
                  @if (producto.stock && producto.stock > 0) {
                  <span class="text-xs text-green-600 font-medium">
                    En stock
                  </span>
                  } @else {
                  <span class="text-xs text-red-600 font-medium">
                    Agotado
                  </span>
                  }
                </div>

                <!-- Rating -->
                @if ($any(producto).rating && $any(producto).rating > 0) {
                <div class="mt-2 flex items-center space-x-1">
                  @for (star of getStarArray($any(producto).rating); track
                  $index) {
                  <svg
                    class="w-4 h-4"
                    [class.text-yellow-400]="star"
                    [class.text-gray-300]="!star"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    ></path>
                  </svg>
                  }
                  <span class="text-xs text-gray-500 ml-1">
                    ({{ $any(producto).total_reviews || 0 }})
                  </span>
                </div>
                }

                <!-- Fecha agregada a favoritos -->
                <div class="mt-2 text-xs text-gray-400">
                  Agregado
                  {{
                    formatearFechaRelativa($any(producto).fecha_favorito || '')
                  }}
                </div>
              </div>
            </div>
            }
          </div>
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
              {{ paginacion()!.total }} favoritos
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
      /* Truncar texto en múltiples líneas */
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      /* Efectos hover mejorados */
      .group:hover .group-hover\\:scale-105 {
        transform: scale(1.05);
      }

      /* Estados de productos */
      .producto-card {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .producto-card:hover {
        transform: translateY(-2px);
      }

      /* Grid responsive mejorado */
      @media (min-width: 1536px) {
        .grid-cols-5 {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }
      }
    `,
  ],
})
export class MisFavoritosComponent implements OnInit {
  private readonly cuentaUsuarioService = inject(CuentaUsuarioService);
  private readonly fb = inject(FormBuilder);

  // 🚦 Signals para gestión de estado
  protected readonly favoritos = signal<Producto[]>([]);
  protected readonly categoriasDisponibles = signal<any[]>([]);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly paginacion = signal<PaginationMeta | null>(null);
  protected readonly totalFavoritos = signal<number>(0);

  // 📊 Form para filtros
  protected readonly filtrosForm: FormGroup = this.fb.group({
    search: [''],
    categoria_id: [''],
    sort_by: ['created_at'],
    sort_dir: ['desc'],
  });

  // 📊 Signals computados
  protected readonly tieneFilttrosActivos = computed(() => {
    const form = this.filtrosForm.value;
    return !!(form.search || form.categoria_id);
  });

  ngOnInit(): void {
    this.cargarFavoritos();
    this.cargarCategorias();
  }

  /**
   * 📂 Cargar favoritos con filtros
   */
  protected cargarFavoritos(pagina: number = 1): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filtros = {
      ...this.filtrosForm.value,
      page: pagina,
      per_page: 12,
    };

    // Limpiar filtros vacíos
    Object.keys(filtros).forEach((key) => {
      if (filtros[key] === '' || filtros[key] === null) {
        delete filtros[key];
      }
    });

    this.cuentaUsuarioService.getFavoritos(filtros).subscribe({
      next: (response) => {
        if (response.data) {
          this.favoritos.set(
            response.data.favoritos.map(
              (favorito: any) => favorito.producto || favorito
            )
          );
          this.paginacion.set(response.data.pagination);
          this.totalFavoritos.set(response.data.pagination.total);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          'Error al cargar los favoritos. Por favor, intenta nuevamente.'
        );
        this.isLoading.set(false);
        console.error('Error cargando favoritos:', error);
      },
    });
  }

  /**
   * 📂 Cargar categorías disponibles
   */
  private cargarCategorias(): void {
    this.cuentaUsuarioService.getCategoriasFavoritos().subscribe({
      next: (response) => {
        if (response.success) {
          this.categoriasDisponibles.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error cargando categorías:', error);
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
    this.cargarFavoritos(1);
  }

  /**
   * 🧹 Limpiar todos los filtros
   */
  protected limpiarFiltros(): void {
    this.filtrosForm.reset({
      search: '',
      categoria_id: '',
      sort_by: 'created_at',
      sort_dir: 'desc',
    });
    this.cargarFavoritos(1);
  }

  /**
   * 📄 Cambiar página
   */
  protected cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= (this.paginacion()?.last_page || 1)) {
      this.cargarFavoritos(pagina);
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
   * ⭐ Obtener array de estrellas para rating
   */
  protected getStarArray(rating: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating);
    }
    return stars;
  }

  /**
   * 📅 Formatear fecha relativa
   */
  protected formatearFechaRelativa(fecha: string): string {
    if (!fecha) return 'recientemente';

    const now = new Date();
    const date = new Date(fecha);
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return 'hoy';
    if (diffInDays === 1) return 'ayer';
    if (diffInDays < 7) return `hace ${diffInDays} días`;
    if (diffInDays < 30)
      return `hace ${Math.floor(diffInDays / 7)} semana${
        Math.floor(diffInDays / 7) > 1 ? 's' : ''
      }`;
    if (diffInDays < 365)
      return `hace ${Math.floor(diffInDays / 30)} mes${
        Math.floor(diffInDays / 30) > 1 ? 'es' : ''
      }`;

    return `hace ${Math.floor(diffInDays / 365)} año${
      Math.floor(diffInDays / 365) > 1 ? 's' : ''
    }`;
  }

  /**
   * ❤️ Toggle favorito
   */
  protected toggleFavorito(producto: Producto): void {
    this.cuentaUsuarioService.toggleFavorito(producto.id).subscribe({
      next: (response) => {
        if (response.success) {
          // Recargar favoritos para reflejar el cambio
          this.cargarFavoritos(this.paginacion()?.current_page || 1);
        }
      },
      error: (error) => {
        console.error('Error al cambiar favorito:', error);
      },
    });
  }

  /**
   * 🛒 Agregar al carrito
   */
  protected agregarAlCarrito(producto: Producto): void {
    // TODO: Implementar agregar al carrito
    console.log('🛒 Agregar al carrito:', producto.nombre);
  }

  /**
   * 📤 Compartir lista de favoritos
   */
  protected compartirFavoritos(): void {
    // TODO: Implementar compartir lista
    console.log('📤 Compartir lista de favoritos');
  }

  /**
   * 🖼️ Obtener URL completa de imagen
   */
  protected getImagenUrl(rutaImagen: string | null | undefined): string {
    if (!rutaImagen) {
      return 'assets/productos/default.jpg';
    }

    // Si ya es una URL completa, la devolvemos tal como está
    if (rutaImagen.startsWith('http://') || rutaImagen.startsWith('https://')) {
      return rutaImagen;
    }

    // Concatenar con la URL base del environment
    return `${environment.urlDominioApi}/${rutaImagen}`;
  }
}
