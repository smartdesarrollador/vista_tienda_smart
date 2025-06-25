import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// Servicios
import { CarritoService } from '../../../core/services/carrito.service';

// Sub-componentes
import { DatosClienteComponent } from './datos-cliente/datos-cliente.component';
import { EnvioResumenComponent } from './envio-resumen/envio-resumen.component';
import { PagoTarjetaIzipayComponent } from './pago-tarjeta-izipay/pago-tarjeta-izipay.component';
import { ConfirmacionComponent } from './confirmacion/confirmacion.component';

// Interfaces
import {
  DatosPersonales,
  DireccionEnvio,
  MetodoEnvio,
  MetodoPago,
  ItemCheckout,
} from '../../../core/models/checkout.interface';
import { ItemCarrito } from '../../../core/models/carrito.interface';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    DatosClienteComponent,
    EnvioResumenComponent,
    PagoTarjetaIzipayComponent,
    ConfirmacionComponent,
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private carritoService = inject(CarritoService);
  protected router = inject(Router);

  // Signals para estado reactivo
  pasoActual = signal<number>(1);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  // Datos del checkout
  datosPersonales = signal<DatosPersonales | null>(null);
  direccionEnvio = signal<DireccionEnvio | null>(null);
  metodoEnvio = signal<MetodoEnvio | null>(null);
  metodoPago = signal<MetodoPago | null>(null);
  pedidoFinalId = signal<number | null>(null);

  // Items del carrito convertidos al formato ItemCheckout
  itemsCarrito = computed(() => {
    return this.carritoService
      .items()
      .map((item) => this.convertirItemCarritoACheckout(item));
  });
  totalCarrito = computed(() => this.carritoService.total());

  // Validación de pasos
  paso1Valido = computed(() => !!this.datosPersonales());
  paso2Valido = computed(() => !!this.direccionEnvio() && !!this.metodoEnvio());
  paso3Valido = computed(() => !!this.metodoPago());

  // Suscripciones
  private suscripciones = new Subscription();

  // Configuración de pasos
  pasos = [
    { numero: 1, titulo: 'Datos del Cliente', icono: 'user', tiempo: '30 seg' },
    { numero: 2, titulo: 'Envío y Resumen', icono: 'truck', tiempo: '45 seg' },
    {
      numero: 3,
      titulo: 'Método de Pago',
      icono: 'credit-card',
      tiempo: '60 seg',
    },
    {
      numero: 4,
      titulo: 'Confirmación',
      icono: 'check-circle',
      tiempo: '15 seg',
    },
  ];

  ngOnInit(): void {
    this.verificarCarrito();
    this.configurarMetodoPagoDefecto();
  }

  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
  }

  private verificarCarrito(): void {
    if (this.itemsCarrito().length === 0) {
      this.router.navigate(['/carrito']);
      return;
    }
  }

  private configurarMetodoPagoDefecto(): void {
    // Configurar método de pago por defecto (tarjeta)
    const metodoPagoDefecto: MetodoPago = {
      id: 1,
      nombre: 'Tarjeta de Crédito/Débito',
      tipo: 'tarjeta_credito',
      descripcion: 'Pago seguro con Izipay',
      logo_url: '',
      activo: true,
      tiempo_procesamiento: 'Inmediato',
      tiempo_procesamiento_texto: 'Procesamiento inmediato',
      permite_cuotas: true,
      pais_disponible: ['PE'],
      moneda_soportada: 'PEN',
      es_tarjeta: true,
      es_billetera_digital: false,
      es_transferencia: false,
      es_efectivo: false,
    };
    this.metodoPago.set(metodoPagoDefecto);
  }

  // Métodos para navegación entre pasos
  irAPaso(paso: number): void {
    if (paso < this.pasoActual() || this.puedeAvanzarAPaso(paso)) {
      this.pasoActual.set(paso);
    }
  }

  puedeAvanzarAPaso(paso: number): boolean {
    switch (paso) {
      case 2:
        return this.paso1Valido();
      case 3:
        return this.paso1Valido() && this.paso2Valido();
      case 4:
        return this.paso1Valido() && this.paso2Valido() && this.paso3Valido();
      default:
        return true;
    }
  }

  // Event handlers para los sub-componentes

  // Paso 1: Datos del cliente
  onDatosPersonalesActualizados(datos: DatosPersonales): void {
    this.datosPersonales.set(datos);
  }

  onSiguienteDesdeCliente(): void {
    if (this.paso1Valido()) {
      this.pasoActual.set(2);
    }
  }

  // Paso 2: Envío y resumen
  onDireccionEnvioActualizada(direccion: DireccionEnvio): void {
    this.direccionEnvio.set(direccion);
  }

  onMetodoEnvioSeleccionado(metodo: MetodoEnvio): void {
    this.metodoEnvio.set(metodo);
  }

  onAnteriorDesdeEnvio(): void {
    this.pasoActual.set(1);
  }

  onSiguienteDesdeEnvio(): void {
    if (this.paso2Valido()) {
      this.pasoActual.set(3);
    }
  }

  // Paso 3: Pago
  onAnteriorDesdePago(): void {
    this.pasoActual.set(2);
  }

  onPagoExitoso(pedidoId: number): void {
    this.pedidoFinalId.set(pedidoId);
    this.pasoActual.set(4);
  }

  // Método para obtener el progreso visual
  getProgreso(): number {
    return (this.pasoActual() / this.pasos.length) * 100;
  }

  // Método para obtener clases CSS del paso
  getClasePaso(paso: number): string {
    if (paso < this.pasoActual()) return 'completed';
    if (paso === this.pasoActual()) return 'active';
    return 'pending';
  }

  // Método para convertir ItemCarrito a ItemCheckout
  private convertirItemCarritoACheckout(item: ItemCarrito): ItemCheckout {
    return {
      producto_id: item.producto_id,
      producto: {
        id: item.producto_id,
        nombre: item.nombre,
        imagen_principal: item.imagen,
        peso: item.peso,
      },
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      subtotal: item.subtotal,
      variacion_id: item.variacion_id,
      variacion: item.variacion
        ? {
            id: item.variacion_id || 0,
            nombre: item.variacion.talla || item.variacion.color?.nombre || '',
            color: item.variacion.color?.nombre,
            talla: item.variacion.talla,
          }
        : undefined,
    };
  }
}
