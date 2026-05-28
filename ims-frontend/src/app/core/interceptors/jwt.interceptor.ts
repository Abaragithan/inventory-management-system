import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const baseUrl = 'http://localhost:5053';

  let clone = req;

  // Prepend base URL if req.url doesn't start with http or https
  if (!req.url.startsWith('http://') && !req.url.startsWith('https://')) {
    clone = req.clone({
      url: `${baseUrl}/${req.url.replace(/^\//, '')}`
    });
  }

  // Inject Authorization header if token exists
  if (token) {
    clone = clone.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clone).pipe(
    catchError((error: HttpErrorResponse) => {
      // If unauthorized and not a login/refresh request, try to refresh the token
      if (error.status === 401 && !req.url.includes('api/auth/login') && !req.url.includes('api/auth/refresh-token')) {
        return authService.refreshToken().pipe(
          switchMap((session) => {
            // Re-clone request with new access token
            const retryReq = req.clone({
              url: req.url.startsWith('http://') || req.url.startsWith('https://') 
                ? req.url 
                : `${baseUrl}/${req.url.replace(/^\//, '')}`,
              setHeaders: {
                Authorization: `Bearer ${session.token}`
              }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Logout and redirect to login if refresh fails
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
