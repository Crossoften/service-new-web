import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { ApiService } from '@core/services/api.service';
import { SUPPRESS_GLOBAL_ERROR_TOAST } from '@core/tokens/http-context.tokens';

import { Coupon } from '../models/coupon.model';
import { CouponsService } from './coupons.service';

type ApiServiceMock = {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};

const CUPOM: Coupon = {
  id: 4,
  code: 'BEMVINDO10',
  description: 'Primeira compra',
  type: 'Percent',
  value: '10',
  maxDiscountValue: '15.00',
  minOrderValue: '40.00',
  startsAt: null,
  endsAt: null,
  maxUses: 100,
  maxUsesPerCustomer: 1,
  restaurantId: null,
  isActive: true,
  timesUsed: 7,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('CouponsService', () => {
  let service: CouponsService;
  let apiService: ApiServiceMock;

  beforeEach(() => {
    apiService = { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() };

    TestBed.configureTestingModule({
      providers: [CouponsService, { provide: ApiService, useValue: apiService }],
    });

    service = TestBed.inject(CouponsService);
  });

  it('lista e detalha pelas rotas do admin', async () => {
    apiService.get.mockReturnValue(of([CUPOM]));
    await firstValueFrom(service.getAll());
    expect(apiService.get).toHaveBeenCalledWith('/v1/admin-coupons');

    apiService.get.mockReturnValue(of(CUPOM));
    await firstValueFrom(service.getById(4));
    expect(apiService.get).toHaveBeenCalledWith('/v1/admin-coupons/4');
  });

  /**
   * O back-end confere relações entre campos e responde `400` com texto
   * específico — "Um cupom percentual não pode passar de 100%.", "Já existe um
   * cupom com o código X." O `errorInterceptor` trocaria por "Revise os dados
   * informados", que não diz qual campo.
   */
  it('suprime o toast global na criação e na edição', async () => {
    apiService.post.mockReturnValue(of(CUPOM));
    apiService.patch.mockReturnValue(of(CUPOM));

    await firstValueFrom(service.create({ code: 'X', type: 'FreeShipping' }));
    await firstValueFrom(service.update(4, { isActive: false }));

    expect(apiService.post.mock.calls[0][2].context.get(SUPPRESS_GLOBAL_ERROR_TOAST)).toBe(true);
    expect(apiService.patch.mock.calls[0][2].context.get(SUPPRESS_GLOBAL_ERROR_TOAST)).toBe(true);
  });

  /**
   * O `DELETE` desativa, não apaga: cupom resgatado tem pedidos apontando para
   * ele. Por isso devolve o cupom em vez de vazio, e a reativação precisa de
   * outra rota.
   */
  it('desativa pelo DELETE e reativa pelo PATCH', async () => {
    apiService.delete.mockReturnValue(of({ ...CUPOM, isActive: false }));
    const desativado = await firstValueFrom(service.deactivate(4));

    expect(apiService.delete).toHaveBeenCalledWith('/v1/admin-coupons/4');
    expect(desativado.isActive).toBe(false);

    apiService.patch.mockReturnValue(of({ ...CUPOM, isActive: true }));
    await firstValueFrom(service.reactivate(4));

    expect(apiService.patch.mock.calls[0][0]).toBe('/v1/admin-coupons/4');
    expect(apiService.patch.mock.calls[0][1]).toEqual({ isActive: true });
  });

  it('reduz a lista de restaurantes ao que o seletor precisa', async () => {
    apiService.get.mockReturnValue(
      of({
        restaurants: [
          { id: 1, name: 'Cantina', imageUrl: null, ratingAverage: 4.5 },
          { id: 2, name: 'Pizzaria', imageUrl: null, ratingAverage: 4.9 },
        ],
        currentPage: 1,
        totalPages: 1,
        totalRecords: 2,
      })
    );

    const opcoes = await firstValueFrom(service.getRestaurantOptions());

    expect(apiService.get).toHaveBeenCalledWith('/v1/restaurants', { take: 100 });
    expect(opcoes).toEqual([
      { id: 1, name: 'Cantina' },
      { id: 2, name: 'Pizzaria' },
    ]);
  });

  it('não quebra quando a listagem de restaurantes vem sem o campo', async () => {
    apiService.get.mockReturnValue(of({ currentPage: 1, totalPages: 0, totalRecords: 0 }));

    expect(await firstValueFrom(service.getRestaurantOptions())).toEqual([]);
  });
});
