import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 z-50 bg-zinc-900/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        (click)="cancel.emit()"
      >
        <!-- Modal Card -->
        <div 
          class="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200"
          (click)="$event.stopPropagation()"
        >
          <!-- Header and Body Content -->
          <div class="flex items-start gap-4">
            <!-- Warning badge icon -->
            <div class="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div class="space-y-1">
              <h3 class="text-lg font-bold text-zinc-900">{{ title }}</h3>
              <p class="text-sm text-zinc-500 leading-relaxed">{{ message }}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              type="button"
              (click)="cancel.emit()"
              class="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-sm rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="confirm.emit()"
              class="flex-1 py-2.5 font-semibold text-sm rounded-xl shadow-md transition-all"
              [ngClass]="confirmClass"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Deletion';
  @Input() message = 'Are you sure you want to delete this item? This action cannot be undone.';
  @Input() confirmLabel = 'Delete';
  @Input() confirmClass = 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/10';

  @Output() readonly confirm = new EventEmitter<void>();
  @Output() readonly cancel = new EventEmitter<void>();
}
