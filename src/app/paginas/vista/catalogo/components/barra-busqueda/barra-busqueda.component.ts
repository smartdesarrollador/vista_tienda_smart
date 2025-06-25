import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-barra-busqueda',
  standalone: true,
  imports: [],
  templateUrl: './barra-busqueda.component.html',
  styleUrl: './barra-busqueda.component.css',
})
export class BarraBusquedaComponent implements OnInit {
  ngOnInit(): void {
    console.log('🔧 BARRA-BUSQUEDA: ngOnInit - Componente inicializado');
  }

  onBusquedaChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    console.log('🔧 BARRA-BUSQUEDA: onBusquedaChange', { valor: target.value });
  }

  onBuscar(): void {
    console.log('🔧 BARRA-BUSQUEDA: onBuscar - Ejecutando búsqueda');
  }
}
