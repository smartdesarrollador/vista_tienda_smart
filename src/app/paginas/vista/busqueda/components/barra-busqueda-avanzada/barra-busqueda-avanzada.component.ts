import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
  ViewChild,
  ElementRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Subject,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from 'rxjs';

// Core imports
import { BusquedaService } from '../../../../../core/services/busqueda.service';
import {
  BusquedaGeneralRequest,
  AutocompletadoResponse,
  ProductoAutocompletado,
  CategoriaAutocompletado,
} from '../../../../../core/models/busqueda.interface';
import { Categoria } from '../../../../../core/models/categoria.model';

@Component({
  selector: 'app-barra-busqueda-avanzada',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './barra-busqueda-avanzada.component.html',
  styleUrls: ['./barra-busqueda-avanzada.component.css'],
})
export class BarraBusquedaAvanzadaComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly busquedaService = inject(BusquedaService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('inputBusqueda', { static: true })
  inputBusqueda!: ElementRef<HTMLInputElement>;

  // Inputs
  @Input() categorias: Categoria[] = [];
  @Input() terminoInicial: string = '';
  @Input() categoriaInicial: number | null = null;
  @Input() placeholder: string = 'Buscar productos, marcas, categorías...';
  @Input() mostrarFiltrosRapidos: boolean = true;
  @Input() autocompletadoHabilitado: boolean = true;

  // Outputs
  @Output() buscar = new EventEmitter<BusquedaGeneralRequest>();
  @Output() terminoCambiado = new EventEmitter<string>();
  @Output() autocompletadoSeleccionado = new EventEmitter<string>();
  @Output() productoSeleccionado = new EventEmitter<ProductoAutocompletado>();

  // Signals para estado del componente
  readonly mostrarAutocompletado = signal<boolean>(false);
  readonly cargandoAutocompletado = signal<boolean>(false);
  readonly indiceBusquedaSeleccionado = signal<number>(-1);
  readonly mostrarFiltrosAvanzados = signal<boolean>(false);
  readonly rangosPrecioPopulares = signal<
    { min: number; max: number; label: string }[]
  >([
    { min: 0, max: 50, label: 'Hasta S/ 50' },
    { min: 50, max: 100, label: 'S/ 50 - S/ 100' },
    { min: 100, max: 200, label: 'S/ 100 - S/ 200' },
    { min: 200, max: 500, label: 'S/ 200 - S/ 500' },
    { min: 500, max: 1000, label: 'S/ 500 - S/ 1000' },
    { min: 1000, max: Number.MAX_SAFE_INTEGER, label: 'Más de S/ 1000' },
  ]);

  // Datos de autocompletado
  readonly autocompletado = computed(() =>
    this.busquedaService.autocompletado()
  );
  readonly productosAutocompletado = computed(() => {
    const data = this.autocompletado();
    return data?.data?.productos || [];
  });
  readonly categoriasAutocompletado = computed(() => {
    const data = this.autocompletado();
    return data?.data?.categorias || [];
  });
  readonly marcasAutocompletado = computed(() => {
    const data = this.autocompletado();
    return data?.data?.marcas || [];
  });
  readonly busquedasPopulares = computed(() => {
    const data = this.autocompletado();
    return data?.data?.busquedas_populares || [];
  });

  // Formulario principal
  readonly busquedaForm = this.fb.group({
    termino: ['', [Validators.minLength(2)]],
    categoria: [null as number | null],
    precio_min: [null as number | null],
    precio_max: [null as number | null],
  });

  // Subject para debounce del autocompletado
  private readonly terminoBusqueda$ = new Subject<string>();

  constructor() {
    // Configurar autocompletado con debounce
    this.configurarAutocompletado();

    // Effect para actualizar valores iniciales
    effect(() => {
      if (this.terminoInicial) {
        this.busquedaForm.patchValue(
          {
            termino: this.terminoInicial,
          },
          { emitEvent: false }
        );
      }
      if (this.categoriaInicial) {
        this.busquedaForm.patchValue(
          {
            categoria: this.categoriaInicial,
          },
          { emitEvent: false }
        );
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
   * Inicializa el componente
   */
  private inicializarComponente(): void {
    // Escuchar cambios en el término de búsqueda
    this.busquedaForm
      .get('termino')
      ?.valueChanges.pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((termino) => {
        if (termino && termino.length >= 2) {
          this.terminoBusqueda$.next(termino);
          this.terminoCambiado.emit(termino);
        } else {
          this.ocultarAutocompletado();
        }
      });

    // Configurar eventos de teclado
    this.configurarEventosTeclado();
  }

  /**
   * Configura el autocompletado con debounce
   */
  private configurarAutocompletado(): void {
    if (!this.autocompletadoHabilitado) return;

    this.terminoBusqueda$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((termino) => {
          if (termino && termino.length >= 2) {
            this.cargandoAutocompletado.set(true);
            this.busquedaService.autocompletar(termino);
            return new Promise((resolve) => setTimeout(resolve, 500)); // Simular delay
          }
          return [];
        })
      )
      .subscribe(() => {
        this.cargandoAutocompletado.set(false);
        this.mostrarAutocompletado.set(true);
      });
  }

  /**
   * Configura eventos de teclado para navegación
   */
  private configurarEventosTeclado(): void {
    this.inputBusqueda.nativeElement.addEventListener('keydown', (event) => {
      if (!this.mostrarAutocompletado()) return;

      const totalOpciones = this.obtenerTotalOpcionesAutocompletado();

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.indiceBusquedaSeleccionado.update((index) =>
            index < totalOpciones - 1 ? index + 1 : 0
          );
          break;

        case 'ArrowUp':
          event.preventDefault();
          this.indiceBusquedaSeleccionado.update((index) =>
            index > 0 ? index - 1 : totalOpciones - 1
          );
          break;

        case 'Enter':
          event.preventDefault();
          const indiceSeleccionado = this.indiceBusquedaSeleccionado();
          if (indiceSeleccionado >= 0) {
            this.seleccionarOpcionAutocompletado(indiceSeleccionado);
          } else {
            this.realizarBusqueda();
          }
          break;

        case 'Escape':
          this.ocultarAutocompletado();
          break;
      }
    });
  }

  /**
   * Obtiene el total de opciones de autocompletado
   */
  private obtenerTotalOpcionesAutocompletado(): number {
    return (
      this.productosAutocompletado().length +
      this.categoriasAutocompletado().length +
      this.marcasAutocompletado().length +
      this.busquedasPopulares().length
    );
  }

  /**
   * Selecciona una opción del autocompletado
   */
  private seleccionarOpcionAutocompletado(indice: number): void {
    let contador = 0;

    // Productos
    if (indice < this.productosAutocompletado().length) {
      const producto = this.productosAutocompletado()[indice];
      this.seleccionarProductoAutocompletado(producto);
      return;
    }
    contador += this.productosAutocompletado().length;

    // Categorías
    if (indice < contador + this.categoriasAutocompletado().length) {
      const categoria = this.categoriasAutocompletado()[indice - contador];
      this.seleccionarCategoriaAutocompletado(categoria);
      return;
    }
    contador += this.categoriasAutocompletado().length;

    // Marcas
    if (indice < contador + this.marcasAutocompletado().length) {
      const marca = this.marcasAutocompletado()[indice - contador];
      this.seleccionarMarcaAutocompletado(marca);
      return;
    }
    contador += this.marcasAutocompletado().length;

    // Búsquedas populares
    if (indice < contador + this.busquedasPopulares().length) {
      const busqueda = this.busquedasPopulares()[indice - contador];
      this.seleccionarBusquedaPopular(busqueda);
      return;
    }
  }

  /**
   * Maneja el enfoque en el input
   */
  onFocusInput(): void {
    const termino = this.busquedaForm.get('termino')?.value;
    if (termino && termino.length >= 2) {
      this.mostrarAutocompletado.set(true);
    }
  }

  /**
   * Maneja la pérdida de enfoque (con delay para permitir clicks)
   */
  onBlurInput(): void {
    setTimeout(() => {
      this.ocultarAutocompletado();
    }, 300);
  }

  /**
   * Maneja el cambio de categoría en el select
   */
  onCategoriaChange(value: string | null): void {
    console.log('🔄 [DROPDOWN] Cambio de categoría detectado:', value);
    if (value && value !== 'null' && value !== '') {
      const categoriaId = parseInt(value, 10);
      if (!isNaN(categoriaId)) {
        console.log('✅ [DROPDOWN] Navegando a categoría ID:', categoriaId);
        this.navegarACategoria(categoriaId);
      }
    }
  }

  /**
   * Oculta el autocompletado
   */
  private ocultarAutocompletado(): void {
    this.mostrarAutocompletado.set(false);
    this.indiceBusquedaSeleccionado.set(-1);
  }

  /**
   * Método de test para verificar que los eventos funcionan
   */
  testClick(producto: ProductoAutocompletado): void {
    console.log('🧪 [TEST] Click detectado en:', producto.nombre);
    this.seleccionarProductoAutocompletado(producto);
  }

  /**
   * Selecciona un producto del autocompletado
   */
  seleccionarProductoAutocompletado(producto: ProductoAutocompletado): void {
    console.log(
      '🔍 [BARRA-BUSQUEDA] Producto seleccionado:',
      producto.nombre,
      'ID:',
      producto.id
    );

    // Ocultar autocompletado inmediatamente
    this.ocultarAutocompletado();

    // Emitir evento al componente padre
    this.productoSeleccionado.emit(producto);

    // También intentar navegar directamente como backup
    this.navegarAProducto(producto);
  }

  /**
   * Navega al detalle del producto
   */
  private navegarAProducto(producto: ProductoAutocompletado): void {
    // Por ahora usar solo el ID para probar la navegación
    console.log('🚀 [BARRA-BUSQUEDA] Navegando a producto ID:', producto.id);
    console.log('🚀 [BARRA-BUSQUEDA] Ruta:', [
      '/producto',
      producto.id.toString(),
    ]);

    // Intentar ambas opciones
    this.router.navigate(['/producto', producto.id.toString()]).then(
      (success) => {
        console.log('✅ [BARRA-BUSQUEDA] Navegación exitosa:', success);
      },
      (error) => {
        console.error('❌ [BARRA-BUSQUEDA] Error en navegación:', error);
      }
    );
  }

  /**
   * Genera un slug para el producto
   */
  private generarSlug(nombre: string, id: number): string {
    const slug = nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s-]/g, '') // Mantener solo letras, números, espacios y guiones
      .trim()
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
      .concat(`-${id}`); // Agregar ID al final para unicidad

    // console.log('Slug generado:', slug, 'para producto:', nombre, 'ID:', id);
    return slug;
  }

  /**
   * Navega a la página de productos por categoría
   */
  private navegarACategoria(categoriaId: number): void {
    const categoria = this.categorias.find((c) => c.id === categoriaId);
    if (categoria) {
      // Usar slug si está disponible, sino usar ID
      const parametroCategoria = categoria.slug || categoriaId.toString();
      this.router.navigate(['/productos-por-categoria', parametroCategoria]);
    }
  }

  /**
   * Selecciona una categoría del autocompletado
   */
  seleccionarCategoriaAutocompletado(categoria: CategoriaAutocompletado): void {
    this.ocultarAutocompletado();
    this.autocompletadoSeleccionado.emit(categoria.nombre);

    // Navegar directamente a la página de productos por categoría
    this.navegarACategoria(categoria.id);
  }

  /**
   * Selecciona una marca del autocompletado
   */
  seleccionarMarcaAutocompletado(marca: string): void {
    this.busquedaForm.patchValue({ termino: marca });
    this.autocompletadoSeleccionado.emit(marca);
    this.ocultarAutocompletado();
    this.realizarBusqueda();
  }

  /**
   * Selecciona una búsqueda popular
   */
  seleccionarBusquedaPopular(busqueda: string): void {
    this.busquedaForm.patchValue({ termino: busqueda });
    this.autocompletadoSeleccionado.emit(busqueda);
    this.ocultarAutocompletado();
    this.realizarBusqueda();
  }

  /**
   * Selecciona un rango de precio predefinido
   */
  seleccionarRangoPrecio(rango: {
    min: number;
    max: number;
    label: string;
  }): void {
    const precioMax = rango.max === Number.MAX_SAFE_INTEGER ? null : rango.max;
    this.busquedaForm.patchValue({
      precio_min: rango.min,
      precio_max: precioMax,
    });
    this.realizarBusqueda();
  }

  /**
   * Limpia el rango de precios
   */
  limpiarRangoPrecios(): void {
    this.busquedaForm.patchValue({
      precio_min: null,
      precio_max: null,
    });
    this.realizarBusqueda();
  }

  /**
   * Alterna la visibilidad de filtros avanzados
   */
  toggleFiltrosAvanzados(): void {
    this.mostrarFiltrosAvanzados.update((valor) => !valor);
  }

  /**
   * Realiza la búsqueda con los parámetros actuales
   */
  realizarBusqueda(): void {
    const formValue = this.busquedaForm.value;

    if (!formValue.termino && !formValue.categoria) {
      return;
    }

    const request: BusquedaGeneralRequest = {
      q: formValue.termino || '',
      categoria: formValue.categoria || undefined,
      precio_min: formValue.precio_min || undefined,
      precio_max: formValue.precio_max || undefined,
      page: 1,
    };

    this.buscar.emit(request);
    this.inputBusqueda.nativeElement.blur();
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.busquedaForm.valid) {
      this.realizarBusqueda();
    }
  }

  /**
   * Limpia el formulario
   */
  limpiarFormulario(): void {
    this.busquedaForm.reset();
    this.inputBusqueda.nativeElement.focus();
  }

  /**
   * Verifica si hay filtros aplicados
   */
  readonly tieneFiltrosAplicados = computed(() => {
    const formValue = this.busquedaForm.value;
    return !!(
      formValue.categoria ||
      formValue.precio_min ||
      formValue.precio_max
    );
  });

  /**
   * Obtiene el texto de la categoría seleccionada
   */
  readonly textoCategoria = computed(() => {
    const categoriaId = this.busquedaForm.get('categoria')?.value;
    if (!categoriaId) return '';

    const categoria = this.categorias.find((c) => c.id === categoriaId);
    return categoria ? categoria.nombre : '';
  });

  /**
   * Obtiene el texto del rango de precios
   */
  readonly textoRangoPrecios = computed(() => {
    const formValue = this.busquedaForm.value;
    const min = formValue.precio_min;
    const max = formValue.precio_max;

    if (!min && !max) return '';
    if (min && !max) return `Desde S/ ${min}`;
    if (!min && max) return `Hasta S/ ${max}`;
    return `S/ ${min} - S/ ${max}`;
  });

  /**
   * Formatea el precio para mostrar
   */
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
    }).format(precio);
  }

  /**
   * Getter para validaciones del formulario
   */
  get f() {
    return this.busquedaForm.controls;
  }
}
