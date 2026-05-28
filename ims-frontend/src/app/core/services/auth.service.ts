import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface UserSession {
  token: string;
  refreshToken: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Current user session signal
  readonly currentUser = signal<UserSession | null>(null);
  
  // Computed logged-in status signal
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  constructor(private http: HttpClient) {
    // Restore session on application startup
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');

    if (token && refreshToken && email && role) {
      this.currentUser.set({ token, refreshToken, email, role });
    }
  }

  login(dto: any): Observable<UserSession> {
    return this.http.post<UserSession>('api/auth/login', dto).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('email', res.email);
        localStorage.setItem('role', res.role);
        this.currentUser.set(res);
      })
    );
  }

  refreshToken(): Observable<UserSession> {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<UserSession>('api/auth/refresh-token', { accessToken: token, refreshToken }).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('email', res.email);
        localStorage.setItem('role', res.role);
        this.currentUser.set(res);
      })
    );
  }

  register(dto: any): Observable<any> {
    // Backend RegisterDto has Email, Password, ConfirmPassword.
    // It defaults new registrations to 'InventoryManager' on the backend.
    return this.http.post('api/auth/register', dto);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    this.currentUser.set(null);
  }

  getUserRole(): string | null {
    const user = this.currentUser();
    return user ? user.role : null;
  }
}
