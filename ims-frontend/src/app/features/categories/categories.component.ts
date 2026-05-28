import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService, CategoryDto } from '../../core/services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SkeletonComponent, ConfirmModalComponent],
  templateUrl: './categories.component.html'
})
export class CategoriesComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly categories = signal<CategoryDto[]>([]);
  readonly isLoading = signal(true);
  readonly isModalOpen = signal(false);
  readonly isEditing = signal(false);

  readonly viewModalOpen = signal(false);
  readonly selectedCategoryForView = signal<CategoryDto | null>(null);

  categoryForm: FormGroup;
  selectedCategoryId: number | null = null;

  readonly searchQuery = signal('');
  readonly rawSearchValue = signal(''); // Holds current keyboard input

  // Pagination State Signals
  readonly currentPage = signal(1);
  readonly pageSize = signal(6);
  readonly totalPages = signal(1);
  readonly totalFilteredCount = signal(0);

  // Statistics Signals
  readonly totalCategoriesCount = signal(0);
  readonly categoriesWithDescriptionCount = signal(0);
  readonly categoriesWithoutDescriptionCount = signal(0);

  protected readonly Math = Math;

  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });

    // Set up search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(val => {
      this.searchQuery.set(val);
      this.currentPage.set(1);
      this.loadCategories();
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  onSearchChange(value: string): void {
    this.rawSearchValue.set(value);
    this.searchSubject.next(value);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.categoryService.getPaged(this.searchQuery(), this.currentPage(), this.pageSize()).subscribe({
      next: (res) => {
        this.categories.set(res.items);
        this.totalFilteredCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);

        // Update stats from summary
        if (res.summary) {
          this.totalCategoriesCount.set(res.summary['totalCount'] ?? 0);
          this.categoriesWithDescriptionCount.set(res.summary['withDescription'] ?? 0);
          this.categoriesWithoutDescriptionCount.set(res.summary['withoutDescription'] ?? 0);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load categories.');
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedCategoryId = null;
    this.categoryForm.reset({
      name: '',
      description: ''
    });
    this.isModalOpen.set(true);
  }

  openEditModal(cat: CategoryDto): void {
    this.isEditing.set(true);
    this.selectedCategoryId = cat.categoryId;
    this.categoryForm.patchValue({
      name: cat.name,
      description: cat.description
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  openViewModal(cat: CategoryDto): void {
    this.selectedCategoryForView.set(cat);
    this.viewModalOpen.set(true);
  }

  closeViewModal(): void {
    this.viewModalOpen.set(false);
    this.selectedCategoryForView.set(null);
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) return;

    if (this.isEditing() && this.selectedCategoryId !== null) {
      this.categoryService.update(this.selectedCategoryId, this.categoryForm.value).subscribe({
        next: () => {
          this.toastService.success('Category updated successfully.');
          this.closeModal();
          this.loadCategories();
        },
        error: (err) => {
          const msg = err.error?.message || err.error || 'Failed to update category.';
          this.toastService.error(msg);
        }
      });
    } else {
      this.categoryService.create(this.categoryForm.value).subscribe({
        next: () => {
          this.toastService.success('Category created successfully.');
          this.closeModal();
          this.loadCategories();
        },
        error: (err) => {
          const msg = err.error?.message || err.error || 'Failed to create category.';
          this.toastService.error(msg);
        }
      });
    }
  }

  readonly deleteModalOpen = signal(false);
  readonly categoryToDelete = signal<CategoryDto | null>(null);

  onDelete(cat: CategoryDto): void {
    this.categoryToDelete.set(cat);
    this.deleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const cat = this.categoryToDelete();
    if (!cat) return;

    this.categoryService.delete(cat.categoryId).subscribe({
      next: () => {
        this.toastService.success('Category deleted.');
        this.cancelDelete();
        this.loadCategories();
      },
      error: (err) => {
        const msg = err.error?.message || err.error || 'Failed to delete category. Ensure no products are linked.';
        this.toastService.error(msg);
        this.cancelDelete();
      }
    });
  }

  cancelDelete(): void {
    this.deleteModalOpen.set(false);
    this.categoryToDelete.set(null);
  }
}
