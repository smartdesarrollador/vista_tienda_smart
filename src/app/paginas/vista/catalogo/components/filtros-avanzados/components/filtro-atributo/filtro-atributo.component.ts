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
 * Interface para un valor de atributo
 */
export interface ValorAtributo {
  id: string;
  valor: string;
  productos_count: number;
  color_hex?: string; // Para atributos de color
}

/**
 * Interface para un atributo completo
 */
export interface Atributo {
  id: string;
  nombre: string;
  tipo: 'texto' | 'color' | 'numero' | 'booleano';
  valores: ValorAtributo[];
  es_filtrable: boolean;
}

/**
 * Interface para atributos seleccionados
 */
export interface AtributoSeleccionado {
  atributo_id: string;
  valores_seleccionados: string[];
}

/**
 * Componente para filtrar productos por atributos dinámicos
 * Maneja múltiples tipos de atributos (color, talla, material, etc.)
 */
@Component({
  selector: 'app-filtro-atributo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filtro-atributo.component.html',
  styleUrl: './filtro-atributo.component.css',
})
export class FiltroAtributoComponent {
  // Inputs y outputs
  readonly atributosSeleccionados = input<{ [key: string]: string[] }>({});
  readonly atributosDisponibles = input<Atributo[]>([]);
  readonly loading = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  readonly atributosChanged = output<{ [key: string]: string[] }>();
  readonly atributoSeleccionado = output<AtributoSeleccionado>();

  // Signals para estado interno
  readonly atributosSeleccionadosLocal = signal<{ [key: string]: string[] }>(
    {}
  );
  readonly atributosExpanded = signal<Set<string>>(new Set());
  readonly busquedaAtributos = signal<{ [key: string]: string }>({});
  readonly mostrarSoloConProductos = signal<boolean>(true);

  // Computed signals
  readonly tieneAtributosSeleccionados = computed(() => {
    const seleccionados = this.atributosSeleccionadosLocal();
    return Object.values(seleccionados).some((valores) => valores.length > 0);
  });

  readonly contadorAtributosSeleccionados = computed(() => {
    const seleccionados = this.atributosSeleccionadosLocal();
    return Object.values(seleccionados).reduce(
      (count, valores) => count + valores.length,
      0
    );
  });

  readonly atributosFiltrados = computed(() => {
    const atributos = this.atributosDisponibles();
    const soloConProductos = this.mostrarSoloConProductos();
    const busquedas = this.busquedaAtributos();

    return atributos
      .filter((atributo) => atributo.es_filtrable)
      .map((atributo) => {
        let valoresFiltrados = atributo.valores;

        // Filtrar por productos disponibles
        if (soloConProductos) {
          valoresFiltrados = valoresFiltrados.filter(
            (valor) => valor.productos_count > 0
          );
        }

        // Filtrar por búsqueda
        const busqueda = busquedas[atributo.id];
        if (busqueda && busqueda.trim()) {
          const termino = busqueda.toLowerCase();
          valoresFiltrados = valoresFiltrados.filter((valor) =>
            valor.valor.toLowerCase().includes(termino)
          );
        }

        return {
          ...atributo,
          valores: valoresFiltrados,
        };
      })
      .filter((atributo) => atributo.valores.length > 0);
  });

  ngOnInit(): void {
    // Sincronizar con inputs externos
    const seleccionados = this.atributosSeleccionados();
    this.atributosSeleccionadosLocal.set(seleccionados);
  }

  /**
   * Toggle de expansión de un atributo
   */
  toggleExpansion(atributoId: string): void {
    const expanded = this.atributosExpanded();
    const newExpanded = new Set(expanded);

    if (newExpanded.has(atributoId)) {
      newExpanded.delete(atributoId);
    } else {
      newExpanded.add(atributoId);
    }

    this.atributosExpanded.set(newExpanded);
  }

  /**
   * Verifica si un atributo está expandido
   */
  isExpanded(atributoId: string): boolean {
    return this.atributosExpanded().has(atributoId);
  }

