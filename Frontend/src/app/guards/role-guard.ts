import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const expectedRole = route.data['expectedRole'];
  const userRole = authService.getRole();

  if (!authService.isLoggedIn() || userRole !== expectedRole) {
    console.warn('Pristup odbijen. Potrebna rola:', expectedRole, 'Korisnička rola:', userRole);
    router.navigate(['/welcome']);
    return false;
  }
  
  return true;
};
