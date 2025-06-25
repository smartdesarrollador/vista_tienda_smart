import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../../core/services/carrito.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import {
  ItemCarrito,
  ResumenCarrito,
  ProductoRelacionado,
  EventoCarrito,
  OpcionEnvio,
  DireccionEnvio,
  CuponDescuento,
} from '../../../core/models/carrito.interface';

// Importar componentes hijos
import { ListaItemsCarritoComponent } from './components/lista-items-carrito/lista-items-carrito.component';
import { CarritoVacioComponent } from './components/carrito-vacio/carrito-vacio.component';
import { ResumenCarritoComponent } from './components/resumen-carrito/resumen-carrito.component';
import { NotificacionesCarritoComponent } from './components/notificaciones-carrito/notificaciones-carrito.component';
import { CalculadoraEnvioComponent } from './components/calculadora-envio/calculadora-envio.component';
import { ItemsGuardadosComponent } from './components/items-guardados/items-guardados.component';
import { CuponesDescuentoComponent } from './components/cupones-descuento/cupones-descuento.component';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ListaItemsCarritoComponent,
    CarritoVacioComponent,
    ResumenCarritoComponent,
    NotificacionesCarritoComponent,
    CalculadoraEnvioComponent,
    ItemsGuardadosComponent,
    CuponesDescuentoComponent,
  ],
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.css',
})
export class CarritoComponent implements OnInit {
  // Servicios inyectados
  private readonly carritoService = inject(CarritoService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Signals locales para UI
  readonly mostrarResumen = signal<boolean>(true);
  readonly vistaMobil = signal<boolean>(false);
  readonly productosRelacionados = signal<ProductoRelacionado[]>([]);
  readonly cargandoRelacionados = signal<boolean>(false);

  // Computed signals para datos derivados
  readonly items = this.carritoService.items;
  readonly resumen = this.carritoService.resumen;
  readonly estaVacio = this.carritoService.estaVacio;
  readonly cargando = this.carritoService.cargando;
  readonly error = this.carritoService.error;
  readonly totalItems = this.carritoService.totalItems;

  readonly esUsuarioLogueado = computed(() =>
    this.authService.isAuthenticated()
  );

  readonly mostrarMensajeRegistro = computed(
    () => !this.esUsuarioLogueado() && !this.estaVacio()
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
      total_formatted: this.formatearPrecio(resumen.total),
    };
  });

  constructor() {
    // Detectar tamaño de pantalla
    if (typeof window !== 'undefined') {
      this.detectarVistaMobil();
      window.addEventListener('resize', () => this.detectarVistaMobil());
    }

    // Escuchar eventos del carrito
    this.carritoService.eventos$.subscribe((evento) => {
      if (evento) {
        this.manejarEventoCarrito(evento);
      }
    });
  }

  ngOnInit(): void {
    // Cargar carrito desde el servidor al inicializar
    this.carritoService.cargarCarrito().subscribe({
      next: (response) => {
        console.log('Carrito cargado desde servidor:', response);

        // Verificar disponibilidad de items después de cargar
        if (!this.estaVacio()) {
          this.verificarDisponibilidad();
        } else {
          // Cargar productos relacionados si el carrito está vacío
          this.cargarProductosRelacionados();
        }
      },
      error: (error) => {
        console.error('Error al cargar carrito:', error);
        // Si hay error, cargar productos relacionados
        this.cargarProductosRelacionados();
      },
    });
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
   * Ir al checkout
   */
  irAlCheckout(): void {
    if (!this.puedeIrAlCheckout()) {
      return;
    }

    // Si se llama desde el evento checkoutClick, ya se validó la autenticación
    // Solo verificamos si no está autenticado como fallback
    if (!this.esUsuarioLogueado()) {
      // Redirigir al login con return URL
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/checkout' },
      });
      return;
    }

    // Ir directamente al checkout
    console.log('Navegando al checkout...');
    this.router.navigate(['/checkout']);
  }

  /**
   * Continuar comprando
   */
  continuarComprando(): void {
    this.router.navigate(['/catalogo']);
  }

  /**
   * Limpiar todo el carrito
   */
  limpiarCarrito(): void {
    if (
      confirm(
        '¿Estás seguro de que quieres eliminar todos los productos del carrito?'
      )
    ) {
      this.carritoService.limpiarCarrito().subscribe({
        next: (response) => {
          if (response.success) {
            // El estado ya se actualiza automáticamente via signals
            this.cargarProductosRelacionados();
          }
        },
        error: (error) => {
          console.error('Error al limpiar carrito:', error);
        },
      });
    }
  }

  /**
   * Toggle del resumen en móvil
   */
  toggleResumen(): void {
    this.mostrarResumen.update((valor) => !valor);
  }

  /**
   * Verificar disponibilidad de todos los items
   */
  private verificarDisponibilidad(): void {
    this.carritoService.verificarDisponibilidad().subscribe({
      next: (itemsActualizados) => {
        // La actualización del estado se maneja automáticamente en el servicio
        console.log('Disponibilidad verificada:', itemsActualizados);
      },
      error: (error) => {
        console.error('Error al verificar disponibilidad:', error);
      },
    });
  }

  /**
   * Cargar productos relacionados para cuando el carrito esté vacío
   */
  private cargarProductosRelacionados(): void {
    this.cargandoRelacionados.set(true);

    this.carritoService.obtenerProductosRelacionados().subscribe({
      next: (productos) => {
        this.productosRelacionados.set(productos);
        this.cargandoRelacionados.set(false);
      },
      error: (error) => {
        console.error('Error al cargar productos relacionados:', error);
        this.cargandoRelacionados.set(false);
      },
    });
  }

  /**
   * Manejar eventos del carrito
   */
  private manejarEventoCarrito(evento: EventoCarrito): void {
    switch (evento.tipo) {
      case 'item_agregado':
        // Mostrar notificación de éxito
        break;
      case 'item_removido':
        // Si se queda vacío, cargar productos relacionados
        if (this.estaVacio()) {
          this.cargarProductosRelacionados();
        }
        break;
      case 'carrito_limpiado':
        this.cargarProductosRelacionados();
        break;
    }
  }

  /**
   * Detectar si es vista móvil
   */
  private detectarVistaMobil(): void {
    if (typeof window !== 'undefined') {
      this.vistaMobil.set(window.innerWidth < 768);
    }
  }

  /**
   * Ir al login manteniendo el carrito
   */
  irAlLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: '/carrito' },
    });
  }

  /**
   * Ir al registro
   */
  irAlRegistro(): void {
    this.router.navigate(['/auth/registro'], {
      queryParams: { returnUrl: '/carrito' },
    });
  }

  /**
   * Manejar selección de opción de envío
   */
  onOpcionEnvioSeleccionada(opcion: OpcionEnvio): void {
    console.log('Opción de envío seleccionada:', opcion);
    // Aquí se actualizaría el costo de envío en el carrito
    // En producción se llamaría al servicio para actualizar el envío
  }

  /**
   * Manejar actualización de dirección
   */
  onDireccionActualizada(direccion: DireccionEnvio): void {
    console.log('Dirección actualizada:', direccion);
    // Aquí se guardaría la dirección seleccionada
    // En producción se llamaría al servicio para guardar la dirección
  }

  /**
   * Manejar item movido desde lista de deseos al carrito
   */
  onItemMovidoAlCarrito(item: any): void {
    console.log('Item movido al carrito desde lista de deseos:', item);
    // El item ya fue agregado al carrito por el componente ItemsGuardados
    // Aquí podríamos mostrar una notificación adicional si es necesario
  }

  /**
   * Manejar eliminación de item de lista de deseos
   */
  onItemEliminado(item: any): void {
    console.log('Item eliminado de lista de deseos:', item);
    // Aquí podríamos mostrar una notificación de confirmación
  }

  /**
   * Manejar cupón aplicado
   */
  onCuponAplicado(cupon: CuponDescuento): void {
    console.log('Cupón aplicado:', cupon);
    // El servicio ya maneja la aplicación del cupón
  }

  /**
   * Manejar cupón eliminado
   */
  onCuponEliminado(codigo: string): void {
    console.log('Cupón eliminado:', codigo);
    // El servicio ya maneja la eliminación del cupón
  }
}
