import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PurchaseRequestService, PurchaseRequestResponseDto, PurchaseRequestItemResponseDto, CreatePurchaseRequestDto, PurchaseRequestSuggestionDto, PurchaseRequestSuggestionItemDto } from '../../core/services/purchase-request.service';
import { ProductService, ProductListDto } from '../../core/services/product.service';
import { SupplierService, SupplierResponseDto } from '../../core/services/supplier.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-purchase-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SkeletonComponent, ConfirmModalComponent],
  templateUrl: './purchase-requests.component.html'
})
export class PurchaseRequestsComponent implements OnInit {
  private readonly requestService = inject(PurchaseRequestService);
  private readonly productService = inject(ProductService);
  private readonly supplierService = inject(SupplierService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly requests = signal<PurchaseRequestResponseDto[]>([]);
  readonly products = signal<ProductListDto[]>([]);
  readonly suppliers = signal<SupplierResponseDto[]>([]);

  readonly selectedSupplierIdForForm = signal<number>(0);

  readonly selectedSupplierNameForForm = computed(() => {
    const id = this.selectedSupplierIdForForm();
    if (id === 0) return '';
    const supplier = this.suppliers().find(s => s.supplierId === id);
    return supplier ? supplier.companyName.trim().toLowerCase() : '';
  });

  readonly filteredProductsForForm = computed(() => {
    const supplierName = this.selectedSupplierNameForForm();
    if (!supplierName) {
      return [];
    }
    return this.products().filter(p => p.supplierName?.trim().toLowerCase() === supplierName);
  });

  readonly isLoading = signal(true);
  readonly isCreateModalOpen = signal(false);
  readonly isSuggestionsModalOpen = signal(false);
  readonly isSuggestionsLoading = signal(false);
  readonly isDispatchingId = signal<number | null>(null);

  readonly suggestions = signal<PurchaseRequestSuggestionDto[]>([]);
  // Editable suggestion qty overrides: key = "supplierId_productId"
  readonly suggestionQtyOverrides = signal<Record<string, number>>({});
  // Suggestion order-level fields
  suggestionExpectedDate = '';
  suggestionNotes = '';

  // Cancel confirmation modal
  readonly confirmCancelOpen = signal(false);
  readonly requestToCancel = signal<PurchaseRequestResponseDto | null>(null);

  readonly selectedRequest = signal<PurchaseRequestResponseDto | null>(null);
  readonly receiveRequest = signal<PurchaseRequestResponseDto | null>(null);

  readonly userRole = computed(() => this.authService.currentUser()?.role ?? '');

  // Forms
  createForm!: FormGroup;
  receiveForm!: FormGroup;

  // Search & Filter State
  readonly searchQuery = signal('');
  readonly rawSearchValue = signal('');
  readonly selectedStatus = signal('');
  readonly selectedSupplierId = signal<string | number>('');

  // Pagination State
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalPages = signal(1);
  readonly totalFilteredCount = signal(0);

  // Stats Counts
  readonly totalRequestsCount = signal(0);
  readonly pendingCount = signal(0);
  readonly acceptedCount = signal(0);
  readonly deliveredCount = signal(0);

  protected readonly Math = Math;

  private readonly searchSubject = new Subject<string>();

  constructor() {
    // Set up search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(val => {
      this.searchQuery.set(val);
      this.currentPage.set(1);
      this.loadRequests();
    });
  }

  ngOnInit(): void {
    this.initCreateForm();
    this.loadAllData();
    // Auto-open suggestions modal if routed with ?showSuggestions=true
    this.route.queryParams.subscribe(params => {
      if (params['showSuggestions'] === 'true') {
        this.openSuggestionsModal();
      }
    });
  }

  initCreateForm(): void {
    this.createForm = this.fb.group({
      supplierId: [0, [Validators.required, Validators.min(1)]],
      notes: [''],
      expectedDeliveryDate: [null, [futureDateValidator]],
      purchaseRequestItems: this.fb.array([], Validators.required)
    });
    this.selectedSupplierIdForForm.set(0);

    // Listen to changes
    this.createForm.get('supplierId')?.valueChanges.subscribe(val => {
      const numericVal = Number(val) || 0;
      const prevVal = this.selectedSupplierIdForForm();
      if (prevVal !== numericVal) {
        this.selectedSupplierIdForForm.set(numericVal);
        if (prevVal !== 0) {
          this.clearItemRows();
        }
      }
    });
  }

  clearItemRows(): void {
    const control = this.itemRows;
    while (control.length !== 0) {
      control.removeAt(0);
    }
    this.addItemRow();
  }

  get itemRows(): FormArray {
    return this.createForm.get('purchaseRequestItems') as FormArray;
  }

  get receiveRows(): FormArray {
    return this.receiveForm.get('items') as FormArray;
  }

  addItemRow(): void {
    const row = this.fb.group({
      productId: [0, [Validators.required, Validators.min(1)]],
      requestedQuantity: [1, [Validators.required, Validators.min(1)]],
      unitCost: [0, [Validators.required, Validators.min(0.01)]],
      notes: ['']
    });
    this.itemRows.push(row);
  }

  removeItemRow(idx: number): void {
    this.itemRows.removeAt(idx);
  }

  onProductSelect(idx: number): void {
    const row = this.itemRows.at(idx);
    const productId = row.get('productId')?.value;
    if (productId > 0) {
      this.productService.getById(productId).subscribe({
        next: (prod) => {
          row.patchValue({
            unitCost: prod.costPrice
          });
        }
      });
    }
  }

  onSearchChange(value: string): void {
    this.rawSearchValue.set(value);
    this.searchSubject.next(value);
  }

  onStatusChange(value: string): void {
    this.selectedStatus.set(value);
    this.currentPage.set(1);
    this.loadRequests();
  }

  onSupplierFilterChange(value: string | number): void {
    this.selectedSupplierId.set(value);
    this.currentPage.set(1);
    this.loadRequests();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadRequests();
  }

  loadAllData(): void {
    this.loadRequests();
    this.productService.getAll().subscribe(res => this.products.set(res));
    this.supplierService.getAll().subscribe(res => this.suppliers.set(res));
    this.loadSuggestions();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.requestService.getPaged(
      this.searchQuery(),
      this.selectedStatus(),
      this.selectedSupplierId(),
      this.currentPage(),
      this.pageSize()
    ).subscribe({
      next: (res) => {
        this.requests.set(res.items);
        this.totalFilteredCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);

        // Update stats from backend summary
        if (res.summary) {
          this.totalRequestsCount.set(res.summary['totalCount'] ?? 0);
          this.pendingCount.set(res.summary['pendingCount'] ?? 0);
          this.acceptedCount.set(res.summary['acceptedCount'] ?? 0);
          this.deliveredCount.set(res.summary['deliveredCount'] ?? 0);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load purchase requests.');
        this.isLoading.set(false);
      }
    });
  }

  loadSuggestions(): void {
    const role = this.authService.currentUser()?.role;
    if (role !== 'Admin' && role !== 'InventoryManager') return;
    this.requestService.getSuggestions().subscribe({
      next: (res) => this.suggestions.set(res),
      error: () => {} // Silently ignore
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

  canCancel(req: PurchaseRequestResponseDto): boolean {
    const role = this.userRole();
    return req.requestStatus === 'Pending' && (role === 'Admin' || role === 'InventoryManager');
  }

  cancelRequest(req: PurchaseRequestResponseDto): void {
    this.requestToCancel.set(req);
    this.confirmCancelOpen.set(true);
  }

  executeCancelRequest(): void {
    const req = this.requestToCancel();
    if (!req) return;
    this.confirmCancelOpen.set(false);
    this.requestService.cancel(req.requestId).subscribe({
      next: () => {
        this.toastService.success(`Request ${req.requestNumber} has been cancelled.`);
        this.requestToCancel.set(null);
        this.loadAllData();
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to cancel the purchase request.';
        this.toastService.error(msg);
        this.requestToCancel.set(null);
      }
    });
  }

  openSuggestionsModal(): void {
    this.isSuggestionsModalOpen.set(true);
    this.isSuggestionsLoading.set(true);
    this.suggestionExpectedDate = '';
    this.suggestionNotes = '';
    this.requestService.getSuggestions().subscribe({
      next: (res) => {
        this.suggestions.set(res);
        this.suggestionQtyOverrides.set({});
        this.isSuggestionsLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load restock suggestions.');
        this.isSuggestionsLoading.set(false);
      }
    });
  }

  closeSuggestionsModal(): void {
    this.isSuggestionsModalOpen.set(false);
  }

  getSuggestionQty(supplierId: number, productId: number, defaultQty: number): number {
    const key = `${supplierId}_${productId}`;
    return this.suggestionQtyOverrides()[key] ?? defaultQty;
  }

  setSuggestionQty(supplierId: number, productId: number, event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(val) && val >= 1) {
      const key = `${supplierId}_${productId}`;
      this.suggestionQtyOverrides.update(o => ({ ...o, [key]: val }));
    }
  }

  dispatchSuggestion(group: PurchaseRequestSuggestionDto): void {
    this.isDispatchingId.set(group.supplierId);
    const items = group.items.map(item => ({
      productId: item.productId,
      requestedQuantity: this.getSuggestionQty(group.supplierId, item.productId, item.suggestedQuantity),
      unitCost: item.unitCost,
      notes: 'Auto-suggested restock order'
    }));
    const baseNotes = this.suggestionNotes.trim() || `Automated restock suggestion for ${group.supplierCompanyName}`;
    const payload: CreatePurchaseRequestDto = {
      supplierId: group.supplierId,
      notes: baseNotes,
      expectedDeliveryDate: this.suggestionExpectedDate ? new Date(this.suggestionExpectedDate).toISOString() : null,
      purchaseRequestItems: items
    };
    this.requestService.create(payload).subscribe({
      next: () => {
        this.toastService.success(`Purchase request created for ${group.supplierCompanyName}!`);
        this.isDispatchingId.set(null);
        this.closeSuggestionsModal();
        this.loadAllData();
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to create purchase request.';
        this.toastService.error(msg);
        this.isDispatchingId.set(null);
      }
    });
  }

  openCreateModal(): void {
    this.initCreateForm();
    this.addItemRow(); // Start with one item row
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  onCreateSubmit(): void {
    if (this.createForm.invalid) return;
    const formVal = this.createForm.value;
    const payload: CreatePurchaseRequestDto = {
      supplierId: formVal.supplierId,
      notes: formVal.notes,
      expectedDeliveryDate: formVal.expectedDeliveryDate ? new Date(formVal.expectedDeliveryDate).toISOString() : null,
      purchaseRequestItems: formVal.purchaseRequestItems
    };

    this.requestService.create(payload).subscribe({
      next: () => {
        this.toastService.success('Purchase request created successfully!');
        this.closeCreateModal();
        this.loadAllData();
      },
      error: (err) => {
        const msg = err.error?.message || err.error || 'Failed to dispatch request.';
        this.toastService.error(msg);
      }
    });
  }

  viewDetails(req: PurchaseRequestResponseDto): void {
    this.selectedRequest.set(req);
  }

  closeDetails(): void {
    this.selectedRequest.set(null);
  }

  openReceiveModal(req: PurchaseRequestResponseDto): void {
    this.receiveRequest.set(req);
    const rows = req.purchaseRequestItems.map(item => this.fb.group({
      requestItemId: [item.requestItemId, Validators.required],
      deliveredQuantity: [item.requestedQuantity, [Validators.required, Validators.min(0)]],
      notes: ['']
    }));
    this.receiveForm = this.fb.group({
      items: this.fb.array(rows)
    });
  }

  closeReceiveModal(): void {
    this.receiveRequest.set(null);
  }

  onReceiveSubmit(): void {
    if (this.receiveForm.invalid || !this.receiveRequest()) return;
    const payload = this.receiveForm.value;
    this.requestService.receive(this.receiveRequest()!.requestId, payload).subscribe({
      next: () => {
        this.toastService.success('Delivery recorded and stock updated!');
        this.closeReceiveModal();
        this.loadAllData();
      },
      error: (err) => {
        const msg = err.error?.message || err.error || 'Failed to receive delivery.';
        this.toastService.error(msg);
      }
    });
  }
}

export function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const inputDate = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today ? null : { pastDate: true };
}
