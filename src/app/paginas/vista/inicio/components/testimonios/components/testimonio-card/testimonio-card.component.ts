import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstrellasCalificacionComponent } from '../estrellas-calificacion/estrellas-calificacion.component';
import { ComentarioCompleto } from '../../../../../../../core/models';

@Component({
  selector: 'app-testimonio-card',
  standalone: true,
  imports: [CommonModule, EstrellasCalificacionComponent],
  template: `
    <div
      class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-gray-200 transform hover:-translate-y-1"
      [class.h-full]="!expandido()"
    >
      <!-- Header del testimonio -->
      <div class="flex items-start space-x-4 mb-4">
        <!-- Avatar del usuario -->
        <div class="flex-shrink-0">
          @if (testimonio()?.usuario?.avatar) {
          <img
            [src]="getAvatarUrl(testimonio()?.usuario?.avatar || '')"
            [alt]="'Avatar de ' + (testimonio()?.usuario?.nombre || 'Usuario')"
            class="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            loading="lazy"
          />
          } @else {
          <div
            class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg"
          >
            {{ getIniciales(testimonio()?.usuario?.nombre || 'U') }}
          </div>
          }

          <!-- Badge de verificado -->
          @if (testimonio()?.usuario?.verificado) {
          <div class="relative -mt-2 -mr-2">
            <div class="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
              <svg
                class="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
          }
        </div>

        <!-- Información del usuario -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <h4 class="text-lg font-semibold text-gray-900 truncate">
              {{ testimonio()?.usuario?.nombre || 'Usuario Anónimo' }}
            </h4>
            @if (testimonio()?.usuario?.verificado) {
            <span
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              Verificado
            </span>
            }
          </div>

          <!-- Calificación -->
          <div class="mt-1">
            <app-estrellas-calificacion
              [rating]="testimonio()?.calificacion || 0"
              size="sm"
              [showNumber]="false"
              [showText]="false"
            />
          </div>
        </div>
      </div>

      <!-- Título del testimonio -->
      @if (testimonio()?.titulo) {
      <h5 class="text-base font-semibold text-gray-900 mb-3 line-clamp-2">
        "{{ testimonio()?.titulo }}"
      </h5>
      }

      <!-- Contenido del testimonio -->
      <div class="mb-4">
        <p
          class="text-gray-700 leading-relaxed transition-all duration-300"
          [class.line-clamp-4]="!expandido()"
          [class.line-clamp-none]="expandido()"
        >
          {{ testimonio()?.comentario }}
        </p>

        <!-- Botón para expandir/contraer si el texto es muy largo -->
        @if (textoLargo()) {
        <button
          type="button"
          class="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
          (click)="toggleExpansion()"
        >
          {{ expandido() ? 'Ver menos' : 'Ver más' }}
        </button>
        }
      </div>

      <!-- Footer del testimonio -->
      <div
        class="flex items-center justify-between pt-4 border-t border-gray-100"
      >
        <!-- Fecha -->
        <span class="text-sm text-gray-500">
          {{ getFechaFormateada(testimonio()?.created_at || '') }}
        </span>

        <!-- Producto recomendado -->
        @if (testimonio()?.es_recomendado) {
        <div class="flex items-center text-green-600">
          <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="text-sm font-medium">Recomendado</span>
        </div>
        }
      </div>

      <!-- Respuesta del administrador -->
      @if (testimonio()?.respuesta_admin) {
      <div class="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <svg
              class="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-blue-900 mb-1">
              Respuesta del equipo:
            </p>
            <p class="text-sm text-blue-800">
              {{ testimonio()?.respuesta_admin }}
            </p>
          </div>
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .line-clamp-2 {
        overflow: hidden;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      .line-clamp-4 {
        overflow: hidden;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 4;
      }

      .line-clamp-none {
        overflow: visible;
        display: block;
      }
    `,
  ],
})
export class TestimonioCardComponent {
  // Input del testimonio
  @Input() set comentario(value: ComentarioCompleto | null) {
    this.testimonio.set(value);
  }

  @Input() set showFullContent(value: boolean) {
    this.expandido.set(value);
  }

  @Input() set baseUrlAvatares(value: string) {
    this.baseUrlAvatars.set(value);
  }

  // Signals para estado del componente
  readonly testimonio = signal<ComentarioCompleto | null>(null);
  readonly expandido = signal<boolean>(false);
  readonly baseUrlAvatars = signal<string>('');

  // Computed para determinar si el texto es muy largo
  readonly textoLargo = computed(() => {
    const comentario = this.testimonio()?.comentario || '';
    return comentario.length > 200;
  });

  /**
   * Obtener iniciales del nombre del usuario
   */
  getIniciales(nombre: string): string {
    if (!nombre) return 'U';

    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
      return palabras[0].charAt(0).toUpperCase();
    }

    return (
      palabras[0].charAt(0) + (palabras[1]?.charAt(0) || '')
    ).toUpperCase();
  }

  /**
   * Obtener URL completa del avatar
   */
  getAvatarUrl(avatar: string): string {
    if (!avatar) return '';

    // Si ya es una URL completa, retornarla tal como está
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }

    // Si es una ruta relativa, construir la URL completa
    return `${this.baseUrlAvatars()}${avatar}`;
  }

  /**
   * Formatear fecha de manera amigable
   */
  getFechaFormateada(fecha: string): string {
    if (!fecha) return '';

    const fechaTestimonio = new Date(fecha);
    const ahora = new Date();
    const diferencia = ahora.getTime() - fechaTestimonio.getTime();
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;
    if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
    if (dias < 365) return `Hace ${Math.floor(dias / 30)} meses`;

    // Para fechas muy antiguas, mostrar fecha específica
    return fechaTestimonio.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Toggle para expandir/contraer el contenido
   */
  toggleExpansion(): void {
    this.expandido.update((current) => !current);
  }
}
