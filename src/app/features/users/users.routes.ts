import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/users-list/users-list.component').then((m) => m.UsersListComponent),
    data: { title: 'Usuarios' },
  },
  {
    path: 'influencers',
    loadComponent: () =>
      import('@shared/components/contract-gap-page/contract-gap-page.component').then(
        (m) => m.ContractGapPageComponent
      ),
    data: {
      title: 'Influencers',
      moduleTitle: 'Influencers',
      summary:
        'O backend documentado em Service.md nao expoe endpoints para o modulo de influencers. O fluxo foi desativado para evitar consumo de dados mockados ou rotas inconsistentes.',
      missingEndpoints: [
        'GET /v1/influencers ou endpoint equivalente para listagem paginada.',
        'POST /v1/influencers ou endpoint equivalente para cadastro.',
        'PATCH /v1/influencers/{id} ou endpoint equivalente para atualizacao e status.',
      ],
      actionLabel: 'Voltar para usuarios',
      actionRoute: '/users',
    },
  },
  {
    path: 'influencers/:id',
    loadComponent: () =>
      import('@shared/components/contract-gap-page/contract-gap-page.component').then(
        (m) => m.ContractGapPageComponent
      ),
    data: {
      title: 'Detalhes do Influencer',
      moduleTitle: 'Influencers',
      summary:
        'Nao existe endpoint correspondente para detalhe de influencer no contrato atual do backend. Enquanto isso nao for disponibilizado, a tela permanece bloqueada.',
      missingEndpoints: [
        'GET /v1/influencers/{id} ou endpoint equivalente para dados do influencer.',
        'GET /v1/influencers/{id}/stats ou endpoint equivalente para ranking, downloads e comissao.',
        'PATCH /v1/influencers/{id} ou endpoint equivalente para salvar alteracoes.',
      ],
      actionLabel: 'Voltar para usuarios',
      actionRoute: '/users',
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/user-detail/user-detail.component').then((m) => m.UserDetailComponent),
    data: { title: 'Detalhes do Usuario' },
  },
];
