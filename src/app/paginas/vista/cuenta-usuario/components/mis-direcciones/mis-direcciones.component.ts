import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import { CuentaUsuarioService } from '../../../../../core/services/cuenta-usuario.service';
import { Direccion } from '../../../../../core/models/direccion.interface';

// Interfaces locales
interface Ubigeo {
  id: number;
  nombre: string;
  codigo?: string;
}

interface DireccionEnvio extends Direccion {
  es_predeterminada?: boolean;
  referencia?: string;
  telefono?: string;
  instrucciones_entrega?: string;
  departamento_id?: number;
  provincia_id?: number;
  distrito_id?: number;
}

/**
 * 📍 Interfaz para el modal
 */
interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  direccion: DireccionEnvio | null;
}

/**
 * 📍 Componente Mis Direcciones
 *
 * Características:
 * - Lista de direcciones guardadas
 * - CRUD completo de direcciones
 * - Modal para crear/editar direcciones
 * - Formulario con validaciones
 * - Seleccionar dirección predeterminada
 * - Integración con ubigeo (departamentos, provincias, distritos)
 */
@Component({
  selector: 'app-mis-direcciones',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- 📄 Header con título y botón agregar -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Mis Direcciones</h1>
            <p class="text-gray-600 mt-1">Gestiona tus direcciones de envío</p>
          </div>

          <div class="mt-4 sm:mt-0">
            <button
              (click)="abrirModal('create')"
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              type="button"
            >
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                ></path>
              </svg>
              Agregar dirección
            </button>
          </div>
        </div>
      </div>

      <!-- 📋 Lista de direcciones -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        @if (isLoading()) {
        <!-- Estado de carga -->
        <div class="p-12 text-center">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"
          ></div>
          <p class="text-gray-600 mt-4">Cargando direcciones...</p>
        </div>
        } @else if (errorMessage()) {
        <!-- Estado de error -->
        <div class="p-12 text-center">
          <div
            class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            Error al cargar direcciones
          </h3>
          <p class="text-gray-600 mb-4">{{ errorMessage() }}</p>
          <button
            (click)="cargarDirecciones()"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Intentar nuevamente
          </button>
        </div>
        } @else if (direcciones().length === 0) {
        <!-- Estado vacío -->
        <div class="p-12 text-center">
          <div
            class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              ></path>
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              ></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            No tienes direcciones guardadas
          </h3>
          <p class="text-gray-600 mb-6">
            Agrega direcciones para acelerar el proceso de checkout en tus
            compras futuras.
          </p>
          <button
            (click)="abrirModal('create')"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Agregar primera dirección
          </button>
        </div>
        } @else {
        <!-- Lista de direcciones -->
        <div class="divide-y divide-gray-200">
          @for (direccion of direcciones(); track direccion.id) {
          <div
            class="p-6 hover:bg-gray-50 transition-colors"
            [class.bg-blue-50]="direccion.es_predeterminada"
            [class.border-l-4]="direccion.es_predeterminada"
            [class.border-blue-500]="direccion.es_predeterminada"
          >
            <div
              class="flex flex-col lg:flex-row lg:items-start lg:justify-between"
            >
              <!-- Información de la dirección -->
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900">
                    {{ direccion.referencia || 'Dirección sin título' }}
                  </h3>

                  @if (direccion.es_predeterminada) {
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <svg
                      class="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      ></path>
                    </svg>
                    Predeterminada
                  </span>
                  }
                </div>

                <div class="space-y-1 text-gray-600">
                  <div class="flex items-start">
                    <svg
                      class="w-4 h-4 mt-0.5 mr-2 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      ></path>
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                    </svg>
                    <div>
                      <div>{{ direccion.direccion }}</div>
                      <div>
                        {{ direccion.distrito }}, {{ direccion.provincia }}
                      </div>
                      <div>
                        {{ direccion.departamento }}
                        {{
                          direccion.codigo_postal
                            ? '- ' + direccion.codigo_postal
                            : ''
                        }}
                      </div>
                    </div>
                  </div>

                  @if (direccion.telefono) {
                  <div class="flex items-center">
                    <svg
                      class="w-4 h-4 mr-2 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      ></path>
                    </svg>
                    <span>{{ direccion.telefono }}</span>
                  </div>
                  } @if (direccion.instrucciones_entrega) {
                  <div class="flex items-start">
                    <svg
                      class="w-4 h-4 mt-0.5 mr-2 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <span class="text-sm">{{
                      direccion.instrucciones_entrega
                    }}</span>
                  </div>
                  }
                </div>
              </div>

              <!-- Acciones -->
              <div class="mt-4 lg:mt-0 lg:ml-6 flex flex-wrap gap-2">
                @if (!direccion.es_predeterminada) {
                <button
                  (click)="establecerPredeterminada(direccion)"
                  class="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  type="button"
                >
                  <svg
                    class="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    ></path>
                  </svg>
                  Predeterminada
                </button>
                }

                <button
                  (click)="abrirModal('edit', direccion)"
                  class="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  type="button"
                >
                  <svg
                    class="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    ></path>
                  </svg>
                  Editar
                </button>

                <button
                  (click)="eliminarDireccion(direccion)"
                  class="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  type="button"
                >
                  <svg
                    class="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
          }
        </div>
        }
      </div>
    </div>

    <!-- 🏗️ Modal para crear/editar dirección -->
    @if (modalState().isOpen) {
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto"
      >
        <!-- Header del modal -->
        <div
          class="flex items-center justify-between p-6 border-b border-gray-200"
        >
          <h2 class="text-xl font-semibold text-gray-900">
            {{
              modalState().mode === 'create'
                ? 'Agregar dirección'
                : 'Editar dirección'
            }}
          </h2>
          <button
            (click)="cerrarModal()"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
          >
            <svg
              class="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <!-- Formulario -->
        <form
          [formGroup]="direccionForm"
          (ngSubmit)="guardarDireccion()"
          class="p-6 space-y-4"
        >
          <!-- Referencia/Título -->
          <div>
            <label
              for="referencia"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Título de la dirección *
            </label>
            <input
              id="referencia"
              type="text"
              formControlName="referencia"
              placeholder="Ej: Casa, Trabajo, Casa de mamá..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              [class.border-red-500]="
                direccionForm.get('referencia')?.invalid &&
                direccionForm.get('referencia')?.touched
              "
            />
            @if (direccionForm.get('referencia')?.invalid &&
            direccionForm.get('referencia')?.touched) {
            <p class="text-red-500 text-sm mt-1">El título es requerido</p>
            }
          </div>

          <!-- Dirección completa -->
          <div>
            <label
              for="direccion"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Dirección completa *
            </label>
            <textarea
              id="direccion"
              formControlName="direccion"
              rows="3"
              placeholder="Ej: Av. Los Robles 123, Urb. San Patricio, Mz. A Lt. 15"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              [class.border-red-500]="
                direccionForm.get('direccion')?.invalid &&
                direccionForm.get('direccion')?.touched
              "
            ></textarea>
            @if (direccionForm.get('direccion')?.invalid &&
            direccionForm.get('direccion')?.touched) {
            <p class="text-red-500 text-sm mt-1">La dirección es requerida</p>
            }
          </div>

          <!-- Ubigeo: Departamento, Provincia, Distrito -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Departamento -->
            <div>
              <label
                for="departamento"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Departamento *
              </label>
              <select
                id="departamento"
                formControlName="departamento_id"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                (change)="onDepartamentoChange()"
                [class.border-red-500]="
                  direccionForm.get('departamento_id')?.invalid &&
                  direccionForm.get('departamento_id')?.touched
                "
              >
                <option value="">Seleccionar...</option>
                @if (departamentos()) { @for (departamento of departamentos();
                track departamento.id) {
                <option [value]="departamento.id">
                  {{ departamento.nombre }}
                </option>
                } }
              </select>
              @if (direccionForm.get('departamento_id')?.invalid &&
              direccionForm.get('departamento_id')?.touched) {
              <p class="text-red-500 text-sm mt-1">
                Selecciona un departamento
              </p>
              }
            </div>

            <!-- Provincia -->
            <div>
              <label
                for="provincia"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Provincia *
              </label>
              <select
                id="provincia"
                formControlName="provincia_id"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                (change)="onProvinciaChange()"
                [disabled]="!direccionForm.get('departamento_id')?.value"
                [class.border-red-500]="
                  direccionForm.get('provincia_id')?.invalid &&
                  direccionForm.get('provincia_id')?.touched
                "
              >
                <option value="">Seleccionar...</option>
                @if (provincias()) { @for (provincia of provincias(); track
                provincia.id) {
                <option [value]="provincia.id">{{ provincia.nombre }}</option>
                } }
              </select>
              @if (direccionForm.get('provincia_id')?.invalid &&
              direccionForm.get('provincia_id')?.touched) {
              <p class="text-red-500 text-sm mt-1">Selecciona una provincia</p>
              }
            </div>

            <!-- Distrito -->
            <div>
              <label
                for="distrito"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Distrito *
              </label>
              <select
                id="distrito"
                formControlName="distrito_id"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [disabled]="!direccionForm.get('provincia_id')?.value"
                [class.border-red-500]="
                  direccionForm.get('distrito_id')?.invalid &&
                  direccionForm.get('distrito_id')?.touched
                "
              >
                <option value="">Seleccionar...</option>
                @if (distritos()) { @for (distrito of distritos(); track
                distrito.id) {
                <option [value]="distrito.id">{{ distrito.nombre }}</option>
                } }
              </select>
              @if (direccionForm.get('distrito_id')?.invalid &&
              direccionForm.get('distrito_id')?.touched) {
              <p class="text-red-500 text-sm mt-1">Selecciona un distrito</p>
              }
            </div>
          </div>

          <!-- Código postal y teléfono -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Código postal -->
            <div>
              <label
                for="codigoPostal"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Código postal
              </label>
              <input
                id="codigoPostal"
                type="text"
                formControlName="codigo_postal"
                placeholder="Ej: 15001"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Teléfono -->
            <div>
              <label
                for="telefono"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Teléfono de contacto
              </label>
              <input
                id="telefono"
                type="tel"
                formControlName="telefono"
                placeholder="Ej: 987654321"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <!-- Instrucciones de entrega -->
          <div>
            <label
              for="instrucciones"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Instrucciones de entrega (opcional)
            </label>
            <textarea
              id="instrucciones"
              formControlName="instrucciones_entrega"
              rows="3"
              placeholder="Ej: Tocar el timbre 3 veces, preguntar por Juan..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          <!-- Establecer como predeterminada -->
          <div class="flex items-center">
            <input
              id="predeterminada"
              type="checkbox"
              formControlName="es_predeterminada"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              for="predeterminada"
              class="ml-2 block text-sm text-gray-900"
            >
              Establecer como dirección predeterminada
            </label>
          </div>

          <!-- Botones del modal -->
          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              (click)="cerrarModal()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              [disabled]="direccionForm.invalid || isSubmitting()"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              @if (isSubmitting()) {
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
                Guardando...
              </span>
              } @else {
              {{
                modalState().mode === 'create'
                  ? 'Crear dirección'
                  : 'Actualizar dirección'
              }}
              }
            </button>
          </div>
        </form>
      </div>
    </div>
    }
  `,
  styles: [
    `
      /* Animaciones para el modal */
      .modal-enter {
        animation: modalEnter 0.3s ease-out;
      }

      @keyframes modalEnter {
        from {
          opacity: 0;
          transform: scale(0.9) translateY(-10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      /* Mejoras de accesibilidad */
      select:disabled {
        background-color: #f3f4f6;
        cursor: not-allowed;
      }

      /* Estados de validación */
      .border-red-500 {
        border-color: #ef4444 !important;
      }
    `,
  ],
})
export class MisDireccionesComponent implements OnInit {
  private readonly cuentaUsuarioService = inject(CuentaUsuarioService);
  private readonly fb = inject(FormBuilder);

  // 🚦 Signals para gestión de estado
  protected readonly direcciones = signal<DireccionEnvio[]>([]);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly modalState = signal<ModalState>({
    isOpen: false,
    mode: 'create',
    direccion: null,
  });

  // 🌍 Signals para ubigeo
  protected readonly departamentos = signal<Ubigeo[]>([]);
  protected readonly provincias = signal<Ubigeo[]>([]);
  protected readonly distritos = signal<Ubigeo[]>([]);

  // 📊 Formulario reactivo
  protected readonly direccionForm: FormGroup = this.fb.group({
    referencia: ['', [Validators.required, Validators.minLength(3)]],
    direccion: ['', [Validators.required, Validators.minLength(10)]],
    departamento_id: ['', Validators.required],
    provincia_id: ['', Validators.required],
    distrito_id: ['', Validators.required],
    codigo_postal: [''],
    telefono: [''],
    instrucciones_entrega: [''],
    es_predeterminada: [false],
  });

  ngOnInit(): void {
    this.cargarDirecciones();
    this.cargarDepartamentos();
  }

  /**
   * 📂 Cargar direcciones del usuario
   */
  protected cargarDirecciones(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.cuentaUsuarioService.getDirecciones().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          // Mapeamos las direcciones con la propiedad es_predeterminada
          const direccionesArray = response.data.direcciones || [];
          const direccionesFormateadas = direccionesArray.map((dir: any) => ({
            ...dir,
            es_predeterminada: dir.predeterminada || false,
          }));
          this.direcciones.set(direccionesFormateadas);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          'Error al cargar las direcciones. Por favor, intenta nuevamente.'
        );
        this.isLoading.set(false);
        console.error('Error cargando direcciones:', error);
      },
    });
  }

  /**
   * 🌍 Cargar departamentos
   */
  private cargarDepartamentos(): void {
    this.cuentaUsuarioService.getDepartamentos().subscribe({
      next: (response) => {
        if (response.success) {
          this.departamentos.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error cargando departamentos:', error);
      },
    });
  }

  /**
   * 🌍 Cambio de departamento
   */
  protected onDepartamentoChange(): void {
    const departamentoId = this.direccionForm.get('departamento_id')?.value;

    // Limpiar selecciones dependientes
    this.direccionForm.patchValue({
      provincia_id: '',
      distrito_id: '',
    });

    this.provincias.set([]);
    this.distritos.set([]);

    if (departamentoId) {
      this.cuentaUsuarioService.getProvincias(departamentoId).subscribe({
        next: (response) => {
          if (response.success) {
            this.provincias.set(response.data);
          }
        },
        error: (error) => {
          console.error('Error cargando provincias:', error);
        },
      });
    }
  }

  /**
   * 🌍 Cambio de provincia
   */
  protected onProvinciaChange(): void {
    const provinciaId = this.direccionForm.get('provincia_id')?.value;

    // Limpiar distrito
    this.direccionForm.patchValue({
      distrito_id: '',
    });

    this.distritos.set([]);

    if (provinciaId) {
      this.cuentaUsuarioService.getDistritos(provinciaId).subscribe({
        next: (response) => {
          if (response.success) {
            this.distritos.set(response.data);
          }
        },
        error: (error) => {
          console.error('Error cargando distritos:', error);
        },
      });
    }
  }

  /**
   * 🏗️ Abrir modal
   */
  protected abrirModal(
    mode: 'create' | 'edit',
    direccion?: DireccionEnvio
  ): void {
    this.modalState.set({
      isOpen: true,
      mode,
      direccion: direccion || null,
    });

    if (mode === 'edit' && direccion) {
      this.direccionForm.patchValue({
        referencia: direccion.referencia,
        direccion: direccion.direccion,
        departamento_id: direccion.departamento_id,
        provincia_id: direccion.provincia_id,
        distrito_id: direccion.distrito_id,
        codigo_postal: direccion.codigo_postal,
        telefono: direccion.telefono,
        instrucciones_entrega: direccion.instrucciones_entrega,
        es_predeterminada: direccion.es_predeterminada,
      });

      // Cargar provincias y distritos si están seleccionados
      if (direccion.departamento_id) {
        this.onDepartamentoChange();
        setTimeout(() => {
          if (direccion.provincia_id) {
            this.direccionForm.patchValue({
              provincia_id: direccion.provincia_id,
            });
            this.onProvinciaChange();
            setTimeout(() => {
              if (direccion.distrito_id) {
                this.direccionForm.patchValue({
                  distrito_id: direccion.distrito_id,
                });
              }
            }, 100);
          }
        }, 100);
      }
    } else {
      this.direccionForm.reset({
        referencia: '',
        direccion: '',
        departamento_id: '',
        provincia_id: '',
        distrito_id: '',
        codigo_postal: '',
        telefono: '',
        instrucciones_entrega: '',
        es_predeterminada: false,
      });
    }
  }

  /**
   * ❌ Cerrar modal
   */
  protected cerrarModal(): void {
    this.modalState.set({
      isOpen: false,
      mode: 'create',
      direccion: null,
    });
    this.direccionForm.reset();
    this.provincias.set([]);
    this.distritos.set([]);
  }

  /**
   * 💾 Guardar dirección
   */
  protected guardarDireccion(): void {
    if (this.direccionForm.invalid) return;

    this.isSubmitting.set(true);
    const formData = this.direccionForm.value;
    const modal = this.modalState();

    const request$ =
      modal.mode === 'create'
        ? this.cuentaUsuarioService.crearDireccion(formData)
        : this.cuentaUsuarioService.actualizarDireccion(
            modal.direccion!.id,
            formData
          );

    request$.subscribe({
      next: (response) => {
        if (response.success) {
          this.cerrarModal();
          this.cargarDirecciones();
        }
        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.error('Error guardando dirección:', error);
        this.isSubmitting.set(false);
      },
    });
  }

  /**
   * ⭐ Establecer dirección predeterminada
   */
  protected establecerPredeterminada(direccion: DireccionEnvio): void {
    this.cuentaUsuarioService
      .establecerDireccionPredeterminada(direccion.id)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.cargarDirecciones();
          }
        },
        error: (error) => {
          console.error('Error estableciendo dirección predeterminada:', error);
        },
      });
  }

  /**
   * 🗑️ Eliminar dirección
   */
  protected eliminarDireccion(direccion: DireccionEnvio): void {
    if (
      confirm(
        `¿Estás seguro de que deseas eliminar la dirección "${direccion.referencia}"?`
      )
    ) {
      this.cuentaUsuarioService.eliminarDireccion(direccion.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.cargarDirecciones();
          }
        },
        error: (error) => {
          console.error('Error eliminando dirección:', error);
        },
      });
    }
  }
}
