import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { AuthApiService } from '../../services/auth-api.service';
import { ResetPasswordPageComponent } from './reset-password-page.component';

describe('ResetPasswordPageComponent', () => {
  let fixture: ComponentFixture<ResetPasswordPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthApiService,
          useValue: { resetPassword: jest.fn() },
        },
        {
          provide: ToastService,
          useValue: { showSuccess: jest.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordPageComponent);
    fixture.detectChanges();
  });

  it('usa a mesma composição visual das telas públicas de autenticação', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('main.login-page')).not.toBeNull();
    expect(element.querySelector('.login-content')).not.toBeNull();
    expect(element.querySelector('.login-panel')).not.toBeNull();
    expect(element.querySelector('form.login-form')).not.toBeNull();
    expect(element.querySelector('.illustration-panel img')).not.toBeNull();
    expect(element.querySelector('footer.login-footer')).not.toBeNull();
  });

  it('mantém os campos e ações necessários para redefinir a senha', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('#code')).not.toBeNull();
    expect(element.querySelector('#password')).not.toBeNull();
    expect(element.querySelector('#confirmPassword')).not.toBeNull();
    expect(element.querySelector('button[type="submit"]')?.textContent).toContain('CONFIRMAR');
    expect(element.querySelector('.back-link')?.textContent).toContain(
      'Voltar para a tela de login'
    );
  });
});
