import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { ApiService } from '@core/services/api.service';
import { SUPPRESS_GLOBAL_ERROR_TOAST } from '@core/tokens/http-context.tokens';
import { SuppliersService } from './suppliers.service';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let apiService: jest.Mocked<Pick<ApiService, 'get' | 'post' | 'patch'>>;

  beforeEach(() => {
    apiService = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [SuppliersService, { provide: ApiService, useValue: apiService }],
    });

    service = TestBed.inject(SuppliersService);
  });

  it('envia filtros e ordenação suportados pelo contrato de fornecedores', async () => {
    apiService.get.mockReturnValue(
      of({
        providers: [],
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
      })
    );

    await firstValueFrom(
      service.getSuppliers({
        take: 10,
        skip: 2,
        search: 'Marina',
        status: 'Active',
        sortBy: 'createdAt',
        sortDirection: 'desc',
      })
    );

    expect(apiService.get).toHaveBeenCalledWith('/v1/admin-providers', {
      take: 10,
      skip: 2,
      search: 'Marina',
      status: 'Active',
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });
  });

  it('envia ordenação no histórico de serviços do fornecedor', async () => {
    apiService.get.mockReturnValue(
      of({
        history: [],
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
      })
    );

    await firstValueFrom(
      service.getSupplierHistory(7, {
        take: 5,
        skip: 1,
        sortBy: 'serviceDate',
        sortDirection: 'desc',
      })
    );

    expect(apiService.get).toHaveBeenCalledWith('/v1/admin-providers/7/history', {
      take: 5,
      skip: 1,
      sortBy: 'serviceDate',
      sortDirection: 'desc',
    });
  });

  it('carrega ranking regional de prestadores com filtros obrigatórios', async () => {
    apiService.get.mockReturnValue(
      of({
        providers: [
          {
            ranking: 2,
            city: 'Curitiba',
            state: 'PR',
            providersCount: 8,
            activeServices: 42,
          },
        ],
      })
    );

    const ranking = await firstValueFrom(
      service.getRegionalRanking({ state: 'PR', city: 'Curitiba' })
    );

    expect(apiService.get).toHaveBeenCalledWith('/v1/admin-users/ranking/providers-by-location', {
      state: 'PR',
      city: 'Curitiba',
    });
    expect(ranking).toEqual([
      {
        position: 2,
        city: 'Curitiba',
        state: 'PR',
        totalProviders: 8,
        totalActiveServices: 42,
      },
    ]);
  });
  describe('assinaturas do fornecedor', () => {
    const RESPOSTA_MINIMA = {
      providerId: 7,
      subscriptions: [
        {
          subscriptionId: 12,
          planId: 2,
          planName: 'Plano Mensal',
          planInterval: 'Month',
          intervalCount: 1,
          amount: 0,
          status: 'Active',
          isGranted: true,
          bonusMonths: 0,
          cancelAtPeriodEnd: false,
          isCurrent: true,
          createdAt: '2026-01-10T08:00:00.000Z',
        },
      ],
    };

    it('busca as assinaturas do fornecedor', async () => {
      apiService.get.mockReturnValue(of({ providerId: 7, activeGrantId: 12, subscriptions: [] }));

      const res = await firstValueFrom(service.getSupplierSubscriptions(7));

      expect(apiService.get).toHaveBeenCalledWith('/v1/admin-providers/7/subscriptions');
      expect(res.activeGrantId).toBe(12);
    });

    // O back-end omite os campos opcionais em vez de mandar null. Sem o `?? null`
    // a tela receberia `undefined` e o `=== null` da cobertura ampla falharia.
    it('normaliza campos ausentes para null', async () => {
      apiService.get.mockReturnValue(of(RESPOSTA_MINIMA));

      const res = await firstValueFrom(service.getSupplierSubscriptions(7));
      const [assinatura] = res.subscriptions;

      expect(res.activeGrantId).toBeNull();
      expect(assinatura.categoryId).toBeNull();
      expect(assinatura.categoryName).toBeNull();
      expect(assinatura.grantedById).toBeNull();
      expect(assinatura.grantReason).toBeNull();
      expect(assinatura.startedAt).toBeNull();
      expect(assinatura.currentPeriodStart).toBeNull();
      expect(assinatura.currentPeriodEnd).toBeNull();
    });

    it('tolera resposta sem a lista de assinaturas', async () => {
      apiService.get.mockReturnValue(of({ providerId: 7 }));

      const res = await firstValueFrom(service.getSupplierSubscriptions(7));

      expect(res.subscriptions).toEqual([]);
    });

    it('concede assinatura suprimindo o toast global, para o 409 chegar à tela', async () => {
      apiService.post.mockReturnValue(of({ subscriptionId: 12 }));

      await firstValueFrom(
        service.grantSubscription(7, { planId: 2, months: 12, reason: 'Cortesia' })
      );

      const [rota, corpo, opcoes] = apiService.post.mock.calls[0];
      expect(rota).toBe('/v1/admin-providers/7/subscriptions/grant');
      expect(corpo).toEqual({ planId: 2, months: 12, reason: 'Cortesia' });
      expect(opcoes?.context?.get(SUPPRESS_GLOBAL_ERROR_TOAST)).toBe(true);
    });

    it('aplica bônus na assinatura informada, suprimindo o toast global', async () => {
      apiService.patch.mockReturnValue(of({ subscriptionId: 12, totalBonusMonths: 3 }));

      await firstValueFrom(service.addSubscriptionBonus(7, 12, { months: 3 }));

      const [rota, corpo, opcoes] = apiService.patch.mock.calls[0];
      expect(rota).toBe('/v1/admin-providers/7/subscriptions/12/bonus');
      expect(corpo).toEqual({ months: 3 });
      expect(opcoes?.context?.get(SUPPRESS_GLOBAL_ERROR_TOAST)).toBe(true);
    });

    it('monta as opções do seletor a partir dos planos ativos', async () => {
      apiService.get.mockReturnValue(
        of({
          plans: [
            { id: 2, name: 'Plano Mensal', price: '49.90', interval: 'Month', isActive: true },
            { id: 3, name: 'Plano Anual', price: '499.00', interval: 'Year', isActive: true },
          ],
          currentPage: 1,
          totalPages: 1,
          totalRecords: 2,
        })
      );

      const opcoes = await firstValueFrom(service.getActivePlanOptions());

      expect(apiService.get).toHaveBeenCalledWith('/v1/plans/active', { take: 100 });
      expect(opcoes).toEqual([
        { id: 2, name: 'Plano Mensal', price: '49.90', interval: 'Month' },
        { id: 3, name: 'Plano Anual', price: '499.00', interval: 'Year' },
      ]);
    });
  });
});
