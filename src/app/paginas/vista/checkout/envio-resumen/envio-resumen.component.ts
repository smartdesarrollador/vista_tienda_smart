import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  output,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  DireccionEnvio,
  MetodoEnvio,
} from '../../../../core/models/checkout.interface';

@Component({
  selector: 'app-envio-resumen',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './envio-resumen.component.html',
  styleUrl: './envio-resumen.component.css',
})
export class EnvioResumenComponent implements OnInit {
  private fb = inject(FormBuilder);

  // Inputs
  datosPersonales = input<any>(null);

  // Signals
  direccionEnvio = signal<DireccionEnvio | null>(null);
  metodoEnvio = signal<MetodoEnvio | null>(null);
  cargando = signal<boolean>(false);

  // Eventos de salida
  direccionActualizada = output<DireccionEnvio>();
  metodoEnvioSeleccionado = output<MetodoEnvio>();
  anterior = output<void>();
  siguiente = output<void>();

  // Formulario reactivo
  direccionForm: FormGroup;

  // Métodos de envío disponibles
  metodosEnvio = [
    {
      id: 1,
      nombre: 'Envío Regular',
      descripcion: 'Entrega de 3 a 5 días hábiles',
      precio: 10,
      tiempo_entrega: '3-5 días',
      activo: true,
    },
    {
      id: 2,
      nombre: 'Envío Express',
      descripcion: 'Entrega en 24 horas',
      precio: 20,
      tiempo_entrega: '24 horas',
      activo: true,
    },
  ];

  // Signal para el estado del formulario
  formularioValido = signal<boolean>(false);

  constructor() {
    this.direccionForm = this.fb.group({
      nombre_contacto: ['', [Validators.required, Validators.minLength(2)]],
      telefono_contacto: [
        '',
        [Validators.required, Validators.pattern(/^[0-9]{9}$/)],
      ],
      direccion: ['', [Validators.required, Validators.minLength(10)]],
      referencia: [''],
      departamento: ['Lima', Validators.required],
      provincia: ['Lima', Validators.required],
      distrito: ['Miraflores', Validators.required],
    });
  }

  ngOnInit(): void {
    this.configurarSuscripciones();
    this.precargarDatos();
    // Verificar estado inicial del formulario
    this.actualizarValidacionFormulario();
  }

  private precargarDatos(): void {
    // Precargar datos del cliente en el formulario de envío
    const datos = this.datosPersonales();
    if (datos) {
      this.direccionForm.patchValue({
        nombre_contacto: `${datos.nombre} ${datos.apellidos}`,
        telefono_contacto: datos.telefono,
      });
    }
  }

  private configurarSuscripciones(): void {
    // Escuchar cambios en el formulario
    this.direccionForm.valueChanges.subscribe((value) => {
      // Actualizar el estado de validez del formulario
      this.actualizarValidacionFormulario();

      if (this.direccionForm.valid) {
        const direccion: DireccionEnvio = {
          nombre_contacto: value.nombre_contacto,
          telefono_contacto: value.telefono_contacto,
          direccion: value.direccion,
          referencia: value.referencia,
          departamento: value.departamento,
          provincia: value.provincia,
          distrito: value.distrito,
        };

        this.direccionEnvio.set(direccion);
        this.direccionActualizada.emit(direccion);
      }
    });

    // También escuchar cambios en el estado del formulario
    this.direccionForm.statusChanges.subscribe(() => {
      this.actualizarValidacionFormulario();
    });
  }

  private actualizarValidacionFormulario(): void {
    const formularioValido = this.direccionForm.valid;
    const metodoSeleccionado = this.metodoEnvio() !== null;
    this.formularioValido.set(formularioValido && metodoSeleccionado);
  }

  seleccionarMetodoEnvio(id: number): void {
    const metodo = this.metodosEnvio.find((m) => m.id === id);
    if (metodo) {
      const metodoEnvio: MetodoEnvio = {
        id: metodo.id,
        nombre: metodo.nombre,
        descripcion: metodo.descripcion,
        precio: metodo.precio,
        tiempo_entrega: metodo.tiempo_entrega,
        activo: metodo.activo,
      };

      this.metodoEnvio.set(metodoEnvio);
      this.metodoEnvioSeleccionado.emit(metodoEnvio);
      // Actualizar validación después de seleccionar método de envío
      this.actualizarValidacionFormulario();
    }
  }

  onAnterior(): void {
    this.anterior.emit();
  }

  onSiguiente(): void {
    if (this.formularioValido()) {
      this.siguiente.emit();
    }
  }

  // Getters para acceso fácil a los controles del formulario
  get nombreContacto() {
    return this.direccionForm.get('nombre_contacto');
  }
  get telefonoContacto() {
    return this.direccionForm.get('telefono_contacto');
  }
  get direccion() {
    return this.direccionForm.get('direccion');
  }
  get referencia() {
    return this.direccionForm.get('referencia');
  }
  get departamento() {
    return this.direccionForm.get('departamento');
  }
  get provincia() {
    return this.direccionForm.get('provincia');
  }
  get distrito() {
    return this.direccionForm.get('distrito');
  }
}
