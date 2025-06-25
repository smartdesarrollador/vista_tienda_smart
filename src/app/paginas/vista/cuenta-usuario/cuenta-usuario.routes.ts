import { Routes } from '@angular/router';
import { authGuard } from '../../../core/auth/guards/auth.guard';

/**
 * 🛣️ Rutas del módulo Cuenta de Usuario
 *
 * Todas las rutas requieren autenticación y rol 'cliente'
 */
export const cuentaUsuarioRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./cuenta-usuario.component').then(
        (c) => c.CuentaUsuarioComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './components/dashboard-usuario/dashboard-usuario.component'
          ).then((c) => c.DashboardUsuarioComponent),
        title: 'Mi Cuenta - Dashboard',
        data: { breadcrumb: 'Dashboard' },
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./components/mis-pedidos/mis-pedidos.component').then(
            (c) => c.MisPedidosComponent
          ),
        title: 'Mi Cuenta - Mis Pedidos',
        data: { breadcrumb: 'Mis Pedidos' },
      },
      {
        path: 'pedidos/:id',
        loadComponent: () =>
          import(
            './components/detalle-pedido-usuario/detalle-pedido-usuario.component'
          ).then((c) => c.DetallePedidoUsuarioComponent),
        title: 'Mi Cuenta - Detalle del Pedido',
        data: { breadcrumb: 'Detalle del Pedido' },
      },
      {
        path: 'favoritos',
        loadComponent: () =>
          import('./components/mis-favoritos/mis-favoritos.component').then(
            (c) => c.MisFavoritosComponent
          ),
        title: 'Mi Cuenta - Mis Favoritos',
        data: { breadcrumb: 'Mis Favoritos' },
      },
      {
        path: 'direcciones',
        loadComponent: () =>
          import('./components/mis-direcciones/mis-direcciones.component').then(
            (c) => c.MisDireccionesComponent
          ),
        title: 'Mi Cuenta - Mis Direcciones',
        data: { breadcrumb: 'Mis Direcciones' },
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('./components/notificaciones/notificaciones.component').then(
            (c) => c.NotificacionesComponent
          ),
        title: 'Mi Cuenta - Notificaciones',
        data: { breadcrumb: 'Notificaciones' },
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import(
            './components/configuracion-cuenta/configuracion-cuenta.component'
          ).then((c) => c.ConfiguracionCuentaComponent),
        title: 'Mi Cuenta - Configuración',
        data: { breadcrumb: 'Configuración' },
      },
      {
        path: 'credito',
        loadComponent: () =>
          import(
            './components/informacion-credito/informacion-credito.component'
          ).then((c) => c.InformacionCreditoComponent),
        title: 'Mi Cuenta - Información de Crédito',
        data: { breadcrumb: 'Información de Crédito' },
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];

/**
 * 🏗️ Configuración adicional de rutas
 */
export const cuentaUsuarioConfig = {
  // Prefijo base para todas las rutas
  baseRoute: '/mi-cuenta',

  // Rutas principales
  routes: {
    dashboard: '/mi-cuenta/dashboard',
    pedidos: '/mi-cuenta/pedidos',
    favoritos: '/mi-cuenta/favoritos',
    direcciones: '/mi-cuenta/direcciones',
    notificaciones: '/mi-cuenta/notificaciones',
    configuracion: '/mi-cuenta/configuracion',
    credito: '/mi-cuenta/credito',
  },

  // Títulos para breadcrumbs
  titles: {
    dashboard: 'Dashboard',
    pedidos: 'Mis Pedidos',
    favoritos: 'Mis Favoritos',
    direcciones: 'Mis Direcciones',
    notificaciones: 'Notificaciones',
    configuracion: 'Configuración',
    credito: 'Información de Crédito',
  },
};
