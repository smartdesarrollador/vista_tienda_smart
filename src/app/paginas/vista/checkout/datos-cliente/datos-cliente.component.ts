import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { DatosPersonales } from '../../../../core/models/checkout.interface';

@Component({
  selector: 'app-datos-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datos-cliente.component.html',
  styleUrl: './datos-cliente.component.css',
})
export class DatosClienteComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Signals
  datosPersonales = signal<DatosPersonales | null>(null);
  cargando = signal<boolean>(false);

  // Eventos de salida
  datosActualizados = output<DatosPersonales>();
  siguiente = output<void>();

  // Formulario reactivo
  datosForm: FormGroup;

  // Signal para el estado del formulario
  formularioValido = signal<boolean>(false);

  constructor() {
    this.datosForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      documento_tipo: ['DNI', Validators.required],
      documento_numero: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit(): void {
    this.cargarDatosUsuario();
    this.configurarSuscripciones();
    // Verificar estado inicial del formulario
    this.formularioValido.set(this.datosForm.valid);
  }

  private cargarDatosUsuario(): void {
    const usuario = this.authService.currentUser();
    if (usuario) {
      const datos: DatosPersonales = {
        nombre: usuario.name || '',
        apellidos: '',
        email: usuario.email || '',
        telefono: '',
        documento_tipo: 'DNI',
        documento_numero: '',
      };

      this.datosForm.patchValue(datos);
      this.datosPersonales.set(datos);
      this.emitirDatos();
    }
  }

  private configurarSuscripciones(): void {
    // Escuchar cambios en el formulario
    this.datosForm.valueChanges.subscribe((value) => {
      // Actualizar el estado de validez del formulario
      this.formularioValido.set(this.datosForm.valid);

      if (this.datosForm.valid) {
        const datos: DatosPersonales = {
          nombre: value.nombre,
          apellidos: value.apellidos,
          email: value.email,
          telefono: value.telefono,
          documento_tipo: value.documento_tipo,
          documento_numero: value.documento_numero,
        };

        this.datosPersonales.set(datos);
        this.emitirDatos();
      }
    });

    // También escuchar cambios en el estado del formulario
    this.datosForm.statusChanges.subscribe(() => {
      this.formularioValido.set(this.datosForm.valid);
    });
  }

  private emitirDatos(): void {
    if (this.datosPersonales()) {
      this.datosActualizados.emit(this.datosPersonales()!);
    }
  }

  onSiguiente(): void {
    if (this.formularioValido()) {
      this.siguiente.emit();
    }
  }

  // Getters para acceso fácil a los controles del formulario
  get nombre() {
    return this.datosForm.get('nombre');
  }
  get apellidos() {
    return this.datosForm.get('apellidos');
  }
  get email() {
    return this.datosForm.get('email');
  }
  get telefono() {
    return this.datosForm.get('telefono');
  }
  get documentoTipo() {
    return this.datosForm.get('documento_tipo');
  }
  get documentoNumero() {
    return this.datosForm.get('documento_numero');
  }
}
