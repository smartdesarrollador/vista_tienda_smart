import {
  Component,
  input,
  signal,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  Producto,
  Comentario,
} from '../../../../../core/models/producto.interface';

/**
 * Interface para nueva reseña
 */
interface NuevaResena {
  calificacion: number;
  comentario: string;
  usuario: string;
}

/**
 * Interface para estadísticas de reseñas
 */
interface EstadisticasResenas {
  promedio: number;
  total: number;
  distribucion: Record<number, number>;
}

@Component({
  selector: 'app-resenas-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <!-- Sistema de Reseñas del Producto -->
    <div class="space-y-6">
      <!-- Resumen de Calificaciones -->
      <div class="bg-gray-50 rounded-lg p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Calificación General -->
          <div class="text-center">
            <div class="text-4xl font-bold text-gray-900 mb-2">
              {{ estadisticas().promedio.toFixed(1) }}
            </div>
            <div class="flex justify-center mb-2">
              @for (estrella of [1, 2, 3, 4, 5]; track estrella) {
              <svg
                class="w-6 h-6"
                [class.text-yellow-400]="
                  estrella <= Math.round(estadisticas().promedio)
                "
                [class.text-gray-300]="
                  estrella > Math.round(estadisticas().promedio)
                "
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </svg>
              }
            </div>
            <p class="text-gray-600">
              Basado en {{ estadisticas().total }}
              {{ estadisticas().total === 1 ? 'reseña' : 'reseñas' }}
            </p>
          </div>

          <!-- Distribución de Calificaciones -->
          <div class="space-y-2">
            @for (estrella of [5, 4, 3, 2, 1]; track estrella) {
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600 w-8">{{ estrella }}</span>
              <svg
                class="w-4 h-4 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </svg>
              <div class="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  [style.width.%]="porcentajeEstrella(estrella)"
                ></div>
              </div>
              <span class="text-sm text-gray-600 w-8 text-right">
                {{ estadisticas().distribucion[estrella] || 0 }}
              </span>
            </div>
            }
          </div>
        </div>
      </div>

      <!-- Botón para Agregar Reseña -->
      <div class="text-center">
        <button
          type="button"
          (click)="toggleFormularioResena()"
          class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
        >
          {{ mostrarFormulario() ? 'Cancelar' : 'Escribir Reseña' }}
        </button>
      </div>

      <!-- Formulario de Nueva Reseña -->
      @if (mostrarFormulario()) {
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h4 class="text-lg font-semibold text-gray-900 mb-4">
          Escribe tu reseña
        </h4>

        <form
          [formGroup]="formResena"
          (ngSubmit)="enviarResena()"
          class="space-y-4"
        >
          <!-- Calificación -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Calificación
            </label>
            <div class="flex gap-1">
              @for (estrella of [1, 2, 3, 4, 5]; track estrella) {
              <button
                type="button"
                (click)="seleccionarCalificacion(estrella)"
                class="p-1 transition-colors duration-200"
              >
                <svg
                  class="w-8 h-8"
                  [class.text-yellow-400]="
                    estrella <= calificacionSeleccionada()
                  "
                  [class.text-gray-300]="estrella > calificacionSeleccionada()"
                  [class.hover:text-yellow-300]="
                    estrella > calificacionSeleccionada()
                  "
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  />
                </svg>
              </button>
              }
            </div>
            @if (formResena.get('calificacion')?.touched &&
            formResena.get('calificacion')?.invalid) {
            <p class="mt-1 text-sm text-red-600">
              Por favor selecciona una calificación.
            </p>
            }
          </div>

          <!-- Comentario -->
          <div>
            <label
              for="comentario"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Tu reseña
            </label>
            <textarea
              id="comentario"
              formControlName="comentario"
              rows="4"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Comparte tu experiencia con este producto..."
            ></textarea>
            @if (formResena.get('comentario')?.touched &&
            formResena.get('comentario')?.invalid) {
            <p class="mt-1 text-sm text-red-600">
              Por favor escribe tu reseña (mínimo 10 caracteres).
            </p>
            }
          </div>

          <!-- Nombre (simulado) -->
          <div>
            <label
              for="usuario"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Tu nombre
            </label>
            <input
              id="usuario"
              type="text"
              formControlName="usuario"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tu nombre"
            />
            @if (formResena.get('usuario')?.touched &&
            formResena.get('usuario')?.invalid) {
            <p class="mt-1 text-sm text-red-600">
              Por favor ingresa tu nombre.
            </p>
            }
          </div>

          <!-- Botones -->
          <div class="flex gap-3 pt-4">
            <button
              type="submit"
              [disabled]="formResena.invalid || enviandoResena()"
              class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              @if (enviandoResena()) { Enviando... } @else { Enviar Reseña }
            </button>
            <button
              type="button"
              (click)="cancelarResena()"
              class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
      }

      <!-- Lista de Reseñas -->
      <div class="space-y-4">
        <h4 class="text-lg font-semibold text-gray-900">Reseñas de Clientes</h4>

        @if (resenas().length === 0) {
        <div class="text-center py-8">
          <svg
            class="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p class="text-gray-500">Aún no hay reseñas para este producto.</p>
          <p class="text-gray-400 text-sm">
            ¡Sé el primero en compartir tu experiencia!
          </p>
        </div>
        } @else {
        <div class="space-y-4">
          @for (resena of resenasPaginadas(); track resena.id) {
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <div class="flex">
                    @for (estrella of [1, 2, 3, 4, 5]; track estrella) {
                    <svg
                      class="w-4 h-4"
                      [class.text-yellow-400]="estrella <= resena.calificacion"
                      [class.text-gray-300]="estrella > resena.calificacion"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                    }
                  </div>
                  <span class="font-medium text-gray-900">
                    Usuario Anónimo
                  </span>
                </div>
                <p class="text-sm text-gray-500">
                  {{ formatearFecha(resena.created_at) }}
                </p>
              </div>
            </div>
            <p class="text-gray-700 leading-relaxed">
              {{ resena.comentario }}
            </p>
          </div>
          }
        </div>

        <!-- Paginación -->
        @if (totalPaginas() > 1) {
        <div class="flex justify-center mt-6">
          <nav class="flex items-center gap-2">
            <button
              type="button"
              (click)="cambiarPagina(paginaActual() - 1)"
              [disabled]="paginaActual() === 1"
              class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            @for (pagina of paginasVisibles(); track pagina) {
            <button
              type="button"
              (click)="cambiarPagina(pagina)"
              class="px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
              [class.bg-blue-600]="pagina === paginaActual()"
              [class.text-white]="pagina === paginaActual()"
              [class.bg-white]="pagina !== paginaActual()"
              [class.text-gray-900]="pagina !== paginaActual()"
              [class.border]="pagina !== paginaActual()"
              [class.border-gray-300]="pagina !== paginaActual()"
              [class.hover:bg-gray-50]="pagina !== paginaActual()"
            >
              {{ pagina }}
            </button>
            }

            <button
              type="button"
              (click)="cambiarPagina(paginaActual() + 1)"
              [disabled]="paginaActual() === totalPaginas()"
              class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </nav>
        </div>
        } }
      </div>
    </div>
  `,
  styles: [
    `
      /* Animaciones para formulario */
      form {
        animation: slideDown 0.3s ease-out;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Transiciones suaves para estrellas */
      svg {
        transition: color 0.2s ease-in-out;
      }

      /* Hover effect para estrellas */
      button:hover svg {
        transform: scale(1.1);
      }
    `,
  ],
})
export class ResenasProductoComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly fb = inject(FormBuilder);

  // Inputs
  producto = input.required<Producto>();

  // Estado local
  private readonly _mostrarFormulario = signal(false);
  private readonly _calificacionSeleccionada = signal(0);
  private readonly _enviandoResena = signal(false);
  private readonly _paginaActual = signal(1);
  private readonly _resenasSimuladas = signal<Comentario[]>([]);

  // Configuración
  private readonly RESENAS_POR_PAGINA = 5;

  // Form
  formResena: FormGroup;

  // Computed signals
  readonly mostrarFormulario = computed(() => this._mostrarFormulario());
  readonly calificacionSeleccionada = computed(() =>
    this._calificacionSeleccionada()
  );
  readonly enviandoResena = computed(() => this._enviandoResena());
  readonly paginaActual = computed(() => this._paginaActual());

  readonly resenas = computed(() => {
    // Combinar reseñas del producto con las simuladas
    const resenasProducto = this.producto().comentarios || [];
    const resenasSimuladas = this._resenasSimuladas();
    return [...resenasProducto, ...resenasSimuladas].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  readonly estadisticas = computed((): EstadisticasResenas => {
    const resenas = this.resenas();
    const total = resenas.length;

    if (total === 0) {
      return {
        promedio: 0,
        total: 0,
        distribucion: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const suma = resenas.reduce((acc, resena) => acc + resena.calificacion, 0);
    const promedio = suma / total;

    const distribucion = resenas.reduce((acc, resena) => {
      acc[resena.calificacion] = (acc[resena.calificacion] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Asegurar que todas las calificaciones estén presentes
    for (let i = 1; i <= 5; i++) {
      if (!distribucion[i]) distribucion[i] = 0;
    }

    return { promedio, total, distribucion };
  });

  readonly totalPaginas = computed(() =>
    Math.ceil(this.resenas().length / this.RESENAS_POR_PAGINA)
  );

  readonly resenasPaginadas = computed(() => {
    const resenas = this.resenas();
    const inicio = (this.paginaActual() - 1) * this.RESENAS_POR_PAGINA;
    return resenas.slice(inicio, inicio + this.RESENAS_POR_PAGINA);
  });

  readonly paginasVisibles = computed(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    const paginas: number[] = [];

    for (
      let i = Math.max(1, actual - 2);
      i <= Math.min(total, actual + 2);
      i++
    ) {
      paginas.push(i);
    }

    return paginas;
  });

  constructor() {
    this.formResena = this.fb.group({
      calificacion: [0, [Validators.required, Validators.min(1)]],
      comentario: ['', [Validators.required, Validators.minLength(10)]],
      usuario: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  /**
   * Calcula el porcentaje para la barra de distribución
   */
  porcentajeEstrella(estrella: number): number {
    const total = this.estadisticas().total;
    if (total === 0) return 0;

    const cantidad = this.estadisticas().distribucion[estrella] || 0;
    return (cantidad / total) * 100;
  }

  /**
   * Toggle del formulario de reseña
   */
  toggleFormularioResena(): void {
    this._mostrarFormulario.update((estado) => !estado);
    if (!this.mostrarFormulario()) {
      this.limpiarFormulario();
    }
  }

  /**
   * Selecciona una calificación
   */
  seleccionarCalificacion(calificacion: number): void {
    this._calificacionSeleccionada.set(calificacion);
    this.formResena.patchValue({ calificacion });
  }

  /**
   * Envía la nueva reseña
   */
  enviarResena(): void {
    if (this.formResena.invalid) return;

    this._enviandoResena.set(true);

    // Simular envío
    setTimeout(() => {
      const nuevaResena: Comentario = {
        id: Date.now(),
        producto_id: this.producto().id,
        usuario_id: 1,
        calificacion: this.formResena.value.calificacion,
        comentario: this.formResena.value.comentario,
        activo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this._resenasSimuladas.update((resenas) => [nuevaResena, ...resenas]);
      this._enviandoResena.set(false);
      this._mostrarFormulario.set(false);
      this.limpiarFormulario();

      if (isPlatformBrowser(this.platformId)) {
        console.log('Reseña agregada:', nuevaResena);
      }
    }, 1000);
  }

  /**
   * Cancela la reseña
   */
  cancelarResena(): void {
    this._mostrarFormulario.set(false);
    this.limpiarFormulario();
  }

  /**
   * Limpia el formulario
   */
  private limpiarFormulario(): void {
    this.formResena.reset();
    this._calificacionSeleccionada.set(0);
  }

  /**
   * Cambia de página
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this._paginaActual.set(pagina);
    }
  }

  /**
   * Formatea la fecha
   */
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Exponer Math para el template
  readonly Math = Math;
}
