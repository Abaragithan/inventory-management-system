import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SupplierService, SupplierResponseDto } from '../../core/services/supplier.service';
import { UserService, UserResponseDto } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SkeletonComponent, ConfirmModalComponent],
  templateUrl: './suppliers.component.html'
})
export class SuppliersComponent implements OnInit {
  private readonly supplierService = inject(SupplierService);
  private readonly userService = inject(UserService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly suppliers = signal<SupplierResponseDto[]>([]);
  readonly unassignedUsers = signal<UserResponseDto[]>([]);

  readonly isLoading = signal(true);
  readonly isModalOpen = signal(false);
  readonly isEditing = signal(false);
  readonly isSubmitting = signal(false);

  readonly viewModalOpen = signal(false);
  readonly selectedSupplierForView = signal<SupplierResponseDto | null>(null);

  supplierForm: FormGroup;
  selectedSupplierId: number | null = null;

  // Phone validation: digits, spaces, +, -, (, ) only
  private readonly phonePattern = /^[0-9\s\+\-\(\)]{6,20}$/;

  // Search & Filter State
  readonly searchQuery = signal('');
  readonly rawSearchValue = signal('');
  readonly statusFilter = signal('');

  // Pagination State
  readonly currentPage = signal(1);
  readonly pageSize = signal(6);
  readonly totalPages = signal(1);
  readonly totalFilteredCount = signal(0);

  // Stats Counts
  readonly totalSuppliersCount = signal(0);
  readonly activeSuppliersCount = signal(0);
  readonly inactiveSuppliersCount = signal(0);

  protected readonly Math = Math;

  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.supplierForm = this.fb.group({
      userId: [0],
      companyName: ['', [Validators.required, Validators.maxLength(200)]],
      contactPerson: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(this.phonePattern)]],
      address: ['', [Validators.required, Validators.maxLength(500)]],
      isActive: [true]
    });

    // Set up search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(val => {
      this.searchQuery.set(val);
      this.currentPage.set(1);
      this.loadSuppliers();
    });
  }

  ngOnInit(): void {
    this.loadSuppliers();

    // Check if we were redirected from Users page with a pre-selected userId
    this.route.queryParams.subscribe(params => {
      const preselect = params['preselect'];
      if (preselect) {
        const userId = Number(preselect);
        if (!isNaN(userId) && userId > 0) {
          this.openCreateModalWithUser(userId);
        }
      }
    });
  }

  onSearchChange(value: string): void {
    this.rawSearchValue.set(value);
    this.searchSubject.next(value);
  }

  onStatusChange(value: string): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.loadSuppliers();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.isLoading.set(true);
    this.supplierService.getPaged(
      this.searchQuery(),
      this.statusFilter(),
      this.currentPage(),
      this.pageSize()
    ).subscribe({
      next: (res) => {
        this.suppliers.set(res.items);
        this.totalFilteredCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);

        // Update stats counts from backend summary
        if (res.summary) {
          this.totalSuppliersCount.set(res.summary['totalCount'] ?? 0);
          this.activeSuppliersCount.set(res.summary['activeCount'] ?? 0);
          this.inactiveSuppliersCount.set(res.summary['inactiveCount'] ?? 0);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load supplier profiles.');
        this.isLoading.set(false);
      }
    });
  }

  loadUnassignedSupplierUsers(): void {
    this.userService.getUnassignedSuppliers().subscribe({
      next: (res) => this.unassignedUsers.set(res),
      error: () => this.toastService.error('Could not retrieve supplier users.')
    });
  }

  /** Returns true when a field is invalid AND touched/dirty */
  isInvalid(field: string): boolean {
    const ctrl = this.supplierForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedSupplierId = null;
    this.supplierForm.reset({ userId: 0, companyName: '', contactPerson: '', email: '', phone: '', address: '', isActive: true });
    this.supplierForm.get('userId')?.setValidators([Validators.required, Validators.min(1)]);
    this.supplierForm.get('userId')?.updateValueAndValidity();
    this.loadUnassignedSupplierUsers();
    this.isModalOpen.set(true);
  }

  /**
   * Opens the create modal and pre-selects the given userId.
   * Called when redirected from Users page via ?preselect= query param.
   */
  openCreateModalWithUser(userId: number): void {
    this.isEditing.set(false);
    this.selectedSupplierId = null;
    this.supplierForm.reset({ userId, companyName: '', contactPerson: '', email: '', phone: '', address: '', isActive: true });
    this.supplierForm.get('userId')?.setValidators([Validators.required, Validators.min(1)]);
    this.supplierForm.get('userId')?.updateValueAndValidity();

    // Load users and ensure the pre-selected one appears in the list
    this.userService.getUnassignedSuppliers().subscribe({
      next: (res) => {
        // If the pre-selected user isn't in unassigned list yet, fetch them individually
        if (!res.find(u => u.userId === userId)) {
          this.userService.getById(userId).subscribe({
            next: (u) => this.unassignedUsers.set([u, ...res]),
            error: () => this.unassignedUsers.set(res)
          });
        } else {
          this.unassignedUsers.set(res);
        }
        this.isModalOpen.set(true);
      },
      error: () => {
        this.toastService.error('Could not load supplier users.');
        this.isModalOpen.set(true);
      }
    });
  }

  openEditModal(sup: SupplierResponseDto): void {
    this.isEditing.set(true);
    this.selectedSupplierId = sup.supplierId;
    this.supplierForm.patchValue({
      userId: sup.userId,
      companyName: sup.companyName,
      contactPerson: sup.contactPerson,
      email: sup.email,
      phone: sup.phone,
      address: sup.address,
      isActive: sup.isActive
    });
    this.supplierForm.get('userId')?.clearValidators();
    this.supplierForm.get('userId')?.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  openViewModal(sup: SupplierResponseDto): void {
    this.selectedSupplierForView.set(sup);
    this.viewModalOpen.set(true);
  }

  closeViewModal(): void {
    this.viewModalOpen.set(false);
    this.selectedSupplierForView.set(null);
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      // Mark all fields touched so errors show
      this.supplierForm.markAllAsTouched();
      return;
    }

    const raw = this.supplierForm.getRawValue();
    this.isSubmitting.set(true);

    if (this.isEditing() && this.selectedSupplierId !== null) {
      const dto = {
        companyName: raw.companyName,
        contactPerson: raw.contactPerson,
        email: raw.email,
        phone: raw.phone,
        address: raw.address,
        isActive: raw.isActive
      };
      this.supplierService.update(this.selectedSupplierId, dto).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toastService.success('Supplier profile updated.');
          this.closeModal();
          this.loadSuppliers();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toastService.error(err.error?.message || 'Failed to update supplier profile.');
        }
      });
    } else {
      const userId = raw.userId;
      const dto = {
        companyName: raw.companyName,
        contactPerson: raw.contactPerson,
        email: raw.email,
        phone: raw.phone,
        address: raw.address
      };
      this.supplierService.create(userId, dto).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toastService.success('Supplier linked successfully!');
          this.closeModal();
          this.loadSuppliers();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toastService.error(err.error?.message || 'Failed to link supplier.');
        }
      });
    }
  }

  readonly deleteModalOpen = signal(false);
  readonly supplierToDelete = signal<SupplierResponseDto | null>(null);

  onDelete(sup: SupplierResponseDto): void {
    this.supplierToDelete.set(sup);
    this.deleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const sup = this.supplierToDelete();
    if (!sup) return;
    this.supplierService.delete(sup.supplierId).subscribe({
      next: () => {
        this.toastService.success('Supplier profile removed.');
        this.cancelDelete();
        this.loadSuppliers();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to remove supplier profile.');
        this.cancelDelete();
      }
    });
  }

  cancelDelete(): void {
    this.deleteModalOpen.set(false);
    this.supplierToDelete.set(null);
  }
}
