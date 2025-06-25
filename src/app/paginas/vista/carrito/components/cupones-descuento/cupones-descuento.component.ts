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
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CarritoService } from '../../../../../core/services/carrito.service';
import {
  CuponDescuento,
  ValidacionCupon,
  DescuentoAplicado,
} from '../../../../../core/models/carrito.interface';

interface CuponSugerido {
  id: number;
  codigo: string;
  descripcion: string;
  descuento_texto: string;
  condiciones: string;
  imagen?: string;
  destacado: boolean;
  categoria: 'envio' | 'porcentaje' | 'monto' | 'especial';
}

@Component({
  selector: 'app-cupones-descuento',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cupones-descuento.component.html',
  styleUrl: './cupones-descuento.component.css',
})
export class CuponesDescuentoComponent implements OnInit {
  // Servicios inyectados
  private readonly carritoService = inject(CarritoService);
  private readonly fb = inject(FormBuilder);

  // Inputs
  readonly compacto = input<boolean>(false);
  readonly mostrarSugerencias = input<boolean>(true);
  readonly maxCuponesSugeridos = input<number>(4);

  // Outputs
  readonly cuponAplicado = output<CuponDescuento>();
  readonly cuponEliminado = output<string>();

  // Signals para estado local
  readonly validandoCupon = signal<boolean>(false);
  readonly errorValidacion = signal<string>('');
  readonly cuponInput = signal<string>('');
  readonly cuponesSugeridos = signal<CuponSugerido[]>([]);
  readonly cargandoSugerencias = signal<boolean>(false);
  readonly mostrarFormulario = signal<boolean>(false);
  readonly mensajeExito = signal<string>('');

  // Form
  cuponForm!: FormGroup;

  // Computed signals
  readonly resumen = this.carritoService.resumen;
  readonly cuponesAplicados = computed(() =>
    this.resumen().descuentos_aplicados.filter((d) => d.tipo === 'cupon')
  );

  readonly totalDescuentos = computed(() =>
    this.cuponesAplicados().reduce((total, cupon) => total + cupon.monto, 0)
  );

  readonly puedeAplicarMasCupones = computed(
    () => this.cuponesAplicados().length < 3
  );

  readonly categoriasFiltradas = computed(() => {
    const categorias = [
      ...new Set(this.cuponesSugeridos().map((c) => c.categoria)),
    ];
    return categorias;
  });

  readonly cuponesPorCategoria = computed(() => {
    const cupones = this.cuponesSugeridos();
    return {
      envio: cupones.filter((c) => c.categoria === 'envio'),
      porcentaje: cupones.filter((c) => c.categoria === 'porcentaje'),
      monto: cupones.filter((c) => c.categoria === 'monto'),
      especial: cupones.filter((c) => c.categoria === 'especial'),
    };
  });

  readonly subtotalMinimo = computed(() => {
    // Calcular monto mínimo basado en cupones disponibles
    const montoCarrito = this.resumen().subtotal;
    return montoCarrito;
  });

  ngOnInit(): void {
    this.inicializarFormulario();
    if (this.mostrarSugerencias()) {
      this.cargarCuponesSugeridos();
    }
  }

