import { DeliveryFeeRule } from '../models/delivery-fee.model';
import { comecaEmZero, conferirCobertura } from './delivery-fee-coverage';

function faixa(
  minKm: string,
  maxKm: string | null,
  isActive = true,
  id = Math.random()
): DeliveryFeeRule {
  return {
    id,
    minKm,
    maxKm,
    type: 'Fixed',
    value: '10.00',
    isActive,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('conferirCobertura', () => {
  it('não aponta nada quando as faixas se encaixam', () => {
    expect(conferirCobertura([faixa('0', '5'), faixa('5', '10'), faixa('10', null)])).toEqual([]);
  });

  /**
   * O back-end não valida o conjunto — só que `maxKm > minKm` dentro de cada
   * faixa. Um vão aqui faz o pedido cair na taxa padrão do servidor, em
   * silêncio.
   */
  it('acha o vão entre duas faixas', () => {
    const problemas = conferirCobertura([faixa('0', '5'), faixa('7', '10')]);

    expect(problemas).toEqual([{ tipo: 'buraco', de: 5, ate: 7 }]);
  });

  it('acha a sobreposição entre duas faixas', () => {
    const problemas = conferirCobertura([faixa('0', '10'), faixa('8', '15')]);

    expect(problemas).toEqual([{ tipo: 'sobreposicao', de: 8, ate: 10 }]);
  });

  /** Faixa inativa não entra no cálculo do servidor, nem na conferência. */
  it('ignora faixas inativas', () => {
    const problemas = conferirCobertura([
      faixa('0', '5'),
      faixa('5', '7', false),
      faixa('7', '10'),
    ]);

    expect(problemas).toEqual([{ tipo: 'buraco', de: 5, ate: 7 }]);
  });

  it('trata a faixa sem limite superior como cobrindo até o infinito', () => {
    expect(conferirCobertura([faixa('0', null)])).toEqual([]);
    expect(conferirCobertura([faixa('0', null), faixa('20', '30')])).toEqual([
      { tipo: 'sobreposicao', de: 20, ate: 30 },
    ]);
  });

  it('ordena antes de comparar, não confia na ordem recebida', () => {
    const problemas = conferirCobertura([faixa('7', '10'), faixa('0', '5')]);

    expect(problemas).toEqual([{ tipo: 'buraco', de: 5, ate: 7 }]);
  });

  it('não acusa nada com lista vazia ou faixa única', () => {
    expect(conferirCobertura([])).toEqual([]);
    expect(conferirCobertura([faixa('0', '5')])).toEqual([]);
  });
});

describe('comecaEmZero', () => {
  it('aceita quando alguma faixa ativa começa em zero', () => {
    expect(comecaEmZero([faixa('0', '5'), faixa('5', null)])).toBe(true);
  });

  /** Entrega de 300 metros não casaria com faixa nenhuma. */
  it('acusa quando a cobertura começa depois de zero', () => {
    expect(comecaEmZero([faixa('2', '5')])).toBe(false);
  });

  it('não acusa quando não há faixa nenhuma, porque aí vale a taxa padrão', () => {
    expect(comecaEmZero([])).toBe(true);
  });

  it('desconsidera a faixa inativa que começa em zero', () => {
    expect(comecaEmZero([faixa('0', '5', false), faixa('5', null)])).toBe(false);
  });
});
