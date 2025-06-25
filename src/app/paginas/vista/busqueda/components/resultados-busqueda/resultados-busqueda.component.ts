import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductoBusqueda } from '../../../../../core/models/busqueda.interface';

@Component({
  selector: 'app-resultados-busqueda',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './resultados-busqueda.component.html',
  styleUrls: ['./resultados-busqueda.component.css'],
})
export class ResultadosBusquedaComponent {
  @Input({ required: true }) productos: ProductoBusqueda[] = [];
  @Input() vista: 'grid' | 'lista' = 'grid';
  @Input() cargandoMas: boolean = false;

  @Output() seleccionarProducto = new EventEmitter<ProductoBusqueda>();
  @Output() cargarMas = new EventEmitter<void>();

  /**
   * Maneja el clic en un producto
   */
  onProductoClick(producto: ProductoBusqueda): void {
    this.seleccionarProducto.emit(producto);
  }

  /**
   * Calcula el descuento porcentual
   */
  calcularDescuento(precioOferta: number, precioOriginal: number): number {
    if (!precioOriginal || !precioOferta || precioOriginal <= precioOferta)
      return 0;
    return Math.round(((precioOriginal - precioOferta) / precioOriginal) * 100);
  }

  /**
   * Genera un array de estrellas para la calificación
   */
  generarEstrellas(
    calificacion: number | undefined
  ): { llena: boolean; media: boolean }[] {
    const estrellas = [];
    if (calificacion === undefined) return [];

    const calificacionRedondeada = Math.floor(calificacion);
    const tieneMedia = calificacion % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < calificacionRedondeada) {
        estrellas.push({ llena: true, media: false });
      } else if (i === calificacionRedondeada && tieneMedia) {
        estrellas.push({ llena: false, media: true });
      } else {
        estrellas.push({ llena: false, media: false });
      }
    }
    return estrellas;
  }

  /**
   * Formatea el precio para mostrar
   */
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(precio);
  }

  /**
   * Obtiene el texto del estado de stock
   */
  getTextoStock(stock: number): { texto: string; clase: string } {
    if (stock === 0) {
      return { texto: 'Agotado', clase: 'text-red-600' };
    } else if (stock <= 5) {
      return { texto: `Últimas ${stock} unidades`, clase: 'text-orange-600' };
    } else if (stock <= 10) {
      return { texto: 'Stock limitado', clase: 'text-yellow-600' };
    } else {
      return { texto: 'Disponible', clase: 'text-green-600' };
    }
  }

  /**
   * Verifica si un producto está disponible
   */
  estaDisponible(producto: ProductoBusqueda): boolean {
    return producto.activo;
  }
}
