import { campoLocalParaIso, isoParaCampoLocal } from './coupon-dates';

describe('conversão de datas do cupom', () => {
  /**
   * Ida e volta tem que devolver o mesmo instante. É aqui que um erro de fuso
   * apareceria: a vigência do cupom andaria pelo offset do navegador a cada
   * edição, acumulando.
   */
  it('mantém o instante na ida e na volta', () => {
    const original = new Date('2026-10-26T14:30:00.000Z').toISOString();

    const campo = isoParaCampoLocal(original);
    const devolta = campoLocalParaIso(campo);

    expect(new Date(devolta!).getTime()).toBe(new Date(original).getTime());
  });

  it('produz o formato que o datetime-local aceita', () => {
    const campo = isoParaCampoLocal(new Date(2026, 9, 26, 14, 30).toISOString());

    expect(campo).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('exibe a data em hora local, não em UTC', () => {
    // Construída a partir de componentes locais: o campo deve repeti-los.
    const local = new Date(2026, 2, 15, 9, 5);

    expect(isoParaCampoLocal(local.toISOString())).toBe('2026-03-15T09:05');
  });

  /** Vazio precisa virar `undefined`, para o campo ser omitido do JSON. */
  it('trata ausência de data nas duas direções', () => {
    expect(isoParaCampoLocal(null)).toBe('');
    expect(isoParaCampoLocal(undefined)).toBe('');
    expect(isoParaCampoLocal('')).toBe('');

    expect(campoLocalParaIso('')).toBeUndefined();
    expect(campoLocalParaIso(null)).toBeUndefined();
    expect(campoLocalParaIso(undefined)).toBeUndefined();
  });

  it('não quebra com data inválida', () => {
    expect(isoParaCampoLocal('nada disso')).toBe('');
    expect(campoLocalParaIso('nada disso')).toBeUndefined();
  });
});
