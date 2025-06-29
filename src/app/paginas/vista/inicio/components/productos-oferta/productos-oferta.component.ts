import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

import { ProductoService } from '../../../../../core/services/producto.service';
import {
  Producto,
  ProductosResponse,
} from '../../../../../core/models/producto.interface';

import { ContadorTiempoComponent } from './components/contador-tiempo/contador-tiempo.component';
import { BadgeDescuentoComponent } from './components/badge-descuento/badge-descuento.component';
import {
  ProductoCardComponent,
  ProductoCardEventos,
  ProductoCardConfig,
} from '../../../../../shared/components/producto-card/producto-card.component';

interface ProductoConOferta extends Producto {
  fecha_fin_oferta?: Date | string;
  porcentaje_descuento?: number;
}

@Component({
  selector: 'app-productos-oferta',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgOptimizedImage,
    ContadorTiempoComponent,
    BadgeDescuentoComponent,
    ProductoCardComponent,
  ],
  templateUrl: './productos-oferta.component.html',
  styleUrl: './productos-oferta.component.css',
})
export class ProductosOfertaComponent implements OnInit {
  private readonly productoService = inject(ProductoService);

  readonly productosOferta = signal<ProductoConOferta[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly fechaVencimientoGlobal = signal<Date>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  );

  readonly productosMostrados = computed(() =>
    this.productosOferta().slice(0, 4)
  );
  readonly hayMasProductos = computed(() => this.productosOferta().length > 4);

  // Configuración para ProductoCard con tema de ofertas
  readonly configProductoCard: ProductoCardConfig = {
    mostrarMarca: false,
    mostrarCategoria: true,
    mostrarDescripcion: false,
    mostrarRating: false,
    mostrarStock: false,
    mostrarBotonCarrito: true,
    mostrarAccionesRapidas: true,
    mostrarFavoritos: true,
    mostrarVistaRapida: false,
    stockBajo: 5,
    urlPorDefecto: 'productos/default.jpg',
    textoDestacado: 'Oferta',
  };

  @Output() agregarAlCarritoClicked = new EventEmitter<Producto>();
  @Output() toggleFavoritoClicked = new EventEmitter<Producto>();

  ngOnInit(): void {
    this.cargarProductosEnOferta();
  }

  cargarProductosEnOferta(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productoService
      .getProductos({
        activo: true,
        per_page: 20,
        order_by: 'precio',
        order_direction: 'asc',
      })
      .pipe(
        tap((response: ProductosResponse) => {
          const ahora = Date.now();
          const productosConFechaOferta: ProductoConOferta[] = response.data
            .filter(
              (p: Producto) => p.precio_oferta && p.precio_oferta < p.precio
            )
            .map((p: Producto) => {
              let fechaFinOferta;
              if (
                p.atributos_extra &&
                typeof p.atributos_extra['oferta_fin'] === 'string'
              ) {
                fechaFinOferta = new Date(
                  p.atributos_extra['oferta_fin'] as string
                );
              } else {
                const diasExtra = Math.floor(Math.random() * 5) + 1;
                fechaFinOferta = new Date(
                  ahora + diasExtra * 24 * 60 * 60 * 1000
                );
              }

              const porcentajeDescuento = p.precio_oferta
                ? ((p.precio - p.precio_oferta) / p.precio) * 100
                : 0;

              return {
                ...p,
                fecha_fin_oferta: fechaFinOferta,
                porcentaje_descuento: porcentajeDescuento,
              };
            })
            .sort((a, b) => {
              if (a.destacado && !b.destacado) return -1;
              if (!a.destacado && b.destacado) return 1;

              return (
                (b.porcentaje_descuento || 0) - (a.porcentaje_descuento || 0)
              );
            });

          this.productosOferta.set(productosConFechaOferta);
        }),
        catchError((err) => {
          console.error('Error al cargar productos en oferta:', err);
          this.error.set(
            'No se pudieron cargar las ofertas. Inténtalo de nuevo.'
          );
          let errorMessage = 'Error desconocido';
          if (err instanceof Error) {
            errorMessage = err.message;
          }
          return of({
            data: [],
            meta: {} as any,
            links: {} as any,
          } as ProductosResponse);
        }),
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe();
  }

  // Eventos del ProductoCard
  onCarritoClick(evento: ProductoCardEventos): void {
    console.log('Agregando al carrito desde ProductoCard:', evento.producto);
    this.agregarAlCarritoClicked.emit(evento.producto);
  }

  onFavoritoToggle(evento: ProductoCardEventos): void {
    console.log('Toggle favorito desde ProductoCard:', evento.producto);
    this.toggleFavoritoClicked.emit(evento.producto);
  }

  onProductoClick(evento: ProductoCardEventos): void {
    console.log('Click en producto desde ProductoCard:', evento.producto);
    // Aquí puedes manejar la navegación o emitir otro evento si es necesario
  }

  // Métodos legacy para compatibilidad (pueden eliminarse después)
  agregarAlCarrito(producto: Producto, event: Event): void {
    event.stopPropagation();
    console.log('Intento de agregar al carrito:', producto);
    this.agregarAlCarritoClicked.emit(producto);
  }

  toggleFavorito(producto: Producto, event: Event): void {
    event.stopPropagation();
    console.log('Intento de cambiar favorito:', producto);
    this.toggleFavoritoClicked.emit(producto);
  }

  esFavorito(productoId: number): boolean {
    // console.log('Comprobando si es favorito (lógica dummy):', productoId);
    return false;
  }

  getImagenUrl(path: string | null): string {
    if (!path) return 'assets/imagenes/placeholder-producto.webp';
    return path.startsWith('http')
      ? path
      : `${this.productoService.baseUrlImagenes}${path}`;
  }

  getFechaFinOferta(producto: ProductoConOferta): Date | string {
    return (
      producto.fecha_fin_oferta ||
      new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    );
  }
}
