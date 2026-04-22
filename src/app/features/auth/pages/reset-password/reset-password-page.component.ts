import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { AuthApiService } from '../../services/auth-api.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password-page.component.html',
  styleUrls: ['./reset-password-page.component.scss'],
})
export class ResetPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly authApiService = inject(AuthApiService);

  readonly isSubmitting = signal(false);
  readonly resetForm: FormGroup = this.fb.group(
    {
      code: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]],
      password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]],
    },
    { validators: passwordMatchValidator }
  );

  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isConfirmInvalid(): boolean {
    const control = this.resetForm.get('confirmPassword');
    const mismatch = this.resetForm.errors?.['passwordMismatch'];
    return !!(control && (control.dirty || control.touched) && (control.invalid || mismatch));
  }

  onSubmit(): void {
    this.resetForm.markAllAsTouched();

    if (this.resetForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);

    this.authApiService
      .resetPassword({
        code: this.resetForm.get('code')?.value as string,
        password: this.resetForm.get('password')?.value as string,
        confirmPassword: this.resetForm.get('confirmPassword')?.value as string,
      })
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.toastService.showSuccess(response.message || 'Senha redefinida com sucesso.');
          this.router.navigate(['/auth/login']);
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
  }
}
