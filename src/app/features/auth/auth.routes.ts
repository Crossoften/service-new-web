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
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
