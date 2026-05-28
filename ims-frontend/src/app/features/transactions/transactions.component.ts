import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StockService, StockTransactionResponseDto } from '../../core/services/stock.service';
import { ProductService, ProductListDto } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SkeletonComponent],
  templateUrl: './transactions.component.html'
})
export class TransactionsComponent implements OnInit {
  private readonly stockService = inject(StockService);
  private readonly productService = inject(ProductService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly products = signal<ProductListDto[]>([]);
  readonly transactions = signal<StockTransactionResponseDto[]>([]);
  
  readonly isSubmitting = signal(false);
  readonly isLoadingRecent = signal(true);

  txForm: FormGroup;

  // Custom Searchable Product Dropdown State Signals
  readonly isDropdownOpen = signal(false);
  readonly productSearchQuery = signal('');
  readonly selectedProductId = signal<number>(0);

  // Computed signals for searchable dropdown
  readonly selectedProduct = computed(() => {
    return this.products().find(p => p.productId === this.selectedProductId()) || null;
  });

  readonly filteredCatalogProducts = computed(() => {
    const query = this.productSearchQuery().toLowerCase().trim();
    if (!query) return this.products();
    return this.products().filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.barcode.toLowerCase().includes(query)
    );
  });

  // Logs Search & Pagination State Signals
  readonly txSearchQuery = signal('');
  readonly rawSearchQuery = signal('');
  readonly txTypeFilter = signal('');
  readonly txCurrentPage = signal(1);
  readonly txPageSize = signal(10);
  readonly txTotalPages = signal(1);
  readonly totalFilteredCount = signal(0);

  // Stats counts
  readonly totalTransactionsCount = signal(0);
  readonly stockInCount = signal(0);
  readonly stockOutCount = signal(0);

  protected readonly Math = Math;

  private readonly searchSubject = new Subject<string>();

  readonly typeOptions = [
    {
      value: 'StockIn',
      label: 'Stock In',
      activeClass: 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm shadow-emerald-500/5',
      icon: `<svg class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>`
    },
    {
      value: 'StockOut',
      label: 'Stock Out',
      activeClass: 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm shadow-rose-500/5',
      icon: `<svg class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>`
    },
    {
      value: 'Adjustment',
      label: 'Adjustment',
      activeClass: 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm shadow-amber-500/5',
      icon: `<svg class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>`
    },
    {
      value: 'Return',
      label: 'Return',
      activeClass: 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm shadow-blue-500/5',
      icon: `<svg class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>`
    }
  ];

  constructor() {
    this.txForm = this.fb.group({
      productId: [0, [Validators.required, Validators.min(1)]],
      type: ['StockIn', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      notes: ['']
    });

    // Set up search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(val => {
      this.txSearchQuery.set(val);
      this.txCurrentPage.set(1);
      this.loadRecentTransactions();
    });
  }

  ngOnInit(): void {
    this.loadCatalog();
    this.loadRecentTransactions();
  }

  loadCatalog(): void {
    this.productService.getAll().subscribe({
      next: (res) => this.products.set(res),
      error: () => this.toastService.error('Failed to load catalog products.')
    });
  }

  onSearchChange(value: string): void {
    this.rawSearchQuery.set(value);
    this.searchSubject.next(value);
  }

  onTypeFilterChange(value: string): void {
    this.txTypeFilter.set(value);
    this.txCurrentPage.set(1);
    this.loadRecentTransactions();
  }

  onPageChange(page: number): void {
    this.txCurrentPage.set(page);
    this.loadRecentTransactions();
  }

  loadRecentTransactions(): void {
    this.isLoadingRecent.set(true);
    this.stockService.getPaged(
      this.txSearchQuery(),
      this.txTypeFilter(),
      this.txCurrentPage(),
      this.txPageSize()
    ).subscribe({
      next: (res) => {
        this.transactions.set(res.items);
        this.totalFilteredCount.set(res.totalCount);
        this.txTotalPages.set(res.totalPages);

        // Update stats from backend summary
        if (res.summary) {
          this.totalTransactionsCount.set(res.summary['totalCount'] ?? 0);
          this.stockInCount.set(res.summary['stockInCount'] ?? 0);
          this.stockOutCount.set(res.summary['stockOutCount'] ?? 0);
        }

        this.isLoadingRecent.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load transaction logs.');
        this.isLoadingRecent.set(false);
      }
    });
  }

  setTxType(type: string): void {
    this.txForm.patchValue({ type });
    const quantityControl = this.txForm.get('quantity');
    if (quantityControl) {
      if (type === 'Adjustment') {
        quantityControl.setValidators([Validators.required, (control) => control.value === 0 ? { zeroQuantity: true } : null]);
      } else {
        quantityControl.setValidators([Validators.required, Validators.min(1)]);
      }
      quantityControl.updateValueAndValidity();
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'StockIn':
        return 'bg-emerald-50 border border-emerald-250 text-emerald-700';
      case 'StockOut':
        return 'bg-rose-50 border border-rose-250 text-rose-700';
      case 'Adjustment':
        return 'bg-amber-50 border border-amber-250 text-amber-700';
      case 'Return':
        return 'bg-blue-50 border border-blue-250 text-blue-700';
      default:
        return 'bg-zinc-100 border border-zinc-200 text-zinc-650';
    }
  }

  getTransactionColorClass(tx: StockTransactionResponseDto): string {
    if (tx.type === 'StockIn' || tx.type === 'Return') {
      return 'text-emerald-600';
    }
    if (tx.type === 'StockOut') {
      return 'text-rose-600';
    }
    return tx.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600';
  }

  getTransactionSign(tx: StockTransactionResponseDto): string {
    if (tx.type === 'StockIn' || tx.type === 'Return') {
      return '+';
    }
    if (tx.type === 'StockOut') {
      return '-';
    }
    return tx.quantity >= 0 ? '+' : '-';
  }

  getTransactionQuantity(tx: StockTransactionResponseDto): number {
    return Math.abs(tx.quantity);
  }

  selectProduct(prod: ProductListDto): void {
    this.selectedProductId.set(prod.productId);
    this.txForm.patchValue({ productId: prod.productId });
    this.txForm.get('productId')?.markAsTouched();
    this.isDropdownOpen.set(false);
    this.productSearchQuery.set('');
  }

  getStockBadgeClass(p: ProductListDto): string {
    if (p.quantity === 0) {
      return 'bg-rose-50 border-rose-200 text-rose-700';
    } else if (p.quantity <= 10) {
      return 'bg-amber-50 border border-amber-200 text-amber-700';
    } else {
      return 'bg-blue-50 border border-blue-200 text-blue-700';
    }
  }

  onSubmit(): void {
    if (this.txForm.invalid) return;

    this.isSubmitting.set(true);
    this.stockService.recordTransaction(this.txForm.value).subscribe({
      next: () => {
        this.toastService.success('Stock transaction recorded successfully!');
        this.isSubmitting.set(false);
        this.txForm.patchValue({
          productId: 0,
          quantity: 1,
          notes: ''
        });
        this.selectedProductId.set(0);
        // Reload details
        this.loadCatalog();
        this.loadRecentTransactions();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || err.error || 'Failed to submit transaction.';
        this.toastService.error(msg);
      }
    });
  }
}
