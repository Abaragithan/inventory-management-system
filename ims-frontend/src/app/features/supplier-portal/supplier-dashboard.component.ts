import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardService, SupplierDashboardSummaryDto } from '../../core/services/dashboard.service';
import { PurchaseRequestService, PurchaseRequestResponseDto } from '../../core/services/purchase-request.service';
import { ToastService } from '../../core/services/toast.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SkeletonComponent],
  templateUrl: './supplier-dashboard.component.html'
})
export class SupplierDashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly requestService = inject(PurchaseRequestService);
  private readonly toastService = inject(ToastService);

  readonly summary = signal<SupplierDashboardSummaryDto | null>(null);
  readonly isLoading = signal(true);
  readonly selectedDateRange = signal('all');

  // Detail Modal Action states
  readonly selectedRequest = signal<PurchaseRequestResponseDto | null>(null);
  readonly isRejecting = signal(false);
  rejectionNotes = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  getDateBounds(): { startDate: string | null, endDate: string | null } {
    const now = new Date();
    let startDate: Date | null = null;

    switch (this.selectedDateRange()) {
      case 'last-week':
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last-month':
        startDate = new Date();
        startDate.setDate(now.getDate() - 30);
        break;
      case 'last-3-months':
        startDate = new Date();
        startDate.setDate(now.getDate() - 90);
        break;
      case 'last-1-year':
        startDate = new Date();
        startDate.setDate(now.getDate() - 365);
        break;
      case 'all':
      default:
        return { startDate: null, endDate: null };
    }

    return {
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    };
  }

  onDateRangeChange(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    const { startDate, endDate } = this.getDateBounds();
    this.dashboardService.getSupplierSummary(startDate, endDate).subscribe({
      next: (res) => {
        this.summary.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errMsg = err.error?.message || err.error || 'Failed to load supplier dashboard summaries.';
        this.toastService.error(errMsg);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'Accepted': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'Delivered': return 'bg-emerald-50 border-emerald-250 text-emerald-700';
      case 'Rejected': return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'Cancelled': return 'bg-zinc-100 border-zinc-300 text-zinc-500';
      default: return 'bg-zinc-50 border-zinc-200 text-zinc-700';
    }
  }

  viewDetails(req: PurchaseRequestResponseDto): void {
    this.selectedRequest.set(req);
    this.isRejecting.set(false);
    this.rejectionNotes = '';
  }

  closeDetails(): void {
    this.selectedRequest.set(null);
    this.isRejecting.set(false);
    this.rejectionNotes = '';
  }

  onAccept(req: PurchaseRequestResponseDto): void {
    this.requestService.updateStatus(req.requestId, 'Accepted').subscribe({
      next: () => {
        this.toastService.success('Supply request accepted successfully!');
        this.closeDetails();
        this.loadDashboard();
      },
      error: (err) => {
        const msg = err.error?.message || err.error || 'Failed to accept supply request.';
        this.toastService.error(msg);
      }
    });
  }

  onReject(req: PurchaseRequestResponseDto): void {
    if (!this.rejectionNotes.trim()) {
      this.toastService.error('Please provide a reason for rejecting the request.');
      return;
    }
    this.requestService.updateStatus(req.requestId, 'Rejected', this.rejectionNotes).subscribe({
      next: () => {
        this.toastService.success('Supply request rejected.');
        this.closeDetails();
        this.loadDashboard();
      },
      error: (err) => {
        const msg = err.error?.message || err.error || 'Failed to reject supply request.';
        this.toastService.error(msg);
      }
    });
  }
}
