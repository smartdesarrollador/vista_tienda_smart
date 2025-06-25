import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../../../../core/services/carrito.service';
import { ItemCarrito } from '../../../../../core/models/carrito.interface';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-lista-items-carrito',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lista-items-carrito.component.html',
  styleUrl: './lista-items-carrito.component.css',
})
export class ListaItemsCarritoComponent {
  // Servicios inyectados
  private readonly carritoService = inject(CarritoService);
  private readonly router = inject(Router);

  // Signals del carrito
  readonly items = this.carritoService.items;
  readonly cargando = this.carritoService.cargando;
  readonly error = this.carritoService.error;

  // Computed signals
  readonly itemsOrdenados = computed(() => {
    return this.items().sort(
      (a, b) =>
        new Date(b.agregado_en).getTime() - new Date(a.agregado_en).getTime()
    );
  });

  readonly tieneItemsConProblemas = computed(() =>
    this.items().some(
      (item) =>
        item.stock_disponible < item.cantidad || item.stock_disponible === 0
    )
  );

  /**
   * Construir URL completa de la imagen
   */
  construirUrlImagen(imagen: string): string {
    if (!imagen) {
      return environment.urlDominioApi + '/assets/productos/default.jpg';
    }

    // Si ya es una URL completa, retornarla tal como está
    if (imagen.startsWith('http')) {
      return imagen;
    }

    // Si es una ruta relativa, construir la URL completa
    return environment.urlDominioApi + '/' + imagen;
  }

  /**
   * Manejar error de imagen
   */
  onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = this.construirUrlImagen('');
    }
  }

  /**
   * Formatear precio
   */
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(precio);
  }

  /**
   * Actualizar cantidad de un item
   */
  actualizarCantidad(item: ItemCarrito, nuevaCantidad: number): void {
    if (nuevaCantidad < 1) {
      this.removerItem(item);
      return;
    }

    if (nuevaCantidad > item.stock_disponible) {
      nuevaCantidad = item.stock_disponible;
    }

    if (nuevaCantidad !== item.cantidad) {
      this.carritoService.actualizarCantidad(item.id, nuevaCantidad).subscribe({
        next: (response) => {
          if (!response.success) {
            console.error('Error al actualizar cantidad:', response.message);
          }
        },
        error: (error) => {
          console.error('Error al actualizar cantidad:', error);
        },
      });
    }
  }

  /**
   * Incrementar cantidad
   */
  incrementarCantidad(item: ItemCarrito): void {
    const nuevaCantidad = item.cantidad + 1;
    this.actualizarCantidad(item, nuevaCantidad);
  }

  /**
   * Decrementar cantidad
   */
  decrementarCantidad(item: ItemCarrito): void {
    const nuevaCantidad = item.cantidad - 1;
    if (nuevaCantidad < 1) {
      this.removerItem(item);
    } else {
      this.actualizarCantidad(item, nuevaCantidad);
    }
  }

  /**
   * Remover item del carrito
   */
  removerItem(item: ItemCarrito): void {
    if (
      confirm(
        `¿Estás seguro de que quieres eliminar "${item.nombre}" del carrito?`
      )
    ) {
      this.carritoService.removerItem(item.id).subscribe({
        next: (response) => {
          if (!response.success) {
            console.error('Error al remover item:', response.message);
          }
        },
        error: (error) => {
          console.error('Error al remover item:', error);
        },
      });
    }
  }

  /**
   * Ver producto específico
   */
  verProducto(slug: string): void {
    this.router.navigate(['/producto', slug]);
  }

  /**
   * Calcular descuento porcentual
   */
  calcularDescuento(precio: number, precioOferta: number): number {
    return Math.round(((precio - precioOferta) / precio) * 100);
  }

  /**
   * Verificar si el item tiene descuento
   */
  tieneDescuento(item: ItemCarrito): boolean {
    return !!(item.precio_oferta && item.precio_oferta < item.precio);
  }

  /**
   * Obtener precio efectivo del item
   */
  obtenerPrecioEfectivo(item: ItemCarrito): number {
    return item.precio_oferta && item.precio_oferta < item.precio
      ? item.precio_oferta
      : item.precio;
  }

  /**
   * Formatear variaciones del producto
   */
  formatearVariaciones(item: ItemCarrito): string {
    if (!item.variacion) return '';

    const variaciones: string[] = [];

    if (item.variacion.color) {
      variaciones.push(`Color: ${item.variacion.color.nombre}`);
    }

    if (item.variacion.talla) {
      variaciones.push(`Talla: ${item.variacion.talla}`);
    }

    // Agregar otras variaciones dinámicamente
    Object.keys(item.variacion).forEach((key) => {
      if (key !== 'color' && key !== 'talla' && item.variacion![key]) {
        variaciones.push(`${key}: ${item.variacion![key]}`);
      }
    });

    return variaciones.join(' • ');
  }

  /**
   * Obtener estado del stock
   */
  obtenerEstadoStock(item: ItemCarrito): {
    estado: 'disponible' | 'bajo' | 'agotado' | 'insuficiente';
    mensaje: string;
    clase: string;
  } {
    if (item.stock_disponible === 0) {
      return {
        estado: 'agotado',
        mensaje: 'Producto agotado',
        clase: 'text-red-600 bg-red-50',
      };
    }

    if (item.stock_disponible < item.cantidad) {
      return {
        estado: 'insuficiente',
        mensaje: `Solo ${item.stock_disponible} disponibles`,
        clase: 'text-orange-600 bg-orange-50',
      };
    }

    if (item.stock_disponible < 5) {
      return {
        estado: 'bajo',
        mensaje: `${item.stock_disponible} en stock`,
        clase: 'text-yellow-600 bg-yellow-50',
      };
    }

    return {
      estado: 'disponible',
      mensaje: 'En stock',
      clase: 'text-green-600 bg-green-50',
    };
  }

  /**
   * Manejar cambio de cantidad desde input
   */
  onCantidadChange(item: ItemCarrito, event: Event): void {
    const target = event.target as HTMLInputElement;
    const nuevaCantidad = parseInt(target.value, 10);

    if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
      target.value = item.cantidad.toString();
      return;
    }

    this.actualizarCantidad(item, nuevaCantidad);
  }
}
