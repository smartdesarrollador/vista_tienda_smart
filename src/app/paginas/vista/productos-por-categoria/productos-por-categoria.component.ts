import {
  Component,
  inject,
  signal,
  computed,
  effect,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';

// Interfaces
import {
  Producto,
  ProductoFilters,
  ProductosResponse,
  ProductoPaginationMeta,
} from '../../../core/models/producto.interface';
import {
  Categoria,
  CategoriaSingleResponse,
} from '../../../core/models/categoria.model';

// Servicios
import { ProductoService } from '../../../core/services/producto.service';
import { CategoriasService } from '../../../core/services/categorias.service';

// Componentes
import { ProductoCardComponent } from '../../../shared/components/producto-card/producto-card.component';

// Environment
import { environment } from '../../../../environments/environment';

/**
 * Tipos de vista para los productos
 */
export type VistaProductos = 'grid' | 'lista';

/**
 * Opciones de ordenamiento
 */
export interface OpcionOrdenamiento {
  label: string;
  value: string;
  orderBy: string;
  orderDirection: 'asc' | 'desc';
}

/**
 * Estado del componente
 */
interface ComponenteState {
  productos: Producto[];
  categoria: Categoria | null;
  loading: boolean;
  error: string | null;
  pagination: ProductoPaginationMeta | null;
  currentPage: number;
  filtros: ProductoFilters;
  vista: VistaProductos;
  ordenamiento: string;
}

@Component({
  selector: 'app-productos-por-categoria',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductoCardComponent],
  templateUrl: './productos-por-categoria.component.html',
  styleUrls: ['./productos-por-categoria.component.css'],
})
export class ProductosPorCategoriaComponent implements OnInit {
  // Servicios inyectados
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productoService = inject(ProductoService);
  private readonly categoriasService = inject(CategoriasService);

  // Estado del componente
  private readonly _state = signal<ComponenteState>({
    productos: [],
    categoria: null,
    loading: false,
    error: null,
    pagination: null,
    currentPage: 1,
    filtros: {},
    vista: 'grid',
    ordenamiento: 'nombre_asc',
  });

  // Signals públicos computados
  readonly productos = computed(() => this._state().productos);
  readonly categoria = computed(() => this._state().categoria);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly pagination = computed(() => this._state().pagination);
  readonly currentPage = computed(() => this._state().currentPage);
  readonly filtros = computed(() => this._state().filtros);
  readonly vista = computed(() => this._state().vista);
  readonly ordenamiento = computed(() => this._state().ordenamiento);

  // Computed signals adicionales
  readonly hasProductos = computed(() => this.productos().length > 0);
  readonly totalProductos = computed(() => this.pagination()?.total ?? 0);
  readonly lastPage = computed(() => this.pagination()?.last_page ?? 1);
  readonly hasNextPage = computed(() => this.currentPage() < this.lastPage());
  readonly hasPrevPage = computed(() => this.currentPage() > 1);
  readonly isGridView = computed(() => this.vista() === 'grid');

  // Breadcrumb computado
  readonly breadcrumb = computed(() => {
    const categoria = this.categoria();
    const breadcrumbs = [
      { label: 'Inicio', url: '/' },
      { label: 'Productos', url: '/productos' },
    ];

    if (categoria) {
      // Agregar categoría padre si existe
      if (categoria.categoria_padre) {
        breadcrumbs.push({
          label: categoria.categoria_padre.nombre,
          url: `/categoria/${categoria.categoria_padre.slug}`,
        });
      }

      // Agregar categoría actual
      breadcrumbs.push({
        label: categoria.nombre,
        url: `/categoria/${categoria.slug}`,
      });
    }

    return breadcrumbs;
  });

