import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pending-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-approval.component.html'
})
export class PendingApprovalComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly steps = [
    {
      label: 'An administrator reviews your account registration.',
      icon: `<svg class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>`
    },
    {
      label: 'Your role is upgraded to Inventory Manager, Supplier, or Admin.',
      icon: `<svg class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>`
    },
    {
      label: 'You can then sign in and access the system.',
      icon: `<svg class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>`
    }
  ];

  userEmail() {
    return this.authService.currentUser()?.email ?? '';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
