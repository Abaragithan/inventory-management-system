import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { UserService, UserResponseDto } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SkeletonComponent],
  templateUrl: './user-profile.component.html'
})
export class UserProfileComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly profile = signal<UserResponseDto | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMsg = signal<string | null>(null);

  // Password visibility toggles
  readonly showCurrent = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);

  // Role display helpers
  readonly roleBadgeColor = computed(() => {
    const role = this.profile()?.role;
    return role === 'Admin'
      ? 'bg-gradient-to-br from-blue-600 to-blue-800'
      : 'bg-gradient-to-br from-violet-500 to-violet-700';
  });

  readonly roleChipClass = computed(() => {
    const role = this.profile()?.role;
    return role === 'Admin'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-violet-50 text-violet-700 border-violet-200';
  });

  readonly roleDotClass = computed(() => {
    const role = this.profile()?.role;
    return role === 'Admin' ? 'bg-blue-600' : 'bg-violet-600';
  });

  passwordForm: FormGroup;

  // Password strength — 1=weak, 2=fair, 3=good, 4=strong
  readonly passwordStrength = computed(() => {
    const v: string = this.passwordForm?.get('newPassword')?.value ?? '';
    if (!v) return 0;
    let score = 0;
    if (v.length >= 6) score++;
    if (v.length >= 10) score++;
    if (/[A-Z]/.test(v) && /[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    return Math.max(1, score);
  });

  readonly passwordStrengthLabel = computed(() => {
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[this.passwordStrength()] ?? '';
  });

  constructor() {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.userService.getMyProfile().subscribe({
      next: (res) => {
        this.profile.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || err.error || 'Failed to load profile.';
        this.errorMsg.set(msg);
        this.toastService.error(msg);
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const c = this.passwordForm.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    const { currentPassword, newPassword, confirmNewPassword } = this.passwordForm.value;
    this.userService.changePassword({ currentPassword, newPassword, confirmNewPassword }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.success('Password updated successfully. Please use your new password next time you log in.');
        this.passwordForm.reset();
      },
      error: (err) => {
        this.isSaving.set(false);
        const msg = err.error?.message || 'Failed to update password.';
        this.toastService.error(msg);
      }
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPass = control.get('newPassword')?.value;
    const confirmPass = control.get('confirmNewPassword')?.value;
    return newPass === confirmPass ? null : { mismatch: true };
  }
}
