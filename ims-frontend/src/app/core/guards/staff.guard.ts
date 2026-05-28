import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Staff guard: allows access ONLY to users with the 'Staff' role.
 * Used to protect the /pending-approval route.
 */
export const staffGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.getUserRole();

  if (role === 'Staff') {
    return true;
  }

  // Non-staff users get redirected to dashboard if logged in, else login
  if (authService.isLoggedIn()) {
    router.navigate(['/dashboard']);
  } else {
    router.navigate(['/login']);
  }
  return false;
};
