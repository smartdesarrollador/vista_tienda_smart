import {
  Component,
  input,
  output,
  computed,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CarritoService } from '../../../../../core/services/carrito.service';
import { AuthService } from '../../../../../core/auth/services/auth.service';
import { ItemCarrito } from '../../../../../core/models/carrito.interface';
import { environment } from '../../../../../../environments/environment';

interface ItemGuardado {
  id: string;
  producto_id: number;
  variacion_id?: number;
  nombre: string;
  slug: string;
  imagen: string;
  precio: number;
  precio_oferta?: number;
  stock_disponible: number;
  categoria: string;
  marca?: string;
  calificacion: number;
  descuento_porcentaje?: number;

  // Información de variaciones
  variacion?: {
    color?: {
      nombre: string;
      hex: string;
    };
    talla?: string;
    [key: string]: any;
  };

  // Metadatos
  guardado_en: Date;
  visto_por_ultima_vez?: Date;
  precio_cuando_se_guardo: number;
  notificar_cambio_precio: boolean;
  disponible: boolean;
}

interface ConfiguracionListaDeseos {
  maximo_items: number;
  notificaciones_precio: boolean;
  notificaciones_stock: boolean;
  auto_remover_sin_stock: boolean;
}

@Component({
  selector: 'app-items-guardados',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './items-guardados.component.html',
  styleUrl: './items-guardados.component.css',
})
export class ItemsGuardadosComponent implements OnInit {
  // Servicios inyectados
  private readonly carritoService = inject(CarritoService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Inputs
  readonly compacto = input<boolean>(false);
  readonly mostrarAcciones = input<boolean>(true);
  readonly maxItemsVisibles = input<number>(6);

  // Outputs
  readonly itemMovidoAlCarrito = output<ItemGuardado>();
  readonly itemEliminado = output<ItemGuardado>();

  // Signals para estado local
  readonly itemsGuardados = signal<ItemGuardado[]>([]);
  readonly cargando = signal<boolean>(false);
  readonly error = signal<string>('');
  readonly configuracion = signal<ConfiguracionListaDeseos>({
    maximo_items: 50,
    notificaciones_precio: true,
    notificaciones_stock: true,
    auto_remover_sin_stock: false,
  });
  readonly mostrarTodos = signal<boolean>(false);
  readonly categoriaFiltro = signal<string>('');
  readonly ordenamiento = signal<
    'fecha' | 'precio' | 'nombre' | 'disponibilidad'
  >('fecha');

  // Computed signals
  readonly esUsuarioLogueado = computed(() =>
    this.authService.isAuthenticated()
  );
  readonly itemsCarrito = this.carritoService.items;

  readonly itemsVisibles = computed(() => {
    let items = this.itemsGuardados();

    // Filtrar por categoría si está seleccionada
    if (this.categoriaFiltro()) {
      items = items.filter((item) => item.categoria === this.categoriaFiltro());
    }

    // Ordenar según selección
    items = this.ordenarItems(items);

    // Limitar cantidad si no está expandido
    if (!this.mostrarTodos() && !this.compacto()) {
      items = items.slice(0, this.maxItemsVisibles());
    } else if (this.compacto()) {
      items = items.slice(0, 3);
    }

    return items;
  });

  readonly categoriesDisponibles = computed(() => {
    const categorias = [
      ...new Set(this.itemsGuardados().map((item) => item.categoria)),
    ];
    return categorias.sort();
  });

  readonly itemsConCambioPrecio = computed(() =>
    this.itemsGuardados().filter(
      (item) => item.precio !== item.precio_cuando_se_guardo
    )
  );

  readonly itemsSinStock = computed(() =>
    this.itemsGuardados().filter((item) => !item.disponible)
  );

  readonly estadisticas = computed(() => ({
    total: this.itemsGuardados().length,
    disponibles: this.itemsGuardados().filter((item) => item.disponible).length,
    con_descuento: this.itemsGuardados().filter((item) => item.precio_oferta)
      .length,
    cambios_precio: this.itemsConCambioPrecio().length,
    valor_total: this.itemsGuardados().reduce(
      (total, item) => total + (item.precio_oferta || item.precio),
      0
    ),
  }));

  readonly estaVacio = computed(() => this.itemsGuardados().length === 0);

  readonly hayMasParaMostrar = computed(
    () =>
      this.itemsGuardados().length > this.maxItemsVisibles() &&
      !this.mostrarTodos()
  );

  ngOnInit(): void {
    if (this.esUsuarioLogueado()) {
      this.cargarItemsGuardados();
    }
  }

  /**
   * Construir URL completa de la imagen
   */
  construirUrlImagen(imagen: string): string {
    if (!imagen) {
      return environment.urlDominioApi + '/assets/productos/default.jpg';
    }

    // Si ya es una URL completa, retornarla tal como está
    if (imagen.startsWith('http')) {
      return imagen;
    }

    // Si es una ruta relativa, construir la URL completa
    return environment.urlDominioApi + '/' + imagen;
  }

  /**
   * Manejar error de imagen
   */
  onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = this.construirUrlImagen('');
    }
  }

  /**
   * Cargar items guardados desde el servidor
   */
  private cargarItemsGuardados(): void {
    this.cargando.set(true);
    this.error.set('');

    // Simulación de datos - en producción vendría de un servicio
    setTimeout(() => {
      const itemsSimulados: ItemGuardado[] = [
        {
          id: '1',
          producto_id: 101,
          nombre: 'Smartphone Samsung Galaxy S24',
          slug: 'smartphone-samsung-galaxy-s24',
          imagen: '/assets/productos/samsung-s24.jpg',
          precio: 2899,
          precio_oferta: 2599,
          stock_disponible: 15,
          categoria: 'Electrónicos',
          marca: 'Samsung',
          calificacion: 4.8,
          descuento_porcentaje: 10,
          guardado_en: new Date('2024-01-15'),
          precio_cuando_se_guardo: 2899,
          notificar_cambio_precio: true,
          disponible: true,
        },
        {
          id: '2',
          producto_id: 102,
          nombre: 'Zapatillas Nike Air Max 270',
          slug: 'zapatillas-nike-air-max-270',
          imagen: '/assets/productos/nike-air-max.jpg',
          precio: 459,
          stock_disponible: 0,
          categoria: 'Calzado',
          marca: 'Nike',
          calificacion: 4.6,
          variacion: {
            color: { nombre: 'Negro', hex: '#000000' },
            talla: '42',
          },
          guardado_en: new Date('2024-01-20'),
          precio_cuando_se_guardo: 429,
          notificar_cambio_precio: true,
          disponible: false,
        },
        {
          id: '3',
          producto_id: 103,
          nombre: 'Laptop HP Pavilion 15',
          slug: 'laptop-hp-pavilion-15',
          imagen: '/assets/productos/hp-pavilion.jpg',
          precio: 2299,
          precio_oferta: 1999,
          stock_disponible: 8,
          categoria: 'Computadoras',
          marca: 'HP',
          calificacion: 4.4,
          descuento_porcentaje: 13,
          guardado_en: new Date('2024-01-25'),
          precio_cuando_se_guardo: 2299,
          notificar_cambio_precio: true,
          disponible: true,
        },
      ];

      this.itemsGuardados.set(itemsSimulados);
      this.cargando.set(false);
    }, 800);
  }

  /**
   * Ordenar items según criterio seleccionado
   */
  private ordenarItems(items: ItemGuardado[]): ItemGuardado[] {
    const ordenamiento = this.ordenamiento();

    return [...items].sort((a, b) => {
      switch (ordenamiento) {
        case 'fecha':
          return (
            new Date(b.guardado_en).getTime() -
            new Date(a.guardado_en).getTime()
          );
        case 'precio':
          const precioA = a.precio_oferta || a.precio;
          const precioB = b.precio_oferta || b.precio;
          return precioA - precioB;
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'disponibilidad':
          if (a.disponible && !b.disponible) return -1;
          if (!a.disponible && b.disponible) return 1;
          return 0;
        default:
          return 0;
      }
    });
  }

  /**
   * Mover item al carrito
   */
  moverAlCarrito(item: ItemGuardado): void {
    if (!item.disponible) return;

    const itemCarrito: Partial<ItemCarrito> = {
      id: `carrito_${item.id}`,
      producto_id: item.producto_id,
      variacion_id: item.variacion_id,
      nombre: item.nombre,
      slug: item.slug,
      imagen: item.imagen,
      precio: item.precio,
      precio_oferta: item.precio_oferta,
      cantidad: 1,
      stock_disponible: item.stock_disponible,
      peso: 0.5, // Peso por defecto
      variacion: item.variacion,
      subtotal: item.precio_oferta || item.precio,
      agregado_en: new Date(),
      modificado_en: new Date(),
    };

    this.carritoService
      .agregarItem({
        producto_id: item.producto_id,
        variacion_id: item.variacion_id,
        cantidad: 1,
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Remover de guardados
            this.removerItemGuardado(item.id);
            this.itemMovidoAlCarrito.emit(item);
          }
        },
        error: (error) => {
          console.error('Error al mover item al carrito:', error);
          this.error.set('No se pudo agregar el producto al carrito');
        },
      });
  }

  /**
   * Eliminar item de guardados
   */
  eliminarItem(item: ItemGuardado): void {
    if (
      confirm(
        `¿Estás seguro de eliminar "${item.nombre}" de tu lista de deseos?`
      )
    ) {
      this.removerItemGuardado(item.id);
      this.itemEliminado.emit(item);
    }
  }

  /**
   * Remover item de la lista local
   */
  private removerItemGuardado(itemId: string): void {
    this.itemsGuardados.update((items) =>
      items.filter((item) => item.id !== itemId)
    );
  }

  /**
   * Verificar si item ya está en el carrito
   */
  estaEnCarrito(item: ItemGuardado): boolean {
    return this.itemsCarrito().some(
      (itemCarrito) =>
        itemCarrito.producto_id === item.producto_id &&
        itemCarrito.variacion_id === item.variacion_id
    );
  }

  /**
   * Cambiar filtro de categoría
   */
  cambiarFiltroCategoria(categoria: string): void {
    this.categoriaFiltro.set(categoria);
  }

  /**
   * Cambiar ordenamiento
   */
  cambiarOrdenamiento(
    criterio: 'fecha' | 'precio' | 'nombre' | 'disponibilidad'
  ): void {
    this.ordenamiento.set(criterio);
  }

  /**
   * Toggle mostrar todos los items
   */
  toggleMostrarTodos(): void {
    this.mostrarTodos.update((valor) => !valor);
  }

  /**
   * Ver producto en detalle
   */
  verProducto(slug: string): void {
    this.router.navigate(['/producto', slug]);
  }

  /**
   * Formatear precio
   */
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(precio);
  }

  /**
   * Calcular porcentaje de descuento
   */
  calcularDescuento(precioOriginal: number, precioOferta: number): number {
    return Math.round(((precioOriginal - precioOferta) / precioOriginal) * 100);
  }

  /**
   * Formatear tiempo relativo
   */
  formatearTiempoGuardado(fecha: Date): string {
    const ahora = new Date();
    const diff = ahora.getTime() - fecha.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;
    if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
    return `Hace ${Math.floor(dias / 30)} meses`;
  }

  /**
   * Verificar si hubo cambio de precio
   */
  tuvoCambioPrecio(item: ItemGuardado): 'aumento' | 'descuento' | null {
    const precioActual = item.precio_oferta || item.precio;
    if (precioActual > item.precio_cuando_se_guardo) return 'aumento';
    if (precioActual < item.precio_cuando_se_guardo) return 'descuento';
    return null;
  }

  /**
   * Obtener diferencia de precio
   */
  obtenerDiferenciaPrecio(item: ItemGuardado): number {
    const precioActual = item.precio_oferta || item.precio;
    return Math.abs(precioActual - item.precio_cuando_se_guardo);
  }

  /**
   * Actualizar configuración de notificaciones
   */
  toggleNotificacionPrecio(item: ItemGuardado): void {
    this.itemsGuardados.update((items) =>
      items.map((i) =>
        i.id === item.id
          ? { ...i, notificar_cambio_precio: !i.notificar_cambio_precio }
          : i
      )
    );
  }

  /**
   * Limpiar items sin stock
   */
  limpiarItemsSinStock(): void {
    const itemsSinStock = this.itemsSinStock().length;
    if (
      itemsSinStock > 0 &&
      confirm(`¿Eliminar ${itemsSinStock} productos sin stock de tu lista?`)
    ) {
      this.itemsGuardados.update((items) =>
        items.filter((item) => item.disponible)
      );
    }
  }

  /**
   * Obtener calificación en estrellas
   */
  obtenerEstrellas(calificacion: number): Array<'full' | 'half' | 'empty'> {
    const estrellas: Array<'full' | 'half' | 'empty'> = [];
    const entero = Math.floor(calificacion);
    const decimal = calificacion - entero;

    for (let i = 0; i < 5; i++) {
      if (i < entero) {
        estrellas.push('full');
      } else if (i === entero && decimal >= 0.5) {
        estrellas.push('half');
      } else {
        estrellas.push('empty');
      }
    }

    return estrellas;
  }
}
