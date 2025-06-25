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
  OpcionEnvio,
  CalculoEnvio,
  DireccionEnvio,
} from '../../../../../core/models/carrito.interface';

interface Departamento {
  id: string;
  nombre: string;
  provincias: Provincia[];
}

interface Provincia {
  id: string;
  nombre: string;
  distritos: Distrito[];
}

interface Distrito {
  id: string;
  nombre: string;
  codigo_postal: string;
  zona_envio: 'metropolitana' | 'urbana' | 'rural';
}

@Component({
  selector: 'app-calculadora-envio',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './calculadora-envio.component.html',
  styleUrl: './calculadora-envio.component.css',
})
export class CalculadoraEnvioComponent implements OnInit {
  // Servicios inyectados
  private readonly carritoService = inject(CarritoService);
  private readonly fb = inject(FormBuilder);

  // Inputs
  readonly compacto = input<boolean>(false);
  readonly mostrarDirecciones = input<boolean>(true);
  readonly mostrarMapaInteractivo = input<boolean>(false);

  // Outputs
  readonly opcionSeleccionada = output<OpcionEnvio>();
  readonly direccionActualizada = output<DireccionEnvio>();

  // Signals para estado local
  readonly calculando = signal<boolean>(false);
  readonly opcionesEnvio = signal<OpcionEnvio[]>([]);
  readonly opcionSeleccionadaLocal = signal<OpcionEnvio | null>(null);
  readonly errorCalculo = signal<string>('');
  readonly departamentos = signal<Departamento[]>([]);
  readonly provinciasDisponibles = signal<Provincia[]>([]);
  readonly distritosDisponibles = signal<Distrito[]>([]);
  readonly direccionesGuardadas = signal<DireccionEnvio[]>([]);
  readonly mostrarFormularioDireccion = signal<boolean>(false);
  readonly direccionSeleccionada = signal<DireccionEnvio | null>(null);

  // Form groups
  direccionForm!: FormGroup;

  // Computed signals
  readonly resumen = this.carritoService.resumen;
  readonly items = this.carritoService.items;
  readonly pesoTotal = computed(() =>
    this.items().reduce((total, item) => total + item.peso * item.cantidad, 0)
  );

  readonly tiempoEntregaMinimo = computed(() => {
    const opciones = this.opcionesEnvio();
    if (opciones.length === 0) return null;
    return Math.min(...opciones.map((o) => o.tiempo_entrega_min));
  });

  readonly tiempoEntregaMaximo = computed(() => {
    const opciones = this.opcionesEnvio();
    if (opciones.length === 0) return null;
    return Math.max(...opciones.map((o) => o.tiempo_entrega_max));
  });

