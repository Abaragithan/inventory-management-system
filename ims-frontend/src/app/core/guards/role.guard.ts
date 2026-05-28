import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[];
  const userRole = authService.getUserRole();

  // Staff users can only see the pending-approval page
  if (userRole === 'Staff') {
    router.navigate(['/pending-approval']);
    return false;
  }

  if (userRole && requiredRoles.includes(userRole)) {
    return true;
  }

  // Redirect based on current auth state
  if (authService.isLoggedIn()) {
    // If logged in but unauthorized, send to supplier-portal or dashboard
    if (userRole === 'Supplier') {
      router.navigate(['/supplier-portal']);
    } else {
      router.navigate(['/dashboard']);
    }
  } else {
    // If not logged in, send to login
    router.navigate(['/login']);
  }
  return false;
};
