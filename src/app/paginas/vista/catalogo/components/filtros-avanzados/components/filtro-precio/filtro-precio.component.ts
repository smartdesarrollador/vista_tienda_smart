import {
  Component,
  signal,
  computed,
  input,
  output,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Interface para el rango de precios
 */
export interface RangoPrecio {
  min?: number;
  max?: number;
}

/**
 * Interface para rangos predefinidos
 */
export interface RangoPredefinido {
  label: string;
  min?: number;
  max?: number;
  icono: string;
}

/**
 * Componente para filtrar productos por precio
 * Permite rangos personalizados y rangos predefinidos
 */
@Component({
  selector: 'app-filtro-precio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filtro-precio.component.html',
  styleUrl: './filtro-precio.component.css',
})
export class FiltroPrecioComponent {
  // Inputs y outputs
  readonly precioMin = input<number | undefined>(undefined);
  readonly precioMax = input<number | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly moneda = input<string>('S/.');
  readonly step = input<number>(1);
  readonly placeholder = input<{ min: string; max: string }>({
    min: '0',
    max: 'Máximo',
  });

  readonly precioChanged = output<RangoPrecio>();
  readonly rangoPredefinidoSeleccionado = output<RangoPredefinido>();

  // Signals para estado interno
  readonly precioMinLocal = signal<number | undefined>(undefined);
  readonly precioMaxLocal = signal<number | undefined>(undefined);
  readonly rangoSeleccionado = signal<string | null>(null);
  readonly mostrarRangoPersonalizado = signal<boolean>(false);
  readonly errorValidacion = signal<string | null>(null);

  // Rangos predefinidos
  readonly rangosPredefinidos = signal<RangoPredefinido[]>([
    { label: 'Hasta S/. 25', max: 25, icono: '💸' },
    { label: 'S/. 25 - 50', min: 25, max: 50, icono: '💰' },
    { label: 'S/. 50 - 100', min: 50, max: 100, icono: '💎' },
    { label: 'S/. 100 - 200', min: 100, max: 200, icono: '👑' },
    { label: 'S/. 200 - 500', min: 200, max: 500, icono: '✨' },
    { label: 'Más de S/. 500', min: 500, icono: '🚀' },
  ]);

  // Computed signals
  readonly tieneRangoActivo = computed(() => {
    return (
      this.precioMinLocal() !== undefined || this.precioMaxLocal() !== undefined
    );
  });

  readonly rangoFormateado = computed(() => {
    const min = this.precioMinLocal();
    const max = this.precioMaxLocal();
    const moneda = this.moneda();

    if (!min && !max) return null;
    if (min && !max) return `Desde ${moneda} ${min}`;
    if (!min && max) return `Hasta ${moneda} ${max}`;
    return `${moneda} ${min} - ${moneda} ${max}`;
  });

  readonly esRangoValido = computed(() => {
    const min = this.precioMinLocal();
    const max = this.precioMaxLocal();

    if (!min && !max) return true;
    if (min && max) return min <= max;
    return true;
  });

  constructor() {
    // Sincronizar con inputs externos
    effect(
      () => {
        const min = this.precioMin();
        const max = this.precioMax();

        if (min !== this.precioMinLocal()) {
          this.precioMinLocal.set(min);
        }
        if (max !== this.precioMaxLocal()) {
          this.precioMaxLocal.set(max);
        }
      },
      { allowSignalWrites: true }
    );

    // Validar rango cada vez que cambie
    effect(
      () => {
        if (!this.esRangoValido()) {
          this.errorValidacion.set(
            'El precio mínimo debe ser menor que el máximo'
          );
        } else {
          this.errorValidacion.set(null);
        }
      },
      { allowSignalWrites: true }
    );
  }

  /**
   * Maneja el cambio de precio mínimo
   */
  onPrecioMinChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value ? parseFloat(target.value) : undefined;

    // Validar que no sea negativo
    if (value !== undefined && value < 0) {
      target.value = '0';
      return;
    }

    this.precioMinLocal.set(value);
    this.rangoSeleccionado.set(null);
    this.emitirCambio();
  }

  /**
   * Maneja el cambio de precio máximo
   */
  onPrecioMaxChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value ? parseFloat(target.value) : undefined;

    // Validar que no sea negativo
    if (value !== undefined && value < 0) {
      target.value = '0';
      return;
    }

    this.precioMaxLocal.set(value);
    this.rangoSeleccionado.set(null);
    this.emitirCambio();
  }

  /**
   * Selecciona un rango predefinido
   */
  seleccionarRangoPredefinido(rango: RangoPredefinido): void {
    this.precioMinLocal.set(rango.min);
    this.precioMaxLocal.set(rango.max);
    this.rangoSeleccionado.set(rango.label);
    this.mostrarRangoPersonalizado.set(false);

    this.rangoPredefinidoSeleccionado.emit(rango);
    this.emitirCambio();
  }

  /**
   * Limpia el filtro de precio
   */
  limpiarRango(): void {
    this.precioMinLocal.set(undefined);
    this.precioMaxLocal.set(undefined);
    this.rangoSeleccionado.set(null);
    this.errorValidacion.set(null);
    this.emitirCambio();
  }

  /**
   * Toggle para mostrar rango personalizado
   */
  toggleRangoPersonalizado(): void {
    this.mostrarRangoPersonalizado.update((current) => !current);
    if (this.mostrarRangoPersonalizado()) {
      this.rangoSeleccionado.set(null);
    }
  }

  /**
   * Verifica si un rango predefinido está seleccionado
   */
  isRangoSeleccionado(rango: RangoPredefinido): boolean {
    return this.rangoSeleccionado() === rango.label;
  }

  /**
   * Aplica un rango rápido común
   */
  aplicarRangoRapido(tipo: 'economico' | 'medio' | 'premium' | 'lujo'): void {
    switch (tipo) {
      case 'economico':
        this.seleccionarRangoPredefinido({
          label: 'Económico',
          max: 50,
          icono: '💸',
        });
        break;
      case 'medio':
        this.seleccionarRangoPredefinido({
          label: 'Rango Medio',
          min: 50,
          max: 150,
          icono: '💰',
        });
        break;
      case 'premium':
        this.seleccionarRangoPredefinido({
          label: 'Premium',
          min: 150,
          max: 400,
          icono: '💎',
        });
        break;
      case 'lujo':
        this.seleccionarRangoPredefinido({
          label: 'Lujo',
          min: 400,
          icono: '✨',
        });
        break;
    }
  }

  /**
   * Formatea un número como precio
   */
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(precio);
  }

  /**
   * Emite el cambio de precio
   */
  emitirCambio(): void {
    if (this.esRangoValido()) {
      this.precioChanged.emit({
        min: this.precioMinLocal(),
        max: this.precioMaxLocal(),
      });
    }
  }
}
