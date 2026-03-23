import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '@core/services/toast.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (!password || !confirm) return null;
  return password.value === confirm.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password-page.component.html',
  styleUrls: ['./reset-password-page.component.scss'],
})
export class ResetPasswordPageComponent {
  resetForm!: FormGroup;
  isSubmitting = signal(false);

  readonly testCredentials = {
    token: '123456',
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastService: ToastService
  ) {
    this.initForm();
  }

  private initForm(): void {
    this.resetForm = this.fb.group(
      {
        token: ['', [Validators.required, Validators.minLength(4)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordMatchValidator }
    );
  }

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
    if (!this.resetForm.valid) {
      return;
    }

    this.isSubmitting.set(true);

    setTimeout(() => {
      this.isSubmitting.set(false);
      this.toastService.showSuccess('Senha redefinida com sucesso!');
      this.router.navigate(['/auth/login']);
    }, 1500);
  }
}
