import {
  Component,
  signal,
  computed,
  input,
  output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Interface para un filtro personalizado
 */
export interface FiltroPersonalizado {
  id: string;
  nombre: string;
  tipo: 'marca' | 'fecha' | 'caracteristica' | 'ordenamiento' | 'personalizado';
  valor: any;
  activo: boolean;
}

/**
 * Interface para marca disponible
 */
export interface Marca {
  id: string;
  nombre: string;
  productos_count: number;
  logo_url?: string;
}

/**
 * Interface para rango de fechas
 */
export interface RangoFecha {
  desde?: Date;
  hasta?: Date;
  periodo_predefinido?:
    | 'ultima_semana'
    | 'ultimo_mes'
    | 'ultimos_3_meses'
    | 'ultimo_año';
}

/**
 * Interface para filtros guardados
 */
export interface FiltroGuardado {
  id: string;
  nombre: string;
  descripcion?: string;
  filtros: any;
  fecha_creacion: Date;
  es_favorito: boolean;
  veces_usado: number;
}

/**
 * Componente para filtros personalizados avanzados
 * Maneja marcas, fechas, características especiales y filtros guardados
 */
@Component({
  selector: 'app-filtro-personalizado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filtro-personalizado.component.html',
  styleUrl: './filtro-personalizado.component.css',
})
export class FiltroPersonalizadoComponent {
  // Inputs y outputs
  readonly filtrosPersonalizados = input<FiltroPersonalizado[]>([]);
  readonly marcasDisponibles = input<Marca[]>([]);
  readonly loading = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  readonly filtrosChanged = output<FiltroPersonalizado[]>();
  readonly filtroGuardado = output<FiltroGuardado>();
  readonly filtroEliminado = output<string>();

  // Signals para estado interno
  readonly filtrosActivos = signal<FiltroPersonalizado[]>([]);
  readonly marcasSeleccionadas = signal<string[]>([]);
  readonly rangoFecha = signal<RangoFecha>({});
  readonly ordenamientoActivo = signal<string>('relevancia');
  readonly caracteristicasEspeciales = signal<{ [key: string]: boolean }>({
    solo_ofertas: false,
    envio_gratis: false,
    stock_disponible: false,
    nuevo_ingreso: false,
    mejor_valorado: false,
    mas_vendido: false,
  });

  // Filtros guardados
  readonly filtrosGuardados = signal<FiltroGuardado[]>([
    {
      id: '1',
      nombre: 'Celulares en Oferta',
      descripcion: 'Smartphones con descuento y buena calificación',
      filtros: { categorias: ['celulares'], descuento: true, rating: 4 },
      fecha_creacion: new Date('2024-01-15'),
      es_favorito: true,
      veces_usado: 23,
    },
    {
      id: '2',
      nombre: 'Laptops Gaming',
      descripcion: 'Equipos gaming de alta gama',
      filtros: {
        categorias: ['laptops'],
        precio_min: 3000,
        atributos: { tipo: ['gaming'] },
      },
      fecha_creacion: new Date('2024-02-01'),
      es_favorito: false,
      veces_usado: 8,
    },
    {
      id: '3',
      nombre: 'Apple Productos',
      descripcion: 'Todos los productos de Apple disponibles',
      filtros: { marca: 'Apple', stock_disponible: true },
      fecha_creacion: new Date('2024-02-10'),
      es_favorito: true,
      veces_usado: 15,
    },
  ]);

  // Estado del componente
  readonly seccionExpanded = signal<{ [key: string]: boolean }>({
    marcas: true,
    fecha: false,
    caracteristicas: false,
    ordenamiento: false,
    guardados: false,
  });
  readonly busquedaMarca = signal<string>('');
  readonly mostrandoFormularioGuardar = signal<boolean>(false);
  readonly nombreFiltroGuardar = signal<string>('');
  readonly descripcionFiltroGuardar = signal<string>('');

  // Datos de ejemplo para marcas
  readonly marcasEjemplo = signal<Marca[]>([
    {
      id: 'apple',
      nombre: 'Apple',
      productos_count: 15,
      logo_url: 'assets/marcas/apple.png',
    },
    {
      id: 'samsung',
      nombre: 'Samsung',
      productos_count: 23,
      logo_url: 'assets/marcas/samsung.png',
    },
    {
      id: 'xiaomi',
      nombre: 'Xiaomi',
      productos_count: 18,
      logo_url: 'assets/marcas/xiaomi.png',
    },
    {
      id: 'sony',
      nombre: 'Sony',
      productos_count: 12,
      logo_url: 'assets/marcas/sony.png',
    },
    {
      id: 'asus',
      nombre: 'ASUS',
      productos_count: 8,
      logo_url: 'assets/marcas/asus.png',
    },
    {
      id: 'hp',
      nombre: 'HP',
      productos_count: 14,
      logo_url: 'assets/marcas/hp.png',
    },
    {
      id: 'lenovo',
      nombre: 'Lenovo',
      productos_count: 10,
      logo_url: 'assets/marcas/lenovo.png',
    },
    {
      id: 'huawei',
      nombre: 'Huawei',
      productos_count: 6,
      logo_url: 'assets/marcas/huawei.png',
    },
  ]);

  // Computed signals
  readonly marcasFiltradas = computed(() => {
    const marcas =
      this.marcasDisponibles().length > 0
        ? this.marcasDisponibles()
        : this.marcasEjemplo();
    const busqueda = this.busquedaMarca().toLowerCase().trim();

    if (!busqueda) return marcas;

    return marcas.filter((marca) =>
      marca.nombre.toLowerCase().includes(busqueda)
    );
  });

  readonly tieneFiltrosActivos = computed(() => {
    return (
      this.marcasSeleccionadas().length > 0 ||
      Object.keys(this.rangoFecha()).length > 0 ||
      Object.values(this.caracteristicasEspeciales()).some((val) => val) ||
      this.ordenamientoActivo() !== 'relevancia'
    );
  });

  readonly contadorFiltrosActivos = computed(() => {
    let contador = 0;
    if (this.marcasSeleccionadas().length > 0) contador++;
    if (Object.keys(this.rangoFecha()).length > 0) contador++;
    contador += Object.values(this.caracteristicasEspeciales()).filter(
      (val) => val
    ).length;
    if (this.ordenamientoActivo() !== 'relevancia') contador++;
    return contador;
  });

  readonly filtrosGuardadosFavoritos = computed(() => {
    return this.filtrosGuardados().filter((filtro) => filtro.es_favorito);
  });

  readonly tieneCaracteristicasActivas = computed(() => {
    return Object.values(this.caracteristicasEspeciales()).some((val) => val);
  });

  readonly tieneRangoFecha = computed(() => {
    return Object.keys(this.rangoFecha()).length > 0;
  });

  readonly opciodesOrdenamiento = signal([
    { valor: 'relevancia', label: 'Más Relevantes', icono: '🎯' },
    { valor: 'precio_asc', label: 'Precio: Menor a Mayor', icono: '💰' },
    { valor: 'precio_desc', label: 'Precio: Mayor a Menor', icono: '💎' },
    { valor: 'nombre_asc', label: 'Nombre A-Z', icono: '🔤' },
    { valor: 'nombre_desc', label: 'Nombre Z-A', icono: '🔡' },
    { valor: 'mas_vendidos', label: 'Más Vendidos', icono: '🔥' },
    { valor: 'mejor_valorados', label: 'Mejor Valorados', icono: '⭐' },
    { valor: 'mas_nuevos', label: 'Más Nuevos', icono: '🆕' },
  ]);

  ngOnInit(): void {
    // Sincronizar con inputs externos
    const filtros = this.filtrosPersonalizados();
    this.cargarFiltrosIniciales(filtros);
  }

  /**
   * Carga filtros iniciales desde inputs
   */
  private cargarFiltrosIniciales(filtros: FiltroPersonalizado[]): void {
    filtros.forEach((filtro) => {
      switch (filtro.tipo) {
        case 'marca':
          if (Array.isArray(filtro.valor)) {
            this.marcasSeleccionadas.set(filtro.valor);
          }
          break;
        case 'fecha':
          this.rangoFecha.set(filtro.valor);
          break;
        case 'caracteristica':
          this.caracteristicasEspeciales.update((current) => ({
            ...current,
            ...filtro.valor,
          }));
          break;
        case 'ordenamiento':
          this.ordenamientoActivo.set(filtro.valor);
          break;
      }
    });
  }

  /**
   * Toggle de expansión de secciones
   */
  toggleSeccion(seccion: string): void {
    this.seccionExpanded.update((current) => ({
      ...current,
      [seccion]: !current[seccion],
    }));
  }

  /**
   * Verifica si una sección está expandida
   */
  isSeccionExpanded(seccion: string): boolean {
    return this.seccionExpanded()[seccion] || false;
  }

  /**
   * Toggle de selección de marca
   */
  toggleMarca(marcaId: string): void {
    const seleccionadas = this.marcasSeleccionadas();
    const nuevasSeleccionadas = seleccionadas.includes(marcaId)
      ? seleccionadas.filter((id) => id !== marcaId)
      : [...seleccionadas, marcaId];

    this.marcasSeleccionadas.set(nuevasSeleccionadas);
    this.emitirCambios();
  }

  /**
   * Verifica si una marca está seleccionada
   */
  isMarcaSeleccionada(marcaId: string): boolean {
    return this.marcasSeleccionadas().includes(marcaId);
  }

  /**
   * Maneja el cambio de búsqueda de marcas
   */
  onBusquedaMarcaChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.busquedaMarca.set(target.value);
  }

  /**
   * Toggle de características especiales
   */
  toggleCaracteristica(caracteristica: string): void {
    this.caracteristicasEspeciales.update((current) => ({
      ...current,
      [caracteristica]: !current[caracteristica],
    }));
    this.emitirCambios();
  }

  /**
   * Cambia el ordenamiento activo
   */
  cambiarOrdenamiento(ordenamiento: string): void {
    this.ordenamientoActivo.set(ordenamiento);
    this.emitirCambios();
  }

  /**
   * Establece un período predefinido para fechas
   */
  establecerPeriodoPredefinido(
    periodo: RangoFecha['periodo_predefinido']
  ): void {
    const ahora = new Date();
    let desde: Date;

    switch (periodo) {
      case 'ultima_semana':
        desde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'ultimo_mes':
        desde = new Date(
          ahora.getFullYear(),
          ahora.getMonth() - 1,
          ahora.getDate()
        );
        break;
      case 'ultimos_3_meses':
        desde = new Date(
          ahora.getFullYear(),
          ahora.getMonth() - 3,
          ahora.getDate()
        );
        break;
      case 'ultimo_año':
        desde = new Date(
          ahora.getFullYear() - 1,
          ahora.getMonth(),
          ahora.getDate()
        );
        break;
      default:
        desde = ahora;
    }

    this.rangoFecha.set({
      desde,
      hasta: ahora,
      periodo_predefinido: periodo,
    });
    this.emitirCambios();
  }

  /**
   * Aplica un filtro guardado
   */
  aplicarFiltroGuardado(filtro: FiltroGuardado): void {
    // Incrementar contador de uso
    this.filtrosGuardados.update((filtros) =>
      filtros.map((f) =>
        f.id === filtro.id ? { ...f, veces_usado: f.veces_usado + 1 } : f
      )
    );

    // Aplicar el filtro
    if (filtro.filtros.marca) {
      this.marcasSeleccionadas.set(
        Array.isArray(filtro.filtros.marca)
          ? filtro.filtros.marca
          : [filtro.filtros.marca]
      );
    }

    if (filtro.filtros.solo_ofertas) {
      this.caracteristicasEspeciales.update((current) => ({
        ...current,
        solo_ofertas: true,
      }));
    }

    this.emitirCambios();
  }

  /**
   * Toggle favorito de filtro guardado
   */
  toggleFavoritoFiltro(filtroId: string): void {
    this.filtrosGuardados.update((filtros) =>
      filtros.map((f) =>
        f.id === filtroId ? { ...f, es_favorito: !f.es_favorito } : f
      )
    );
  }

  /**
   * Elimina un filtro guardado
   */
  eliminarFiltroGuardado(filtroId: string): void {
    this.filtrosGuardados.update((filtros) =>
      filtros.filter((f) => f.id !== filtroId)
    );
    this.filtroEliminado.emit(filtroId);
  }

  /**
   * Muestra el formulario para guardar filtro
   */
  mostrarFormularioGuardar(): void {
    this.mostrandoFormularioGuardar.set(true);
    this.nombreFiltroGuardar.set('');
    this.descripcionFiltroGuardar.set('');
  }

  /**
   * Cancela el guardado del filtro
   */
  cancelarGuardado(): void {
    this.mostrandoFormularioGuardar.set(false);
  }

  /**
   * Guarda el filtro actual
   */
  guardarFiltroActual(): void {
    const nombre = this.nombreFiltroGuardar().trim();
    if (!nombre) return;

    const nuevoFiltro: FiltroGuardado = {
      id: Date.now().toString(),
      nombre,
      descripcion: this.descripcionFiltroGuardar().trim(),
      filtros: this.obtenerFiltrosActuales(),
      fecha_creacion: new Date(),
      es_favorito: false,
      veces_usado: 0,
    };

    this.filtrosGuardados.update((filtros) => [nuevoFiltro, ...filtros]);
    this.filtroGuardado.emit(nuevoFiltro);
    this.mostrandoFormularioGuardar.set(false);
  }

  /**
   * Obtiene los filtros actuales para guardar
   */
  private obtenerFiltrosActuales(): any {
    return {
      marcas: this.marcasSeleccionadas(),
      rangoFecha: this.rangoFecha(),
      caracteristicas: this.caracteristicasEspeciales(),
      ordenamiento: this.ordenamientoActivo(),
    };
  }

  /**
   * Limpia todos los filtros personalizados
   */
  limpiarTodosFiltros(): void {
    this.marcasSeleccionadas.set([]);
    this.rangoFecha.set({});
    this.caracteristicasEspeciales.set({
      solo_ofertas: false,
      envio_gratis: false,
      stock_disponible: false,
      nuevo_ingreso: false,
      mejor_valorado: false,
      mas_vendido: false,
    });
    this.ordenamientoActivo.set('relevancia');
    this.emitirCambios();
  }

  /**
   * Limpia filtros de una sección específica
   */
  limpiarSeccion(seccion: string): void {
    switch (seccion) {
      case 'marcas':
        this.marcasSeleccionadas.set([]);
        break;
      case 'fecha':
        this.rangoFecha.set({});
        break;
      case 'caracteristicas':
        this.caracteristicasEspeciales.set({
          solo_ofertas: false,
          envio_gratis: false,
          stock_disponible: false,
          nuevo_ingreso: false,
          mejor_valorado: false,
          mas_vendido: false,
        });
        break;
      case 'ordenamiento':
        this.ordenamientoActivo.set('relevancia');
        break;
    }
    this.emitirCambios();
  }

  /**
   * Formatear fecha para display
   */
  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Emite los cambios de filtros
   */
  private emitirCambios(): void {
    const filtros: FiltroPersonalizado[] = [];

    if (this.marcasSeleccionadas().length > 0) {
      filtros.push({
        id: 'marcas',
        nombre: 'Marcas',
        tipo: 'marca',
        valor: this.marcasSeleccionadas(),
        activo: true,
      });
    }

    if (Object.keys(this.rangoFecha()).length > 0) {
      filtros.push({
        id: 'fecha',
        nombre: 'Rango de Fecha',
        tipo: 'fecha',
        valor: this.rangoFecha(),
        activo: true,
      });
    }

    const caracteristicasActivas = Object.entries(
      this.caracteristicasEspeciales()
    ).filter(([_, activo]) => activo);

    if (caracteristicasActivas.length > 0) {
      filtros.push({
        id: 'caracteristicas',
        nombre: 'Características',
        tipo: 'caracteristica',
        valor: Object.fromEntries(caracteristicasActivas),
        activo: true,
      });
    }

    if (this.ordenamientoActivo() !== 'relevancia') {
      filtros.push({
        id: 'ordenamiento',
        nombre: 'Ordenamiento',
        tipo: 'ordenamiento',
        valor: this.ordenamientoActivo(),
        activo: true,
      });
    }

    this.filtrosActivos.set(filtros);
    this.filtrosChanged.emit(filtros);
  }
}