  // Opciones de ordenamiento
  readonly opcionesOrdenamiento: OpcionOrdenamiento[] = [
    {
      label: 'Nombre (A-Z)',
      value: 'nombre_asc',
      orderBy: 'nombre',
      orderDirection: 'asc',
    },
    {
      label: 'Nombre (Z-A)',
      value: 'nombre_desc',
      orderBy: 'nombre',
      orderDirection: 'desc',
    },
    {
      label: 'Precio (Menor a Mayor)',
      value: 'precio_asc',
      orderBy: 'precio',
      orderDirection: 'asc',
    },
    {
      label: 'Precio (Mayor a Menor)',
      value: 'precio_desc',
      orderBy: 'precio',
      orderDirection: 'desc',
    },
    {
      label: 'Más Nuevos',
      value: 'created_at_desc',
      orderBy: 'created_at',
      orderDirection: 'desc',
    },
    {
      label: 'Destacados',
      value: 'destacado_desc',
      orderBy: 'destacado',
      orderDirection: 'desc',
    },
  ];

  // Opciones de cantidad por página
  readonly opcionesPorPagina = [12, 24, 36, 48];

  // Exponer Math para el template
  readonly Math = Math;

  /**
   * Obtiene la URL completa de una imagen concatenando con la base URL
   */
  getImagenUrl(rutaImagen: string | null | undefined): string {
    if (!rutaImagen) {
      return 'assets/images/categoria-default.jpg';
    }

    // Si ya es una URL completa, la devolvemos tal como está
    if (rutaImagen.startsWith('http://') || rutaImagen.startsWith('https://')) {
      return rutaImagen;
    }

    // Concatenar con la URL base del environment
    return `${environment.urlDominioApi}/${rutaImagen}`;
  }

  // Configuración para producto-card
  readonly productoCardConfig = {
    mostrarMarca: true,
    mostrarCategoria: false, // No mostrar categoría ya que todos son de la misma
    mostrarDescripcion: true,
    mostrarRating: true,
    mostrarStock: true,
    mostrarBotonCarrito: true,
    mostrarAccionesRapidas: true,
    mostrarFavoritos: true,
    mostrarVistaRapida: true,
    stockBajo: 5,
    urlPorDefecto: 'assets/images/producto-default.jpg',
    textoDestacado: 'Destacado',
  };

