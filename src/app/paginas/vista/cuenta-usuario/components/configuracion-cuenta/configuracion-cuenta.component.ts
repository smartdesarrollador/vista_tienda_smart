import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import { CuentaUsuarioService } from '../../../../../core/services/cuenta-usuario.service';
import { AuthService } from '../../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-configuracion-cuenta',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 class="text-2xl font-bold text-gray-900">
          Configuración de la cuenta
        </h1>
        <p class="text-gray-600 mt-1">
          Actualiza tu información personal y configuraciones
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Información personal -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">
            Información personal
          </h2>

          <form
            [formGroup]="perfilForm"
            (ngSubmit)="actualizarPerfil()"
            class="space-y-4"
          >
            <!-- Avatar -->
            <div class="flex items-center space-x-4">
              <div
                class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden"
              >
                @if (usuario()?.avatar) {
                <img
                  [src]="usuario()!.avatar"
                  [alt]="usuario()!.nombre"
                  class="w-full h-full object-cover"
                />
                } @else {
                <svg
                  class="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  ></path>
                </svg>
                }
              </div>
              <button
                type="button"
                class="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cambiar foto
              </button>
            </div>

            <!-- Nombre -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Nombre completo</label
              >
              <input
                type="text"
                formControlName="nombre"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Correo electrónico</label
              >
              <input
                type="email"
                formControlName="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Teléfono -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Teléfono</label
              >
              <input
                type="tel"
                formControlName="telefono"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Fecha de nacimiento -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Fecha de nacimiento</label
              >
              <input
                type="date"
                formControlName="fecha_nacimiento"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              [disabled]="perfilForm.invalid || isUpdatingPerfil()"
              class="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              @if (isUpdatingPerfil()) {
              <span class="inline-flex items-center">
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Actualizando...
              </span>
              } @else { Actualizar perfil }
            </button>
          </form>
        </div>

        <!-- Cambiar contraseña -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">
            Cambiar contraseña
          </h2>

          <form
            [formGroup]="passwordForm"
            (ngSubmit)="cambiarPassword()"
            class="space-y-4"
          >
            <!-- Contraseña actual -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Contraseña actual</label
              >
              <input
                type="password"
                formControlName="password_actual"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Nueva contraseña -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Nueva contraseña</label
              >
              <input
                type="password"
                formControlName="password_nueva"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p class="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
            </div>

            <!-- Confirmar contraseña -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Confirmar nueva contraseña</label
              >
              <input
                type="password"
                formControlName="password_confirmacion"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              [disabled]="passwordForm.invalid || isUpdatingPassword()"
              class="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              @if (isUpdatingPassword()) {
              <span class="inline-flex items-center">
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Cambiando...
              </span>
              } @else { Cambiar contraseña }
            </button>
          </form>
        </div>
      </div>

      <!-- Preferencias -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Preferencias</h2>

        <div class="space-y-4">
          <!-- Notificaciones por email -->
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900">
                Notificaciones por email
              </h3>
              <p class="text-sm text-gray-500">
                Recibe actualizaciones sobre tus pedidos
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                [checked]="preferencias().notificaciones_email"
                class="sr-only peer"
              />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
              ></div>
            </label>
          </div>

          <!-- Newsletter -->
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900">Newsletter</h3>
              <p class="text-sm text-gray-500">
                Ofertas especiales y promociones
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                [checked]="preferencias().newsletter"
                class="sr-only peer"
              />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
              ></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ConfiguracionCuentaComponent implements OnInit {
  private readonly cuentaUsuarioService = inject(CuentaUsuarioService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly usuario = signal<any>(null);
  protected readonly preferencias = signal<any>({
    notificaciones_email: true,
    newsletter: false,
  });
  protected readonly isUpdatingPerfil = signal<boolean>(false);
  protected readonly isUpdatingPassword = signal<boolean>(false);

  protected readonly perfilForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
    fecha_nacimiento: [''],
  });

  protected readonly passwordForm: FormGroup = this.fb.group(
    {
      password_actual: ['', [Validators.required]],
      password_nueva: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmacion: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  ngOnInit(): void {
    this.cargarDatosUsuario();
  }

  private cargarDatosUsuario(): void {
    this.cuentaUsuarioService.getPerfilUsuario().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.usuario.set(response.data.usuario);
          this.preferencias.set(response.data.preferencias);

          this.perfilForm.patchValue({
            nombre: response.data.usuario.nombre,
            email: response.data.usuario.email,
            telefono: response.data.usuario.telefono,
            fecha_nacimiento: response.data.usuario.fecha_nacimiento,
          });
        }
      },
    });
  }

  protected actualizarPerfil(): void {
    if (this.perfilForm.valid) {
      this.isUpdatingPerfil.set(true);

      this.cuentaUsuarioService
        .actualizarPerfil(this.perfilForm.value)
        .subscribe({
          next: (response) => {
            if (response.status === 'success') {
              this.cargarDatosUsuario();
            }
            this.isUpdatingPerfil.set(false);
          },
          error: () => {
            this.isUpdatingPerfil.set(false);
          },
        });
    }
  }

  protected cambiarPassword(): void {
    if (this.passwordForm.valid) {
      this.isUpdatingPassword.set(true);

      this.cuentaUsuarioService
        .cambiarPassword(this.passwordForm.value)
        .subscribe({
          next: (response) => {
            if (response.status === 'success') {
              this.passwordForm.reset();
            }
            this.isUpdatingPassword.set(false);
          },
          error: () => {
            this.isUpdatingPassword.set(false);
          },
        });
    }
  }

  private passwordMatchValidator(group: FormGroup) {
    const password = group.get('password_nueva');
    const confirmPassword = group.get('password_confirmacion');

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }
}
