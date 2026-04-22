import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { AuthApiService } from '../../services/auth-api.service';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './contact-page.component.html',
  styleUrls: ['./contact-page.component.scss'],
})
export class ContactPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApiService = inject(AuthApiService);
  private readonly toastService = inject(ToastService);

  readonly isSubmitting = signal(false);
  readonly contactForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
    text: ['', [Validators.required, Validators.minLength(10)]],
  });

  isFieldInvalid(fieldName: 'name' | 'phone' | 'email' | 'text'): boolean {
    const field = this.contactForm.controls[fieldName];
    return field.invalid && (field.dirty || field.touched);
  }

  onSubmit(): void {
    this.contactForm.markAllAsTouched();

    if (this.contactForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);

    this.authApiService
      .contactUs({
        name: this.contactForm.controls.name.value,
        phone: this.contactForm.controls.phone.value || undefined,
        email: this.contactForm.controls.email.value,
        text: this.contactForm.controls.text.value,
      })
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.toastService.showSuccess(response.message || 'Mensagem enviada com sucesso.');
          this.contactForm.reset({
            name: '',
            phone: '',
            email: '',
            text: '',
          });
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
  }
}
