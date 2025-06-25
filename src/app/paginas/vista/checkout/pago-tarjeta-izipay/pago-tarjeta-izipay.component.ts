import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  output,
  input,
  Renderer2,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

// Servicios
import { CheckoutService } from '../../../../core/services/checkout.service';

// Interfaces
import {
  DatosPersonales,
  DireccionEnvio,
  MetodoEnvio,
  SolicitudProcesarPedido,
  SolicitudFormTokenIzipay,
  ItemCheckout,
} from '../../../../core/models/checkout.interface';

// Importar la librería de Izipay
declare const KRGlue: any;

@Component({
  selector: 'app-pago-tarjeta-izipay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pago-tarjeta-izipay.component.html',
  styleUrl: './pago-tarjeta-izipay.component.css',
})
export class PagoTarjetaIzipayComponent implements OnInit, OnDestroy {
  private checkoutService = inject(CheckoutService);
  private renderer = inject(Renderer2);

  // ViewChild para el contenedor de Izipay
  @ViewChild('izipayContainer', { static: true }) izipayContainer?: ElementRef;

  // Inputs
  datosPersonales = input<DatosPersonales | null>(null);
  direccionEnvio = input<DireccionEnvio | null>(null);
  metodoEnvio = input<MetodoEnvio | null>(null);
  itemsCarrito = input<ItemCheckout[]>([]);
  totalCarrito = input<number>(0);

