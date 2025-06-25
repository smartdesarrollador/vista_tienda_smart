import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import {
  FiltroAplicado,
  CategoriaFiltro,
  MarcaFiltro,
} from '../../../../../core/models/busqueda.interface';

// Tipo local para filtros disponibles
interface FiltroDisponible {
  campo: string;
  label: string;
  opciones?: { valor: string; etiqueta: string; conteo: number }[];
}

interface RangoNumerico {
  min?: number;
  max?: number;
}

@Component({
  selector: 'app-filtros-laterales',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './filtros-laterales.component.html',
  styleUrls: ['./filtros-laterales.component.css'],
})
export class FiltrosLateralesComponent implements OnInit {
  @Input() filtrosDisponibles: FiltroDisponible[] = [];
  @Input() filtrosActivos: FiltroAplicado[] = [];

  @Output() aplicarFiltro = new EventEmitter<FiltroAplicado>();
  @Output() removerFiltro = new EventEmitter<string>();
  @Output() limpiarFiltros = new EventEmitter<void>();

  // Signals para estado del componente
  readonly seccionesExpandidas = signal<Set<string>>(
    new Set(['precio', 'categoria'])
  );
  readonly mostrarMasMarcas = signal<boolean>(false);
  readonly mostrarMasCategorias = signal<boolean>(false);

  // Formulario para filtros de rango
  rangoPrecioForm: FormGroup;

  // Computed properties
  readonly categoriasVisibles = computed(() => {
    const filtroCategoria = this.filtrosDisponibles.find(
      (f) => f.campo === 'categoria'
    );
    if (!filtroCategoria || !filtroCategoria.opciones) return [];

    const limite = this.mostrarMasCategorias()
      ? filtroCategoria.opciones.length
      : 5;
    return filtroCategoria.opciones.slice(0, limite);
  });

  readonly marcasVisibles = computed(() => {
    const filtroMarca = this.filtrosDisponibles.find(
      (f) => f.campo === 'marca'
    );
    if (!filtroMarca || !filtroMarca.opciones) return [];

    const limite = this.mostrarMasMarcas() ? filtroMarca.opciones.length : 5;
    return filtroMarca.opciones.slice(0, limite);
  });

  readonly tieneCategoriasExtras = computed(() => {
    const filtroCategoria = this.filtrosDisponibles.find(
      (f) => f.campo === 'categoria'
    );
    return filtroCategoria?.opciones && filtroCategoria.opciones.length > 5;
  });

  readonly tieneMarcasExtras = computed(() => {
    const filtroMarca = this.filtrosDisponibles.find(
      (f) => f.campo === 'marca'
    );
    return filtroMarca?.opciones && filtroMarca.opciones.length > 5;
  });

  constructor(private fb: FormBuilder) {
    this.rangoPrecioForm = this.fb.group({
      min: [null],
      max: [null],
    });
  }

  ngOnInit(): void {
    this.inicializarFiltros();
  }

  /**
   * Inicializa los filtros con valores activos
   */
  private inicializarFiltros(): void {
    this.filtrosActivos.forEach((filtro) => {
      if (
        filtro.campo === 'precio' &&
        filtro.valor &&
        typeof filtro.valor === 'object'
      ) {
        const rango = filtro.valor as RangoNumerico;
        this.rangoPrecioForm.patchValue({
          min: rango.min,
          max: rango.max,
        });
      }
    });
  }

  /**
   * Verifica si una sección está expandida
   */
  estaExpandida(seccion: string): boolean {
    return this.seccionesExpandidas().has(seccion);
  }

  /**
   * Alterna el estado de expansión de una sección
   */
  toggleSeccion(seccion: string): void {
    this.seccionesExpandidas.update((secciones) => {
      const nuevasSecciones = new Set(secciones);
      if (nuevasSecciones.has(seccion)) {
        nuevasSecciones.delete(seccion);
      } else {
        nuevasSecciones.add(seccion);
      }
      return nuevasSecciones;
    });
  }

