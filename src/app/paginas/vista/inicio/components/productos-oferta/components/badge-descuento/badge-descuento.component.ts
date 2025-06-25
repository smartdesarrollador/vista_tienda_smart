import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge-descuento',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (tieneDescuento()) {
    <div class="badge-descuento" [ngClass]="getBadgeClasses()">
      <div class="contenido-badge">
        <div class="porcentaje">-{{ porcentajeDescuento() }}%</div>
        @if (mostrarTextoDescuento()) {
        <div class="texto-descuento">
          {{ getTextoDescuento() }}
        </div>
        }
      </div>
      <div class="efecto-brillo"></div>
      @if (esDescuentoDestacado()) {
      <div class="decoracion-estrella">⭐</div>
      }
    </div>
    }
  `,
  styles: [
    `
      .badge-descuento {
        @apply relative inline-block font-bold text-white text-center rounded-lg shadow-lg transform rotate-12;
        min-width: 60px;
        padding: 8px 12px;
      }
      .badge-descuento.sin-rotacion {
        @apply rotate-0;
      }
      .descuento-pequeno {
        @apply bg-gradient-to-r from-orange-400 to-orange-600;
      }
      .descuento-mediano {
        @apply bg-gradient-to-r from-red-500 to-red-700;
      }
      .descuento-grande {
        @apply bg-gradient-to-r from-red-600 to-red-800 animate-pulse;
      }
      .descuento-mega {
        @apply bg-gradient-to-r from-purple-600 to-red-600 animate-pulse;
        animation-duration: 0.8s;
        box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
      }
      .contenido-badge {
        @apply relative z-10;
      }
      .porcentaje {
        @apply text-lg font-extrabold leading-none;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      }
      .texto-descuento {
        @apply text-xs uppercase tracking-wide mt-1 opacity-90;
      }
      .efecto-brillo {
        @apply absolute top-0 left-0 w-full h-full rounded-lg opacity-30;
        background: linear-gradient(
          45deg,
          transparent,
          rgba(255, 255, 255, 0.3),
          transparent
        );
        animation: brillo 3s infinite linear;
      }
      .decoracion-estrella {
        @apply absolute -top-2 -right-2 text-yellow-300 text-base;
        animation: parpadeo 1.5s infinite;
      }
      @keyframes brillo {
        0% {
          transform: translateX(-100%) skewX(-20deg);
        }
        100% {
          transform: translateX(100%) skewX(-20deg);
        }
      }
      @keyframes parpadeo {
        0%,
        100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.7;
          transform: scale(1.2);
        }
      }
      @media (max-width: 640px) {
        .badge-descuento {
          @apply text-sm;
          min-width: 50px;
          padding: 6px 10px;
          transform: rotate(8deg);
        }
        .badge-descuento.sin-rotacion {
          @apply rotate-0;
        }
        .porcentaje {
          @apply text-base;
        }
        .texto-descuento {
          @apply text-xs;
        }
      }
    `,
  ],
})
export class BadgeDescuentoComponent {
  readonly precioOriginal = input.required<number>();
  readonly precioOferta = input.required<number>();
  readonly mostrarTexto = input<boolean>(true);
  readonly sinRotacion = input<boolean>(false);

  readonly tieneDescuento = computed(() => {
    return (
      this.precioOferta() < this.precioOriginal() && this.precioOferta() > 0
    );
  });

  readonly porcentajeDescuento = computed(() => {
    if (!this.tieneDescuento()) return 0;
    const descuento =
      ((this.precioOriginal() - this.precioOferta()) / this.precioOriginal()) *
      100;
    return Math.round(descuento);
  });

  readonly nivelDescuento = computed(() => {
    const porcentaje = this.porcentajeDescuento();
    if (porcentaje >= 50) return 'mega';
    if (porcentaje >= 30) return 'grande';
    if (porcentaje >= 15) return 'mediano';
    return 'pequeno';
  });

  readonly mostrarTextoDescuento = computed(() => {
    return this.mostrarTexto() && this.porcentajeDescuento() >= 15;
  });

  getTextoDescuento(): string {
    const porcentaje = this.porcentajeDescuento();
    if (porcentaje >= 50) return '¡MEGA OFERTA!';
    if (porcentaje >= 30) return '¡SÚPER OFERTA!';
    if (porcentaje >= 15) return '¡OFERTA!';
    return '';
  }

  getBadgeClasses(): Record<string, boolean> {
    return {
      'sin-rotacion': this.sinRotacion(),
      [`descuento-${this.nivelDescuento()}`]: true,
    };
  }

  esDescuentoDestacado(): boolean {
    return this.porcentajeDescuento() >= 30;
  }
}
