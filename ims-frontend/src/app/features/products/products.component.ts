import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService, ProductListDto, ProductResponseDto } from '../../core/services/product.service';
import { CategoryService, CategoryDto } from '../../core/services/category.service';
import { SupplierService, SupplierResponseDto } from '../../core/services/supplier.service';
import { ToastService } from '../../core/services/toast.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SkeletonComponent, ConfirmModalComponent],
  templateUrl: './products.component.html'
})
export class ProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly supplierService = inject(SupplierService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly products = signal<ProductListDto[]>([]);
  readonly categories = signal<CategoryDto[]>([]);
  readonly suppliers = signal<SupplierResponseDto[]>([]);
  
  readonly isLoading = signal(true);
  readonly isModalOpen = signal(false);
  readonly isEditing = signal(false);

  readonly deleteModalOpen = signal(false);
  readonly productToDelete = signal<ProductListDto | null>(null);

  readonly viewModalOpen = signal(false);
  readonly selectedProductForView = signal<ProductResponseDto | null>(null);
  
  selectedProductId: number | null = null;
  productForm: FormGroup;

  // Search & Filter State Signals
  readonly searchQuery = signal('');
  readonly rawSearchValue = signal('');
  readonly selectedCategory = signal('');
  readonly selectedSupplier = signal('');

  // Pagination State Signals
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalPages = signal(1);
  readonly totalFilteredCount = signal(0);

  // Statistics Signals
  readonly totalProductsCount = signal(0);
  readonly outOfStockCount = signal(0);
  readonly lowStockCount = signal(0);

  protected readonly Math = Math;

  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.productForm = this.fb.group({
      barcode: ['', [Validators.required, Validators.maxLength(100)]],
      name: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      reorderLevel: [10, [Validators.required, Validators.min(0)]],
      categoryId: [0, [Validators.required, Validators.min(1)]],
      supplierId: [0, [Validators.required, Validators.min(1)]]
    });

    // Set up search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(val => {
      this.searchQuery.set(val);
      this.currentPage.set(1);
      this.loadProducts();
    });
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  onSearchChange(value: string): void {
    this.rawSearchValue.set(value);
    this.searchSubject.next(value);
  }

  onCategoryChange(value: string): void {
    this.selectedCategory.set(value);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onSupplierChange(value: string): void {
    this.selectedSupplier.set(value);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();
  }

  loadAllData(): void {
    this.loadProducts();
    this.categoryService.getAll().subscribe(res => this.categories.set(res));
    this.supplierService.getAll().subscribe(res => this.suppliers.set(res));
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productService.getPaged(
      this.searchQuery(),
      this.selectedCategory(),
      this.selectedSupplier(),
      this.currentPage(),
      this.pageSize()
    ).subscribe({
      next: (res) => {
        this.products.set(res.items);
        this.totalFilteredCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);

        // Update stats from summary
        if (res.summary) {
          this.totalProductsCount.set(res.summary['totalCount'] ?? 0);
          this.outOfStockCount.set(res.summary['outOfStock'] ?? 0);
          this.lowStockCount.set(res.summary['lowStock'] ?? 0);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load products.');
        this.isLoading.set(false);
      }
    });
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

  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedProductId = null;
    this.productForm.reset({
      barcode: '',
      name: '',
      description: '',
      price: 0,
      costPrice: 0,
      quantity: 0,
      reorderLevel: 10,
      categoryId: 0,
      supplierId: 0
    });
    this.productForm.get('quantity')?.enable(); // Can input quantity when creating
    this.isModalOpen.set(true);
  }

  openEditModal(productId: number): void {
    this.isLoading.set(true);
    this.productService.getById(productId).subscribe({
      next: (res) => {
        this.isEditing.set(true);
        this.selectedProductId = productId;
        this.productForm.patchValue({
          barcode: res.barcode,
          name: res.name,
          description: res.description,
          price: res.price,
          costPrice: res.costPrice,
          quantity: res.quantity,
          reorderLevel: res.reorderLevel,
          categoryId: res.categoryId,
          supplierId: res.supplierId
        });
        // Disable quantity on edit (must adjust quantity through transactions page)
        this.productForm.get('quantity')?.disable();
        this.isLoading.set(false);
        this.isModalOpen.set(true);
      },
      error: () => {
        this.toastService.error('Failed to load product details.');
        this.isLoading.set(false);
      }
    });
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  openViewModal(productId: number): void {
    this.isLoading.set(true);
    this.productService.getById(productId).subscribe({
      next: (res) => {
        this.selectedProductForView.set(res);
        this.isLoading.set(false);
        this.viewModalOpen.set(true);
      },
      error: () => {
        this.toastService.error('Failed to load product details.');
        this.isLoading.set(false);
      }
    });
  }

  closeViewModal(): void {
    this.viewModalOpen.set(false);
    this.selectedProductForView.set(null);
  }

  onSubmit(): void {
    if (this.productForm.invalid) return;

    const rawValue = this.productForm.getRawValue();

    if (this.isEditing() && this.selectedProductId !== null) {
      this.productService.update(this.selectedProductId, rawValue).subscribe({
        next: () => {
          this.toastService.success('Product updated successfully!');
          this.closeModal();
          this.loadProducts();
        },
        error: (err) => {
          const msg = err.error?.message || err.error || 'Failed to update product.';
          this.toastService.error(msg);
        }
      });
    } else {
      this.productService.create(rawValue).subscribe({
        next: () => {
          this.toastService.success('Product created successfully!');
          this.closeModal();
          this.loadProducts();
        },
        error: (err) => {
          const msg = err.error?.message || err.error || 'Failed to create product.';
          this.toastService.error(msg);
        }
      });
    }
  }

  onDelete(prod: ProductListDto): void {
    this.productToDelete.set(prod);
    this.deleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const prod = this.productToDelete();
    if (!prod) return;

    this.productService.delete(prod.productId).subscribe({
      next: () => {
        this.toastService.success('Product deleted.');
        this.cancelDelete();
        this.loadProducts();
      },
      error: (err) => {
        const msg = err.error?.message || err.error || 'Failed to delete product.';
        this.toastService.error(msg);
        this.cancelDelete();
      }
    });
  }

  cancelDelete(): void {
    this.deleteModalOpen.set(false);
    this.productToDelete.set(null);
  }
}
