import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { AuthApiService } from '../../services/auth-api.service';

declare const bootstrap: {
  Modal: new (el: HTMLElement, opts?: object) => { show(): void; hide(): void };
};

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password-page.component.html',
  styleUrls: ['./forgot-password-page.component.scss'],
})
export class ForgotPasswordPageComponent {
  @ViewChild('messageSentModalRef') messageSentModalRef!: ElementRef<HTMLElement>;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly authApiService = inject(AuthApiService);

  readonly isSubmitting = signal(false);
  readonly sentIdentifier = signal('');
  readonly forgotPasswordForm = this.fb.group({
    identifier: ['', [Validators.required, Validators.email]],
  });

  private modalInstance: { show(): void; hide(): void } | null = null;

  isFieldInvalid(): boolean {
    const field = this.forgotPasswordForm.controls.identifier;
    return field.invalid && (field.dirty || field.touched);
  }

  onSubmit(): void {
    this.forgotPasswordForm.markAllAsTouched();

    if (this.forgotPasswordForm.invalid || this.isSubmitting()) {
      return;
    }

    const rawIdentifier = this.forgotPasswordForm.controls.identifier.value ?? '';
    const identifier = rawIdentifier.trim().toLowerCase();

    this.isSubmitting.set(true);
    this.authApiService.forgotPassword({ channel: 'email', identifier }).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.sentIdentifier.set(identifier);
        this.toastService.showSuccess(response.message || 'E-mail enviado com sucesso.');
        this.modalInstance = new bootstrap.Modal(this.messageSentModalRef.nativeElement, {
          backdrop: 'static',
          keyboard: false,
        });
        this.modalInstance.show();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.showError(
          'Não foi possível enviar o e-mail. Aguarde um momento e tente novamente.'
        );
      },
    });
  }

  confirmAndNavigate(): void {
    this.modalInstance?.hide();
    void this.router.navigate(['/auth/reset-password']);
  }
}
