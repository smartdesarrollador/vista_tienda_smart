import { Routes } from '@angular/router';
import { InicioComponent } from './paginas/vista/inicio/inicio.component';
import { VistaComponent } from './paginas/vista/vista.component';
import { PageNotFoundComponent } from './paginas/page-not-found/page-not-found.component';
import { AboutComponent } from './paginas/vista/about/about.component';
import { CuentaComponent } from './paginas/vista/cuenta/cuenta.component';
import { CatalogoComponent } from './paginas/vista/catalogo/catalogo.component';
import { authGuard } from './core/auth/guards/auth.guard';
import { ContactoComponent } from './paginas/vista/contacto/contacto.component';
export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./paginas/auth/login/login.component').then(
            (m) => m.LoginComponent
          ),
        title: 'Iniciar sesión',
      },
      {
        path: 'register',
        //canActivate: [authGuard],
        loadComponent: () =>
          import('./paginas/auth/register/register.component').then(
            (m) => m.RegisterComponent
          ),
        title: 'Registrarse',
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import(
            './paginas/auth/forgot-password/forgot-password.component'
          ).then((m) => m.ForgotPasswordComponent),
        title: 'Recuperar contraseña',
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./paginas/auth/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent
          ),
        title: 'Restablecer contraseña',
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      /* {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      }, */
    ],
  },
  {
    path: '',
    component: VistaComponent,
    children: [
      {
        path: '',
        component: InicioComponent,
      },
      {
        path: 'about',
        component: AboutComponent,
      },
      {
        path: 'contacto',
        component: ContactoComponent,
      },
      {
        path: 'catalogo',
        component: CatalogoComponent,
        title: 'Catálogo de Productos',
      },
      {
        path: 'buscar',
        loadComponent: () =>
          import('./paginas/vista/busqueda/busqueda.component').then(
            (m) => m.BusquedaComponent
          ),
        title: 'Búsqueda de Productos',
      },
      {
        path: 'producto/:slug',
        loadComponent: () =>
          import(
            './paginas/vista/producto-detalle/producto-detalle.component'
          ).then((m) => m.ProductoDetalleComponent),
      },
      {
        path: 'productos-por-categoria/:categoria',
        loadComponent: () =>
          import(
            './paginas/vista/productos-por-categoria/productos-por-categoria.component'
          ).then((m) => m.ProductosPorCategoriaComponent),
      },
      {
        path: 'carrito',
        loadComponent: () =>
          import('./paginas/vista/carrito/carrito.component').then(
            (m) => m.CarritoComponent
          ),
        title: 'Carrito de Compras',
      },
      {
        path: 'checkout',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./paginas/vista/checkout/checkout.component').then(
            (m) => m.CheckoutComponent
          ),
        title: 'Finalizar Compra',
      },
      {
        path: 'mi-cuenta',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./paginas/vista/cuenta-usuario/cuenta-usuario.routes').then(
            (m) => m.cuentaUsuarioRoutes
          ),
        title: 'Mi Cuenta',
      },
      {
        path: 'cuenta',
        canActivate: [authGuard],
        component: CuentaComponent,
      },
      {
        path: '**',
        component: PageNotFoundComponent,
      },
    ],
  },
];
