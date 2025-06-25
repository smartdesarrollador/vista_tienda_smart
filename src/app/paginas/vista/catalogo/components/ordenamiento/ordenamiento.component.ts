import { Component, OnInit, input, output } from '@angular/core';

@Component({
  selector: 'app-ordenamiento',
  standalone: true,
  imports: [],
  templateUrl: './ordenamiento.component.html',
  styleUrl: './ordenamiento.component.css',
})
export class OrdenamientoComponent implements OnInit {
  readonly ordenamientoActual = input<string>('relevancia');
  readonly ordenamientoCambiado = output<string>();

  ngOnInit(): void {
    console.log('🔧 ORDENAMIENTO: ngOnInit - Componente inicializado');
  }

  onOrdenamientoChange(ordenamiento: string): void {
    console.log('🔧 ORDENAMIENTO: onOrdenamientoChange', {
      ordenamientoAnterior: this.ordenamientoActual(),
      ordenamientoNuevo: ordenamiento,
    });
    this.ordenamientoCambiado.emit(ordenamiento);
  }
}
