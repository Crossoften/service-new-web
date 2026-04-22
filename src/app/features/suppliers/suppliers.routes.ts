import { Routes } from '@angular/router';

export const SUPPLIERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@shared/components/contract-gap-page/contract-gap-page.component').then(
        (m) => m.ContractGapPageComponent
      ),
    data: {
      title: 'Fornecedores',
      moduleTitle: 'Fornecedores',
      summary:
        'Nao ha endpoints de fornecedores no backend documentado. O modulo foi mantido apenas como aviso para nao mascarar a ausencia de integracao real.',
      missingEndpoints: [
        'GET /v1/suppliers ou endpoint equivalente para listagem paginada.',
        'POST /v1/suppliers ou endpoint equivalente para cadastro.',
        'PATCH /v1/suppliers/{id} ou endpoint equivalente para atualizacao e status.',
      ],
      actionLabel: 'Abrir colaboradores',
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
      title: 'Detalhes do Fornecedor',
      moduleTitle: 'Fornecedores',
      summary:
        'O contrato atual do backend nao possui endpoint para detalhe de fornecedor. A tela ficou indisponivel para evitar chamadas inconsistentes.',
      missingEndpoints: [
        'GET /v1/suppliers/{id} ou endpoint equivalente para consultar o fornecedor.',
        'GET /v1/suppliers/{id}/history ou endpoint equivalente para historico de servicos e avaliacoes.',
        'PATCH /v1/suppliers/{id} ou endpoint equivalente para salvar alteracoes.',
      ],
      actionLabel: 'Abrir colaboradores',
      actionRoute: '/settings',
    },
  },
];
