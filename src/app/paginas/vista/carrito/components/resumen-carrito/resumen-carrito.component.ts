import {
  Component,
  input,
  output,
  computed,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CarritoService } from '../../../../../core/services/carrito.service';
import { AuthService } from '../../../../../core/auth/services/auth.service';
import {
  ResumenCarrito,
  CuponDescuento,
  ValidacionCupon,
  AplicarCuponRequest,
} from '../../../../../core/models/carrito.interface';

@Component({
  selector: 'app-resumen-carrito',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './resumen-carrito.component.html',
  styleUrl: './resumen-carrito.component.css',
})
export class ResumenCarritoComponent implements OnInit {
  // Servicios inyectados
  private readonly carritoService = inject(CarritoService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Inputs
  readonly mostrarBotonCheckout = input<boolean>(true);
  readonly mostrarBotonContinuar = input<boolean>(true);
  readonly compacto = input<boolean>(false);
  readonly sticky = input<boolean>(true);

  // Outputs
  readonly checkoutClick = output<void>();
  readonly continuarClick = output<void>();

  // Signals locales
  readonly codigoCupon = signal<string>('');
  readonly aplicandoCupon = signal<boolean>(false);
  readonly errorCupon = signal<string>('');
  readonly mostrarFormularioCupon = signal<boolean>(false);

  // Computed signals
  readonly resumen = this.carritoService.resumen;
  readonly cuponAplicado = this.carritoService.cuponAplicado;
  readonly estaVacio = this.carritoService.estaVacio;
  readonly totalItems = this.carritoService.totalItems;
  readonly cargando = this.carritoService.cargando;

  readonly esUsuarioLogueado = computed(() =>
    this.authService.isAuthenticated()
  );

  readonly puedeIrAlCheckout = computed(
    () => !this.estaVacio() && !this.cargando()
  );

  readonly resumenFormateado = computed(() => {
    const resumen = this.resumen();
    return {
      ...resumen,
      subtotal_formatted: this.formatearPrecio(resumen.subtotal),
      descuentos_formatted: this.formatearPrecio(resumen.descuentos),
      impuestos_formatted: this.formatearPrecio(resumen.impuestos),
      costo_envio_formatted: this.formatearPrecio(resumen.costo_envio),
      total_formatted: this.formatearPrecio(resumen.total),
    };
  });

  readonly ahorroTotal = computed(() => {
    const resumen = this.resumen();
    return resumen.descuentos;
  });

  ngOnInit(): void {
    // Reset form cuando se quite un cupón
    if (!this.cuponAplicado()) {
      this.codigoCupon.set('');
      this.errorCupon.set('');
    }
  }

  /**
   * Formatear precio con símbolo de moneda
   */
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(precio);
  }

  /**
   * Formatear porcentaje de descuento
   */
  formatearPorcentaje(porcentaje: number): string {
    return `${Math.round(porcentaje)}%`;
  }

  /**
   * Aplicar cupón
   */
  aplicarCupon(): void {
    const codigo = this.codigoCupon().trim();

    if (!codigo) {
      this.errorCupon.set('Ingresa un código de cupón');
      return;
    }

    this.aplicandoCupon.set(true);
    this.errorCupon.set('');

    const request: AplicarCuponRequest = {
      codigo: codigo,
    };

    this.carritoService.aplicarCupon(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.codigoCupon.set('');
          this.mostrarFormularioCupon.set(false);
        } else {
          this.errorCupon.set(response.message || 'Error al aplicar cupón');
        }
      },
      error: () => {
        this.errorCupon.set('Error al aplicar cupón. Intenta nuevamente.');
      },
      complete: () => {
        this.aplicandoCupon.set(false);
      },
    });
  }

  /**
   * Remover cupón aplicado
   */
  removerCupon(): void {
    const cuponActual = this.carritoService.cuponAplicado();
    if (!cuponActual) return;

    this.carritoService.removerCupon(cuponActual.codigo).subscribe({
      next: () => {
        // El servicio maneja la actualización del estado
      },
      error: () => {
        console.error('Error al remover cupón');
      },
    });
  }

  /**
   * Toggle del formulario de cupón
   */
  toggleFormularioCupon(): void {
    this.mostrarFormularioCupon.update((valor) => !valor);
    if (this.mostrarFormularioCupon()) {
      this.errorCupon.set('');
    }
  }

  /**
   * Manejar envío del formulario de cupón
   */
  onSubmitCupon(event: Event): void {
    event.preventDefault();
    this.aplicarCupon();
  }

  /**
   * Emitir evento de checkout
   */
  onCheckoutClick(): void {
    console.log('onCheckoutClick ejecutado');
    console.log('puedeIrAlCheckout:', this.puedeIrAlCheckout());
    console.log('esUsuarioLogueado:', this.esUsuarioLogueado());
    console.log(
      'AuthService isAuthenticated:',
      this.authService.isAuthenticated()
    );

    if (this.puedeIrAlCheckout()) {
      if (this.esUsuarioLogueado()) {
        console.log('Emitiendo evento checkoutClick...');
        this.checkoutClick.emit();
      } else {
        console.log('Redirigiendo al login...');
        // Redirigir al login con URL de retorno al checkout
        this.router.navigate(['/auth/login'], {
          queryParams: { returnUrl: '/checkout' },
        });
      }
    } else {
      console.log('No puede ir al checkout - carrito vacío o cargando');
    }
  }

  /**
   * Emitir evento de continuar comprando
   */
  onContinuarClick(): void {
    this.continuarClick.emit();
  }

  /**
   * Calcular tiempo de entrega estimado
   */
  obtenerTiempoEntrega(): string {
    // Lógica para calcular tiempo de entrega basado en productos y ubicación
    // Por ahora retornamos un valor fijo
    return '2-3 días hábiles';
  }

  /**
   * Verificar si aplica envío gratis
   */
  aplicaEnvioGratis(): boolean {
    const montoMinimo = 150; // S/ 150 para envío gratis
    return this.resumen().subtotal >= montoMinimo;
  }

  /**
   * Calcular cuánto falta para envío gratis
   */
  faltaParaEnvioGratis(): number {
    const montoMinimo = 150;
    const subtotal = this.resumen().subtotal;
    return Math.max(0, montoMinimo - subtotal);
  }
}
