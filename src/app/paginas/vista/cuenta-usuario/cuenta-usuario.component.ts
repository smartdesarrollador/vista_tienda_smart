import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterModule,
  ActivatedRoute,
  NavigationEnd,
} from '@angular/router';
import { filter } from 'rxjs';

import { CuentaUsuarioService } from '../../../core/services/cuenta-usuario.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import {
  DashboardUsuario,
  EstadisticasUsuario,
} from '../../../core/models/cuenta-usuario.interface';
import { User } from '../../../core/models/user.model';

import { MenuCuentaComponent } from './components/menu-cuenta/menu-cuenta.component';
import { DashboardUsuarioComponent } from './components/dashboard-usuario/dashboard-usuario.component';

/**
 * 👤 Componente principal de Cuenta de Usuario
 *
 * Características:
 * - Layout responsive con sidebar y contenido
 * - Navegación dinámica entre secciones
 * - Gestión de estado con signals
 * - Protección de rutas para usuarios autenticados
 * - Breadcrumbs dinámicos
 */
@Component({
  selector: 'app-cuenta-usuario',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MenuCuentaComponent,
    DashboardUsuarioComponent,
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- 📱 Header móvil con menú hamburguesa -->
      <div class="lg:hidden bg-white shadow-sm border-b sticky top-0 z-40">
        <div class="px-4 py-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <button
                (click)="toggleMobileMenu()"
                class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                type="button"
                aria-label="Abrir menú"
              >
                <svg
                  class="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  ></path>
                </svg>
              </button>

              <div class="flex items-center space-x-2">
                <div
                  class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                >
                  <span class="text-white text-sm font-semibold">
                    {{
                      (usuarioActual()?.name ?? 'Usuario')
                        .charAt(0)
                        .toUpperCase()
                    }}
                  </span>
                </div>
                <div>
                  <h1 class="text-lg font-semibold text-gray-900">Mi Cuenta</h1>
                  <p class="text-sm text-gray-500 capitalize">
                    {{ seccionActual() }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Notificaciones móvil -->
            <div class="relative">
              <button
                class="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                type="button"
                aria-label="Notificaciones"
              >
                <svg
                  class="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 17h5l-5-5V9a4 4 0 00-8 0v3l-5 5h5m0 0v1a2 2 0 002 2h2a2 2 0 002-2v-1"
                  ></path>
                </svg>
                @if (notificacionesNoLeidas() > 0) {
                <span
                  class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
                >
                  {{
                    notificacionesNoLeidas() > 99
                      ? '99+'
                      : notificacionesNoLeidas()
                  }}
                </span>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto lg:px-8">
        <div class="lg:grid lg:grid-cols-12 lg:gap-8">
          <!-- 📋 Sidebar de navegación - Desktop -->
          <div class="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div class="sticky top-8">
              <app-menu-cuenta
                [usuario]="usuarioActual()"
                [estadisticas]="estadisticasActuales()"
                [seccionActiva]="seccionActual()"
                [notificacionesNoLeidas]="notificacionesNoLeidas()"
                (seccionSeleccionada)="navegarASeccion($event)"
              />
            </div>
          </div>

          <!-- 📋 Sidebar móvil overlay -->
          @if (menuMovilAbierto()) {
          <div
            class="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
            (click)="cerrarMenuMovil()"
          >
            <div
              class="fixed inset-y-0 left-0 w-80 bg-white shadow-xl transform transition-transform duration-300"
              (click)="$event.stopPropagation()"
            >
              <!-- Header del menú móvil -->
              <div class="flex items-center justify-between px-4 py-4 border-b">
                <h2 class="text-lg font-semibold text-gray-900">Mi Cuenta</h2>
                <button
                  (click)="cerrarMenuMovil()"
                  class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  type="button"
                  aria-label="Cerrar menú"
                >
                  <svg
                    class="w-6 h-6 text-gray-600"
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

              <!-- Menú móvil -->
              <div class="flex-1 overflow-y-auto py-4">
                <app-menu-cuenta
                  [usuario]="usuarioActual()"
                  [estadisticas]="estadisticasActuales()"
                  [seccionActiva]="seccionActual()"
                  [notificacionesNoLeidas]="notificacionesNoLeidas()"
                  [esMobile]="true"
                  (seccionSeleccionada)="navegarASeccionMovil($event)"
                />
              </div>
            </div>
          </div>
          }

          <!-- 📄 Área de contenido principal -->
          <main class="lg:col-span-8 xl:col-span-9">
            <div class="px-4 lg:px-0 py-6 lg:py-8">
              <!-- Breadcrumb - Solo desktop -->
              <nav class="hidden lg:flex mb-6" aria-label="Breadcrumb">
                <ol class="flex items-center space-x-2 text-sm">
                  <li>
                    <a
                      routerLink="/"
                      class="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Inicio
                    </a>
                  </li>
                  <li class="flex items-center">
                    <svg
                      class="w-4 h-4 text-gray-400 mx-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    <span class="text-gray-900 font-medium capitalize">{{
                      seccionActual()
                    }}</span>
                  </li>
                </ol>
              </nav>

              <!-- Contenido de las rutas hijas -->
              <router-outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Animaciones suaves para transiciones */
      .transition-transform {
        transition: transform 0.3s ease-in-out;
      }

      /* Scrollbar personalizado para el menú móvil */
      .overflow-y-auto::-webkit-scrollbar {
        width: 4px;
      }

      .overflow-y-auto::-webkit-scrollbar-track {
        background: #f1f5f9;
      }

      .overflow-y-auto::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;
      }

      .overflow-y-auto::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `,
  ],
})
export class CuentaUsuarioComponent implements OnInit {
  private readonly cuentaUsuarioService = inject(CuentaUsuarioService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  // 🚦 Signals para el estado del componente
  protected readonly seccionActual = signal<string>('dashboard');
  protected readonly menuMovilAbierto = signal<boolean>(false);
  protected readonly usuarioActual = signal<User | null>(null);

  // 📊 Signals computados para datos derivados
  protected readonly dashboardData = computed(() =>
    this.cuentaUsuarioService.dashboardData()
  );
  protected readonly estadisticasActuales = computed(() =>
    this.cuentaUsuarioService.estadisticasData()
  );

  protected readonly notificacionesNoLeidas = signal<number>(0);

  ngOnInit(): void {
    this.verificarAutenticacion();
    this.inicializarUsuario();
    this.cargarDashboard();
    this.escucharCambiosDeRuta();
    this.cargarNotificacionesNoLeidas();
  }

  /**
   * 🔐 Verificar que el usuario esté autenticado
   */
  private verificarAutenticacion(): void {
    const isAuth = this.authService.isAuthenticated();
    if (!isAuth) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/mi-cuenta' },
      });
    }
  }

  /**
   * 👤 Inicializar datos del usuario actual
   */
  private inicializarUsuario(): void {
    this.usuarioActual.set(this.authService.currentUser());
  }

  /**
   * 📊 Cargar dashboard del usuario
   */
  private cargarDashboard(): void {
    this.cuentaUsuarioService.getDashboard().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          console.log('✅ Dashboard cargado correctamente:', response.data);
        }
      },
      error: (error) => {
        console.error('❌ Error cargando dashboard:', error);
      },
    });
  }

  /**
   * 🔔 Cargar contador de notificaciones no leídas
   */
  private cargarNotificacionesNoLeidas(): void {
    this.cuentaUsuarioService
      .getNotificacionesNoLeidasCount()
      .subscribe((count) => {
        this.notificacionesNoLeidas.set(count);
      });
  }

  /**
   * 🛣️ Escuchar cambios de ruta para actualizar sección activa
   */
  private escucharCambiosDeRuta(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const url = this.router.url;
        const seccion = this.extraerSeccionDeUrl(url);
        this.seccionActual.set(seccion);
      });

    // Establecer sección inicial
    const urlInicial = this.router.url;
    const seccionInicial = this.extraerSeccionDeUrl(urlInicial);
    this.seccionActual.set(seccionInicial);
  }

  /**
   * 🔍 Extraer nombre de sección de la URL
   */
  private extraerSeccionDeUrl(url: string): string {
    const segmentos = url.split('/');
    const indiceSeccion = segmentos.findIndex(
      (segmento) => segmento === 'mi-cuenta'
    );

    if (indiceSeccion !== -1 && segmentos[indiceSeccion + 1]) {
      return segmentos[indiceSeccion + 1];
    }

    return 'dashboard';
  }

  /**
   * 🧭 Navegar a una sección específica
   */
  protected navegarASeccion(seccion: string): void {
    this.seccionActual.set(seccion);
    this.router.navigate(['/mi-cuenta', seccion]);
  }

  /**
   * 📱 Navegar desde menú móvil y cerrar overlay
   */
  protected navegarASeccionMovil(seccion: string): void {
    this.navegarASeccion(seccion);
    this.cerrarMenuMovil();
  }

  /**
   * 📱 Toggle del menú móvil
   */
  protected toggleMobileMenu(): void {
    this.menuMovilAbierto.update((abierto) => !abierto);
  }

  /**
   * 📱 Cerrar menú móvil
   */
  protected cerrarMenuMovil(): void {
    this.menuMovilAbierto.set(false);
  }

  /**
   * 🔄 Recargar todos los datos
   */
  protected recargarDatos(): void {
    this.cuentaUsuarioService.refreshAllData().subscribe({
      next: () => {
        console.log('✅ Datos recargados correctamente');
      },
      error: (error) => {
        console.error('❌ Error al recargar datos:', error);
      },
    });
  }
}