  readonly puedeCalcular = computed(() => {
    const form = this.direccionForm;
    return form?.valid && !this.calculando();
  });

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarDepartamentos();
    this.cargarDireccionesGuardadas();
  }

  /**
   * Inicializar formulario de dirección
   */
  private inicializarFormulario(): void {
    this.direccionForm = this.fb.group({
      departamento: ['', [Validators.required]],
      provincia: ['', [Validators.required]],
      distrito: ['', [Validators.required]],
      direccion: ['', [Validators.required, Validators.minLength(10)]],
      referencia: [''],
      codigo_postal: [''],
      tipo_direccion: ['casa', [Validators.required]],
    });

    // Watchers para cascada de selección
    this.direccionForm.get('departamento')?.valueChanges.subscribe((value) => {
      this.onDepartamentoChange(value);
    });

    this.direccionForm.get('provincia')?.valueChanges.subscribe((value) => {
      this.onProvinciaChange(value);
    });

    this.direccionForm.get('distrito')?.valueChanges.subscribe((value) => {
      this.onDistritoChange(value);
    });
  }

  /**
   * Cargar departamentos desde API
   */
  private cargarDepartamentos(): void {
    // Simulación de datos - en producción vendría de un servicio
    const departamentosSimulados: Departamento[] = [
      {
        id: 'lima',
        nombre: 'Lima',
        provincias: [
          {
            id: 'lima',
            nombre: 'Lima',
            distritos: [
              {
                id: 'miraflores',
                nombre: 'Miraflores',
                codigo_postal: '15074',
                zona_envio: 'metropolitana',
              },
              {
                id: 'san-isidro',
                nombre: 'San Isidro',
                codigo_postal: '15073',
                zona_envio: 'metropolitana',
              },
              {
                id: 'surco',
                nombre: 'Santiago de Surco',
                codigo_postal: '15023',
                zona_envio: 'metropolitana',
              },
              {
                id: 'san-borja',
                nombre: 'San Borja',
                codigo_postal: '15021',
                zona_envio: 'metropolitana',
              },
            ],
          },
        ],
      },
      {
        id: 'arequipa',
        nombre: 'Arequipa',
        provincias: [
          {
            id: 'arequipa',
            nombre: 'Arequipa',
            distritos: [
              {
                id: 'arequipa',
                nombre: 'Arequipa',
                codigo_postal: '04001',
                zona_envio: 'urbana',
              },
              {
                id: 'cayma',
                nombre: 'Cayma',
                codigo_postal: '04017',
                zona_envio: 'urbana',
              },
            ],
          },
        ],
      },
    ];

    this.departamentos.set(departamentosSimulados);
  }

  /**
   * Cargar direcciones guardadas del usuario
   */
  private cargarDireccionesGuardadas(): void {
    // En producción vendría del servicio de usuario
    const direccionesSimuladas: DireccionEnvio[] = [
      {
        id: '1',
        alias: 'Casa',
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'Miraflores',
        direccion: 'Av. Larco 123, Miraflores',
        referencia: 'Frente al parque Kennedy',
        codigo_postal: '15074',
        tipo_direccion: 'casa',
        predeterminada: true,
      },
    ];

    this.direccionesGuardadas.set(direccionesSimuladas);
  }

  /**
   * Manejar cambio de departamento
   */
  onDepartamentoChange(departamentoId: string): void {
    const departamento = this.departamentos().find(
      (d) => d.id === departamentoId
    );
    this.provinciasDisponibles.set(departamento?.provincias || []);
    this.distritosDisponibles.set([]);

    // Reset campos dependientes
    this.direccionForm.patchValue({
      provincia: '',
      distrito: '',
      codigo_postal: '',
    });

    this.opcionesEnvio.set([]);
  }

  /**
   * Manejar cambio de provincia
   */
  onProvinciaChange(provinciaId: string): void {
    const provincia = this.provinciasDisponibles().find(
      (p) => p.id === provinciaId
    );
    this.distritosDisponibles.set(provincia?.distritos || []);

    // Reset campos dependientes
    this.direccionForm.patchValue({
      distrito: '',
      codigo_postal: '',
    });

    this.opcionesEnvio.set([]);
  }

  /**
   * Manejar cambio de distrito
   */
  onDistritoChange(distritoId: string): void {
    const distrito = this.distritosDisponibles().find(
      (d) => d.id === distritoId
    );
    if (distrito) {
      this.direccionForm.patchValue({
        codigo_postal: distrito.codigo_postal,
      });

      // Auto-calcular envío si el formulario está completo
      if (this.direccionForm.get('direccion')?.value) {
        this.calcularOpcionesEnvio();
      }
    }
  }

  /**
   * Calcular opciones de envío
   */
  calcularOpcionesEnvio(): void {
    if (!this.puedeCalcular()) return;

    this.calculando.set(true);
    this.errorCalculo.set('');

    const formValue = this.direccionForm.value;
    const distrito = this.distritosDisponibles().find(
      (d) => d.id === formValue.distrito
    );

    if (!distrito) {
      this.errorCalculo.set('Distrito no válido');
      this.calculando.set(false);
      return;
    }

    // Simulación de cálculo (en producción sería una llamada al servicio)
    setTimeout(() => {
      const opciones = this.generarOpcionesEnvio(distrito.zona_envio);
      this.opcionesEnvio.set(opciones);
      this.calculando.set(false);

      // Auto-seleccionar la opción más económica si no hay ninguna seleccionada
      if (opciones.length > 0 && !this.opcionSeleccionadaLocal()) {
        const masEconomica = opciones.reduce((min, current) =>
          current.precio < min.precio ? current : min
        );
        this.seleccionarOpcion(masEconomica);
      }
    }, 1500);
  }

  /**
   * Generar opciones de envío según zona
   */
  private generarOpcionesEnvio(zonaEnvio: string): OpcionEnvio[] {
    const pesoTotal = this.pesoTotal();
    const opciones: OpcionEnvio[] = [];

    const tarifasBase = {
      metropolitana: { express: 15, standard: 8, economico: 5 },
      urbana: { express: 25, standard: 15, economico: 10 },
      rural: { express: 40, standard: 25, economico: 18 },
    };

    const tarifas = tarifasBase[zonaEnvio as keyof typeof tarifasBase];

    // Express
    opciones.push({
      id: 'express',
      nombre: 'Envío Express',
      descripcion: 'Entrega rápida en el menor tiempo posible',
      precio: tarifas.express + Math.ceil(pesoTotal * 0.5),
      tiempo_entrega_min: 1,
      tiempo_entrega_max: 2,
      tiempo_unidad: 'dias',
      empresa: 'CourierExpress',
      incluye_seguro: true,
      incluye_tracking: true,
      logo_empresa: '/assets/logos/courier-express.png',
    });

    // Standard
    opciones.push({
      id: 'standard',
      nombre: 'Envío Standard',
      descripcion: 'Entrega confiable en tiempo estándar',
      precio: tarifas.standard + Math.ceil(pesoTotal * 0.3),
      tiempo_entrega_min: 2,
      tiempo_entrega_max: 4,
      tiempo_unidad: 'dias',
      empresa: 'EnvíosRápidos',
      incluye_seguro: true,
      incluye_tracking: true,
      logo_empresa: '/assets/logos/envios-rapidos.png',
    });

    // Económico
    opciones.push({
      id: 'economico',
      nombre: 'Envío Económico',
      descripcion: 'Opción más económica, perfecto para compras sin prisa',
      precio: tarifas.economico + Math.ceil(pesoTotal * 0.2),
      tiempo_entrega_min: 5,
      tiempo_entrega_max: 8,
      tiempo_unidad: 'dias',
      empresa: 'PostalNacional',
      incluye_seguro: false,
      incluye_tracking: false,
      logo_empresa: '/assets/logos/postal-nacional.png',
    });

    return opciones;
  }

  /**
   * Seleccionar opción de envío
   */
  seleccionarOpcion(opcion: OpcionEnvio): void {
    this.opcionSeleccionadaLocal.set(opcion);
    this.opcionSeleccionada.emit(opcion);
  }

  /**
   * Usar dirección guardada
   */
  usarDireccionGuardada(direccion: DireccionEnvio): void {
    this.direccionSeleccionada.set(direccion);

    // Buscar departamento, provincia y distrito
    const departamento = this.departamentos().find(
      (d) => d.nombre === direccion.departamento
    );
    if (departamento) {
      const provincia = departamento.provincias.find(
        (p) => p.nombre === direccion.provincia
      );
      if (provincia) {
        const distrito = provincia.distritos.find(
          (d) => d.nombre === direccion.distrito
        );

        // Actualizar cascada
        this.provinciasDisponibles.set(departamento.provincias);
        this.distritosDisponibles.set(provincia.distritos);

        // Llenar formulario
        this.direccionForm.patchValue({
          departamento: departamento.id,
          provincia: provincia.id,
          distrito: distrito?.id || '',
          direccion: direccion.direccion,
          referencia: direccion.referencia,
          codigo_postal: direccion.codigo_postal,
          tipo_direccion: direccion.tipo_direccion,
        });

        this.mostrarFormularioDireccion.set(false);
        this.calcularOpcionesEnvio();
      }
    }
  }

  /**
   * Toggle formulario de nueva dirección
   */
  toggleFormularioDireccion(): void {
    this.mostrarFormularioDireccion.update((valor) => !valor);
    if (this.mostrarFormularioDireccion()) {
      this.direccionSeleccionada.set(null);
      this.direccionForm.reset();
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
   * Formatear tiempo de entrega
   */
  formatearTiempoEntrega(opcion: OpcionEnvio): string {
    if (opcion.tiempo_entrega_min === opcion.tiempo_entrega_max) {
      return `${opcion.tiempo_entrega_min} ${opcion.tiempo_unidad}`;
    }
    return `${opcion.tiempo_entrega_min}-${opcion.tiempo_entrega_max} ${opcion.tiempo_unidad}`;
  }

  /**
   * Guardar nueva dirección
   */
  guardarDireccion(): void {
    if (!this.direccionForm.valid) return;

    const formValue = this.direccionForm.value;
    const nuevaDireccion: DireccionEnvio = {
      id: Date.now().toString(),
      alias: `${formValue.tipo_direccion === 'casa' ? 'Casa' : 'Oficina'} ${
        this.direccionesGuardadas().length + 1
      }`,
      departamento:
        this.departamentos().find((d) => d.id === formValue.departamento)
          ?.nombre || '',
      provincia:
        this.provinciasDisponibles().find((p) => p.id === formValue.provincia)
          ?.nombre || '',
      distrito:
        this.distritosDisponibles().find((d) => d.id === formValue.distrito)
          ?.nombre || '',
      direccion: formValue.direccion,
      referencia: formValue.referencia,
      codigo_postal: formValue.codigo_postal,
      tipo_direccion: formValue.tipo_direccion,
      predeterminada: this.direccionesGuardadas().length === 0,
    };

    this.direccionesGuardadas.update((direcciones) => [
      ...direcciones,
      nuevaDireccion,
    ]);
    this.direccionActualizada.emit(nuevaDireccion);
  }
}
