import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ToastService } from '@core/services/toast.service';
import { AuthApiService } from '../../services/auth-api.service';
import { ForgotPasswordPageComponent } from './forgot-password-page.component';

describe('ForgotPasswordPageComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordPageComponent>;
  let authApiService: { forgotPassword: jest.Mock };

  beforeEach(async () => {
    authApiService = { forgotPassword: jest.fn().mockReturnValue(of({ message: 'Enviado' })) };

    Object.assign(globalThis, {
      bootstrap: {
        Modal: class {
          show(): void {}
          hide(): void {}
        },
      },
    });

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthApiService, useValue: authApiService },
        { provide: ToastService, useValue: { showSuccess: jest.fn(), showError: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordPageComponent);
    fixture.detectChanges();
  });

  it('usa a mesma estrutura visual principal da tela de login', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.login-page')).toBeTruthy();
    expect(element.querySelector('.login-content')).toBeTruthy();
    expect(element.querySelector('.login-panel')).toBeTruthy();
    expect(element.querySelector('.login-form')).toBeTruthy();
    expect(element.querySelector('.login-footer')).toBeTruthy();
    expect(element.querySelector('.illustration-panel img')?.getAttribute('src')).toBe(
      'assets/login-illustration.svg'
    );
  });

  it('exibe somente recuperação por e-mail', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('input[value="sms"]')).toBeNull();
    expect(element.querySelector('input[type="radio"]')).toBeNull();
    expect(element.textContent).not.toContain('SMS');
    expect(element.textContent).toContain(
      'Informe seu e-mail para receber o código de redefinição.'
    );
  });

  it('envia o e-mail normalizado como único canal de recuperação', () => {
    const element = fixture.nativeElement as HTMLElement;
    const identifier = element.querySelector<HTMLInputElement>('#identifier')!;
    identifier.value = '  ADMIN@EXEMPLO.COM  ';
    identifier.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    element.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(authApiService.forgotPassword).toHaveBeenCalledWith({
      channel: 'email',
      identifier: 'admin@exemplo.com',
    });
  });
});
