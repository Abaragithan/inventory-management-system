import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loginForm: FormGroup;
  readonly isLoading = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.authService.login(this.loginForm.value).subscribe({
      next: (session) => {
        this.isLoading.set(false);
        this.toastService.success(`Welcome back, ${session.email}!`);

        // Staff users must go to pending approval page
        if (session.role === 'Staff') {
          this.router.navigate(['/pending-approval']);
          return;
        }

        if (session.role === 'Supplier') {
          this.router.navigate(['/supplier-portal']);
          return;
        }

        // Retrieve return URL from route parameters or default to dashboard
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl).catch(() => {
          this.router.navigate(['/dashboard']);
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        const errMsg = err.error?.message || err.error || 'Invalid credentials or connection issue.';
        this.toastService.error(errMsg);
      }
    });
  }
}
