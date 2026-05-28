import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="flex items-center justify-between px-8 h-16 bg-white border-b border-zinc-200/80 text-zinc-800 shrink-0">
      <!-- Page Title Context -->
      <div>
        <h2 class="text-sm font-semibold tracking-wider uppercase text-zinc-550">Inventory Management System</h2>
      </div>

      <!-- User Profile Dropdown -->
      <div class="relative">
        <button
          (click)="toggleProfileDropdown()"
          class="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-zinc-50 transition-all text-left"
        >
          <!-- User Initial Avatar -->
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 font-semibold text-white shadow-md shadow-blue-600/20">
            {{ userInitial() }}
          </div>
          <div class="hidden sm:block">
            <p class="text-xs font-semibold text-zinc-800 max-w-[150px] truncate">{{ userEmail() }}</p>
            <p class="text-[10px] font-semibold tracking-wide uppercase"
               [ngClass]="userRole() === 'Staff' ? 'text-amber-600' : 'text-blue-600'">
              {{ userRole() === 'Staff' ? 'Pending Approval' : userRole() }}
            </p>
          </div>
          <!-- Dropdown Indicator -->
          <svg class="w-4 h-4 text-zinc-400 transition-transform duration-200" [class.rotate-180]="isDropdownOpen()" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Dropdown Card -->
        @if (isDropdownOpen()) {
          <div class="absolute right-0 mt-2 w-56 bg-zinc-50 border border-zinc-200 rounded-xl shadow-2xl z-50 p-2 divide-y divide-zinc-100 animate-in fade-in slide-in-from-top-2 duration-150">
            <div class="px-3 py-2.5">
              <p class="text-xs text-zinc-500 font-medium">Logged in as</p>
              <p class="text-sm font-bold text-zinc-900 truncate">{{ userEmail() }}</p>
              <span class="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase tracking-wider"
                [ngClass]="userRole() === 'Staff' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-100/50'">
                {{ userRole() === 'Staff' ? 'Pending Approval' : userRole() }}
              </span>
            </div>
            <div class="pt-2 mt-2">
              <button
                (click)="logout()"
                class="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-all"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        }
      </div>
    </header>

    <!-- Overlay to close dropdown -->
    @if (isDropdownOpen()) {
      <div class="fixed inset-0 z-40 bg-transparent" (click)="closeDropdown()"></div>
    }
  `
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isDropdownOpen = signal(false);

  userEmail() {
    return this.authService.currentUser()?.email || 'user@example.com';
  }

  userRole() {
    return this.authService.currentUser()?.role || 'Guest';
  }

  userInitial() {
    const email = this.userEmail();
    return email ? email.charAt(0).toUpperCase() : 'U';
  }

  toggleProfileDropdown() {
    this.isDropdownOpen.update(v => !v);
  }

  closeDropdown() {
    this.isDropdownOpen.set(false);
  }

  logout() {
    this.authService.logout();
    this.closeDropdown();
    this.router.navigate(['/login']);
  }
}
