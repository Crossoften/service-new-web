/** Mesmo teto do `CreateCategoryDto`. */
const SLUG_MAXIMO = 120;

/**
 * Sugere o slug a partir do nome.
 *
 * É só sugestão: o campo continua editável, e o back-end é quem recusa
 * duplicata. Serve para o admin não precisar digitar duas vezes a mesma coisa
 * nem inventar a convenção de acentuação na mão.
 */
export function sugerirSlug(nome: string): string {
  return (
    nome
      .normalize('NFD')
      // Remove os diacríticos que o NFD separou: "ação" -> "acao".
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, SLUG_MAXIMO)
      // Um corte no meio de um separador deixaria o slug terminando em '-'.
      .replace(/-+$/g, '')
  );
}
