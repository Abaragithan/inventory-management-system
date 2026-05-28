import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupplierService, SupplierResponseDto, UpdateSupplierDto } from '../../core/services/supplier.service';
import { ToastService } from '../../core/services/toast.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-supplier-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SkeletonComponent],
  templateUrl: './supplier-profile.component.html'
})
export class SupplierProfileComponent implements OnInit {
  private readonly supplierService = inject(SupplierService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly profile = signal<SupplierResponseDto | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMsg = signal<string | null>(null);

  profileForm: FormGroup;
  private readonly phonePattern = /^[0-9\s\+\-\(\)]{6,20}$/;

  constructor() {
    this.profileForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.maxLength(200)]],
      contactPerson: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(this.phonePattern)]],
      address: ['', [Validators.required, Validators.maxLength(500)]]
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
        this.profileForm.patchValue({
          companyName: res.companyName,
          contactPerson: res.contactPerson,
          email: res.email,
          phone: res.phone,
          address: res.address
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errMsg = err.error?.message || err.error || 'Failed to retrieve supplier profile details.';
        this.errorMsg.set(errMsg);
        this.toastService.error(errMsg);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const dto: UpdateSupplierDto = {
      companyName: this.profileForm.value.companyName,
      contactPerson: this.profileForm.value.contactPerson,
      email: this.profileForm.value.email,
      phone: this.profileForm.value.phone,
      address: this.profileForm.value.address,
      isActive: this.profile()?.isActive ?? true
    };

    this.supplierService.updateMyProfile(dto).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.success('Profile details saved successfully.');
        
        // Refresh the local profile cache
        if (this.profile()) {
          this.profile.set({
            ...this.profile()!,
            ...dto
          });
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        const errMsg = err.error?.message || err.error || 'Failed to update profile settings.';
        this.toastService.error(errMsg);
      }
    });
  }
}