  // Effect para monitorear cambios en los parámetros de la ruta
  private readonly routeParamsEffect = effect(
    () => {
      this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (params) => {
          const categoriaParam = params['categoria'];
          if (categoriaParam) {
            this.cargarCategoria(categoriaParam);
          }
        },
        error: (error) => {
          console.error('Error en parámetros de ruta:', error);
          this.updateState({ error: 'Error al cargar la categoría' });
        },
      });
    },
    { allowSignalWrites: true }
  );

  ngOnInit(): void {
    // La carga inicial se maneja en el effect
  }

  /**
   * Cargar categoría por slug o ID
   */
  private cargarCategoria(categoriaParam: string): void {
    this.updateState({ loading: true, error: null });

    // Determinar si es ID numérico o slug
    const isNumeric = /^\d+$/.test(categoriaParam);
    const request$ = isNumeric
      ? this.categoriasService.getCategoriaById(Number(categoriaParam))
      : this.categoriasService.getCategoriaBySlug(categoriaParam);

    request$
      .pipe(
        switchMap((response: CategoriaSingleResponse) => {
          this.updateState({ categoria: response.data });
          return this.cargarProductos();
        }),
        catchError((error) => {
          console.error('Error al cargar categoría:', error);
          this.updateState({
            error: 'No se pudo cargar la categoría solicitada',
            loading: false,
          });
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Cargar productos de la categoría actual
   */
  private cargarProductos(): any {
    const categoria = this._state().categoria;
    if (!categoria) {
      return of(null);
    }

    const currentState = this._state();
    const opcionOrdenamiento = this.opcionesOrdenamiento.find(
      (op) => op.value === currentState.ordenamiento
    );

    const filtros: ProductoFilters = {
      categoria_id: categoria.id,
      page: currentState.currentPage,
      per_page: 24, // Valor por defecto
      order_by:
        (opcionOrdenamiento?.orderBy as
          | 'nombre'
          | 'precio'
          | 'stock'
          | 'created_at'
          | 'categoria_id') || 'nombre',
      order_direction: opcionOrdenamiento?.orderDirection || 'asc',
      activo: true, // Solo productos activos
      ...currentState.filtros,
    };

    return this.productoService.getProductos(filtros).pipe(
      tap((response: ProductosResponse | null) => {
        if (response) {
          this.updateState({
            productos: response.data,
            pagination: response.meta,
            loading: false,
          });
        }
      }),
      catchError((error) => {
        console.error('Error al cargar productos:', error);
        this.updateState({
          error: 'No se pudieron cargar los productos',
          loading: false,
        });
        return of(null);
      }),
      finalize(() => this.updateState({ loading: false }))
    );
  }

  /**
   * Cambiar vista (grid/lista)
   */
  cambiarVista(nuevaVista: VistaProductos): void {
    this.updateState({ vista: nuevaVista });
  }

  /**
   * Cambiar ordenamiento
   */
  cambiarOrdenamiento(nuevoOrdenamiento: string): void {
    this.updateState({
      ordenamiento: nuevoOrdenamiento,
      currentPage: 1,
      loading: true,
    });
    this.cargarProductos().subscribe();
  }

  /**
   * Cambiar página
   */
  cambiarPagina(nuevaPagina: number): void {
    const lastPage = this.lastPage();
    if (nuevaPagina >= 1 && nuevaPagina <= lastPage) {
      this.updateState({ currentPage: nuevaPagina, loading: true });
      this.cargarProductos().subscribe();
      this.scrollToTop();
    }
  }

  /**
   * Ir a página siguiente
   */
  paginaSiguiente(): void {
    if (this.hasNextPage()) {
      this.cambiarPagina(this.currentPage() + 1);
    }
  }

  /**
   * Ir a página anterior
   */
  paginaAnterior(): void {
    if (this.hasPrevPage()) {
      this.cambiarPagina(this.currentPage() - 1);
    }
  }

  /**
   * Cambiar cantidad por página
   */
  cambiarPorPagina(porPagina: number): void {
    this.updateState({
      filtros: { ...this.filtros(), per_page: porPagina },
      currentPage: 1,
      loading: true,
    });
    this.cargarProductos().subscribe();
  }

  /**
   * Obtener rango de páginas para la paginación
   */
  getRangoPaginas(): number[] {
    const currentPage = this.currentPage();
    const lastPage = this.lastPage();
    const delta = 2; // Páginas a mostrar a cada lado
    const range: number[] = [];
    const rangeWithDots: number[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(lastPage - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, -1); // -1 representa "..."
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < lastPage - 1) {
      rangeWithDots.push(-1, lastPage); // -1 representa "..."
    } else if (lastPage > 1) {
      rangeWithDots.push(lastPage);
    }

    return rangeWithDots;
  }

  /**
   * Manejar eventos del producto card
   */
  onProductoClick(evento: any): void {
    // Navegar al detalle del producto
    this.router.navigate([
      '/producto',
      evento.producto.slug || evento.producto.id,
    ]);
  }

  onCarritoClick(evento: any): void {
    // Agregar al carrito (implementar según tu lógica)
    console.log('Agregar al carrito:', evento.producto);
  }

  onFavoritoToggle(evento: any): void {
    // Toggle favorito (implementar según tu lógica)
    console.log('Toggle favorito:', evento.producto);
  }

  onVistaRapida(evento: any): void {
    // Mostrar vista rápida (implementar modal)
    console.log('Vista rápida:', evento.producto);
  }

  /**
   * Scroll al top de la página
   */
  private scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Actualizar estado del componente
   */
  private updateState(partialState: Partial<ComponenteState>): void {
    this._state.update((current) => ({ ...current, ...partialState }));
  }
}
