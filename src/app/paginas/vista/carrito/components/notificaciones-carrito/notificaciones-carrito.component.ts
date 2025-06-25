import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../../../../core/services/carrito.service';
import { EventoCarrito } from '../../../../../core/models/carrito.interface';
import { Subscription } from 'rxjs';

interface NotificacionCarrito {
  id: string;
  tipo: 'success' | 'error' | 'warning' | 'info';
  titulo: string;
  mensaje: string;
  icono: string;
  duracion: number;
  accion?: {
    texto: string;
    callback: () => void;
  };
  timestamp: Date;
  visible: boolean;
}

@Component({
  selector: 'app-notificaciones-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notificaciones-carrito.component.html',
  styleUrl: './notificaciones-carrito.component.css',
})
export class NotificacionesCarritoComponent implements OnInit, OnDestroy {
  // Servicios inyectados
  private readonly carritoService = inject(CarritoService);

  // Signals para notificaciones
  readonly notificaciones = signal<NotificacionCarrito[]>([]);
  readonly maxNotificaciones = signal<number>(5);

  // Subscription para eventos del carrito
  private eventosSubscription?: Subscription;

  // Computed signals
  readonly notificacionesVisibles = computed(() =>
    this.notificaciones().filter((n) => n.visible)
  );

  readonly tieneNotificaciones = computed(
    () => this.notificacionesVisibles().length > 0
  );

