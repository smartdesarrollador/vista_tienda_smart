import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { CuentaUsuarioService } from '../../../../../core/services/cuenta-usuario.service';
import { InformacionCredito } from '../../../../../core/models/cuenta-usuario.interface';

@Component({
  selector: 'app-informacion-credito',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 class="text-2xl font-bold text-gray-900">Información de crédito</h1>
        <p class="text-gray-600 mt-1">
          Gestiona tu línea de crédito y revisa tu historial
        </p>
      </div>

      @if (isLoading()) {
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center"
      >
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"
        ></div>
        <p class="text-gray-600 mt-4">Cargando información de crédito...</p>
      </div>
      } @else if (informacionCredito()) {

      <!-- Estado de la cuenta -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Límite de crédito -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div
              class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                ></path>
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-sm font-medium text-gray-500">
                Límite de crédito
              </h3>
              <p class="text-2xl font-bold text-gray-900">
                S/ {{ informacionCredito()!.limite_credito }}
              </p>
            </div>
          </div>
        </div>

        <!-- Crédito disponible -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div
              class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-sm font-medium text-gray-500">
                Crédito disponible
              </h3>
              <p class="text-2xl font-bold text-green-600">
                S/ {{ informacionCredito()!.credito_disponible }}
              </p>
            </div>
          </div>
        </div>

        <!-- Saldo pendiente -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div
              class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-red-600"
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
            <div class="ml-4">
              <h3 class="text-sm font-medium text-gray-500">Crédito usado</h3>
              <p class="text-2xl font-bold text-red-600">
                S/ {{ informacionCredito()!.credito_usado }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Barra de progreso del crédito -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Uso del crédito
        </h2>

        <div class="mb-2 flex justify-between text-sm">
          <span class="text-gray-600">Utilizado</span>
          <span class="text-gray-900 font-medium">
            {{ porcentajeUtilizado() }}% (S/
            {{ informacionCredito()!.credito_usado }})
          </span>
        </div>

        <div class="w-full bg-gray-200 rounded-full h-3">
          <div
            class="h-3 rounded-full transition-all duration-300"
            [class.bg-green-500]="porcentajeUtilizado() <= 50"
            [class.bg-yellow-500]="
              porcentajeUtilizado() > 50 && porcentajeUtilizado() <= 80
            "
            [class.bg-red-500]="porcentajeUtilizado() > 80"
            [style.width.%]="porcentajeUtilizado()"
          ></div>
        </div>

        <div class="mt-2 text-xs text-gray-500">
          Límite total: S/ {{ informacionCredito()!.limite_credito }}
        </div>
      </div>

      <!-- Historial de transacciones -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">
            Historial de transacciones
          </h2>
        </div>

        @if (transacciones().length === 0) {
        <div class="p-8 text-center">
          <div
            class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            No hay transacciones
          </h3>
          <p class="text-gray-600">
            Aún no tienes movimientos en tu cuenta de crédito.
          </p>
        </div>
        } @else {
        <div class="divide-y divide-gray-200">
          @for (transaccion of transacciones(); track transaccion.id) {
          <div class="p-6 flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <!-- Icono del tipo de transacción -->
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center"
                [class.bg-red-100]="transaccion.tipo === 'cargo'"
                [class.bg-green-100]="transaccion.tipo === 'pago'"
                [class.bg-blue-100]="transaccion.tipo === 'ajuste'"
              >
                <svg
                  class="w-5 h-5"
                  [class.text-red-600]="transaccion.tipo === 'cargo'"
                  [class.text-green-600]="transaccion.tipo === 'pago'"
                  [class.text-blue-600]="transaccion.tipo === 'ajuste'"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  @if (transaccion.tipo === 'cargo') {
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16l-4-4m0 0l4-4m-4 4h18"
                  ></path>
                  } @else if (transaccion.tipo === 'pago') {
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  ></path>
                  } @else {
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                  }
                </svg>
              </div>

              <!-- Información de la transacción -->
              <div>
                <h3 class="text-sm font-medium text-gray-900">
                  {{ getTipoTransaccionTexto(transaccion.tipo) }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ transaccion.descripcion }}
                </p>
                <p class="text-xs text-gray-400 mt-1">
                  {{ formatearFecha(transaccion.created_at) }}
                </p>
              </div>
            </div>

            <!-- Monto -->
            <div class="text-right">
              <span
                class="text-lg font-semibold"
                [class.text-red-600]="transaccion.tipo === 'cargo'"
                [class.text-green-600]="transaccion.tipo === 'pago'"
                [class.text-blue-600]="transaccion.tipo === 'ajuste'"
              >
                {{ transaccion.tipo === 'cargo' ? '-' : '+' }}S/
                {{ transaccion.monto }}
              </span>

              @if (transaccion.pedido_numero) {
              <div class="text-xs text-gray-500 mt-1">
                Pedido #{{ transaccion.pedido_numero }}
              </div>
              }
            </div>
          </div>
          }
        </div>
        }
      </div>

      <!-- Información adicional -->
      <div class="bg-blue-50 rounded-lg p-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="w-5 h-5 text-blue-400"
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
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-blue-800">
              Información importante
            </h3>
            <div class="mt-2 text-sm text-blue-700">
              <ul class="list-disc list-inside space-y-1">
                <li>
                  Tu límite de crédito se renueva automáticamente al realizar
                  pagos.
                </li>
                <li>Los pagos pueden tomar hasta 24 horas en reflejarse.</li>
                <li>
                  Mantén un buen historial crediticio para aumentar tu límite.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      } @else {
      <!-- Sin información de crédito -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center"
      >
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
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            ></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          Sin línea de crédito
        </h3>
        <p class="text-gray-600 mb-6">
          Aún no tienes una línea de crédito asignada. Contáctanos para
          solicitar una evaluación.
        </p>
        <button
          class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Solicitar línea de crédito
        </button>
      </div>
      }
    </div>
  `,
})
export class InformacionCreditoComponent implements OnInit {
  private readonly cuentaUsuarioService = inject(CuentaUsuarioService);

  protected readonly informacionCredito = signal<InformacionCredito | null>(
    null
  );
  protected readonly transacciones = signal<any[]>([]);
  protected readonly isLoading = signal<boolean>(false);

  protected readonly porcentajeUtilizado = signal<number>(0);

  ngOnInit(): void {
    this.cargarInformacionCredito();
  }

  private cargarInformacionCredito(): void {
    this.isLoading.set(true);

    this.cuentaUsuarioService.getInformacionCredito().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.informacionCredito.set(response.data);
          this.transacciones.set(response.data.historial_credito || []);

          // Usar porcentaje precalculado
          const info = response.data;
          if (info) {
            this.porcentajeUtilizado.set(info.porcentaje_usado || 0);
          }
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando información de crédito:', error);
        this.isLoading.set(false);
      },
    });
  }

  protected getTipoTransaccionTexto(tipo: string): string {
    const textos: { [key: string]: string } = {
      cargo: 'Cargo por compra',
      pago: 'Pago recibido',
      ajuste: 'Ajuste de cuenta',
    };
    return textos[tipo] || tipo;
  }

  protected formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