  /**
   * Toggle de selección de un valor de atributo
   */
  toggleValorAtributo(atributoId: string, valorId: string): void {
    const seleccionados = this.atributosSeleccionadosLocal();
    const nuevosSeleccionados = { ...seleccionados };

    if (!nuevosSeleccionados[atributoId]) {
      nuevosSeleccionados[atributoId] = [];
    }

    const valoresActuales = [...nuevosSeleccionados[atributoId]];
    const index = valoresActuales.indexOf(valorId);

    if (index === -1) {
      valoresActuales.push(valorId);
    } else {
      valoresActuales.splice(index, 1);
    }

    if (valoresActuales.length === 0) {
      delete nuevosSeleccionados[atributoId];
    } else {
      nuevosSeleccionados[atributoId] = valoresActuales;
    }

    this.atributosSeleccionadosLocal.set(nuevosSeleccionados);
    this.emitirCambio();
  }

  /**
   * Verifica si un valor de atributo está seleccionado
   */
  isValorSeleccionado(atributoId: string, valorId: string): boolean {
    const seleccionados = this.atributosSeleccionadosLocal();
    return seleccionados[atributoId]?.includes(valorId) || false;
  }

  /**
   * Limpia las selecciones de un atributo específico
   */
  limpiarAtributo(atributoId: string): void {
    const seleccionados = this.atributosSeleccionadosLocal();
    const nuevosSeleccionados = { ...seleccionados };
    delete nuevosSeleccionados[atributoId];

    this.atributosSeleccionadosLocal.set(nuevosSeleccionados);
    this.emitirCambio();
  }

  /**
   * Limpia todas las selecciones de atributos
   */
  limpiarTodosLosAtributos(): void {
    this.atributosSeleccionadosLocal.set({});
    this.emitirCambio();
  }

  /**
   * Actualiza la búsqueda para un atributo
   */
  onBusquedaChange(atributoId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const busquedas = this.busquedaAtributos();
    const nuevasBusquedas = { ...busquedas };

    if (target.value.trim()) {
      nuevasBusquedas[atributoId] = target.value;
    } else {
      delete nuevasBusquedas[atributoId];
    }

    this.busquedaAtributos.set(nuevasBusquedas);
  }

  /**
   * Toggle para mostrar solo atributos con productos
   */
  toggleMostrarSoloConProductos(): void {
    this.mostrarSoloConProductos.update((current) => !current);
  }

  /**
   * Expandir todos los atributos
   */
  expandirTodos(): void {
    const todosLosIds = this.atributosFiltrados().map((attr) => attr.id);
    this.atributosExpanded.set(new Set(todosLosIds));
  }

  /**
   * Colapsar todos los atributos
   */
  colapsarTodos(): void {
    this.atributosExpanded.set(new Set());
  }

  /**
   * Obtiene el número de valores seleccionados para un atributo
   */
  getContadorSeleccionados(atributoId: string): number {
    const seleccionados = this.atributosSeleccionadosLocal();
    return seleccionados[atributoId]?.length || 0;
  }

  /**
   * Verifica si un atributo tiene algún valor seleccionado
   */
  tieneValoresSeleccionados(atributoId: string): boolean {
    return this.getContadorSeleccionados(atributoId) > 0;
  }

  /**
   * Obtiene el estilo para chips de color
   */
  getColorStyle(valorAtributo: ValorAtributo): any {
    if (valorAtributo.color_hex) {
      return {
        'background-color': valorAtributo.color_hex,
        border:
          valorAtributo.color_hex === '#FFFFFF' ? '1px solid #e5e7eb' : 'none',
      };
    }
    return {};
  }

  /**
   * Verifica si un color es claro (para ajustar el texto)
   */
  isColorClaro(hex: string): boolean {
    if (!hex) return false;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  }

  /**
   * Selecciona todos los valores visibles de un atributo
   */
  seleccionarTodosLosValores(atributo: Atributo): void {
    const seleccionados = this.atributosSeleccionadosLocal();
    const nuevosSeleccionados = { ...seleccionados };

    const valoresIds = atributo.valores.map((valor) => valor.id);
    nuevosSeleccionados[atributo.id] = valoresIds;

    this.atributosSeleccionadosLocal.set(nuevosSeleccionados);
    this.emitirCambio();
  }

  /**
   * Filtra valores populares (más productos)
   */
  getValoresPopulares(
    valores: ValorAtributo[],
    limite: number = 5
  ): ValorAtributo[] {
    return [...valores]
      .sort((a, b) => b.productos_count - a.productos_count)
      .slice(0, limite);
  }

  /**
   * Emite el cambio de atributos seleccionados
   */
  private emitirCambio(): void {
    const seleccionados = this.atributosSeleccionadosLocal();
    this.atributosChanged.emit(seleccionados);
  }
}
