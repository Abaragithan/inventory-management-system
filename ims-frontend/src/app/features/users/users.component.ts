import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, UserResponseDto } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SkeletonComponent, ConfirmModalComponent],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly users = signal<UserResponseDto[]>([]);
  readonly isLoading = signal(true);
  readonly isModalOpen = signal(false);
  readonly isEditing = signal(false);
  readonly isSubmitting = signal(false);

  readonly viewModalOpen = signal(false);
  readonly selectedUserForView = signal<UserResponseDto | null>(null);

  userForm: FormGroup;
  selectedUserId: number | null = null;

  // Search & Filter State
  readonly searchQuery = signal('');
  readonly rawSearchValue = signal('');
  readonly roleFilter = signal('');

  // Pagination State
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalPages = signal(1);
  readonly totalFilteredCount = signal(0);

  // Stats Counts
  readonly totalAccountsCount = signal(0);
  readonly adminCount = signal(0);
  readonly managerCount = signal(0);
  readonly pendingStaffCount = signal(0);

  protected readonly Math = Math;

  private readonly searchSubject = new Subject<string>();

  /** Reactive accessor for the current role value in the form */
  readonly selectedRoleValue = computed(() =>
    this.userForm?.get('role')?.value ?? ''
  );

  constructor() {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      confirmPassword: [''],
      role: ['InventoryManager', [Validators.required]],
      isActive: [true],
      isEmailVerified: [false]
    }, { validators: this.passwordMatchValidator });

    // Set up search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(val => {
      this.searchQuery.set(val);
      this.currentPage.set(1);
      this.loadUsers();
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  onSearchChange(value: string): void {
    this.rawSearchValue.set(value);
    this.searchSubject.next(value);
  }

  onRoleFilterChange(value: string): void {
    this.roleFilter.set(value);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getPaged(
      this.searchQuery(),
      this.roleFilter(),
      this.currentPage(),
      this.pageSize()
    ).subscribe({
      next: (res) => {
        this.users.set(res.items);
        this.totalFilteredCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);

        // Update stats from backend summary
        if (res.summary) {
          this.totalAccountsCount.set(res.summary['totalCount'] ?? 0);
          this.pendingStaffCount.set(res.summary['staffCount'] ?? 0);
          this.adminCount.set(res.summary['adminCount'] ?? 0);
          this.managerCount.set(res.summary['managerCount'] ?? 0);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load user list.');
        this.isLoading.set(false);
      }
    });
  }

  /** Returns true when a field is invalid AND has been touched/dirtied */
  isInvalid(field: string): boolean {
    const ctrl = this.userForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'Admin':         return 'bg-zinc-900 border-zinc-700 text-white';
      case 'InventoryManager': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'Supplier':     return 'bg-zinc-50 border-zinc-200 text-zinc-650';
      case 'Staff':        return 'bg-amber-50 border-amber-200 text-amber-700';
      default:             return 'bg-zinc-100 border-zinc-200 text-zinc-650';
    }
  }

  toggleUserStatus(usr: UserResponseDto): void {
    const dto = { email: usr.email, role: usr.role, isActive: !usr.isActive, isEmailVerified: usr.isEmailVerified };
    this.userService.update(usr.userId, dto).subscribe({
      next: () => {
        this.toastService.success('User status updated.');
        this.loadUsers();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to toggle status.');
      }
    });
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedUserId = null;
    this.userForm.reset({ email: '', password: '', confirmPassword: '', role: 'InventoryManager', isActive: true, isEmailVerified: false });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('confirmPassword')?.setValidators([Validators.required]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('confirmPassword')?.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  openEditModal(usr: UserResponseDto): void {
    this.isEditing.set(true);
    this.selectedUserId = usr.userId;
    this.userForm.reset({ email: usr.email, role: usr.role, isActive: usr.isActive, isEmailVerified: usr.isEmailVerified, password: '', confirmPassword: '' });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('confirmPassword')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('confirmPassword')?.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  openViewModal(usr: UserResponseDto): void {
    this.selectedUserForView.set(usr);
    this.viewModalOpen.set(true);
  }

  closeViewModal(): void {
    this.viewModalOpen.set(false);
    this.selectedUserForView.set(null);
  }

  onSubmit(): void {
    if (this.userForm.invalid) return;

    const raw = this.userForm.value;
    this.isSubmitting.set(true);

    if (this.isEditing() && this.selectedUserId !== null) {
      // ── EDIT PATH ──
      const dto = { email: raw.email, role: raw.role, isActive: raw.isActive, isEmailVerified: raw.isEmailVerified };

      this.userService.update(this.selectedUserId, dto).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();

          if (raw.role === 'Supplier') {
            // User role updated → redirect to suppliers page with this user pre-selected
            this.toastService.success('Role updated to Supplier. Fill in the company details below.');
            this.router.navigate(['/suppliers'], { queryParams: { preselect: this.selectedUserId } });
          } else {
            this.toastService.success('User updated successfully.');
            this.loadUsers();
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toastService.error(err.error?.message || 'Failed to update user.');
        }
      });

    } else {
      // ── CREATE PATH ──
      const dto = { email: raw.email, password: raw.password, confirmPassword: raw.confirmPassword, role: raw.role };

      this.userService.create(dto).subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.closeModal();

          if (raw.role === 'Supplier') {
            // New user created as Supplier → redirect to suppliers page
            this.toastService.success('User created with Supplier role. Fill in the company details below.');
            this.router.navigate(['/suppliers'], { queryParams: { preselect: created.userId } });
          } else {
            this.toastService.success('User registered successfully.');
            this.loadUsers();
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toastService.error(err.error?.message || 'Failed to register user.');
        }
      });
    }
  }

  readonly deleteModalOpen = signal(false);
  readonly userToDelete = signal<UserResponseDto | null>(null);

  onDelete(usr: UserResponseDto): void {
    this.userToDelete.set(usr);
    this.deleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const usr = this.userToDelete();
    if (!usr) return;
    this.userService.delete(usr.userId).subscribe({
      next: () => {
        this.toastService.success('User account removed.');
        this.cancelDelete();
        this.loadUsers();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to delete user.');
        this.cancelDelete();
      }
    });
  }

  cancelDelete(): void {
    this.deleteModalOpen.set(false);
    this.userToDelete.set(null);
  }
}
