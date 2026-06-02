import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login-page.component').then((m) => m.LoginPageComponent),
    data: { title: 'Login' },
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password-page.component').then(
        (m) => m.ForgotPasswordPageComponent
      ),
    data: { title: 'Esqueceu sua Senha' },
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password-page.component').then(
        (m) => m.ResetPasswordPageComponent
      ),
    data: { title: 'Redefinir Senha' },
  },
  {
    path: 'terms-of-use',
    loadComponent: () =>
      import('./pages/terms-of-use/terms-of-use-page.component').then(
        (m) => m.TermsOfUsePageComponent
      ),
    data: { title: 'Termos de Uso' },
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./pages/privacy-policy/privacy-policy-page.component').then(
        (m) => m.PrivacyPolicyPageComponent
      ),
    data: { title: 'Políticas de Privacidade' },
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact-page.component').then((m) => m.ContactPageComponent),
    data: { title: 'Contato' },
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
