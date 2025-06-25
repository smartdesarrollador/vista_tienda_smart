import { Component, input, output, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage, DecimalPipe } from '@angular/common';
import { Categoria } from '../../../../../../../core/models/categoria.model';
import { environment } from '../../../../../../../../environments/environment';

@Component({
  selector: 'app-categoria-card',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage, DecimalPipe],
  template: `
    <!-- Categoria Card Circular -->
    <div class="flex flex-col items-center group cursor-pointer">
      <!-- Círculo con imagen/icono -->
      <div
        class="relative w-32 h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
        [attr.aria-label]="'Categoría ' + categoria().nombre"
      >
        @if (categoria().imagen) {
        <!-- Imagen de la categoría -->
        <img
          [ngSrc]="imagenCompleta()"
          [alt]="categoria().nombre"
          width="80"
          height="80"
          class="w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 object-contain drop-shadow-md"
          priority="false"
          (error)="onImageError($event)"
          (load)="onImageLoad($event)"
        />
        } @else {
        <!-- Icono por defecto -->
        <svg
          class="w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 text-blue-600 drop-shadow-md"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
          />
        </svg>
        }

        <!-- Badge de productos (solo si hay productos) -->
        @if (showProductCount() && (categoria().productos_count ?? 0) > 0) {
        <div
          class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-md"
        >
          {{ categoria().productos_count }}
        </div>
        }

        <!-- Overlay de hover -->
        <div
          class="absolute inset-0 rounded-full bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        ></div>
      </div>

      <!-- Información de la categoría -->
      <div class="mt-3 text-center max-w-[140px]">
        <!-- Nombre de la categoría -->
        <h3
          class="font-semibold text-gray-900 text-sm md:text-base group-hover:text-blue-600 transition-colors duration-200 line-clamp-2"
        >
          {{ categoria().nombre }}
        </h3>

        <!-- Contador de productos -->
        @if (showProductCount() && (categoria().productos_count ?? 0) > 0) {
        <p class="text-xs text-gray-500 mt-1">
          {{ categoria().productos_count | number }}
          {{
            (categoria().productos_count ?? 0) === 1 ? 'Producto' : 'Productos'
          }}
        </p>
        }
      </div>

      <!-- Link overlay -->
      <a
        [routerLink]="['/productos']"
        [queryParams]="{ categoria: categoria().slug }"
        class="absolute inset-0 z-10"
        [attr.aria-label]="'Ver productos de ' + categoria().nombre"
        (click)="onCardClick()"
      ></a>
    </div>
  `,
  styles: [
    `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      /* Asegurar que las imágenes mantengan su aspecto */
      img {
        object-fit: contain;
        max-width: 100%;
        max-height: 100%;
      }

      /* Animaciones suaves */
      .group:hover .transform {
        transform: scale(1.05);
      }
    `,
  ],
})
export class CategoriaCardComponent {
  // Inputs usando la nueva API de signals
  categoria = input.required<Categoria>();
  size = input<'sm' | 'md' | 'lg'>('md');
  showProductCount = input<boolean>(true);
  showDescription = input<boolean>(true);

  // Outputs
  cardClick = output<Categoria>();
  exploreClick = output<Categoria>();

  /**
   * Computed signal para generar la URL completa de la imagen
   */
  readonly imagenCompleta = computed(() => {
    const imagen = this.categoria().imagen;

    if (!imagen) {
      return '';
    }

    // Si la imagen ya tiene el protocolo (http/https), devolverla tal como está
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
      return imagen;
    }

    // Usar baseUrlImagenes del environment para imágenes
    let baseUrl = environment.baseUrlImagenes;

    // Fallback si baseUrlImagenes no está definido
    if (!baseUrl) {
      baseUrl = `${environment.urlDominioApi}/assets/`;
    }

    // Si la imagen ya empieza con '/', quitarlo para evitar duplicación
    let imagenPath = imagen.startsWith('/') ? imagen.slice(1) : imagen;

    // Si la imagen empieza con 'assets/' y baseUrl ya incluye 'assets/', quitarlo
    if (imagenPath.startsWith('assets/') && baseUrl.includes('/assets/')) {
      imagenPath = imagenPath.replace('assets/', '');
    }

    // Asegurar que baseUrl termina con '/'
    const baseUrlFinal = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

    const urlFinal = `${baseUrlFinal}${imagenPath}`;

    return urlFinal;
  });

  /**
   * Maneja el click en la card
   */
  onCardClick(): void {
    this.cardClick.emit(this.categoria());
  }

  /**
   * Maneja el click en el botón explorar
   */
  onExploreClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.exploreClick.emit(this.categoria());
  }

  /**
   * Maneja errores al cargar imágenes
   */
  onImageError(event: Event): void {
    // Silently handle image errors
  }

  /**
   * Maneja la carga exitosa de imágenes
   */
  onImageLoad(event: Event): void {
    // Silently handle image load success
  }
}
