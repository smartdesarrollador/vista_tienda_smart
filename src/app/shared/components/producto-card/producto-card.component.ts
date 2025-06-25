import {
  Component,
  input,
  output,
  computed,
  signal,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Producto } from '../../../core/models/producto.interface';
import { environment } from '../../../../environments/environment';

/**
 * Tipos de vista del componente
 */
export type VistaProductoCard = 'grid' | 'lista' | 'compacta';

/**
 * Configuración del componente ProductoCard
 */
export interface ProductoCardConfig {
  mostrarMarca: boolean;
  mostrarCategoria: boolean;
  mostrarDescripcion: boolean;
  mostrarRating: boolean;
  mostrarStock: boolean;
  mostrarBotonCarrito: boolean;
  mostrarAccionesRapidas: boolean;
  mostrarFavoritos: boolean;
  mostrarVistaRapida: boolean;
  stockBajo: number;
  urlPorDefecto: string;
  textoDestacado: string;
}

/**
 * Interface para las estrellas del rating
 */
export interface Estrella {
  llena: boolean;
}

/**
 * Eventos del componente
 */
export interface ProductoCardEventos {
  producto: Producto;
  event?: Event;
}

/**
 * Configuración por defecto del componente
 */
const CONFIG_DEFAULT: ProductoCardConfig = {
  mostrarMarca: true,
  mostrarCategoria: true,
  mostrarDescripcion: true,
  mostrarRating: true,
  mostrarStock: true,
  mostrarBotonCarrito: true,
  mostrarAccionesRapidas: true,
  mostrarFavoritos: true,
  mostrarVistaRapida: true,
  stockBajo: 5,
  urlPorDefecto: 'productos/default.jpg',
  textoDestacado: 'Destacado',
};

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './producto-card.component.html',
  styleUrls: ['./producto-card.component.css'],
})
export class ProductoCardComponent {
  // Platform ID para verificar si estamos en el browser
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  // Inputs del componente
  readonly producto = input.required<Producto>();
  readonly vista = input<VistaProductoCard>('grid');
  readonly configuracion = input<Partial<ProductoCardConfig>>({});
  readonly esFavorito = input<boolean>(false);

  // Outputs del componente
  readonly onCarritoClick = output<ProductoCardEventos>();
  readonly onFavoritoToggle = output<ProductoCardEventos>();
  readonly onVistaRapida = output<ProductoCardEventos>();
  readonly onProductoClick = output<ProductoCardEventos>();

  // Señales computadas para configuración final
  readonly configFinal = computed<ProductoCardConfig>(() => ({
    ...CONFIG_DEFAULT,
    ...this.configuracion(),
  }));

  // URL de la imagen del producto
  readonly imagenUrl = computed(() => {
    const producto = this.producto();
    const baseUrlImagenes = environment.baseUrlImagenes || '';

    if (producto.imagen_principal) {
      // Si la imagen_principal ya es una URL completa (viene de la API), la usamos directamente
      if (producto.imagen_principal.startsWith('http')) {
        return producto.imagen_principal;
      }
      // Si no es una URL completa, la construimos con baseUrl
      return baseUrlImagenes + producto.imagen_principal;
    }

    // URL por defecto si no hay imagen
    return baseUrlImagenes + this.configFinal().urlPorDefecto;
  });

  // Link del producto
  readonly linkProducto = computed(() => {
    const producto = this.producto();
    return `/producto/${producto.slug || producto.id}`;
  });

  // Precio formateado
  readonly precioFormateado = computed(() => {
    const producto = this.producto();
    return this.formatearPrecio(producto.precio);
  });

  // Precio de oferta
  readonly precioOferta = computed(() => {
    const producto = this.producto();
    return producto.precio_oferta || null;
  });

  // Precio de oferta formateado
  readonly precioOfertaFormateado = computed(() => {
    const precioOferta = this.precioOferta();
    return precioOferta ? this.formatearPrecio(precioOferta) : null;
  });

  // Porcentaje de descuento
  readonly porcentajeDescuento = computed(() => {
    const producto = this.producto();
    const precioOferta = this.precioOferta();

    if (!precioOferta || precioOferta >= producto.precio) {
      return 0;
    }

    return Math.round(
      ((producto.precio - precioOferta) / producto.precio) * 100
    );
  });

  // Estrellas del rating
  readonly estrellas = computed<Estrella[]>(() => {
    const producto = this.producto();
    const rating = producto.rating_promedio || 0;
    const estrellas: Estrella[] = [];

    for (let i = 1; i <= 5; i++) {
      estrellas.push({
        llena: i <= Math.round(rating),
      });
    }

    return estrellas;
  });

  /**
   * Formatea un precio con la moneda
   */
  private formatearPrecio(precio: number): string {
    const moneda = this.producto().moneda || 'COP';

    if (isPlatformBrowser(this.platformId)) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: moneda,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(precio);
    }

    // Fallback para SSR
    return `$${precio.toLocaleString('es-CO')}`;
  }

  /**
   * Maneja el error de carga de imagen
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const baseUrlImagenes = environment.baseUrlImagenes || '';
    const urlPorDefecto = this.configFinal().urlPorDefecto;

    // Construir URL de imagen por defecto
    img.src = baseUrlImagenes + urlPorDefecto;
  }

  /**
   * Agrega el producto al carrito
   */
  agregarAlCarrito(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.onCarritoClick.emit({
      producto: this.producto(),
      event,
    });
  }

  /**
   * Toggle del estado de favorito
   */
  toggleFavorito(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.onFavoritoToggle.emit({
      producto: this.producto(),
      event,
    });
  }

  /**
   * Muestra la vista rápida del producto
   */
  mostrarVistaRapida(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.onVistaRapida.emit({
      producto: this.producto(),
      event,
    });
  }

  /**
   * Maneja el click en el producto
   */
  onProductoClickHandler(event: Event): void {
    this.onProductoClick.emit({
      producto: this.producto(),
      event,
    });
  }

  /**
   * Navega al detalle del producto
   */
  verProducto(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const producto = this.producto();
    this.router.navigate(['/producto', producto.slug || producto.id]);
  }
}
