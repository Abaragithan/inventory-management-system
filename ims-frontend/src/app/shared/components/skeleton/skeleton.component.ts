import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (type === 'table') {
      <div class="animate-pulse flex flex-col gap-3">
        <div class="h-10 bg-zinc-200 rounded-lg w-full"></div>
        @for (row of getDummyArray(rows); track $index) {
          <div class="flex gap-4 items-center py-2">
            <div class="h-8 bg-zinc-200/60 rounded-md flex-1"></div>
            <div class="h-8 bg-zinc-200/60 rounded-md flex-1"></div>
            <div class="h-8 bg-zinc-200/60 rounded-md flex-1"></div>
            <div class="h-8 bg-zinc-200/60 rounded-md flex-1"></div>
          </div>
        }
      </div>
    } @else if (type === 'card') {
      <div class="animate-pulse p-6 bg-white border border-zinc-200 rounded-2xl flex flex-col gap-4 shadow-sm">
        <div class="flex justify-between items-center">
          <div class="h-4 bg-zinc-200 rounded w-1/3"></div>
          <div class="w-8 h-8 bg-zinc-200 rounded-full"></div>
        </div>
        <div class="h-8 bg-zinc-200 rounded w-1/2"></div>
        <div class="h-3 bg-zinc-200 rounded w-2/3"></div>
      </div>
    } @else {
      <div class="animate-pulse h-4 bg-zinc-200 rounded w-full"></div>
    }
  `
})
export class SkeletonComponent {
  @Input() type: 'table' | 'card' | 'line' = 'line';
  @Input() rows = 5;

  getDummyArray(count: number): number[] {
    return Array(count).fill(0);
  }
}
