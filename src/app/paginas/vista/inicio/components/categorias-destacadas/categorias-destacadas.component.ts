import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
  PLATFORM_ID,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { CategoriasService } from '../../../../../core/services/categorias.service';
import {
  Categoria,
  CategoriaFilters,
} from '../../../../../core/models/categoria.model';
import { CategoriaCardComponent } from './components/categoria-card/categoria-card.component';

@Component({
  selector: 'app-categorias-destacadas',
  standalone: true,
  imports: [CommonModule, CategoriaCardComponent],
  template: `
    <!-- Sección de Categorías Destacadas -->
    <section class="py-12 bg-gray-50" aria-labelledby="categorias-heading">
      <div class="container mx-auto px-4">
        <!-- Encabezado de la Sección -->
        <div class="text-center mb-10">
          <h2
            id="categorias-heading"
            class="text-3xl font-bold text-gray-900 mb-4"
          >
            Explora Nuestras Categorías
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre nuestra amplia variedad de productos organizados en
            categorías cuidadosamente seleccionadas para tu comodidad
          </p>
        </div>

        <!-- Estado de Carga -->
        @if (isLoading()) {
        <div class="relative flex justify-center">
          <div class="overflow-hidden" [style.width.px]="containerWidth()">
            <div class="flex animate-pulse">
              @for (item of (isMobile() ? [1,2] : [1,2,3,4,5]); track item) {
              <div class="flex-none px-4" [style.width.px]="slideWidth()">
                <div class="aspect-square bg-gray-200 rounded-xl mb-4"></div>
                <div class="h-4 bg-gray-200 rounded mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
              }
            </div>
          </div>
        </div>
        }

        <!-- Carousel de Categorías -->
        @else if (categoriasDestacadas().length > 0) {
        <div class="relative flex justify-center">
          <!-- Container del Carousel con ancho limitado -->
          <div
            class="overflow-hidden"
            [style.width.px]="containerWidth()"
            #carouselContainer
          >
            <div
              class="flex transition-transform duration-300 ease-in-out"
              [style.transform]="
                'translateX(' + -currentIndex() * slideWidth() + 'px)'
              "
            >
              @for (categoria of categoriasDestacadas(); track
              trackByCategoria($index, categoria)) {
              <div class="flex-none px-4" [style.width.px]="slideWidth()">
                <app-categoria-card
                  [categoria]="categoria"
                  [size]="'md'"
                  [showProductCount]="true"
                  [showDescription]="false"
                  (cardClick)="onCategoriaClick($event)"
                  (exploreClick)="onExploreCategoria($event)"
                  class="transform hover:-translate-y-1 transition-transform duration-200"
                />
              </div>
              }
            </div>
          </div>

          <!-- Controles de Navegación -->
          @if (categoriasDestacadas().length > slidesPerView()) {
          <!-- Botón Anterior -->
          <button
            type="button"
            [class]="
              isMobile()
                ? 'absolute left-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-900 p-2 rounded-full shadow-lg border border-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed z-10'
                : 'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 bg-white hover:bg-gray-50 text-gray-900 p-3 rounded-full shadow-lg border border-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed z-10'
            "
            [disabled]="!canSlidePrev()"
            (click)="slidePrev()"
            aria-label="Categoría anterior"
          >
            <svg
              [class]="isMobile() ? 'w-4 h-4' : 'w-5 h-5'"
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

          <!-- Botón Siguiente -->
          <button
            type="button"
            [class]="
              isMobile()
                ? 'absolute right-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-900 p-2 rounded-full shadow-lg border border-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed z-10'
                : 'absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 bg-white hover:bg-gray-50 text-gray-900 p-3 rounded-full shadow-lg border border-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed z-10'
            "
            [disabled]="!canSlideNext()"
            (click)="slideNext()"
            aria-label="Categoría siguiente"
          >
            <svg
              [class]="isMobile() ? 'w-4 h-4' : 'w-5 h-5'"
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
          }
        </div>

        <!-- Botón Ver Todas las Categorías -->
        <div class="text-center mt-10">
          <button
            type="button"
            (click)="onVerTodasCategorias()"
            class="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-medium transition-colors duration-200"
          >
            <span>Ver Todas las Categorías</span>
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
        @else if (!isLoading() && categoriasDestacadas().length === 0) {
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            ></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            No hay categorías disponibles
          </h3>
          <p class="text-gray-600">
            Las categorías se mostrarán aquí una vez que estén configuradas.
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
            Error al cargar categorías
          </h3>
          <p class="text-gray-600 mb-4">
            {{ errorMessage() }}
          </p>
          <button
            type="button"
            (click)="recargarCategorias()"
            class="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
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
  `,
})
export class CategoriasDestacadasComponent implements OnInit {
  // Servicios inyectados
  private readonly categoriasService = inject(CategoriasService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  // Signals para estado reactivo
  private readonly categorias = signal<Categoria[]>([]);
  private readonly loading = signal<boolean>(false);
  private readonly error = signal<string | null>(null);
  readonly isMobile = signal<boolean>(false);
  readonly currentIndex = signal<number>(0);
  private autoScrollInterval: any = null;

  // Computed signals
  readonly isLoading = computed(() => this.loading());
  readonly hasError = computed(() => this.error() !== null);
  readonly errorMessage = computed(() => this.error() || '');

  // Todas las categorías activas ordenadas por ID
  readonly categoriasDestacadas = computed(() => {
    // Filtrar solo por activo, sin importar categoria_padre_id
    const categoriasActivas = this.categorias().filter(
      (categoria) => categoria.activo
    );

    // Ordenar por ID para tener un orden consistente
    return categoriasActivas.sort((a, b) => a.id - b.id);
  });

  // Configuración del carousel responsive
  readonly slidesPerView = computed(() => {
    return this.isMobile() ? 2 : 5;
  });

  readonly slideWidth = computed(() => {
    // Ancho calculado para que se vean bien los slides
    return this.isMobile() ? 180 : 200;
  });

  // Ancho total del contenedor visible
  readonly containerWidth = computed(() => {
    const slidesVisible = this.slidesPerView();
    const slideWidth = this.slideWidth();
    return slidesVisible * slideWidth;
  });

  // Computed signals para el carousel
  readonly canSlidePrev = computed(() => this.currentIndex() > 0);

  readonly canSlideNext = computed(
    () =>
      this.currentIndex() <
      this.categoriasDestacadas().length - this.slidesPerView()
  );

  constructor() {
    // Suscripción al estado del servicio que se mantiene hasta que el componente se destruya
    this.categoriasService.loading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loading) => this.loading.set(loading));

