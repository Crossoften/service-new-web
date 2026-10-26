import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/users-list/users-list.component').then((m) => m.UsersListComponent),
    data: { title: 'Usuários' },
  },
  {
    path: 'influencers',
    loadComponent: () =>
      import('./pages/influencers-list/influencers-list.component').then(
        (m) => m.InfluencersListComponent
      ),
    data: { title: 'Influencers' },
  },
  {
    path: 'influencers/:id',
    loadComponent: () =>
      import('./pages/influencer-detail/influencer-detail.component').then(
        (m) => m.InfluencerDetailComponent
      ),
    data: { title: 'Detalhes do Influencer' },
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./pages/user-form/user-form.component').then((m) => m.UserFormComponent),
    data: { title: 'Editar usuário' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/user-detail/user-detail.component').then((m) => m.UserDetailComponent),
    data: { title: 'Detalhes do usuário' },
  },
];
