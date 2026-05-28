import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="flex items-center gap-3 p-4 min-w-[320px] max-w-md rounded-xl border bg-white text-zinc-800 shadow-xl transition-all duration-300 pointer-events-auto cursor-pointer translate-x-0"
          [ngClass]="{
            'border-emerald-200/80': toast.type === 'success',
            'border-rose-200/80': toast.type === 'error',
            'border-amber-200/80': toast.type === 'warning',
            'border-blue-200/80': toast.type === 'info'
          }"
          (click)="toastService.remove(toast.id)"
        >
          <!-- Icon -->
          <div class="flex-shrink-0">
            @switch (toast.type) {
              @case ('success') {
                <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              }
              @case ('error') {
                <svg class="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              }
              @case ('warning') {
                <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              }
              @case ('info') {
                <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              }
            }
          </div>
          <!-- Content -->
          <div class="flex-1 text-sm font-medium text-zinc-800">{{ toast.message }}</div>
          <!-- Close Button -->
          <button class="text-zinc-400 hover:text-zinc-600">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: []
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);
}
