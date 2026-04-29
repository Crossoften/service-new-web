import { Routes } from '@angular/router';

export const SERVICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/services-list/services-list.component').then(
        (m) => m.ServicesListComponent
      ),
    data: { title: 'Servicos' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/service-detail/service-detail.component').then(
        (m) => m.ServiceDetailComponent
      ),
    data: { title: 'Detalhes do Servico' },
  },
];
