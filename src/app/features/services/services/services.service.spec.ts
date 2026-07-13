import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { ApiService } from '@core/services/api.service';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let service: ServicesService;
  let apiService: jest.Mocked<Pick<ApiService, 'get'>>;

  beforeEach(() => {
    apiService = {
      get: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [ServicesService, { provide: ApiService, useValue: apiService }],
    });

    service = TestBed.inject(ServicesService);
  });

  it('carrega ranking regional de compras com filtros obrigatórios', async () => {
    apiService.get.mockReturnValue(
      of({
        ranking: [
          {
            position: 3,
            city: 'São Paulo',
            state: 'SP',
            purchasesCount: 19,
            worksCount: 17,
            totalValue: 2450.5,
          },
        ],
      })
    );

    const ranking = await firstValueFrom(
      service.getPurchasesRegionalRanking({ state: 'SP', city: 'São Paulo' })
    );

    expect(apiService.get).toHaveBeenCalledWith(
      '/v1/admin-services/ranking/purchases-by-location',
      {
        state: 'SP',
        city: 'São Paulo',
      }
    );
    expect(ranking).toEqual([
      {
        position: 3,
        city: 'São Paulo',
        state: 'SP',
        totalPurchases: 19,
        totalWorks: 17,
        totalValue: 2450.5,
      },
    ]);
  });
});
