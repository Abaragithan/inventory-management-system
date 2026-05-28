import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, ProductListDto } from '../../core/services/product.service';
import { CategoryService, CategoryDto } from '../../core/services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-supplier-products',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonComponent],
  templateUrl: './supplier-products.component.html'
})
export class SupplierProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly toastService = inject(ToastService);

  readonly products = signal<ProductListDto[]>([]);
  readonly categories = signal<CategoryDto[]>([]);
  readonly isLoading = signal(true);

  // Search & Filter States
  readonly searchQuery = signal('');
  readonly selectedCategory = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly totalCount = signal(0);
  protected readonly Math = Math;

  constructor() {
    // Re-fetch products whenever filters or page changes
    effect(() => {
      this.loadProducts();
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (res) => this.categories.set(res),
      error: () => this.toastService.error('Failed to load categories.')
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productService.getPaged(
      this.searchQuery(),
      this.selectedCategory(),
      '', // Backend resolves current supplier name automatically using token roles
      this.page(),
      this.pageSize()
    ).subscribe({
      next: (res) => {
        this.products.set(res.items);
        this.totalCount.set(res.totalCount);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load products.');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    this.page.set(1);
  }

  onFilterChange(): void {
    this.page.set(1);
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
  }

  getStockStatusClass(quantity: number, reorderLevel: number): string {
    if (quantity === 0) return 'bg-rose-50 border border-rose-200 text-rose-700';
    if (quantity <= reorderLevel) return 'bg-amber-50 border border-amber-250 text-amber-700';
    return 'bg-emerald-50 border border-emerald-200 text-emerald-700';
  }

  getStockStatusLabel(quantity: number, reorderLevel: number): string {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= reorderLevel) return 'Low Stock';
    return 'In Stock';
  }

  readonly totalPages = () => Math.ceil(this.totalCount() / this.pageSize());
}
