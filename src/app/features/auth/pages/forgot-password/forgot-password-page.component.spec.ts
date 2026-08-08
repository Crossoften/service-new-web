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

  it('mostra e-mail e SMS como canais de recuperação', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector<HTMLInputElement>('input[value="email"]')).toBeTruthy();
    expect(element.querySelector<HTMLInputElement>('input[value="sms"]')).toBeTruthy();
    expect(element.textContent).toContain('E-mail');
    expect(element.textContent).toContain('SMS');
  });

  it('envia o telefone normalizado ao selecionar SMS', () => {
    const element = fixture.nativeElement as HTMLElement;
    const sms = element.querySelector<HTMLInputElement>('input[value="sms"]')!;
    sms.click();
    fixture.detectChanges();

    const identifier = element.querySelector<HTMLInputElement>('#identifier')!;
    identifier.value = '+55 (11) 98765-4321';
    identifier.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    element.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(authApiService.forgotPassword).toHaveBeenCalledWith({
      channel: 'sms',
      identifier: '+5511' + '987654321',
    });
  });
});
