/**
 * Conversão entre o ISO 8601 que a API usa e o `datetime-local` do navegador.
 *
 * O `<input type="datetime-local">` trabalha em **hora local, sem fuso**
 * (`2026-10-26T14:30`), enquanto a API espera e devolve ISO com fuso. Passar um
 * pelo outro sem converter desloca a vigência do cupom pelo offset do
 * navegador — em Brasília, três horas. Um cupom que deveria começar à meia-noite
 * começaria às 21h do dia anterior, e ninguém olharia a vigência para explicar
 * por que ele foi aceito antes da hora.
 */

/** ISO da API para o valor do campo. Devolve `''` quando não há data. */
export function isoParaCampoLocal(iso: string | null | undefined): string {
  if (!iso) return '';

  const data = new Date(iso);

  if (Number.isNaN(data.getTime())) return '';

  const doisDigitos = (n: number): string => String(n).padStart(2, '0');

  return (
    `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}` +
    `T${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`
  );
}

/**
 * Valor do campo para o ISO da API. Devolve `undefined` quando vazio, para o
 * campo ser **omitido** do JSON — `null` seria enviado e reprovado pela
 * validação de data do back-end.
 */
export function campoLocalParaIso(valor: string | null | undefined): string | undefined {
  if (!valor) return undefined;

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return undefined;

  return data.toISOString();
}
