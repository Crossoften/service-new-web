import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
        (m) => m.DashboardPageComponent
      ),
    data: { title: 'Dashboard' },
  },
  {
    path: 'users',
    loadChildren: () =>
      import('./features/users/users.routes').then((m) => m.USERS_ROUTES),
    data: { title: 'Usuários' },
  },
  {
    path: 'services',
    loadChildren: () =>
      import('./features/services/services.routes').then((m) => m.SERVICES_ROUTES),
    data: { title: 'Serviços' },
  },
  {
    path: 'suppliers',
    loadChildren: () =>
      import('./features/suppliers/suppliers.routes').then((m) => m.SUPPLIERS_ROUTES),
    data: { title: 'Fornecedores' },
  },
  {
    path: 'finance',
    loadChildren: () =>
      import('./features/finance/finance.routes').then((m) => m.FINANCE_ROUTES),
    data: { title: 'Financeiro' },
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
    data: { title: 'Configuração' },
  },
  {
    path: '**',
    redirectTo: '/auth/login',
  },
];
