import { Component, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FiltroCategoriaComponent } from './components/filtro-categoria/filtro-categoria.component';
import {
  FiltroPrecioComponent,
  RangoPrecio,
} from './components/filtro-precio/filtro-precio.component';
import {
  FiltroAtributoComponent,
  Atributo,
} from './components/filtro-atributo/filtro-atributo.component';
import {
  FiltroPersonalizadoComponent,
  FiltroPersonalizado,
  Marca,
  FiltroGuardado,
} from './components/filtro-personalizado/filtro-personalizado.component';

/**
 * Interface para los filtros aplicados
 */
export interface FiltrosAplicados {
  categorias: number[];
  precioMin?: number;
  precioMax?: number;
  atributos: { [key: string]: string[] };
  marca?: string;
  disponibilidad?: boolean;
  rating?: number;
  descuento?: boolean;
  filtrosPersonalizados?: FiltroPersonalizado[];
}

/**
 * Componente principal de filtros avanzados
 * Contiene todos los tipos de filtros para el catálogo
 */
@Component({
  selector: 'app-filtros-avanzados',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FiltroCategoriaComponent,
    FiltroPrecioComponent,
    FiltroAtributoComponent,
    FiltroPersonalizadoComponent,
  ],
  templateUrl: './filtros-avanzados.component.html',
  styleUrl: './filtros-avanzados.component.css',
})
export class FiltrosAvanzadosComponent {
  // Inputs y outputs
  readonly filtrosIniciales = input<FiltrosAplicados>();
  readonly categoriasDisponibles = input<any[]>([]);
  readonly filtrosAplicados = output<FiltrosAplicados>();
  readonly filtrosLimpiados = output<void>();

  // Signals para los filtros
  readonly categorias = signal<number[]>([]);
  readonly precioMin = signal<number | undefined>(undefined);
  readonly precioMax = signal<number | undefined>(undefined);
  readonly atributos = signal<{ [key: string]: string[] }>({});
  readonly marca = signal<string | undefined>(undefined);
  readonly disponibilidad = signal<boolean | undefined>(undefined);
  readonly rating = signal<number | undefined>(undefined);
  readonly descuento = signal<boolean | undefined>(undefined);
  readonly filtrosPersonalizados = signal<FiltroPersonalizado[]>([]);

  // Control de estado
  readonly mostrarFiltros = signal<boolean>(true);
  readonly filtrosColapsados = signal<Set<string>>(new Set());

  // Datos para marcas disponibles (normalmente del servicio)
  readonly marcasDisponibles = signal<Marca[]>([
    { id: 'apple', nombre: 'Apple', productos_count: 15 },
    { id: 'samsung', nombre: 'Samsung', productos_count: 23 },
    { id: 'xiaomi', nombre: 'Xiaomi', productos_count: 18 },
    { id: 'sony', nombre: 'Sony', productos_count: 12 },
    { id: 'asus', nombre: 'ASUS', productos_count: 8 },
    { id: 'hp', nombre: 'HP', productos_count: 14 },
    { id: 'lenovo', nombre: 'Lenovo', productos_count: 10 },
    { id: 'huawei', nombre: 'Huawei', productos_count: 6 },
  ]);

  // Datos para el filtro de atributos (normalmente vienen del servicio)
  readonly atributosDisponibles = signal<Atributo[]>([
    {
      id: '1',
      nombre: 'Color',
      tipo: 'color',
      es_filtrable: true,
      valores: [
        {
          id: 'rojo',
          valor: 'Rojo',
          productos_count: 15,
          color_hex: '#DC2626',
        },
        {
          id: 'azul',
          valor: 'Azul',
          productos_count: 23,
          color_hex: '#2563EB',
        },
        {
          id: 'verde',
          valor: 'Verde',
          productos_count: 18,
          color_hex: '#16A34A',
        },
        {
          id: 'negro',
          valor: 'Negro',
          productos_count: 35,
          color_hex: '#000000',
        },
        {
          id: 'blanco',
          valor: 'Blanco',
          productos_count: 29,
          color_hex: '#FFFFFF',
        },
        {
          id: 'amarillo',
          valor: 'Amarillo',
          productos_count: 12,
          color_hex: '#FACC15',
        },
      ],
    },
    {
      id: '2',
      nombre: 'Talla',
      tipo: 'texto',
      es_filtrable: true,
      valores: [
        { id: 'xs', valor: 'XS', productos_count: 8 },
        { id: 's', valor: 'S', productos_count: 25 },
        { id: 'm', valor: 'M', productos_count: 42 },
        { id: 'l', valor: 'L', productos_count: 38 },
        { id: 'xl', valor: 'XL', productos_count: 22 },
        { id: 'xxl', valor: 'XXL', productos_count: 15 },
      ],
    },
    {
      id: '3',
      nombre: 'Material',
      tipo: 'texto',
      es_filtrable: true,
      valores: [
        { id: 'algodon', valor: 'Algodón', productos_count: 45 },
        { id: 'poliester', valor: 'Poliéster', productos_count: 32 },
        { id: 'lana', valor: 'Lana', productos_count: 18 },
        { id: 'seda', valor: 'Seda', productos_count: 12 },
        { id: 'denim', valor: 'Denim', productos_count: 22 },
      ],
    },
  ]);

