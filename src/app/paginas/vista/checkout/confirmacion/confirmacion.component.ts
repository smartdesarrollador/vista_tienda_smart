import {
  Component,
  signal,
  computed,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  DatosPersonales,
  DireccionEnvio,
  MetodoEnvio,
  MetodoPago,
} from '../../../../core/models/checkout.interface';

@Component({
  selector: 'app-confirmacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmacion.component.html',
  styleUrl: './confirmacion.component.css',
})
export class ConfirmacionComponent implements OnInit {
  protected router = inject(Router);

  // Inputs
  pedidoId = input<number | null>(null);
  datosPersonales = input<DatosPersonales | null>(null);
  direccionEnvio = input<DireccionEnvio | null>(null);
  metodoEnvio = input<MetodoEnvio | null>(null);
  metodoPago = input<MetodoPago | null>(null);
  totalCarrito = input<number>(0);

  // Signals
  cargando = signal<boolean>(false);

  // Computed para formatear el número de pedido
  numeroPedidoFormateado = computed(() => {
    const id = this.pedidoId();
    return id ? `PED-${String(id).padStart(6, '0')}` : 'N/A';
  });

  // Computed para calcular el total final
  totalFinal = computed(() => {
    const subtotal = this.totalCarrito();
    const costoEnvio = this.metodoEnvio()?.precio || 0;
    return (subtotal + costoEnvio) * 1.18; // Incluye IGV
  });

  ngOnInit(): void {
    console.log('✅ Componente de confirmación inicializado');
    console.log('Pedido ID:', this.pedidoId());
  }

  irAMisPedidos(): void {
    this.router.navigate(['/cuenta/pedidos']);
  }

  continuarComprando(): void {
    this.router.navigate(['/']);
  }

  descargarComprobante(): void {
    // Aquí se implementaría la lógica para descargar el comprobante
    console.log('Descargando comprobante del pedido:', this.pedidoId());
    // TODO: Implementar descarga de comprobante
  }

  enviarPorEmail(): void {
    // Aquí se implementaría la lógica para enviar por email
    console.log('Enviando comprobante por email para pedido:', this.pedidoId());
    // TODO: Implementar envío por email
  }
}
