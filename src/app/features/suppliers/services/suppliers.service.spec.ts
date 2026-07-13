import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { ApiService } from '@core/services/api.service';
import { SuppliersService } from './suppliers.service';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let apiService: jest.Mocked<Pick<ApiService, 'get'>>;

  beforeEach(() => {
    apiService = {
      get: jest.fn(),
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
});