  // Computed signals
  readonly filtrosActivos = computed(() => {
    const filtros: FiltrosAplicados = {
      categorias: this.categorias(),
      atributos: this.atributos(),
    };

    if (this.precioMin() !== undefined) {
      filtros.precioMin = this.precioMin();
    }
    if (this.precioMax() !== undefined) {
      filtros.precioMax = this.precioMax();
    }
    if (this.marca()) {
      filtros.marca = this.marca();
    }
    if (this.disponibilidad() !== undefined) {
      filtros.disponibilidad = this.disponibilidad();
    }
    if (this.rating() !== undefined) {
      filtros.rating = this.rating();
    }
    if (this.descuento() !== undefined) {
      filtros.descuento = this.descuento();
    }
    if (this.filtrosPersonalizados().length > 0) {
      filtros.filtrosPersonalizados = this.filtrosPersonalizados();
    }

    return filtros;
  });

  readonly tieneFiltrosActivos = computed(() => {
    const filtros = this.filtrosActivos();
    return (
      filtros.categorias.length > 0 ||
      filtros.precioMin !== undefined ||
      filtros.precioMax !== undefined ||
      Object.keys(filtros.atributos).length > 0 ||
      filtros.marca !== undefined ||
      filtros.disponibilidad !== undefined ||
      filtros.rating !== undefined ||
      filtros.descuento !== undefined ||
      (filtros.filtrosPersonalizados &&
        filtros.filtrosPersonalizados.length > 0)
    );
  });

  readonly contadorFiltrosActivos = computed(() => {
    const filtros = this.filtrosActivos();
    let contador = 0;

    if (filtros.categorias.length > 0) contador++;
    if (filtros.precioMin !== undefined || filtros.precioMax !== undefined)
      contador++;
    if (Object.keys(filtros.atributos).length > 0)
      contador += Object.keys(filtros.atributos).length;
    if (filtros.marca) contador++;
    if (filtros.disponibilidad !== undefined) contador++;
    if (filtros.rating !== undefined) contador++;
    if (filtros.descuento !== undefined) contador++;
    if (
      filtros.filtrosPersonalizados &&
      filtros.filtrosPersonalizados.length > 0
    )
      contador += filtros.filtrosPersonalizados.length;

    return contador;
  });

  ngOnInit(): void {
    console.log('🔧 FILTROS: ngOnInit - Inicializando filtros avanzados');
    // Cargar filtros iniciales si existen
    const filtrosInit = this.filtrosIniciales();
    if (filtrosInit) {
      console.log('🔧 FILTROS: Cargando filtros iniciales', filtrosInit);
      this.cargarFiltrosIniciales(filtrosInit);
    }
  }

  /**
   * Carga los filtros iniciales
   */
  private cargarFiltrosIniciales(filtros: FiltrosAplicados): void {
    this.categorias.set(filtros.categorias || []);
    this.precioMin.set(filtros.precioMin);
    this.precioMax.set(filtros.precioMax);
    this.atributos.set(filtros.atributos || {});
    this.marca.set(filtros.marca);
    this.disponibilidad.set(filtros.disponibilidad);
    this.rating.set(filtros.rating);
    this.descuento.set(filtros.descuento);
    this.filtrosPersonalizados.set(filtros.filtrosPersonalizados || []);
  }

  /**
   * Maneja el cambio de categorías seleccionadas
   */
  onCategoriasSeleccionadas(categorias: number[]): void {
    console.log('🔧 FILTROS: onCategoriasSeleccionadas', {
      categoriasAnteriores: this.categorias(),
      categoriasNuevas: categorias,
    });
    this.categorias.set(categorias);
    this.emitirFiltros();
  }

  /**
   * Maneja el cambio de precio mínimo
   */
  onPrecioMinChange(precio: number | undefined): void {
    this.precioMin.set(precio);
    this.emitirFiltros();
  }

  /**
   * Maneja el cambio de precio máximo
   */
  onPrecioMaxChange(precio: number | undefined): void {
    this.precioMax.set(precio);
    this.emitirFiltros();
  }

  /**
   * Maneja el cambio de atributos
   */
  onAtributosChange(atributos: { [key: string]: string[] }): void {
    this.atributos.set(atributos);
    this.emitirFiltros();
  }

  /**
   * Maneja el cambio de marca
   */
  onMarcaChange(marca: string | undefined): void {
    this.marca.set(marca);
    this.emitirFiltros();
  }

  /**
   * Maneja el cambio de disponibilidad
   */
  onDisponibilidadChange(disponible: boolean | undefined): void {
    this.disponibilidad.set(disponible);
    this.emitirFiltros();
  }