  // Signals
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);
  pedidoActualId = signal<number | null>(null);

  // Eventos de salida
  pagoExitoso = output<number>(); // Emite el ID del pedido
  anterior = output<void>();

  // Variables para Izipay
  private izipayFormToken: string = '';
  private izipayPublicKey: string = '';
  private suscripciones = new Subscription();

  // Computed para validar si se puede procesar el pago
  puedeProceserPago = computed(() => {
    return (
      this.datosPersonales() !== null &&
      this.direccionEnvio() !== null &&
      this.metodoEnvio() !== null &&
      this.itemsCarrito().length > 0
    );
  });

  ngOnInit(): void {
    console.log('🎯 Componente PagoTarjetaIzipay inicializado');
    // El formulario se cargará cuando el usuario haga clic en "Pagar Seguro"
  }

  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
  }

  async procesarPago(): Promise<void> {
    console.log('🔵 Iniciando proceso de pago con Izipay');

    if (!this.puedeProceserPago()) {
      this.error.set('Faltan datos para procesar el pago');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    try {
      // Crear el pedido preliminar
      await this.crearPedidoPreliminar();
    } catch (error) {
      console.error('❌ Error al procesar pago:', error);
      this.error.set('Error al procesar el pago');
      this.cargando.set(false);
    }
  }

  private async crearPedidoPreliminar(): Promise<void> {
    const solicitudPedido: SolicitudProcesarPedido = {
      datos_personales: this.datosPersonales()!,
      direccion_envio: this.direccionEnvio()!,
      metodo_envio: this.metodoEnvio()!,
      metodo_pago_id: 1, // Tarjeta de crédito
      items: this.itemsCarrito().map((item) => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
        variacion_id: item.variacion_id,
      })),
      subtotal: this.totalCarrito(),
      costo_envio: this.metodoEnvio()?.precio || 0,
      igv: this.totalCarrito() * 0.18,
      total: (this.totalCarrito() + (this.metodoEnvio()?.precio || 0)) * 1.18,
      moneda: 'PEN',
      pais: 'PE',
    };

    this.suscripciones.add(
      this.checkoutService.procesarPedido(solicitudPedido).subscribe({
        next: (respuestaPedido) => {
          console.log('✅ Pedido creado exitosamente:', respuestaPedido);

          if (!respuestaPedido || !respuestaPedido.pedido?.id) {
            throw new Error('Error al crear el pedido: Respuesta inválida');
          }

          this.pedidoActualId.set(respuestaPedido.pedido.id);
          this.generarFormToken(respuestaPedido.pedido.id);
        },
        error: (error) => {
          console.error('❌ Error al crear pedido:', error);
          this.error.set('Error al procesar el pedido preliminar');
          this.cargando.set(false);
        },
      })
    );
  }

  private generarFormToken(pedidoId: number): void {
    const solicitudToken: SolicitudFormTokenIzipay = {
      pedido_id: pedidoId,
      datos_personales: this.datosPersonales()!,
      direccion_envio: this.direccionEnvio()!,
    };

    this.suscripciones.add(
      this.checkoutService.generarFormTokenIzipay(solicitudToken).subscribe({
        next: (respuestaToken) => {
          console.log('✅ FormToken generado:', respuestaToken);

          if (respuestaToken.formToken && respuestaToken.publicKey) {
            this.izipayFormToken = respuestaToken.formToken;
            this.izipayPublicKey = respuestaToken.publicKey;

            // Cargar el formulario de Izipay
            setTimeout(() => this.inicializarFormularioIzipay(), 1000);
          } else {
            throw new Error('No se pudo generar el token de pago');
          }
        },
        error: (error) => {
          console.error('❌ Error al generar FormToken:', error);
          this.error.set(
            'Error al cargar el formulario de pago: ' +
              (error.error?.message || error.message)
          );
          this.cargando.set(false);
        },
      })
    );
  }

  private inicializarFormularioIzipay(): void {
    console.log('🔄 Inicializando formulario Izipay...');

    if (!this.izipayFormToken || !this.izipayPublicKey) {
      console.error('❌ Faltan credenciales de Izipay');
      this.error.set('Error: Faltan credenciales de pago');
      return;
    }

    // Cargar estilos de Izipay
    this.cargarEstilosIzipay();

    // Importar la librería dinámicamente y configurar Izipay
    import('@lyracom/embedded-form-glue')
      .then((KRGlue) => {
        const endpoint = 'https://static.micuentaweb.pe';

        console.log('📦 Cargando librería KRGlue...');

        KRGlue.default
          .loadLibrary(endpoint, this.izipayPublicKey)
          .then(({ KR }: any) => {
            console.log('✅ Librería KRGlue cargada correctamente');

            // Configurar el formulario
            KR.setFormConfig({
              formToken: this.izipayFormToken,
              'kr-language': 'es-ES',
            });

            // Verificar que el contenedor exista antes de adjuntar
            const contenedor = document.querySelector(
              '#micuentawebstd_rest_wrapper'
            );
            if (!contenedor) {
              console.error(
                '❌ Contenedor #micuentawebstd_rest_wrapper no encontrado'
              );
              this.error.set('Error: Contenedor de pago no disponible');
              return;
            }

            // Adjuntar el formulario al contenedor
            KR.attachForm('#micuentawebstd_rest_wrapper')
              .then(({ KR, result }: any) => {
                console.log('✅ Formulario adjuntado correctamente');
                KR.showForm(result.formId);

                // Limpiar el error si se cargó exitosamente
                this.error.set(null);
                this.cargando.set(false);
              })
              .catch((error: any) => {
                console.error('❌ Error al adjuntar formulario:', error);
                this.error.set('Error al cargar el formulario de pago');
                this.cargando.set(false);
              });

            // Configurar el callback de envío
            KR.onSubmit((paymentData: any) => {
              console.log('💳 Datos de pago recibidos:', paymentData);
              this.procesarRespuestaIzipay(paymentData);
            });

            // Configurar callback de error
            KR.onError((error: any) => {
              console.error('❌ Error en el formulario de Izipay:', error);
              this.error.set(
                'Error en el formulario de pago: ' + error.message
              );
            });
          })
          .catch((error: any) => {
            console.error('❌ Error al cargar librería KRGlue:', error);
            this.error.set('Error al cargar el formulario de pago');
            this.cargando.set(false);
          });
      })
      .catch((error: any) => {
        console.error(
          '❌ Error al importar @lyracom/embedded-form-glue:',
          error
        );
        this.error.set('Error al cargar las dependencias de pago');
        this.cargando.set(false);
      });
  }

  private cargarEstilosIzipay(): void {
    // Agregar estilos CSS
    const link = this.renderer.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://static.micuentaweb.pe/static/js/krypton-client/V4.0/ext/classic-reset.css';
    this.renderer.appendChild(document.head, link);

    // Agregar script
    const script = this.renderer.createElement('script');
    script.src =
      'https://static.micuentaweb.pe/static/js/krypton-client/V4.0/ext/classic.js';
    script.async = true;
    this.renderer.appendChild(document.body, script);
  }

  private async procesarRespuestaIzipay(paymentData: any): Promise<void> {
    try {
      console.log('🔄 Procesando respuesta de Izipay:', paymentData);
      this.cargando.set(true);

      // Extraer datos según la estructura de Izipay
      const krAnswer = paymentData.rawClientAnswer || paymentData.clientAnswer;
      const krHash = paymentData.hash;

      if (!krAnswer || !krHash) {
        throw new Error('Datos de pago incompletos');
      }

      // Validar el pago
      this.suscripciones.add(
        this.checkoutService
          .validarPagoIzipay({
            'kr-answer': krAnswer,
            'kr-hash': krHash,
            pedido_id: this.pedidoActualId() || undefined,
          })
          .subscribe({
            next: (validacion) => {
              console.log('✅ Validación exitosa:', validacion);

              if (validacion.order_status === 'PAID') {
                // Pago exitoso - emitir evento
                this.pagoExitoso.emit(this.pedidoActualId()!);
                this.error.set(null);
              } else {
                this.error.set(`Pago rechazado: ${validacion.order_status}`);
              }
              this.cargando.set(false);
            },
            error: (error) => {
              console.error('❌ Error validación:', error);
              this.error.set(
                'Error al validar el pago: ' +
                  (error.error?.message || error.message || 'Error desconocido')
              );
              this.cargando.set(false);
            },
          })
      );
    } catch (error) {
      console.error('❌ Error procesando respuesta de Izipay:', error);
      this.error.set('Error al procesar los datos del pago');
      this.cargando.set(false);
    }
  }

  reintentatCargarFormulario(): void {
    console.log('🔄 Reintentando cargar formulario de Izipay...');
    this.error.set(null);
    this.cargando.set(true);

    // Reiniciar el proceso de carga
    if (this.izipayFormToken && this.izipayPublicKey) {
      // Si ya tenemos tokens, solo reinicializar el formulario
      setTimeout(() => this.inicializarFormularioIzipay(), 500);
    } else {
      // Si no tenemos tokens, recargar todo el formulario
      this.procesarPago();
    }
  }

  onAnterior(): void {
    this.anterior.emit();
  }
}
