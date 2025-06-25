import {
  Component,
  input,
  signal,
  computed,
  OnInit,
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { interval } from 'rxjs';

@Component({
  selector: 'app-contador-tiempo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="contador-tiempo" [class.compacto]="esCompacto()">
      @if (mostrarTextoGlobal() && !esCompacto() && tiempoRestante().dias > 0) {
      <div class="texto-global text-center mb-3">
        <h3 class="text-xl font-semibold text-red-600">
          <span class="fire-icon mr-2">🔥</span>¡Ofertas Ardientes!
        </h3>
        <p class="text-sm text-gray-700">
          Terminan en {{ tiempoRestante().dias }}
          {{ tiempoRestante().dias === 1 ? 'día' : 'días' }}
        </p>
      </div>
      } @if (!tiempoTerminado()) {
      <div
        class="tiempo-contenedor"
        [class.compacto]="esCompacto()"
        [class.urgente]="esUrgenteVisual()"
      >
        @if (tiempoRestante().dias > 0 && !esCompacto()) {
        <div class="tiempo-unidad">
          <div class="numero">{{ tiempoRestante().dias }}</div>
          <div class="etiqueta">
            {{ tiempoRestante().dias === 1 ? 'Día' : 'Días' }}
          </div>
        </div>
        <div class="separador">:</div>
        }
        <div class="tiempo-unidad">
          <div class="numero">
            {{ formatearNumero(tiempoRestante().horas) }}
          </div>
          <div class="etiqueta">Hrs</div>
        </div>
        @if (!esCompacto()) {
        <div class="separador">:</div>
        }
        <div class="tiempo-unidad">
          <div class="numero">
            {{ formatearNumero(tiempoRestante().minutos) }}
          </div>
          <div class="etiqueta">Min</div>
        </div>
        @if (!esCompacto()) {
        <div class="separador">:</div>
        }
        <div class="tiempo-unidad">
          <div class="numero">
            {{ formatearNumero(tiempoRestante().segundos) }}
          </div>
          <div class="etiqueta">Seg</div>
        </div>
      </div>
      @if (esUrgente() && !esCompacto() && mostrarTextoIndividualUrgente()) {
      <div class="alerta-urgente mt-2 text-center">
        <p class="text-red-500 font-medium text-xs animate-pulse">
          ⚡ ¡Solo quedan {{ tiempoRestante().horas }}h
          {{ formatearNumero(tiempoRestante().minutos) }}m!
        </p>
      </div>
      } } @else {
      <div class="tiempo-terminado" [class.compacto]="esCompacto()">
        <div class="mensaje-terminado">
          @if (esCompacto()) {
          <span class="text-red-500 font-bold text-xs">¡Terminó!</span>
          } @else {
          <p class="text-red-600 font-bold text-base">⏰ ¡Oferta Terminada!</p>
          }
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .contador-tiempo {
        @apply w-full;
      }
      .contador-tiempo.compacto {
        @apply py-1 px-2 rounded-md bg-red-500 text-white;
      }
      .texto-global .fire-icon {
        animation: firePulse 1s infinite alternate;
      }
      @keyframes firePulse {
        from {
          transform: scale(1);
          opacity: 1;
        }
        to {
          transform: scale(1.2);
          opacity: 0.8;
        }
      }
      .tiempo-contenedor {
        @apply flex items-center justify-center gap-1 bg-gray-800 text-white rounded-lg p-3 shadow-md;
        font-family: 'Roboto Mono', monospace;
      }
      .tiempo-contenedor.compacto {
        @apply p-0 bg-transparent shadow-none text-xs gap-0.5;
      }
      .tiempo-contenedor.urgente {
        @apply bg-red-600;
        /* animation: pulseUrgenteBg 1.5s infinite; */
      }
      .tiempo-unidad {
        @apply text-center flex-shrink-0;
      }
      .tiempo-contenedor.compacto .tiempo-unidad {
        min-width: 18px; /* Ajuste para que los números no salten tanto */
      }
      .numero {
        @apply font-bold text-xl leading-none;
      }
      .compacto .numero {
        @apply text-xs font-semibold;
      }
      .etiqueta {
        @apply text-xs uppercase tracking-tighter opacity-80 mt-0.5;
      }
      .compacto .etiqueta {
        @apply text-[10px] tracking-normal opacity-100 mt-0;
      }
      .separador {
        @apply text-xl font-bold opacity-70 mx-0.5;
      }
      .compacto .separador {
        @apply text-xs mx-0;
      }
      .tiempo-terminado {
        @apply bg-gray-200 text-gray-700 rounded-lg p-3 text-center;
      }
      .tiempo-terminado.compacto {
        @apply p-1 bg-gray-600 text-gray-300 text-xs;
      }
      /* @keyframes pulseUrgenteBg {
      0%, 100% { background-color: theme('colors.red.600'); }
      50% { background-color: theme('colors.red.500'); }
    } */
    `,
  ],
})
export class ContadorTiempoComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly fechaVencimiento = input.required<Date | string>();
  readonly esCompacto = input<boolean>(false);
  readonly mostrarTextoGlobal = input<boolean>(false); // Para el texto "Ofertas Ardientes"
  readonly mostrarTextoIndividualUrgente = input<boolean>(false); // Para el texto de urgencia debajo del contador individual

  private readonly ahora = signal<number>(Date.now());

  readonly tiempoRestante = computed(() => {
    const fechaFin = new Date(this.fechaVencimiento()).getTime();
    const diferencia = fechaFin - this.ahora();

    if (diferencia <= 0) {
      return {
        dias: 0,
        horas: 0,
        minutos: 0,
        segundos: 0,
        totalMilisegundos: 0,
      };
    }

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor(
      (diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

    return { dias, horas, minutos, segundos, totalMilisegundos: diferencia };
  });

  readonly tiempoTerminado = computed(
    () => this.tiempoRestante().totalMilisegundos <= 0
  );

  readonly esUrgente = computed(() => {
    const tiempo = this.tiempoRestante();
    return tiempo.dias === 0 && tiempo.horas < 1 && !this.tiempoTerminado(); // Menos de 1 hora
  });

  // Para la clase CSS, la urgencia visual se activa antes
  readonly esUrgenteVisual = computed(() => {
    const tiempo = this.tiempoRestante();
    return tiempo.dias === 0 && tiempo.horas < 2 && !this.tiempoTerminado(); // Menos de 2 horas
  });

  ngOnInit(): void {
    this.iniciarContador();
  }

  private iniciarContador(): void {
    this.actualizarTiempo(); // Actualización inmediata

    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.actualizarTiempo();
      });
  }

  private actualizarTiempo(): void {
    this.ahora.set(Date.now());
  }

  formatearNumero(numero: number): string {
    return numero.toString().padStart(2, '0');
  }
}