  /**
   * Maneja el cambio de rating
   */
  onRatingChange(rating: number | undefined): void {
    this.rating.set(rating);
    this.emitirFiltros();
  }

  /**
   * Maneja el cambio de descuento
   */
  onDescuentoChange(conDescuento: boolean | undefined): void {
    this.descuento.set(conDescuento);
    this.emitirFiltros();
  }

  /**
   * Maneja el cambio de precio desde el componente hijo
   */
  onPrecioChange(rango: RangoPrecio): void {
    console.log('🔧 FILTROS: onPrecioChange', {
      rangoAnterior: { min: this.precioMin(), max: this.precioMax() },
      rangoNuevo: rango,
    });
    this.precioMin.set(rango.min);
    this.precioMax.set(rango.max);
    this.emitirFiltros();
  }

  /**
   * Maneja el cambio de disponibilidad con type safety
   */
  onDisponibilidadCheckChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onDisponibilidadChange(target.checked ? true : undefined);
  }

  /**
   * Maneja el cambio de descuento con type safety
   */
  onDescuentoCheckChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onDescuentoChange(target.checked ? true : undefined);
  }

  /**
   * Maneja el cambio de filtros personalizados
   */
  onFiltrosPersonalizadosChange(filtros: FiltroPersonalizado[]): void {
    this.filtrosPersonalizados.set(filtros);
    this.emitirFiltros();
  }

  /**
   * Maneja cuando se guarda un filtro personalizado
   */
  onFiltroGuardado(filtro: FiltroGuardado): void {
    // Aquí podrías enviar el filtro al servicio para guardarlo
    console.log('Filtro guardado:', filtro);
  }

  /**
   * Maneja cuando se elimina un filtro guardado
   */
  onFiltroEliminado(filtroId: string): void {
    // Aquí podrías enviar la solicitud al servicio para eliminarlo
    console.log('Filtro eliminado:', filtroId);
  }

  /**
   * Emite los filtros actuales
   */
  private emitirFiltros(): void {
    const filtros = this.filtrosActivos();
    console.log('🔧 FILTROS: emitirFiltros', {
      filtros,
      tieneFiltrosActivos: this.tieneFiltrosActivos(),
      contadorFiltros: this.contadorFiltrosActivos(),
    });
    this.filtrosAplicados.emit(filtros);
  }

  /**
   * Limpia todos los filtros
   */
  limpiarTodosLosFiltros(): void {
    console.log(
      '🔧 FILTROS: limpiarTodosLosFiltros - Limpiando todos los filtros'
    );
    this.categorias.set([]);
    this.precioMin.set(undefined);
    this.precioMax.set(undefined);
    this.atributos.set({});
    this.marca.set(undefined);
    this.disponibilidad.set(undefined);
    this.rating.set(undefined);
    this.descuento.set(undefined);
    this.filtrosPersonalizados.set([]);

    this.filtrosLimpiados.emit();
    this.emitirFiltros();
  }

  /**
   * Toggle para mostrar/ocultar filtros
   */
  toggleMostrarFiltros(): void {
    this.mostrarFiltros.update((current) => !current);
  }

  /**
   * Toggle para colapsar/expandir una sección de filtros
   */
  toggleSeccionFiltro(seccion: string): void {
    const colapsados = this.filtrosColapsados();
    const nuevosColapsados = new Set(colapsados);

    if (nuevosColapsados.has(seccion)) {
      nuevosColapsados.delete(seccion);
    } else {
      nuevosColapsados.add(seccion);
    }

    this.filtrosColapsados.set(nuevosColapsados);
  }

  /**
   * Verifica si una sección está colapsada
   */
  isSeccionColapsada(seccion: string): boolean {
    return this.filtrosColapsados().has(seccion);
  }

  /**
   * Aplica filtros predefinidos rápidos
   */
  aplicarFiltroRapido(
    tipo: 'ofertas' | 'nuevos' | 'populares' | 'disponibles'
  ): void {
    switch (tipo) {
      case 'ofertas':
        this.descuento.set(true);
        break;
      case 'nuevos':
        // Lógica para productos nuevos (últimos 30 días)
        break;
      case 'populares':
        this.rating.set(4);
        break;
      case 'disponibles':
        this.disponibilidad.set(true);
        break;
    }
    this.emitirFiltros();
  }

  /**
   * Exporta los filtros actuales para guardar/compartir
   */
  exportarFiltros(): string {
    return JSON.stringify(this.filtrosActivos());
  }

  /**
   * Importa filtros desde un string JSON
   */
  importarFiltros(filtrosJson: string): void {
    try {
      const filtros = JSON.parse(filtrosJson) as FiltrosAplicados;
      this.cargarFiltrosIniciales(filtros);
      this.emitirFiltros();
    } catch (error) {
      console.error('Error al importar filtros:', error);
    }
  }
}
