import {
  Component,
  inject,
  signal,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Interface para categoría
 */
export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  imagen?: string;
  activo: boolean;
  padre_id?: number;
  productos_count?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface para categoría con estructura jerárquica
 */
export interface CategoriaJerarquica extends Categoria {
  hijos: CategoriaJerarquica[];
  nivel: number;
  productos_count: number;
}

/**
 * Componente para filtrar productos por categorías
 * Permite selección jerárquica de categorías con expansión/colapso
 */
@Component({
  selector: 'app-filtro-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filtro-categoria.component.html',
  styleUrl: './filtro-categoria.component.css',
})
export class FiltroCategoriaComponent {
  // Inputs y outputs
  readonly categoriasSeleccionadas = input<number[]>([]);
  readonly categoriaSeleccionada = output<number[]>();

  // Signals para estado del componente
  readonly categorias = signal<Categoria[]>([]);
  readonly categoriasJerarquicas = signal<CategoriaJerarquica[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly categoriasExpanded = signal<Set<number>>(new Set());
  readonly categoriasSeleccionadasLocal = signal<Set<number>>(new Set());
  readonly mostrarSoloConProductos = signal<boolean>(true);

  // Input para recibir categorías desde el componente padre
  readonly categoriasDisponibles = input<Categoria[]>([]);

  // Datos de ejemplo para categorías (coinciden con los IDs de la BD)
  readonly categoriasEjemplo = signal<Categoria[]>([
    {
      id: 3,
      nombre: 'Tablets',
      slug: 'tablets',
      activo: true,
      productos_count: 10,
    },
    {
      id: 6,
      nombre: 'Smartphones',
      slug: 'smartphones',
      activo: true,
      productos_count: 25,
    },
    {
      id: 7,
      nombre: 'Android',
      slug: 'android',
      activo: true,
      productos_count: 15,
    },
    {
      id: 8,
      nombre: 'Xiaomi',
      slug: 'xiaomi',
      activo: true,
      productos_count: 8,
    },
    {
      id: 9,
      nombre: 'Laptops Gaming',
      slug: 'laptops-gaming',
      activo: true,
      productos_count: 5,
    },
    {
      id: 10,
      nombre: 'MacBooks',
      slug: 'macbooks',
      activo: true,
      productos_count: 7,
    },
  ]);

  // Computed signals
  readonly hasError = computed(() => this.error() !== null);
  readonly isEmpty = computed(() => this.categoriasJerarquicas().length === 0);
  readonly categoriasFiltradas = computed(() => {
    const categorias = this.categoriasJerarquicas();
    const soloConProductos = this.mostrarSoloConProductos();

    if (!soloConProductos) {
      return categorias;
    }

    return categorias.filter(
      (categoria) => categoria.productos_count > 0 || categoria.hijos.length > 0
    );
  });

  ngOnInit(): void {
    console.log('🔧 FILTRO-CATEGORIA: ngOnInit');
    this.cargarCategorias();
    this.sincronizarCategoriasSeleccionadas();
  }

  ngOnChanges(): void {
    console.log('🔧 FILTRO-CATEGORIA: ngOnChanges - Recargando categorías');
    this.cargarCategorias();
  }

  /**
   * Carga las categorías desde el input o datos de ejemplo
   */
  private cargarCategorias(): void {
    console.log('🔧 FILTRO-CATEGORIA: cargarCategorias');
    this.loading.set(true);
    this.error.set(null);

    // Usar categorías del input si están disponibles, sino usar ejemplos
    const categoriasInput = this.categoriasDisponibles();
    const categorias =
      categoriasInput.length > 0 ? categoriasInput : this.categoriasEjemplo();

    console.log('🔧 FILTRO-CATEGORIA: Categorías cargadas', {
      total: categorias.length,
      fuente: categoriasInput.length > 0 ? 'input' : 'ejemplo',
      categorias: categorias.map((c) => ({ id: c.id, nombre: c.nombre })),
    });

    // Simular llamada a API
    setTimeout(() => {
      this.categorias.set(categorias);
      this.construirJerarquia(categorias);
      this.loading.set(false);
    }, 300);
  }

  /**
   * Construye la estructura jerárquica de categorías
   */
  private construirJerarquia(categorias: Categoria[]): void {
    const categoriaMap = new Map<number, CategoriaJerarquica>();
    const categoriasRaiz: CategoriaJerarquica[] = [];

    // Crear mapa de categorías con estructura jerárquica
    categorias.forEach((categoria) => {
      categoriaMap.set(categoria.id, {
        ...categoria,
        hijos: [],
        nivel: 0,
        productos_count: categoria.productos_count || 0,
      });
    });

    // Construir jerarquía
    categorias.forEach((categoria) => {
      const categoriaJerarquica = categoriaMap.get(categoria.id)!;

      if (categoria.padre_id && categoriaMap.has(categoria.padre_id)) {
        const padre = categoriaMap.get(categoria.padre_id)!;
        categoriaJerarquica.nivel = padre.nivel + 1;
        padre.hijos.push(categoriaJerarquica);
      } else {
        categoriasRaiz.push(categoriaJerarquica);
      }
    });

    this.categoriasJerarquicas.set(categoriasRaiz);
  }

  /**
   * Sincroniza las categorías seleccionadas del input
   */
  private sincronizarCategoriasSeleccionadas(): void {
    const seleccionadas = this.categoriasSeleccionadas();
    this.categoriasSeleccionadasLocal.set(new Set(seleccionadas));
  }

  /**
   * Toggle de expansión de categoría
   */
  toggleExpansion(categoriaId: number): void {
    const expanded = this.categoriasExpanded();
    const newExpanded = new Set(expanded);

    if (newExpanded.has(categoriaId)) {
      newExpanded.delete(categoriaId);
    } else {
      newExpanded.add(categoriaId);
    }

    this.categoriasExpanded.set(newExpanded);
  }

  /**
   * Verifica si una categoría está expandida
   */
  isExpanded(categoriaId: number): boolean {
    return this.categoriasExpanded().has(categoriaId);
  }

  /**
   * Toggle de selección de categoría
   */
  toggleSeleccion(categoriaId: number, event: Event): void {
    console.log('🔧 FILTRO-CATEGORIA: toggleSeleccion', { categoriaId });
    event.stopPropagation();

    const seleccionadas = this.categoriasSeleccionadasLocal();
    const newSeleccionadas = new Set(seleccionadas);

    if (newSeleccionadas.has(categoriaId)) {
      newSeleccionadas.delete(categoriaId);
      // Remover también las categorías hijas
      this.removerCategoriasHijas(categoriaId, newSeleccionadas);
    } else {
      newSeleccionadas.add(categoriaId);
      // Agregar también las categorías padre si es necesario
      this.agregarCategoriasPadre(categoriaId, newSeleccionadas);
    }

    this.categoriasSeleccionadasLocal.set(newSeleccionadas);
    const categoriasArray = Array.from(newSeleccionadas);
    console.log('🔧 FILTRO-CATEGORIA: Emitiendo categorías seleccionadas', {
      categorias: categoriasArray,
      total: categoriasArray.length,
    });
    this.categoriaSeleccionada.emit(categoriasArray);
  }

  /**
   * Remueve las categorías hijas cuando se deselecciona una categoría padre
   */
  private removerCategoriasHijas(
    categoriaId: number,
    seleccionadas: Set<number>
  ): void {
    const categoria = this.encontrarCategoria(
      categoriaId,
      this.categoriasJerarquicas()
    );
    if (categoria) {
      categoria.hijos.forEach((hijo) => {
        seleccionadas.delete(hijo.id);
        this.removerCategoriasHijas(hijo.id, seleccionadas);
      });
    }
  }

  /**
   * Agrega las categorías padre cuando se selecciona una categoría hija
   */
  private agregarCategoriasPadre(
    categoriaId: number,
    seleccionadas: Set<number>
  ): void {
    const categorias = this.categorias();
    const categoria = categorias.find((c) => c.id === categoriaId);

    if (categoria && categoria.padre_id) {
      seleccionadas.add(categoria.padre_id);
      this.agregarCategoriasPadre(categoria.padre_id, seleccionadas);
    }
  }

  /**
   * Encuentra una categoría en la estructura jerárquica
   */
  private encontrarCategoria(
    categoriaId: number,
    categorias: CategoriaJerarquica[]
  ): CategoriaJerarquica | null {
    for (const categoria of categorias) {
      if (categoria.id === categoriaId) {
        return categoria;
      }

      const encontrada = this.encontrarCategoria(categoriaId, categoria.hijos);
      if (encontrada) {
        return encontrada;
      }
    }
    return null;
  }

  /**
   * Verifica si una categoría está seleccionada
   */
  isSeleccionada(categoriaId: number): boolean {
    return this.categoriasSeleccionadasLocal().has(categoriaId);
  }

  /**
   * Verifica si una categoría tiene algún hijo seleccionado
   */
  tieneHijoSeleccionado(categoria: CategoriaJerarquica): boolean {
    const seleccionadas = this.categoriasSeleccionadasLocal();
    return categoria.hijos.some(
      (hijo) => seleccionadas.has(hijo.id) || this.tieneHijoSeleccionado(hijo)
    );
  }

  /**
   * Limpiar todas las selecciones
   */
  limpiarSelecciones(): void {
    this.categoriasSeleccionadasLocal.set(new Set());
    this.categoriaSeleccionada.emit([]);
  }

  /**
   * Toggle mostrar solo categorías con productos
   */
  toggleMostrarSoloConProductos(): void {
    this.mostrarSoloConProductos.update((current) => !current);
  }

  /**
   * Expandir/colapsar todas las categorías
   */
  expandirTodas(): void {
    const todasLasCategorias = this.getAllCategoryIds(
      this.categoriasJerarquicas()
    );
    this.categoriasExpanded.set(new Set(todasLasCategorias));
  }

  colapsarTodas(): void {
    this.categoriasExpanded.set(new Set());
  }

  /**
   * Obtiene todos los IDs de categorías
   */
  private getAllCategoryIds(categorias: CategoriaJerarquica[]): number[] {
    const ids: number[] = [];

    categorias.forEach((categoria) => {
      ids.push(categoria.id);
      ids.push(...this.getAllCategoryIds(categoria.hijos));
    });

    return ids;
  }

  /**
   * Recarga las categorías
   */
  recargar(): void {
    this.cargarCategorias();
  }
}
