import { Routes } from '@angular/router';

export const FINANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@shared/components/contract-gap-page/contract-gap-page.component').then(
        (m) => m.ContractGapPageComponent
      ),
    data: {
      title: 'Financeiro',
      moduleTitle: 'Financeiro',
      summary:
        'Service.md nao documenta endpoints financeiros. O modulo foi desativado para impedir uso de dados mockados e destacar a necessidade de contrato backend antes da integracao.',
      missingEndpoints: [
        'GET /v1/finance/services ou endpoint equivalente para a listagem principal.',
        'GET e PATCH /v1/finance/provider-percentages ou endpoint equivalente para porcentagem de fornecedores.',
        'GET e PATCH /v1/finance/partner-commissions ou endpoint equivalente para comissoes de parceiros.',
        'GET e PATCH /v1/finance/subscription-parameters ou endpoint equivalente para parametros de assinatura.',
      ],
      actionLabel: 'Abrir dashboard',
      actionRoute: '/dashboard',
    },
  },
];
