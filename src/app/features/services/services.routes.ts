import { Routes } from '@angular/router';

export const SERVICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@shared/components/contract-gap-page/contract-gap-page.component').then(
        (m) => m.ContractGapPageComponent
      ),
    data: {
      title: 'Servicos',
      moduleTitle: 'Servicos',
      summary:
        'O backend documentado nao possui endpoints para cadastro, listagem ou detalhe de servicos. O modulo foi preservado apenas como placeholder para evitar integracoes falsas.',
      missingEndpoints: [
        'GET /v1/services ou endpoint equivalente para listagem paginada de servicos.',
        'GET /v1/services/{id} ou endpoint equivalente para detalhe do servico.',
        'POST /v1/services ou endpoint equivalente para criacao.',
        'PATCH /v1/services/{id} ou endpoint equivalente para edicao e mudanca de status.',
      ],
      actionLabel: 'Abrir configuracoes',
      actionRoute: '/settings',
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('@shared/components/contract-gap-page/contract-gap-page.component').then(
        (m) => m.ContractGapPageComponent
      ),
    data: {
      title: 'Detalhes do Servico',
      moduleTitle: 'Servicos',
      summary:
        'O contrato atual do backend nao oferece endpoint para detalhe de servico. Por isso a rota foi bloqueada ate que a API seja expandida.',
      missingEndpoints: [
        'GET /v1/services/{id} ou endpoint equivalente para carregar o servico.',
        'GET /v1/services/{id}/history ou endpoint equivalente para historico, clientes e avaliacoes.',
        'PATCH /v1/services/{id} ou endpoint equivalente para salvar alteracoes.',
      ],
      actionLabel: 'Abrir configuracoes',
      actionRoute: '/settings',
    },
  },
];
