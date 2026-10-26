import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { ApiService } from '@core/services/api.service';
import { SUPPRESS_GLOBAL_ERROR_TOAST } from '@core/tokens/http-context.tokens';

import { DeliveryPayoutsService } from './delivery-payouts.service';

type ApiServiceMock = {
  get: jest.Mock;
  post: jest.Mock;
};

const PENDENTE = {
  courierId: 12,
  courierName: 'Rafael Lima',
  courierPhone: '+5534998701109',
  amount: '184.50',
  deliveries: 9,
  oldestAt: '2026-10-01T12:00:00.000Z',
  refundedDeliveries: 1,
  refundedAmount: '12.00',
  bankAccount: {
    bankName: 'Banco X',
    accountType: 'Corrente',
    agency: '0001',
    account: '12345-6',
    cpf: '123.456.789-10',
    pixKey: 'rafael@email.com',
  },
};

describe('DeliveryPayoutsService', () => {
  let service: DeliveryPayoutsService;
  let apiService: ApiServiceMock;

  beforeEach(() => {
    apiService = { get: jest.fn(), post: jest.fn() };

    TestBed.configureTestingModule({
      providers: [DeliveryPayoutsService, { provide: ApiService, useValue: apiService }],
    });

    service = TestBed.inject(DeliveryPayoutsService);
  });

  it('busca os saldos em aberto', async () => {
    apiService.get.mockReturnValue(of([PENDENTE]));

    const lista = await firstValueFrom(service.getPending());

    expect(apiService.get).toHaveBeenCalledWith('/v1/admin-delivery-payouts/pending');
    expect(lista[0].amount).toBe('184.50');
  });

  it('busca o histórico sem filtro quando nenhum entregador é informado', async () => {
    apiService.get.mockReturnValue(of([]));

    await firstValueFrom(service.getHistory());

    expect(apiService.get).toHaveBeenCalledWith('/v1/admin-delivery-payouts', undefined);
  });

  it('filtra o histórico por entregador', async () => {
    apiService.get.mockReturnValue(of([]));

    await firstValueFrom(service.getHistory(12));

    expect(apiService.get).toHaveBeenCalledWith('/v1/admin-delivery-payouts', { courierId: 12 });
  });

  /**
   * O `expectedAmount` é a trava que impede dar baixa em dinheiro que não foi
   * pago: se o saldo mudou entre a tela e o clique, o back-end devolve 409 e
   * não liquida nada. Mandar sem ele faria a liquidação acontecer às cegas.
   */
  it('envia o expectedAmount junto com o repasse', async () => {
    apiService.post.mockReturnValue(of({ id: 1, amount: '184.50' }));

    await firstValueFrom(
      service.registerPayout({
        courierId: 12,
        method: 'Pix',
        reference: 'E2E123',
        expectedAmount: 184.5,
      })
    );

    const [rota, corpo] = apiService.post.mock.calls[0];

    expect(rota).toBe('/v1/admin-delivery-payouts');
    expect(corpo).toMatchObject({ courierId: 12, method: 'Pix', expectedAmount: 184.5 });
  });

  /**
   * As três situações de 409 — saldo mudou, sem saldo, repasse concorrente —
   * têm mensagens próprias no back-end. O `errorInterceptor` não trata 409 e
   * cairia no genérico, descartando a instrução que o admin precisa.
   */
  it('suprime o toast global para poder exibir a mensagem do back-end', async () => {
    apiService.post.mockReturnValue(of({ id: 1, amount: '184.50' }));

    await firstValueFrom(
      service.registerPayout({ courierId: 12, method: 'Pix', expectedAmount: 184.5 })
    );

    const opcoes = apiService.post.mock.calls[0][2];

    expect(opcoes.context.get(SUPPRESS_GLOBAL_ERROR_TOAST)).toBe(true);
  });
});
