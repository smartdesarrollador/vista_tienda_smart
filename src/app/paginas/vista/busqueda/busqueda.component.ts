import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// Core imports
import { BusquedaService } from '../../../core/services/busqueda.service';
import { CategoriasService } from '../../../core/services/categorias.service';
import {
  BusquedaGeneralRequest,
  BusquedaAvanzadaRequest,
  TipoOrdenamiento,
  ProductoBusqueda,
  FiltroAplicado,
  ProductoAutocompletado,
} from '../../../core/models/busqueda.interface';
import { Categoria } from '../../../core/models/categoria.model';

// Feature components (Los componentes shared se agregarán cuando estén disponibles)

// Feature components
import { BarraBusquedaAvanzadaComponent } from './components/barra-busqueda-avanzada/barra-busqueda-avanzada.component';
import { ResultadosBusquedaComponent } from './components/resultados-busqueda/resultados-busqueda.component';
import { FiltrosLateralesComponent } from './components/filtros-laterales/filtros-laterales.component';

@Component({
  selector: 'app-busqueda',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BarraBusquedaAvanzadaComponent,
    ResultadosBusquedaComponent,
    FiltrosLateralesComponent,
  ],
  templateUrl: './busqueda.component.html',
  styleUrls: ['./busqueda.component.css'],
})
export class BusquedaComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly busquedaService = inject(BusquedaService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly destroy$ = new Subject<void>();

  // Signals para estado del componente
  readonly termino = signal<string>('');
  readonly categoriaSeleccionada = signal<number | null>(null);
  readonly ordenamiento = signal<TipoOrdenamiento>('relevancia');
  readonly paginaActual = signal<number>(1);
  readonly mostrarFiltrosMovil = signal<boolean>(false);
  readonly vistaActual = signal<'grid' | 'lista'>('grid');
  readonly cargandoMas = signal<boolean>(false);

  // Signals computados
  readonly hayResultados = computed(() =>
    this.busquedaService.tieneResultados()
  );
  readonly productos = computed(() => this.busquedaService.productos());
  readonly totalResultados = computed(() =>
    this.busquedaService.totalResultados()
  );
  readonly paginacion = computed(() => this.busquedaService.paginacion());
  readonly cargando = computed(() => this.busquedaService.cargando());
  readonly error = computed(() => this.busquedaService.error());
  readonly filtrosActivos = computed(() =>
    this.busquedaService.filtrosActivos()
  );
  readonly sugerencias = computed(() => this.busquedaService.sugerencias());

  // Propiedades públicas para el template
  readonly terminosPopulares = computed(() =>
    this.busquedaService.terminosPopulares()
  );
  readonly filtrosDisponibles = computed(() =>
    this.busquedaService.filtrosDisponibles()
  );

  // Datos para componentes hijos
  readonly categorias = signal<Categoria[]>([]);
  readonly opcionesOrdenamiento = signal<
    { value: TipoOrdenamiento; label: string }[]
  >([
    { value: 'relevancia', label: 'Más relevantes' },
    { value: 'precio_asc', label: 'Precio: menor a mayor' },
    { value: 'precio_desc', label: 'Precio: mayor a menor' },
    { value: 'nombre', label: 'Nombre A-Z' },
    { value: 'calificacion', label: 'Mejor valorados' },
    { value: 'popularidad', label: 'Más populares' },
    { value: 'fecha', label: 'Más recientes' },
  ]);

  // Formulario para parámetros de búsqueda
  readonly busquedaForm = this.fb.group({
    termino: [''],
    categoria: [null as number | null],
    precio_min: [null as number | null],
    precio_max: [null as number | null],
    ordenamiento: ['relevancia' as TipoOrdenamiento],
    pagina: [1],
  });

  // Breadcrumb items
  readonly breadcrumbItems = computed(() => {
    const items = [
      { label: 'Inicio', url: '/' },
      { label: 'Búsqueda', url: '/buscar' },
    ];

    const termino = this.termino();
    if (termino) {
      items.push({
        label: `Resultados para "${termino}"`,
        url: '',
      });
    }

    return items;
  });

  constructor() {
    // Effect para sincronizar query params con formulario
    effect(() => {
      this.route.queryParams
        .pipe(takeUntil(this.destroy$))
        .subscribe((params) => {
          this.actualizarDesdeQueryParams(params);
        });
    });

    // Effect para realizar búsqueda cuando cambian los parámetros
    effect(() => {
      const formValue = this.busquedaForm.value;
      if (formValue.termino && formValue.termino.length >= 2) {
        this.realizarBusqueda();
      }
    });
  }

  ngOnInit(): void {
    this.inicializarComponente();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el componente cargando datos necesarios
   */
  private async inicializarComponente(): Promise<void> {
    try {
      await this.cargarCategorias();
      await this.cargarTerminosPopulares();

      // Procesar query params iniciales
      const queryParams = this.route.snapshot.queryParams;
      if (Object.keys(queryParams).length > 0) {
        this.actualizarDesdeQueryParams(queryParams);
      }
    } catch (error) {
      console.error('Error al inicializar componente de búsqueda:', error);
    }
  }

  /**
   * Carga las categorías disponibles
   */
  private async cargarCategorias(): Promise<void> {
    try {
      this.categoriasService.getCategorias().subscribe({
        next: (response) => {
          if (response.data) {
            this.categorias.set(response.data);
          }
        },
        error: (error: any) =>
          console.error('Error al cargar categorías:', error),
      });
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  }

  /**
   * Carga los términos populares
   */
  private async cargarTerminosPopulares(): Promise<void> {
    try {
      this.busquedaService.obtenerTerminosPopulares().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            console.log('Términos populares cargados:', response.data);
          }
        },
        error: (error) =>
          console.error('Error al cargar términos populares:', error),
      });
    } catch (error) {
      console.error('Error al cargar términos populares:', error);
    }
  }

  /**
   * Actualiza el formulario desde los query parameters
   */
  private actualizarDesdeQueryParams(params: any): void {
    const formUpdate: any = {};

    if (params['q']) {
      formUpdate.termino = params['q'];
      this.termino.set(params['q']);
    }

    if (params['categoria']) {
      const categoriaId = parseInt(params['categoria']);
      formUpdate.categoria = categoriaId;
      this.categoriaSeleccionada.set(categoriaId);
    }

    if (params['precio_min']) {
      formUpdate.precio_min = parseFloat(params['precio_min']);
    }

    if (params['precio_max']) {
      formUpdate.precio_max = parseFloat(params['precio_max']);
    }

    if (params['orden']) {
      formUpdate.ordenamiento = params['orden'];
      this.ordenamiento.set(params['orden']);
    }

    if (params['pagina']) {
      const pagina = parseInt(params['pagina']);
      formUpdate.pagina = pagina;
      this.paginaActual.set(pagina);
    }

    this.busquedaForm.patchValue(formUpdate);
  }

  /**
   * Realiza la búsqueda con los parámetros actuales
   */
  realizarBusqueda(): void {
    const formValue = this.busquedaForm.value;

    const request: BusquedaGeneralRequest = {
      q: formValue.termino || '',
      categoria: formValue.categoria || undefined,
      precio_min: formValue.precio_min || undefined,
      precio_max: formValue.precio_max || undefined,
      ordenar_por: formValue.ordenamiento || 'relevancia',
      page: formValue.pagina || 1,
      per_page: 20,
    };

    this.busquedaService.buscar(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.actualizarURL();
        }
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
      },
    });
  }

  /**
   * Actualiza la URL con los parámetros de búsqueda actuales
   */
  private actualizarURL(): void {
    const formValue = this.busquedaForm.value;
    const queryParams: any = {};

    if (formValue.termino) queryParams['q'] = formValue.termino;
    if (formValue.categoria) queryParams['categoria'] = formValue.categoria;
    if (formValue.precio_min) queryParams['precio_min'] = formValue.precio_min;
    if (formValue.precio_max) queryParams['precio_max'] = formValue.precio_max;
    if (formValue.ordenamiento && formValue.ordenamiento !== 'relevancia') {
      queryParams['orden'] = formValue.ordenamiento;
    }
    if (formValue.pagina && formValue.pagina > 1) {
      queryParams['pagina'] = formValue.pagina;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Maneja la búsqueda desde la barra de búsqueda avanzada
   */
  onBuscar(parametros: BusquedaGeneralRequest): void {
    this.busquedaForm.patchValue({
      termino: parametros.q,
      categoria: parametros.categoria || null,
      precio_min: parametros.precio_min || null,
      precio_max: parametros.precio_max || null,
      ordenamiento: parametros.ordenar_por || 'relevancia',
      pagina: 1,
    });

    this.termino.set(parametros.q);
    this.paginaActual.set(1);
  }

  /**
   * Maneja el cambio de ordenamiento
   */
  onCambiarOrdenamiento(ordenamiento: TipoOrdenamiento): void {
    this.busquedaForm.patchValue({
      ordenamiento,
      pagina: 1,
    });
    this.ordenamiento.set(ordenamiento);
    this.paginaActual.set(1);
  }

  /**
   * Maneja el cambio de página
   */
  onCambiarPagina(pagina: number): void {
    this.busquedaForm.patchValue({ pagina });
    this.paginaActual.set(pagina);

    // Scroll al top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Maneja la aplicación de filtros
   */
  onAplicarFiltro(filtro: FiltroAplicado): void {
    this.busquedaService.aplicarFiltro(filtro);
    this.realizarBusquedaAvanzada();
  }

  /**
   * Maneja la eliminación de filtros
   */
  onRemoverFiltro(campo: string): void {
    this.busquedaService.removerFiltro(campo);
    this.realizarBusquedaAvanzada();
  }

  /**
   * Limpia todos los filtros
   */
  onLimpiarFiltros(): void {
    this.busquedaService.limpiarFiltros();
    this.busquedaForm.patchValue({
      categoria: null,
      precio_min: null,
      precio_max: null,
      pagina: 1,
    });
    this.paginaActual.set(1);
    this.realizarBusqueda();
  }

  /**
   * Realiza búsqueda avanzada con filtros
   */
  private realizarBusquedaAvanzada(): void {
    const formValue = this.busquedaForm.value;
    const filtrosActivos = this.filtrosActivos();

    const request: BusquedaAvanzadaRequest = {
      termino: formValue.termino || undefined,
      categorias: formValue.categoria ? [formValue.categoria] : undefined,
      precio_min: formValue.precio_min || undefined,
      precio_max: formValue.precio_max || undefined,
      ordenar_por: formValue.ordenamiento || 'relevancia',
      page: formValue.pagina || 1,
      per_page: 20,
      // Agregar filtros adicionales según los filtros activos
      ...(filtrosActivos.length > 0 &&
        this.convertirFiltrosARequest(filtrosActivos)),
    };

    this.busquedaService.busquedaAvanzada(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.actualizarURL();
        }
      },
      error: (error) => {
        console.error('Error en búsqueda avanzada:', error);
      },
    });
  }

  /**
   * Convierte filtros aplicados a parámetros de request
   */
  private convertirFiltrosARequest(
    filtros: FiltroAplicado[]
  ): Partial<BusquedaAvanzadaRequest> {
    const request: Partial<BusquedaAvanzadaRequest> = {};

    filtros.forEach((filtro) => {
      switch (filtro.tipo) {
        case 'marca':
          if (!request.marcas) request.marcas = [];
          request.marcas.push(filtro.valor);
          break;
        case 'descuento':
          request.con_descuento = filtro.valor;
          break;
        case 'stock':
          request.en_stock = filtro.valor;
          break;
        case 'calificacion':
          request.calificacion_min = filtro.valor;
          break;
      }
    });

    return request;
  }

  /**
   * Alterna la vista entre grid y lista
   */
  toggleVista(): void {
    const nuevaVista = this.vistaActual() === 'grid' ? 'lista' : 'grid';
    this.vistaActual.set(nuevaVista);
  }

  /**
   * Alterna la visibilidad de filtros en móvil
   */
  toggleFiltrosMovil(): void {
    this.mostrarFiltrosMovil.update((valor) => !valor);
  }

  /**
   * Maneja la selección de un producto desde el autocompletado
   */
  onProductoSeleccionadoAutocompletado(producto: ProductoAutocompletado): void {
    console.log(
      '🔍 [BUSQUEDA-PARENT] Producto seleccionado:',
      producto.nombre,
      'ID:',
      producto.id
    );
    // Por ahora usar ID directo para probar
    console.log('🚀 [BUSQUEDA-PARENT] Navegando con ID:', producto.id);
    this.router.navigate(['/producto', producto.id.toString()]).then(
      (success) => {
        console.log('✅ [BUSQUEDA-PARENT] Navegación exitosa:', success);
      },
      (error) => {
        console.error('❌ [BUSQUEDA-PARENT] Error en navegación:', error);
      }
    );
  }

  /**
   * Maneja la selección de un producto
   */
  onSeleccionarProducto(producto: ProductoBusqueda): void {
    // Generar slug basado en el nombre del producto y su ID
    const slug = this.generarSlug(producto.nombre, producto.id);
    this.router.navigate(['/producto', slug]);
  }

  /**
   * Genera un slug para el producto
   */
  private generarSlug(nombre: string, id: number): string {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s-]/g, '') // Mantener solo letras, números, espacios y guiones
      .trim()
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
      .concat(`-${id}`); // Agregar ID al final para unicidad
  }

  /**
   * Carga más resultados (scroll infinito)
   */
  cargarMasResultados(): void {
    const paginacionActual = this.paginacion();
    if (
      !paginacionActual ||
      paginacionActual.current_page >= paginacionActual.last_page
    ) {
      return;
    }

    this.cargandoMas.set(true);
    const siguientePagina = paginacionActual.current_page + 1;

    this.onCambiarPagina(siguientePagina);

    setTimeout(() => {
      this.cargandoMas.set(false);
    }, 1000);
  }

  /**
   * Getter para usar en template
   */
  get TipoOrdenamiento() {
    return {
      RELEVANCIA: 'relevancia' as TipoOrdenamiento,
      PRECIO_ASC: 'precio_asc' as TipoOrdenamiento,
      PRECIO_DESC: 'precio_desc' as TipoOrdenamiento,
      NOMBRE: 'nombre' as TipoOrdenamiento,
      CALIFICACION: 'calificacion' as TipoOrdenamiento,
      POPULARIDAD: 'popularidad' as TipoOrdenamiento,
      FECHA: 'fecha' as TipoOrdenamiento,
    };
  }
}
