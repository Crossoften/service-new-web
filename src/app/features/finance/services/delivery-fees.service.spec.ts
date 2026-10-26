import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { ApiService } from '@core/services/api.service';
import { SUPPRESS_GLOBAL_ERROR_TOAST } from '@core/tokens/http-context.tokens';

import { DeliveryFeeRule } from '../models/delivery-fee.model';
import { DeliveryFeesService } from './delivery-fees.service';

type ApiServiceMock = {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};

const REGRA: DeliveryFeeRule = {
  id: 3,
  minKm: '0',
  maxKm: '5',
  type: 'Fixed',
  value: '8.50',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('DeliveryFeesService', () => {
  let service: DeliveryFeesService;
  let apiService: ApiServiceMock;

  beforeEach(() => {
    apiService = { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() };

    TestBed.configureTestingModule({
      providers: [DeliveryFeesService, { provide: ApiService, useValue: apiService }],
    });

    service = TestBed.inject(DeliveryFeesService);
  });

  it('lista as faixas', async () => {
    apiService.get.mockReturnValue(of([REGRA]));

    await firstValueFrom(service.getAll());

    expect(apiService.get).toHaveBeenCalledWith('/v1/admin-delivery-fees');
  });

  it('cria pela rota da coleção', async () => {
    apiService.post.mockReturnValue(of(REGRA));

    await firstValueFrom(
      service.create({ minKm: 0, maxKm: 5, type: 'Fixed', value: 8.5, isActive: true })
    );

    const [rota, corpo] = apiService.post.mock.calls[0];

    expect(rota).toBe('/v1/admin-delivery-fees');
    expect(corpo).toMatchObject({ minKm: 0, maxKm: 5, type: 'Fixed', value: 8.5 });
  });

  /**
   * O back-end valida a faixa e devolve `400` com texto próprio — "A distância
   * máxima da faixa precisa ser maior que a mínima." O `errorInterceptor`
   * trocaria isso por "Revise os dados informados", que não diz qual dado.
   */
  it('suprime o toast global na criação e na edição', async () => {
    apiService.post.mockReturnValue(of(REGRA));
    apiService.patch.mockReturnValue(of(REGRA));

    await firstValueFrom(service.create({ minKm: 0, type: 'Fixed', value: 8.5 }));
    await firstValueFrom(service.update(3, { minKm: 0, type: 'Fixed', value: 8.5 }));

    expect(apiService.post.mock.calls[0][2].context.get(SUPPRESS_GLOBAL_ERROR_TOAST)).toBe(true);
    expect(apiService.patch.mock.calls[0][2].context.get(SUPPRESS_GLOBAL_ERROR_TOAST)).toBe(true);
  });

  /**
   * O `PATCH` exige `minKm`, `type` e `value`; mandar só `isActive` daria 400.
   * Por isso o atalho reenvia a faixa inteira, convertendo as strings da
   * resposta de volta para número — que é o que o envio espera.
   */
  it('reenvia a faixa inteira ao ligar ou desligar, convertendo para número', async () => {
    apiService.patch.mockReturnValue(of({ ...REGRA, isActive: false }));

    await firstValueFrom(service.setActive(REGRA, false));

    const [rota, corpo] = apiService.patch.mock.calls[0];

    expect(rota).toBe('/v1/admin-delivery-fees/3');
    expect(corpo).toEqual({
      minKm: 0,
      maxKm: 5,
      type: 'Fixed',
      value: 8.5,
      isActive: false,
    });
  });

  /**
   * `maxKm` ausente significa "daqui em diante". Precisa sair como `undefined`
   * para ser omitido do JSON — `null` seria enviado e reprovado pelo
   * `@IsNumber` do back-end.
   */
  it('omite o maxKm da faixa sem limite superior', async () => {
    apiService.patch.mockReturnValue(of(REGRA));

    await firstValueFrom(service.setActive({ ...REGRA, maxKm: null }, false));

    expect(apiService.patch.mock.calls[0][1].maxKm).toBeUndefined();
  });

  it('remove pela rota do item', async () => {
    apiService.delete.mockReturnValue(of({ message: 'ok' }));

    await firstValueFrom(service.remove(3));

    expect(apiService.delete).toHaveBeenCalledWith('/v1/admin-delivery-fees/3');
  });
});