  /**
   * Verifica si un filtro está activo
   */
  estaActivo(campo: string, valor?: any): boolean {
    if (!valor) {
      return this.filtrosActivos.some((f) => f.campo === campo);
    }
    return this.filtrosActivos.some(
      (f) => f.campo === campo && f.valor === valor
    );
  }

  /**
   * Obtiene el conteo de productos para una opción
   */
  getConteoOpcion(campo: string, valor: string): number {
    const filtro = this.filtrosDisponibles.find((f) => f.campo === campo);
    if (!filtro?.opciones) return 0;

    const opcion = filtro.opciones.find((o) => o.valor === valor);
    return opcion?.conteo || 0;
  }

  /**
   * Maneja la selección de un filtro de categoría
   */
  onSeleccionarCategoria(categoriaId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      const categoria = this.categoriasVisibles().find(
        (c) => c.valor === categoriaId
      );
      if (categoria) {
        this.aplicarFiltro.emit({
          tipo: 'categoria',
          campo: 'categoria',
          valor: categoriaId,
          label: categoria.etiqueta,
          activo: true,
        });
      }
    } else {
      this.removerFiltro.emit('categoria');
    }
  }

  /**
   * Maneja la selección de un filtro de marca
   */
  onSeleccionarMarca(marcaId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      const marca = this.marcasVisibles().find((m) => m.valor === marcaId);
      if (marca) {
        this.aplicarFiltro.emit({
          tipo: 'marca',
          campo: 'marca',
          valor: marcaId,
          label: marca.etiqueta,
          activo: true,
        });
      }
    } else {
      this.removerFiltro.emit('marca');
    }
  }

  /**
   * Aplica el filtro de rango de precio
   */
  aplicarRangoPrecio(): void {
    const formValue = this.rangoPrecioForm.value;

    if (formValue.min !== null || formValue.max !== null) {
      const min = formValue.min ? parseFloat(formValue.min) : undefined;
      const max = formValue.max ? parseFloat(formValue.max) : undefined;

      // Validar que min sea menor que max
      if (min && max && min >= max) {
        return;
      }

      const rango: RangoNumerico = { min, max };
      const label = this.generarLabelPrecio(min, max);

      this.aplicarFiltro.emit({
        tipo: 'precio',
        campo: 'precio',
        valor: rango,
        label,
        activo: true,
      });
    }
  }

  /**
   * Limpia el filtro de precio
   */
  limpiarPrecio(): void {
    this.rangoPrecioForm.reset();
    this.removerFiltro.emit('precio');
  }

  /**
   * Genera el label para el filtro de precio
   */
  private generarLabelPrecio(min?: number, max?: number): string {
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    };

    if (min && max) {
      return `${formatPrice(min)} - ${formatPrice(max)}`;
    } else if (min) {
      return `Desde ${formatPrice(min)}`;
    } else if (max) {
      return `Hasta ${formatPrice(max)}`;
    }
    return 'Rango de precio';
  }

  /**
   * Maneja filtros de atributos adicionales
   */
  onSeleccionarAtributo(
    campo: string,
    valor: string,
    label: string,
    event: Event
  ): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      this.aplicarFiltro.emit({
        tipo: campo as any,
        campo,
        valor,
        label,
        activo: true,
      });
    } else {
      this.removerFiltro.emit(campo);
    }
  }

  /**
   * Obtiene los filtros de atributos (no categoría, marca o precio)
   */
  get filtrosAtributos(): FiltroDisponible[] {
    return this.filtrosDisponibles.filter(
      (f) => !['categoria', 'marca', 'precio'].includes(f.campo)
    );
  }

  /**
   * Alterna mostrar más categorías
   */
  toggleMasCategorias(): void {
    this.mostrarMasCategorias.update((valor) => !valor);
  }

  /**
   * Alterna mostrar más marcas
   */
  toggleMasMarcas(): void {
    this.mostrarMasMarcas.update((valor) => !valor);
  }

  /**
   * Limpia todos los filtros
   */
  onLimpiarTodos(): void {
    this.rangoPrecioForm.reset();
    this.limpiarFiltros.emit();
  }

  /**
   * Obtiene el número total de filtros activos
   */
  get totalFiltrosActivos(): number {
    return this.filtrosActivos.length;
  }
}