  ngOnInit(): void {
    // Suscribirse a eventos del carrito
    this.eventosSubscription = this.carritoService.eventos$.subscribe(
      (evento) => {
        if (evento) {
          this.procesarEventoCarrito(evento);
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.eventosSubscription?.unsubscribe();
  }

  /**
   * Procesar eventos del carrito y crear notificaciones
   */
  private procesarEventoCarrito(evento: EventoCarrito): void {
    let notificacion: Partial<NotificacionCarrito> = {
      id: `${evento.tipo}_${Date.now()}`,
      timestamp: evento.timestamp,
      visible: true,
      duracion: 4000, // 4 segundos por defecto
    };

    switch (evento.tipo) {
      case 'item_agregado':
        notificacion = {
          ...notificacion,
          tipo: 'success',
          titulo: '¡Producto agregado!',
          mensaje: `${evento.item?.nombre} se agregó al carrito`,
          icono: 'check-circle',
          accion: {
            texto: 'Ver carrito',
            callback: () => this.irAlCarrito(),
          },
        };
        break;

      case 'item_removido':
        notificacion = {
          ...notificacion,
          tipo: 'info',
          titulo: 'Producto eliminado',
          mensaje: `${evento.item?.nombre} se eliminó del carrito`,
          icono: 'trash',
          duracion: 3000,
        };
        break;

      case 'cantidad_actualizada':
        notificacion = {
          ...notificacion,
          tipo: 'info',
          titulo: 'Cantidad actualizada',
          mensaje: `${evento.item?.nombre}: ${evento.cantidad_anterior} → ${evento.cantidad_nueva}`,
          icono: 'refresh',
          duracion: 3000,
        };
        break;

      case 'cupon_aplicado':
        notificacion = {
          ...notificacion,
          tipo: 'success',
          titulo: '¡Cupón aplicado!',
          mensaje: `Código "${evento.cupon}" aplicado correctamente`,
          icono: 'tag',
          duracion: 5000,
          accion: {
            texto: 'Ver descuento',
            callback: () => this.scrollToResumen(),
          },
        };
        break;

      case 'carrito_limpiado':
        notificacion = {
          ...notificacion,
          tipo: 'warning',
          titulo: 'Carrito limpiado',
          mensaje: 'Todos los productos fueron eliminados del carrito',
          icono: 'exclamation-triangle',
          duracion: 4000,
        };
        break;

      default:
        return; // No crear notificación para eventos no manejados
    }

    this.agregarNotificacion(notificacion as NotificacionCarrito);
  }

  /**
   * Agregar nueva notificación
   */
  private agregarNotificacion(notificacion: NotificacionCarrito): void {
    const notificaciones = this.notificaciones();

    // Limitar número máximo de notificaciones
    if (notificaciones.length >= this.maxNotificaciones()) {
      // Remover la más antigua
      const masAntigua = notificaciones[0];
      this.removerNotificacion(masAntigua.id);
    }

    // Agregar nueva notificación
    this.notificaciones.update((current) => [...current, notificacion]);

    // Auto-remover después de la duración especificada
    setTimeout(() => {
      this.removerNotificacion(notificacion.id);
    }, notificacion.duracion);
  }

  /**
   * Crear notificación manual (para uso externo)
   */
  mostrarNotificacion(
    tipo: NotificacionCarrito['tipo'],
    titulo: string,
    mensaje: string,
    duracion: number = 4000,
    accion?: NotificacionCarrito['accion']
  ): void {
    const notificacion: NotificacionCarrito = {
      id: `manual_${Date.now()}`,
      tipo,
      titulo,
      mensaje,
      icono: this.getIconoPorTipo(tipo),
      duracion,
      accion,
      timestamp: new Date(),
      visible: true,
    };

    this.agregarNotificacion(notificacion);
  }

  /**
   * Remover notificación por ID
   */
  removerNotificacion(id: string): void {
    this.notificaciones.update((current) =>
      current.map((n) => (n.id === id ? { ...n, visible: false } : n))
    );

    // Remover definitivamente después de la animación
    setTimeout(() => {
      this.notificaciones.update((current) =>
        current.filter((n) => n.id !== id)
      );
    }, 300);
  }

  /**
   * Limpiar todas las notificaciones
   */
  limpiarNotificaciones(): void {
    this.notificaciones.update((current) =>
      current.map((n) => ({ ...n, visible: false }))
    );

    setTimeout(() => {
      this.notificaciones.set([]);
    }, 300);
  }

  /**
   * Ejecutar acción de notificación
   */
  ejecutarAccion(notificacion: NotificacionCarrito): void {
    if (notificacion.accion) {
      notificacion.accion.callback();
      this.removerNotificacion(notificacion.id);
    }
  }

  /**
   * Obtener icono SVG por tipo
   */
  getIconoPorTipo(tipo: NotificacionCarrito['tipo']): string {
    const iconos = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'exclamation-triangle',
      info: 'information-circle',
    };
    return iconos[tipo];
  }

  /**
   * Obtener clases CSS por tipo
   */
  getClasesPorTipo(tipo: NotificacionCarrito['tipo']): string {
    const clases = {
      success: 'bg-green-50 border-green-200 text-green-900',
      error: 'bg-red-50 border-red-200 text-red-900',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      info: 'bg-blue-50 border-blue-200 text-blue-900',
    };
    return clases[tipo];
  }

  /**
   * Obtener clases de icono por tipo
   */
  getClasesIconoPorTipo(tipo: NotificacionCarrito['tipo']): string {
    const clases = {
      success: 'text-green-400',
      error: 'text-red-400',
      warning: 'text-yellow-400',
      info: 'text-blue-400',
    };
    return clases[tipo];
  }

  /**
   * Obtener clases de botón por tipo
   */
  getClasesBotonPorTipo(tipo: NotificacionCarrito['tipo']): string {
    const clases = {
      success: 'text-green-600 hover:text-green-800',
      error: 'text-red-600 hover:text-red-800',
      warning: 'text-yellow-600 hover:text-yellow-800',
      info: 'text-blue-600 hover:text-blue-800',
    };
    return clases[tipo];
  }

  /**
   * Formatear tiempo relativo
   */
  formatearTiempo(timestamp: Date): string {
    const ahora = new Date();
    const diff = ahora.getTime() - timestamp.getTime();
    const segundos = Math.floor(diff / 1000);

    if (segundos < 60) return 'Ahora';
    if (segundos < 3600) return `${Math.floor(segundos / 60)}m`;
    return `${Math.floor(segundos / 3600)}h`;
  }

  /**
   * Navegar al carrito
   */
  private irAlCarrito(): void {
    // Este método se puede expandir para incluir navegación
    console.log('Navegando al carrito...');
  }

  /**
   * Scroll al resumen del carrito
   */
  private scrollToResumen(): void {
    const elemento = document.querySelector('[data-carrito-resumen]');
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}
