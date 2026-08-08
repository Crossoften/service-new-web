import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { PasswordRecoveryChannel } from '../../models/auth.model';
import { AuthApiService } from '../../services/auth-api.service';

declare const bootstrap: {
  Modal: new (el: HTMLElement, opts?: object) => { show(): void; hide(): void };
};

const PHONE_ALLOWED_CHARACTERS = /^\+?[\d\s().-]+$/;

function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const prefix = trimmed.startsWith('+') ? '+' : '';
  return `${prefix}${trimmed.replace(/\D/g, '')}`;
}

const phoneValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (!value) return null;

  const digits = normalizePhone(value).replace(/\D/g, '');
  return PHONE_ALLOWED_CHARACTERS.test(value) && digits.length >= 10 && digits.length <= 15
    ? null
    : { phone: true };
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

  readonly channel = signal<PasswordRecoveryChannel>('email');
  readonly isSubmitting = signal(false);
  readonly sentIdentifier = signal('');
  readonly forgotPasswordForm = this.fb.group({
    channel: this.fb.nonNullable.control<PasswordRecoveryChannel>('email'),
    identifier: ['', [Validators.required, Validators.email]],
  });

  private modalInstance: { show(): void; hide(): void } | null = null;

  selectChannel(channel: PasswordRecoveryChannel): void {
    if (channel === this.channel()) return;

    this.channel.set(channel);
    this.forgotPasswordForm.controls.channel.setValue(channel);
    this.forgotPasswordForm.controls.identifier.reset('');
    this.forgotPasswordForm.controls.identifier.setValidators(
      channel === 'email'
        ? [Validators.required, Validators.email]
        : [Validators.required, phoneValidator]
    );
    this.forgotPasswordForm.controls.identifier.updateValueAndValidity();
  }

  isFieldInvalid(): boolean {
    const field = this.forgotPasswordForm.controls.identifier;
    return field.invalid && (field.dirty || field.touched);
  }

  onSubmit(): void {
    this.forgotPasswordForm.markAllAsTouched();

    if (this.forgotPasswordForm.invalid || this.isSubmitting()) {
      return;
    }

    const channel = this.channel();
    const rawIdentifier = this.forgotPasswordForm.controls.identifier.value ?? '';
    const identifier =
      channel === 'email' ? rawIdentifier.trim().toLowerCase() : normalizePhone(rawIdentifier);

    this.isSubmitting.set(true);
    this.authApiService.forgotPassword({ channel, identifier }).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.sentIdentifier.set(identifier);
        this.toastService.showSuccess(
          response.message ||
            (channel === 'email' ? 'E-mail enviado com sucesso.' : 'SMS enviado com sucesso.')
        );
        this.modalInstance = new bootstrap.Modal(this.messageSentModalRef.nativeElement, {
          backdrop: 'static',
          keyboard: false,
        });
        this.modalInstance.show();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.showError(
          channel === 'sms'
            ? 'Não foi possível enviar o SMS. Tente novamente ou escolha o recebimento por e-mail.'
            : 'Não foi possível enviar o e-mail. Aguarde um momento e tente novamente.'
        );
      },
    });
  }

  confirmAndNavigate(): void {
    this.modalInstance?.hide();
    void this.router.navigate(['/auth/reset-password']);
  }
}
