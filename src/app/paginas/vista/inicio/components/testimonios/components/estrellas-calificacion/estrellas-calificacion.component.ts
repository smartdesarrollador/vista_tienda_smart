import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-estrellas-calificacion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Sistema de Estrellas -->
    <div
      class="flex items-center space-x-1"
      [attr.aria-label]="
        'Calificación de ' + calificacion() + ' de 5 estrellas'
      "
      role="img"
    >
      @for (estrella of estrellas(); track $index) {
      <svg
        class="transition-colors duration-200"
        [ngClass]="{
          'text-yellow-400 fill-yellow-400': estrella.filled,
          'text-yellow-200 fill-yellow-200': estrella.halfFilled,
          'text-gray-300 fill-gray-300': estrella.empty
        }"
        [style.width.px]="tamano()"
        [style.height.px]="tamano()"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="0.5"
      >
        <defs>
          <linearGradient
            [id]="'star-gradient-' + $index + '-' + componentId"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop
              offset="50%"
              [style.stop-color]="estrella.halfFilled ? '#fbbf24' : '#d1d5db'"
            />
            <stop offset="50%" [style.stop-color]="'#d1d5db'" />
          </linearGradient>
        </defs>

        <path
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          [attr.fill]="
            estrella.halfFilled
              ? 'url(#star-gradient-' + $index + '-' + componentId + ')'
              : 'currentColor'
          "
        />
      </svg>
      } @if (mostrarTexto()) {
      <span
        class="ml-2 text-sm font-medium"
        [ngClass]="{
          'text-gray-900': color() === 'default',
          'text-gray-600': color() === 'muted',
          'text-white': color() === 'white'
        }"
      >
        {{ textoCalificacion() }}
      </span>
      } @if (mostrarNumero()) {
      <span
        class="ml-1 text-sm font-medium"
        [ngClass]="{
          'text-gray-700': color() === 'default',
          'text-gray-500': color() === 'muted',
          'text-gray-200': color() === 'white'
        }"
      >
        ({{ calificacion().toFixed(1) }})
      </span>
      }
    </div>
  `,
  styles: [
    `
      /* Componente de estrellas - animaciones suaves */
      svg {
        transition: all 0.2s ease-in-out;
      }

      svg:hover {
        transform: scale(1.1);
      }
    `,
  ],
})
export class EstrellasCalificacionComponent {
  // Propiedades de entrada
  @Input() set rating(value: number) {
    this.calificacion.set(Math.max(0, Math.min(5, value || 0)));
  }

  @Input() set size(value: 'xs' | 'sm' | 'md' | 'lg' | 'xl') {
    this.tamano.set(this.getTamanoPixeles(value));
  }

  @Input() set showText(value: boolean) {
    this.mostrarTexto.set(value);
  }

  @Input() set showNumber(value: boolean) {
    this.mostrarNumero.set(value);
  }

  @Input() set textColor(value: 'default' | 'muted' | 'white') {
    this.color.set(value);
  }

  @Input() set customText(value: string) {
    this.textoPersonalizado.set(value);
  }

  // Signals para estado del componente
  readonly calificacion = signal<number>(0);
  readonly tamano = signal<number>(20);
  readonly mostrarTexto = signal<boolean>(false);
  readonly mostrarNumero = signal<boolean>(false);
  readonly color = signal<'default' | 'muted' | 'white'>('default');
  readonly textoPersonalizado = signal<string>('');

  // ID único para gradientes SVG
  readonly componentId = Math.random().toString(36).substr(2, 9);

  // Computed para generar las estrellas
  readonly estrellas = computed(() => {
    const rating = this.calificacion();
    const estrellas = [];

    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        // Estrella completa
        estrellas.push({
          filled: true,
          halfFilled: false,
          empty: false,
        });
      } else if (rating >= i - 0.5) {
        // Media estrella
        estrellas.push({
          filled: false,
          halfFilled: true,
          empty: false,
        });
      } else {
        // Estrella vacía
        estrellas.push({
          filled: false,
          halfFilled: false,
          empty: true,
        });
      }
    }

    return estrellas;
  });

  // Computed para texto de calificación
  readonly textoCalificacion = computed(() => {
    if (this.textoPersonalizado()) {
      return this.textoPersonalizado();
    }

    const rating = this.calificacion();

    if (rating === 0) return 'Sin calificación';
    if (rating <= 1) return 'Muy malo';
    if (rating <= 2) return 'Malo';
    if (rating <= 3) return 'Regular';
    if (rating <= 4) return 'Bueno';
    return 'Excelente';
  });

  // Constructor con valores por defecto
  constructor() {
    this.calificacion.set(0);
    this.tamano.set(20);
    this.mostrarTexto.set(false);
    this.mostrarNumero.set(false);
    this.color.set('default');
  }

  /**
   * Convierte el tamaño textual a píxeles
   */
  private getTamanoPixeles(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): number {
    const sizes = {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
    };

    return sizes[size] || sizes.md;
  }
}