    // Detectar tamaño de pantalla si estamos en el browser
    if (isPlatformBrowser(this.platformId)) {
      this.detectarTamanoPantalla();
      this.configurarListenerResize();
    }
  }

  ngOnInit(): void {
    this.cargarCategorias();
    this.iniciarAutoScroll();
  }

  /**
   * Detecta si es dispositivo móvil basado en el ancho de pantalla
   */
  private detectarTamanoPantalla(): void {
    const isMobile = window.innerWidth < 768; // Breakpoint md de Tailwind
    this.isMobile.set(isMobile);
  }

  /**
   * Configura el listener para cambios de tamaño de pantalla
   */
  private configurarListenerResize(): void {
    const handleResize = () => this.detectarTamanoPantalla();

    window.addEventListener('resize', handleResize);

    // Cleanup cuando el componente se destruya
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', handleResize);
      this.detenerAutoScroll();
    });
  }

  /**
   * Baraja un array usando el algoritmo Fisher-Yates
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Carga todas las categorías activas desde el servicio
   */
  private cargarCategorias(): void {
    this.error.set(null);

    const filtros: CategoriaFilters = {
      activo: true,
      // Removemos categoria_padre_id para traer TODAS las categorías
      sort_by: 'id', // Ordenar por ID
      sort_direction: 'asc',
      per_page: 50, // Incrementamos para asegurar que traiga todas
    };

    this.categoriasService
      .getCategorias(filtros)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.categorias.set(response.data);
          this.error.set(null);
        },
        error: (error) => {
          console.error('Error al cargar categorías:', error);
          this.error.set(
            'No se pudieron cargar las categorías. Por favor, intenta de nuevo.'
          );
          this.categorias.set([]);
        },
      });
  }

  /**
   * Función trackBy para optimizar el renderizado de la lista
   */
  trackByCategoria(index: number, categoria: Categoria): number {
    return categoria.id;
  }

  /**
   * Maneja el click en una categoría
   */
  onCategoriaClick(categoria: Categoria): void {
    this.navegarACategoria(categoria);
  }

  /**
   * Maneja el click en el botón explorar de una categoría
   */
  onExploreCategoria(categoria: Categoria): void {
    this.navegarACategoria(categoria);
  }

  /**
   * Navega a la página de productos de una categoría específica
   */
  private navegarACategoria(categoria: Categoria): void {
    this.router.navigate([
      '/productos-por-categoria',
      categoria.slug || categoria.id,
    ]);
  }

  /**
   * Navega a la página completa de categorías
   */
  onVerTodasCategorias(): void {
    this.router.navigate(['/catalogo']);
  }

  /**
   * Recarga las categorías en caso de error
   */
  recargarCategorias(): void {
    this.cargarCategorias();
  }

  // Métodos del carousel

  /**
   * Desliza a la categoría anterior
   */
  slidePrev(): void {
    if (this.canSlidePrev()) {
      this.currentIndex.update((index) => Math.max(0, index - 1));
      this.reiniciarAutoScroll(); // Reiniciar auto-scroll al interactuar
    }
  }

  /**
   * Desliza a la categoría siguiente
   */
  slideNext(): void {
    if (this.canSlideNext()) {
      this.currentIndex.update((index) =>
        Math.min(
          this.categoriasDestacadas().length - this.slidesPerView(),
          index + 1
        )
      );
      this.reiniciarAutoScroll(); // Reiniciar auto-scroll al interactuar
    }
  }

  /**
   * Inicia el auto-scroll del carousel
   */
  private iniciarAutoScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.autoScrollInterval = setInterval(() => {
        if (this.categoriasDestacadas().length > this.slidesPerView()) {
          if (this.canSlideNext()) {
            this.slideNext();
          } else {
            // Reiniciar al principio
            this.currentIndex.set(0);
          }
        }
      }, 4000); // Cambiar cada 4 segundos
    }
  }

  /**
   * Detiene el auto-scroll
   */
  private detenerAutoScroll(): void {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }

  /**
   * Reinicia el auto-scroll
   */
  private reiniciarAutoScroll(): void {
    this.detenerAutoScroll();
    this.iniciarAutoScroll();
  }
}
