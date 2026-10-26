import { DeliveryFeeRule, FaixaInconsistente } from '../models/delivery-fee.model';

/**
 * Procura buracos e sobreposições entre as faixas **ativas**.
 *
 * O back-end valida apenas que `maxKm > minKm` dentro de cada faixa; ele não
 * olha o conjunto. Então nada impede deixar um vão entre 5 e 7 km, ou duas
 * faixas cobrindo 0–10 e 8–15 ao mesmo tempo.
 *
 * Nenhum dos dois casos dá erro: o pedido simplesmente cai em outra faixa, ou
 * na taxa padrão do servidor, e o admin não tem como perceber olhando a lista.
 * Por isso a conferência mora aqui, como aviso — nunca como bloqueio, já que a
 * API aceita essas configurações e pode haver motivo para elas.
 *
 * Faixas inativas são ignoradas: elas não participam do cálculo no servidor.
 */
export function conferirCobertura(faixas: DeliveryFeeRule[]): FaixaInconsistente[] {
  const ativas = faixas
    .filter((f) => f.isActive)
    .map((f) => ({
      min: Number(f.minKm),
      // Ausente é "sem limite". `Infinity` deixa a comparação uniforme.
      max: f.maxKm === null || f.maxKm === undefined ? Infinity : Number(f.maxKm),
    }))
    .sort((a, b) => a.min - b.min);

  const problemas: FaixaInconsistente[] = [];

  for (let i = 0; i < ativas.length - 1; i += 1) {
    const atual = ativas[i];
    const proxima = ativas[i + 1];

    if (proxima.min > atual.max) {
      problemas.push({ tipo: 'buraco', de: atual.max, ate: proxima.min });
    } else if (proxima.min < atual.max) {
      problemas.push({
        tipo: 'sobreposicao',
        de: proxima.min,
        ate: Math.min(atual.max, proxima.max),
      });
    }
  }

  return problemas;
}

/**
 * A cobertura precisa começar em zero: uma entrega de 300 metros tem que casar
 * com alguma faixa.
 */
export function comecaEmZero(faixas: DeliveryFeeRule[]): boolean {
  const ativas = faixas.filter((f) => f.isActive);

  if (!ativas.length) return true;

  return ativas.some((f) => Number(f.minKm) === 0);
}
