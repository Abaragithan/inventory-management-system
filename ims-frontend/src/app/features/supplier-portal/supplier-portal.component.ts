import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupplierService, SupplierResponseDto } from '../../core/services/supplier.service';
import { PurchaseRequestService, PurchaseRequestResponseDto } from '../../core/services/purchase-request.service';
import { ToastService } from '../../core/services/toast.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-supplier-portal',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SkeletonComponent],
  templateUrl: './supplier-portal.component.html'
})
export class SupplierPortalComponent implements OnInit {
  private readonly supplierService = inject(SupplierService);
  private readonly requestService = inject(PurchaseRequestService);
  private readonly toastService = inject(ToastService);

  readonly profile = signal<SupplierResponseDto | null>(null);
  readonly requests = signal<PurchaseRequestResponseDto[]>([]);
  readonly isLoading = signal(true);
  readonly errorMsg = signal<string | null>(null);

  // Pagination & Filter signals
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly totalCount = signal(0);
  readonly searchQuery = signal('');
  readonly selectedStatus = signal('');
  readonly rawSearchValue = signal('');

  protected readonly Math = Math;

  // Modal state
  readonly selectedRequest = signal<PurchaseRequestResponseDto | null>(null);
  readonly isRejecting = signal(false);
  rejectionNotes = '';

  private searchTimer: any = null;

  constructor() {
    // Re-fetch whenever page, pageSize, or filters change
    effect(() => {
      const _ = [this.page(), this.pageSize(), this.selectedStatus(), this.searchQuery()];
      if (this.profile()) this.loadRequests();
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.supplierService.getMyProfile().subscribe({
      next: (res) => {
        this.profile.set(res);
        this.loadRequests();
      },
      error: (err) => {
        this.isLoading.set(false);
        const errMsg = err.error?.message || err.error || 'Failed to retrieve supplier profile details.';
        this.errorMsg.set(errMsg);
        this.toastService.error(errMsg);
      }
    });
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.requestService.getPaged(
      this.searchQuery(),
      this.selectedStatus(),
      '',
      this.page(),
      this.pageSize()
    ).subscribe({
      next: (res) => {
        this.requests.set(res.items as PurchaseRequestResponseDto[]);
        this.totalCount.set(res.totalCount);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load supply requests.');
        this.isLoading.set(false);
      }
    });
  }

  onSearchChange(value: string): void {
    this.rawSearchValue.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page.set(1);
      this.searchQuery.set(value);
    }, 350);
  }

  onStatusChange(value: string): void {
    this.selectedStatus.set(value);
    this.page.set(1);
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
  }

  readonly totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  readonly totalFilteredCount = computed(() => this.totalCount());

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending':   return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'Accepted':  return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'Delivered': return 'bg-emerald-50 border-emerald-250 text-emerald-700';
      case 'Rejected':  return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'Cancelled': return 'bg-zinc-100 border-zinc-300 text-zinc-500';
      default:          return 'bg-zinc-50 border-zinc-200 text-zinc-700';
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
        this.loadRequests();
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
        this.loadRequests();
      },
      error: (err) => {
        const msg = err.error?.message || err.error || 'Failed to reject supply request.';
        this.toastService.error(msg);
      }
    });
  }
}
