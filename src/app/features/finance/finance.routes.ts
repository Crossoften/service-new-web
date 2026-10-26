import { Routes } from '@angular/router';

export const FINANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/finance-page/finance-page.component').then((m) => m.FinancePageComponent),
    data: { title: 'Financeiro' },
  },
  {
    path: 'repasses',
    loadComponent: () =>
      import('./pages/delivery-payouts/delivery-payouts.component').then(
        (m) => m.DeliveryPayoutsComponent
      ),
    data: { title: 'Repasses a entregadores' },
  },
  {
    path: 'taxas-entrega',
    loadComponent: () =>
      import('./pages/delivery-fees/delivery-fees.component').then((m) => m.DeliveryFeesComponent),
    data: { title: 'Taxas de entrega' },
  },
  {
    path: 'cupons',
    loadComponent: () =>
      import('./pages/coupons/coupons.component').then((m) => m.CouponsComponent),
    data: { title: 'Cupons de desconto' },
  },
];
