import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Bootstrap JS é carregado como script global via angular.json
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

  forgotPasswordForm!: FormGroup;
  isSubmitting = signal(false);
  sentEmail = signal('');

  readonly testCredentials = {
    email: 'demo@service.com',
    code: '123456',
  };

  private modalInstance: { show(): void; hide(): void } | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initForm();
  }

  private initForm(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (!this.forgotPasswordForm.valid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    setTimeout(() => {
      this.isSubmitting.set(false);
      this.sentEmail.set(this.forgotPasswordForm.get('email')?.value ?? '');
      this.modalInstance = new bootstrap.Modal(this.emailSentModalRef.nativeElement, {
        backdrop: 'static',
        keyboard: false,
      });
      this.modalInstance.show();
    }, 1500);
  }

  confirmAndNavigate(): void {
    this.modalInstance?.hide();
    this.router.navigate(['/auth/reset-password']);
  }

  goBack(): void {
    this.router.navigate(['/auth/login']);
  }
}
