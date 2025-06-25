import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import {
  CommonModule,
  NgOptimizedImage,
  isPlatformBrowser,
} from '@angular/common';
import { Producto } from '../../../../../core/models/producto.interface';
import { environment } from '../../../../../../environments/environment';

/**
 * Interface para las imágenes de la galería
 */
export interface ImagenGaleria {
  url: string;
  alt: string;
  esPrincipal: boolean;
}

@Component({
  selector: 'app-galeria-imagenes',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    <!-- Galería de Imágenes del Producto -->
    <div class="space-y-4">
      <!-- Imagen Principal -->
      <div
        class="relative aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden group"
      >
        @if (imagenPrincipalCompleta()) {
        <img
          [ngSrc]="imagenPrincipalCompleta()"
          [alt]="imagenPrincipalAlt()"
          [width]="600"
          [height]="600"
          class="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          priority="true"
          (click)="abrirZoom()"
        />
        } @else {
        <!-- Placeholder cuando no hay imagen -->
        <div class="w-full h-full flex items-center justify-center bg-gray-100">
          <svg
            class="w-24 h-24 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        }

        <!-- Botón de Zoom -->
        @if (imagenPrincipalCompleta()) {
        <button
          type="button"
          (click)="abrirZoom()"
          class="absolute top-4 right-4 bg-white/80 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100"
          aria-label="Ampliar imagen"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
        </button>
        }

        <!-- Navegación de imágenes (solo si hay múltiples) -->
        @if (imagenes().length > 1) {
        <div class="absolute inset-y-0 left-4 flex items-center">
          <button
            type="button"
            (click)="imagenAnterior()"
            [disabled]="imagenSeleccionada() === 0"
            class="bg-white/80 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
            aria-label="Imagen anterior"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        <div class="absolute inset-y-0 right-4 flex items-center">
          <button
            type="button"
            (click)="imagenSiguiente()"
            [disabled]="imagenSeleccionada() === imagenes().length - 1"
            class="bg-white/80 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
            aria-label="Imagen siguiente"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        }
      </div>

      <!-- Thumbnails -->
      @if (imagenes().length > 1) {
      <div class="grid grid-cols-4 gap-2">
        @for (imagen of imagenes(); track imagen.url; let i = $index) {
        <button
          type="button"
          (click)="seleccionarImagen(i)"
          class="relative aspect-square bg-white rounded-lg border-2 overflow-hidden transition-all duration-200 hover:border-gray-300"
          [class.border-blue-500]="imagenSeleccionada() === i"
          [class.border-gray-200]="imagenSeleccionada() !== i"
          [attr.aria-label]="'Ver ' + imagen.alt"
        >
          <img
            [ngSrc]="getImagenUrl(imagen.url)"
            [alt]="imagen.alt"
            [width]="100"
            [height]="100"
            class="w-full h-full object-contain p-1"
            loading="lazy"
          />
          @if (imagenSeleccionada() === i) {
          <div
            class="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"
          ></div>
          }
        </button>
        }
      </div>
      }

      <!-- Indicadores de imagen -->
      @if (imagenes().length > 1) {
      <div class="flex justify-center space-x-2">
        @for (imagen of imagenes(); track imagen.url; let i = $index) {
        <button
          type="button"
          (click)="seleccionarImagen(i)"
          class="w-2 h-2 rounded-full transition-all duration-200"
          [class.bg-blue-500]="imagenSeleccionada() === i"
          [class.bg-gray-300]="imagenSeleccionada() !== i"
          [attr.aria-label]="'Ir a imagen ' + (i + 1)"
        ></button>
        }
      </div>
      }
    </div>

    <!-- Modal de Zoom -->
    @if (mostrarZoom()) {
    <div
      class="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
      (click)="cerrarZoom()"
      (keydown.escape)="cerrarZoom()"
    >
      <div class="relative max-w-4xl max-h-full">
        <img
          [src]="imagenPrincipalCompleta()"
          [alt]="imagenPrincipalAlt()"
          class="max-w-full max-h-full object-contain"
          (click)="$event.stopPropagation()"
        />

        <!-- Botón cerrar -->
        <button
          type="button"
          (click)="cerrarZoom()"
          class="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200"
          aria-label="Cerrar zoom"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Navegación en zoom -->
        @if (imagenes().length > 1) {
        <button
          type="button"
          (click)="imagenAnterior(); $event.stopPropagation()"
          [disabled]="imagenSeleccionada() === 0"
          class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-200 disabled:opacity-50"
          aria-label="Imagen anterior"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          type="button"
          (click)="imagenSiguiente(); $event.stopPropagation()"
          [disabled]="imagenSeleccionada() === imagenes().length - 1"
          class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-200 disabled:opacity-50"
          aria-label="Imagen siguiente"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
        }
      </div>
    </div>
    }
  `,
  styles: [
    `
      /* Transiciones suaves para todas las imágenes */
      img {
        transition: transform 0.3s ease-in-out;
      }

      /* Cursor pointer para imágenes clickeables */
      .group img {
        cursor: zoom-in;
      }

      /* Mejorar la visibilidad de los botones en hover */
      .group:hover button {
        backdrop-filter: blur(4px);
      }

      /* Animaciones para el modal */
      .fixed {
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `,
  ],
})
export class GaleriaImagenesComponent {
  private readonly platformId = inject(PLATFORM_ID);

  // Inputs
  imagenes = input.required<ImagenGaleria[]>();
  imagenSeleccionada = input<number>(0);
  producto = input.required<Producto>();

  // Outputs
  imagenCambiada = output<number>();

  // Estado local
  private readonly _mostrarZoom = signal(false);

  // Computed signals
  readonly mostrarZoom = computed(() => this._mostrarZoom());

  readonly imagenPrincipalCompleta = computed(() => {
    const imagenes = this.imagenes();
    const indice = this.imagenSeleccionada();

    if (imagenes.length === 0) return '';

    const imagen = imagenes[indice];
    return imagen ? this.getImagenUrl(imagen.url) : '';
  });

  readonly imagenPrincipalAlt = computed(() => {
    const imagenes = this.imagenes();
    const indice = this.imagenSeleccionada();

    if (imagenes.length === 0) return '';

    const imagen = imagenes[indice];
    return imagen ? imagen.alt : '';
  });

  /**
   * Genera la URL completa de la imagen
   */
  getImagenUrl(imagen: string): string {
    if (!imagen) return '';

    // Si la imagen ya tiene protocolo, devolverla tal como está
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
      return imagen;
    }

    // Si es una ruta relativa, concatenar con el dominio
    const baseUrl = environment.urlDominioApi.replace('/api', '');
    const imagenPath = imagen.startsWith('/') ? imagen : `/${imagen}`;

    return `${baseUrl}${imagenPath}`;
  }

  /**
   * Selecciona una imagen específica
   */
  seleccionarImagen(indice: number): void {
    this.imagenCambiada.emit(indice);
  }

  /**
   * Navega a la imagen anterior
   */
  imagenAnterior(): void {
    const indiceActual = this.imagenSeleccionada();
    if (indiceActual > 0) {
      this.seleccionarImagen(indiceActual - 1);
    }
  }

  /**
   * Navega a la imagen siguiente
   */
  imagenSiguiente(): void {
    const indiceActual = this.imagenSeleccionada();
    const totalImagenes = this.imagenes().length;

    if (indiceActual < totalImagenes - 1) {
      this.seleccionarImagen(indiceActual + 1);
    }
  }

  /**
   * Abre el modal de zoom
   */
  abrirZoom(): void {
    if (isPlatformBrowser(this.platformId)) {
      this._mostrarZoom.set(true);
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Cierra el modal de zoom
   */
  cerrarZoom(): void {
    if (isPlatformBrowser(this.platformId)) {
      this._mostrarZoom.set(false);
      // Restaurar scroll del body
      document.body.style.overflow = '';
    }
  }
}
