import { Component, OnInit, input } from '@angular/core';

@Component({
  selector: 'app-grid-productos',
  standalone: true,
  imports: [],
  templateUrl: './grid-productos.component.html',
  styleUrl: './grid-productos.component.css',
})
export class GridProductosComponent implements OnInit {
  readonly productos = input<any[]>([]);
  readonly vista = input<'grid' | 'lista'>('grid');

  ngOnInit(): void {
    console.log('🔧 GRID-PRODUCTOS: ngOnInit - Componente inicializado');
  }

  ngOnChanges(): void {
    console.log('🔧 GRID-PRODUCTOS: ngOnChanges', {
      productos: this.productos().length,
      vista: this.vista(),
    });
  }
}
