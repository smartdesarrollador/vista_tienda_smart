import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BannerCarouselComponent } from '../../../shared/banner-carousel/banner-carousel.component';
import { CategoriasDestacadasComponent } from './components/categorias-destacadas/categorias-destacadas.component';
import { ProductosDestacadosComponent } from './components/productos-destacados/productos-destacados.component';
import { ProductosOfertaComponent } from './components/productos-oferta/productos-oferta.component';
import { ProductosNuevosComponent } from './components/productos-nuevos/productos-nuevos.component';
import { TestimoniosComponent } from './components/testimonios/testimonios.component';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    RouterOutlet,
    BannerCarouselComponent,
    CategoriasDestacadasComponent,
    ProductosDestacadosComponent,
    ProductosOfertaComponent,
    ProductosNuevosComponent,
    TestimoniosComponent,
  ],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent {}
