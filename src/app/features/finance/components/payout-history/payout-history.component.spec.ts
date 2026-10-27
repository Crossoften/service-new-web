import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DeliveryPayout } from '../../models/delivery-payout.model';
import { DeliveryPayoutsService } from '../../services/delivery-payouts.service';
import { PayoutHistoryComponent } from './payout-history.component';

function repasse(parcial: Partial<DeliveryPayout> = {}): DeliveryPayout {
  return {
    id: 1,
    courierId: 42,
    courierName: 'Bruno Alves',
    amount: '18.50',
    method: 'Pix',
    reference: 'E1234',
    notes: null,
    transactionsCount: 2,
    paidAt: '2026-09-21T18:00:00.000Z',
    createdById: 1,
    createdAt: '2026-09-21T18:00:00.000Z',
    ...parcial,
  };
}

function lista(quantidade: number): DeliveryPayout[] {
  return Array.from({ length: quantidade }, (_, i) => repasse({ id: i + 1 }));
}

describe('PayoutHistoryComponent', () => {
  const getHistory = jest.fn();

  function montar(): PayoutHistoryComponent {
    return TestBed.runInInjectionContext(() => new PayoutHistoryComponent());
  }

  beforeEach(() => {
    getHistory.mockReset();
    getHistory.mockReturnValue(of([repasse()]));

    TestBed.configureTestingModule({
      providers: [{ provide: DeliveryPayoutsService, useValue: { getHistory } }],
    });
  });

  it('carrega o histórico sem filtro ao abrir', () => {
    const component = montar();
    component.ngOnInit();

    expect(getHistory).toHaveBeenCalledWith(undefined);
    expect(component.repasses()).toHaveLength(1);
    expect(component.isLoading()).toBe(false);
  });

  it('marca erro quando a busca falha', () => {
    getHistory.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    const component = montar();
    component.ngOnInit();

    expect(component.hasError()).toBe(true);
    expect(component.isLoading()).toBe(false);
  });

  it('tolera resposta sem corpo', () => {
    getHistory.mockReturnValue(of(null));

    const component = montar();
    component.ngOnInit();

    expect(component.repasses()).toEqual([]);
    expect(component.totalDeRegistros()).toBe(0);
  });

  it('monta o filtro com os entregadores distintos, em ordem alfabética', () => {
    getHistory.mockReturnValue(
      of([
        repasse({ id: 1, courierId: 42, courierName: 'Bruno Alves' }),
        repasse({ id: 2, courierId: 7, courierName: 'Ana Paula' }),
        repasse({ id: 3, courierId: 42, courierName: 'Bruno Alves' }),
      ])
    );

    const component = montar();
    component.ngOnInit();

    expect(component.entregadores()).toEqual([
      { id: 7, name: 'Ana Paula' },
      { id: 42, name: 'Bruno Alves' },
    ]);
  });

  it('refaz a busca no servidor ao filtrar por entregador', () => {
    const component = montar();
    component.ngOnInit();

    component.filtrarPor('42');

    expect(getHistory).toHaveBeenLastCalledWith(42);
    expect(component.entregadorId()).toBe(42);
  });

  // Derivar as opções da lista filtrada reduziria o filtro a um único
  // entregador e o admin não teria como voltar para "Todos".
  it('não encolhe as opções do filtro ao filtrar', () => {
    getHistory.mockReturnValueOnce(
      of([
        repasse({ id: 1, courierId: 42, courierName: 'Bruno Alves' }),
        repasse({ id: 2, courierId: 7, courierName: 'Ana Paula' }),
      ])
    );
    const component = montar();
    component.ngOnInit();
    expect(component.entregadores()).toHaveLength(2);

    getHistory.mockReturnValueOnce(of([repasse({ id: 1, courierId: 42 })]));
    component.filtrarPor('42');

    expect(component.entregadores()).toHaveLength(2);
    expect(component.repasses()).toHaveLength(1);
  });

  it('volta a buscar tudo ao limpar o filtro', () => {
    const component = montar();
    component.ngOnInit();
    component.filtrarPor('42');

    component.filtrarPor('');

    expect(getHistory).toHaveBeenLastCalledWith(undefined);
    expect(component.entregadorId()).toBeNull();
  });

  it('não refaz a busca ao escolher o entregador já filtrado', () => {
    const component = montar();
    component.ngOnInit();
    component.filtrarPor('42');

    component.filtrarPor('42');

    expect(getHistory).toHaveBeenCalledTimes(2);
  });

  it('volta para a primeira página ao trocar o filtro', () => {
    getHistory.mockReturnValue(of(lista(25)));
    const component = montar();
    component.ngOnInit();
    component.irParaPagina(3);
    expect(component.pagina()).toBe(3);

    component.filtrarPor('42');

    expect(component.pagina()).toBe(1);
  });

  it('pagina a lista que chegou, de dez em dez', () => {
    getHistory.mockReturnValue(of(lista(25)));

    const component = montar();
    component.ngOnInit();

    expect(component.totalDePaginas()).toBe(3);
    expect(component.paginaAtual()).toHaveLength(10);
    expect(component.paginaAtual()[0].id).toBe(1);

    component.irParaPagina(3);

    expect(component.paginaAtual()).toHaveLength(5);
    expect(component.paginaAtual()[0].id).toBe(21);
  });

  it('recusa página fora do intervalo', () => {
    getHistory.mockReturnValue(of(lista(25)));
    const component = montar();
    component.ngOnInit();

    component.irParaPagina(0);
    expect(component.pagina()).toBe(1);

    component.irParaPagina(4);
    expect(component.pagina()).toBe(1);
  });

  it('mantém uma página mesmo sem registros', () => {
    getHistory.mockReturnValue(of([]));

    const component = montar();
    component.ngOnInit();

    expect(component.totalDePaginas()).toBe(1);
    expect(component.resumoDaPaginacao()).toBe('0 repasses');
  });

  it('descreve o intervalo da página atual', () => {
    getHistory.mockReturnValue(of(lista(25)));
    const component = montar();
    component.ngOnInit();

    expect(component.resumoDaPaginacao()).toBe('1-10 de 25 repasses');

    component.irParaPagina(3);

    expect(component.resumoDaPaginacao()).toBe('21-25 de 25 repasses');
  });

  // `amount` vem como string para não perder centavo; somar sem converter
  // concatenaria os valores.
  it('soma os valores tratando amount como número', () => {
    getHistory.mockReturnValue(
      of([repasse({ id: 1, amount: '18.50' }), repasse({ id: 2, amount: '10.25' })])
    );

    const component = montar();
    component.ngOnInit();

    expect(component.totalPago()).toBeCloseTo(28.75, 2);
  });

  it('soma só o que o filtro trouxe', () => {
    const component = montar();
    component.ngOnInit();

    getHistory.mockReturnValueOnce(of([repasse({ amount: '5.00' })]));
    component.filtrarPor('42');

    expect(component.totalPago()).toBeCloseTo(5, 2);
  });

  it('traduz o método do repasse', () => {
    const component = montar();

    expect(component.rotuloDoMetodo('BankTransfer')).toBe('Transferência bancária');
    expect(component.rotuloDoMetodo('Pix')).toBe('Pix');
  });

  it('formata o valor em reais', () => {
    const component = montar();

    expect(component.formatarMoeda('18.50').replace(/\u00a0/g, ' ')).toBe('R$ 18,50');
  });
  // O `paidAt` vem em UTC e o admin lê em horário de Brasília. O `jest.config.js`
  // fixa TZ=America/Sao_Paulo justamente para esta asserção não passar por
  // acidente num runner que roda em UTC.
  it('mostra o horário do repasse no fuso de Brasília', () => {
    const component = montar();

    expect(component.formatarDataHora('2026-09-21T18:00:00.000Z')).toBe('21/09/2026, 15:00');
  });
});
