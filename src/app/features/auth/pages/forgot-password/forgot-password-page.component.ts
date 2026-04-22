import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { AuthApiService } from '../../services/auth-api.service';

declare const bootstrap: { Modal: new (el: HTMLElement, opts?: object) => { show(): void; hide(): void } };

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password-page.component.html',
  styleUrls: ['./forgot-password-page.component.scss'],
})
export class ForgotPasswordPageComponent {
  @ViewChild('emailSentModalRef') emailSentModalRef!: ElementRef<HTMLElement>;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly authApiService = inject(AuthApiService);

  readonly forgotPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });
  readonly isSubmitting = signal(false);
  readonly sentEmail = signal('');

  private modalInstance: { show(): void; hide(): void } | null = null;

  isFieldInvalid(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    this.forgotPasswordForm.markAllAsTouched();

    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);

    this.authApiService
      .forgotPassword({
        email: this.forgotPasswordForm.get('email')?.value as string,
      })
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.sentEmail.set(this.forgotPasswordForm.get('email')?.value as string);
          this.toastService.showSuccess(response.message || 'Email enviado com sucesso.');
          this.modalInstance = new bootstrap.Modal(this.emailSentModalRef.nativeElement, {
            backdrop: 'static',
            keyboard: false,
          });
          this.modalInstance.show();
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
  }

  confirmAndNavigate(): void {
    this.modalInstance?.hide();
    this.router.navigate(['/auth/reset-password']);
  }
}