  /**
   * Inicializar formulario de cupones
   */
  private inicializarFormulario(): void {
    this.cuponForm = this.fb.group({
      codigo: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          Validators.pattern(/^[A-Za-z0-9-_]+$/),
        ],
      ],
    });

    // Watcher para código de cupón
    this.cuponForm.get('codigo')?.valueChanges.subscribe((valor) => {
      this.cuponInput.set(valor?.toUpperCase() || '');
      this.errorValidacion.set('');
      this.mensajeExito.set('');
    });
  }

  /**
   * Cargar cupones sugeridos desde el servidor
   */
  private cargarCuponesSugeridos(): void {
    this.cargandoSugerencias.set(true);

    // Simulación de datos - en producción vendría de un servicio
    setTimeout(() => {
      const cuponesSugeridos: CuponSugerido[] = [
        {
          id: 1,
          codigo: 'PRIMERACOMPRA',
          descripcion: '15% de descuento en tu primera compra',
          descuento_texto: '15% OFF',
          condiciones: 'Mínimo S/ 100. Solo nuevos usuarios.',
          categoria: 'porcentaje',
          destacado: true,
        },
        {
          id: 2,
          codigo: 'ENVIOGRATIS',
          descripcion: 'Envío gratuito a nivel nacional',
          descuento_texto: 'Envío gratis',
          condiciones: 'Compras mayores a S/ 80',
          categoria: 'envio',
          destacado: true,
        },
        {
          id: 3,
          codigo: 'SAVE50',
          descripcion: 'S/ 50 de descuento en compras grandes',
          descuento_texto: '-S/ 50',
          condiciones: 'Mínimo S/ 300 en compras',
          categoria: 'monto',
          destacado: false,
        },
        {
          id: 4,
          codigo: 'COMBO25',
          descripcion: '25% OFF en productos seleccionados',
          descuento_texto: '25% OFF',
          condiciones: 'Solo en categoría Electrónicos',
          categoria: 'especial',
          destacado: false,
        },
        {
          id: 5,
          codigo: 'BLACKFRIDAY',
          descripcion: 'Mega descuento Black Friday',
          descuento_texto: '40% OFF',
          condiciones: 'Ofertas limitadas por tiempo',
          categoria: 'especial',
          destacado: true,
        },
      ];

      this.cuponesSugeridos.set(cuponesSugeridos);
      this.cargandoSugerencias.set(false);
    }, 800);
  }

  /**
   * Aplicar cupón desde formulario
   */
  aplicarCupon(): void {
    if (!this.cuponForm.valid || this.validandoCupon()) return;

    const codigo = this.cuponInput();
    this.validarYAplicarCupon(codigo);
  }

  /**
   * Aplicar cupón sugerido
   */
  aplicarCuponSugerido(cupon: CuponSugerido): void {
    this.cuponForm.patchValue({ codigo: cupon.codigo });
    this.validarYAplicarCupon(cupon.codigo);
  }

  /**
   * Validar y aplicar cupón
   */
  private validarYAplicarCupon(codigo: string): void {
    this.validandoCupon.set(true);
    this.errorValidacion.set('');
    this.mensajeExito.set('');

    // Simulación de validación - en producción llamaría al servicio
    this.carritoService.aplicarCupon({ codigo }).subscribe({
      next: (response) => {
        if (response.success) {
          this.mensajeExito.set(`Cupón "${codigo}" aplicado correctamente`);
          this.cuponForm.reset();
          this.mostrarFormulario.set(false);

          // Buscar datos del cupón para emitir
          const cuponSugerido = this.cuponesSugeridos().find(
            (c) => c.codigo === codigo
          );
          if (cuponSugerido) {
            const cuponCompleto: CuponDescuento = {
              id: cuponSugerido.id,
              codigo: cuponSugerido.codigo,
              descripcion: cuponSugerido.descripcion,
              tipo: 'porcentaje', // Esto vendría del servidor
              valor: 15, // Esto vendría del servidor
              fecha_inicio: new Date(),
              fecha_fin: new Date(),
              activo: true,
            };
            this.cuponAplicado.emit(cuponCompleto);
          }

          // Auto-ocultar mensaje después de 3 segundos
          setTimeout(() => this.mensajeExito.set(''), 3000);
        } else {
          this.errorValidacion.set(
            response.message || 'Error al aplicar el cupón'
          );
        }
        this.validandoCupon.set(false);
      },
      error: (error) => {
        console.error('Error al aplicar cupón:', error);
        this.errorValidacion.set('Error de conexión. Intenta nuevamente.');
        this.validandoCupon.set(false);
      },
    });
  }

  /**
   * Eliminar cupón aplicado
   */
  eliminarCupon(descuento: DescuentoAplicado): void {
    if (!descuento.codigo) return;

    this.carritoService.removerCupon(descuento.codigo).subscribe({
      next: (response) => {
        if (response.success) {
          this.cuponEliminado.emit(descuento.codigo!);
          this.mensajeExito.set('Cupón eliminado correctamente');
          setTimeout(() => this.mensajeExito.set(''), 3000);
        }
      },
      error: (error) => {
        console.error('Error al eliminar cupón:', error);
        this.errorValidacion.set('Error al eliminar el cupón');
      },
    });
  }

  /**
   * Toggle formulario de cupón
   */
  toggleFormulario(): void {
    this.mostrarFormulario.update((valor) => !valor);
    if (this.mostrarFormulario()) {
      this.cuponForm.reset();
      this.errorValidacion.set('');
      this.mensajeExito.set('');
    }
  }

  /**
   * Formatear precio
   */
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(precio);
  }

  /**
   * Obtener icono por categoría
   */
  obtenerIconoCategoria(categoria: string): string {
    const iconos = {
      envio: '🚚',
      porcentaje: '🎯',
      monto: '💰',
      especial: '⭐',
    };
    return iconos[categoria as keyof typeof iconos] || '🎫';
  }

  /**
   * Verificar si cupón está ya aplicado
   */
  cuponEstaAplicado(codigo: string): boolean {
    return this.cuponesAplicados().some((c) => c.codigo === codigo);
  }

  /**
   * Verificar si cupón puede aplicarse
   */
  puedeAplicarCupon(cupon: CuponSugerido): boolean {
    // Verificar si ya está aplicado
    const yaAplicado = this.cuponEstaAplicado(cupon.codigo);

    return !yaAplicado && this.puedeAplicarMasCupones();
  }

  /**
   * Obtener color de badge por categoría
   */
  obtenerColorCategoria(categoria: string): string {
    const colores = {
      envio: 'bg-blue-100 text-blue-800',
      porcentaje: 'bg-green-100 text-green-800',
      monto: 'bg-yellow-100 text-yellow-800',
      especial: 'bg-purple-100 text-purple-800',
    };
    return (
      colores[categoria as keyof typeof colores] || 'bg-gray-100 text-gray-800'
    );
  }

  /**
   * Verificar si formulario está válido
   */
  get formularioValido(): boolean {
    return this.cuponForm.valid && this.cuponInput().length >= 3;
  }

  /**
   * Limpiar todos los errores y mensajes
   */
  limpiarMensajes(): void {
    this.errorValidacion.set('');
    this.mensajeExito.set('');
  }
}
