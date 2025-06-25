import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductoRelacionado } from '../../../../../core/models/carrito.interface';

@Component({
  selector: 'app-carrito-vacio',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrito-vacio.component.html',
  styleUrl: './carrito-vacio.component.css',
})
export class CarritoVacioComponent {
  // Inputs
  readonly productosRelacionados = input<ProductoRelacionado[]>([]);
  readonly cargando = input<boolean>(false);

  // Router para navegación
  private readonly router = inject(Router);

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
   * Ver producto específico
   */
  verProducto(slug: string): void {
    this.router.navigate(['/producto', slug]);
  }

  /**
   * Ir al catálogo
   */
  irAlCatalogo(): void {
    this.router.navigate(['/catalogo']);
  }

  /**
   * Ir a una categoría específica
   */
  irACategoria(categoria: string): void {
    this.router.navigate(['/catalogo'], {
      queryParams: { categoria: categoria.toLowerCase() },
    });
  }

  /**
   * Calcular descuento porcentual
   */
  calcularDescuento(precio: number, precioOferta: number): number {
    return Math.round(((precio - precioOferta) / precio) * 100);
  }
}
