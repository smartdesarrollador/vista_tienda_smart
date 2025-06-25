import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔒 AuthGuard ejecutándose para:', state.url);
  console.log('🔒 AuthService isAuthenticated:', authService.isAuthenticated());

  if (authService.isAuthenticated()) {
    console.log('✅ AuthGuard: Usuario autenticado, permitiendo acceso');
    return true;
  }

  console.log('❌ AuthGuard: Usuario NO autenticado, redirigiendo al login');
  // Redireccionar al login si el usuario no está autenticado
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
