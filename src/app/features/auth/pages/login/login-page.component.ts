import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { AuthApiService } from '../../services/auth-api.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly authApiService = inject(AuthApiService);

  readonly isSubmitting = signal(false);
  readonly apiStatusMessage = signal('Verificando backend...');
  readonly apiStatusState = signal<'pending' | 'up' | 'down'>('pending');
  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  ngOnInit(): void {
    this.authApiService.getHealthCheck().subscribe({
      next: (message) => {
        this.apiStatusMessage.set(message || 'Servidor UP');
        this.apiStatusState.set('up');
      },
      error: () => {
        this.apiStatusMessage.set('Backend indisponivel no momento');
        this.apiStatusState.set('down');
      },
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);

    this.authApiService
      .login({
        email: this.loginForm.get('email')?.value as string,
        password: this.loginForm.get('password')?.value as string,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toastService.showSuccess('Login realizado com sucesso.');
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
  }
}
