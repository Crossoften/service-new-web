import { Routes } from '@angular/router';

export const SUPPLIERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/suppliers-list/suppliers-list.component').then(
        (m) => m.SuppliersListComponent
      ),
    data: { title: 'Fornecedores' },
  },
  {
    path: 'assinaturas',
    loadComponent: () =>
      import('./pages/subscriptions/subscriptions.component').then(
        (m) => m.SupplierSubscriptionsPanelComponent
      ),
    data: { title: 'Liberar assinatura' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/supplier-detail/supplier-detail.component').then(
        (m) => m.SupplierDetailComponent
      ),
    data: { title: 'Detalhes do Fornecedor' },
  },
];
