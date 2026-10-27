import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';

/**
 * Todo `ngbDropdown` das listas precisa de `container="body"`.
 *
 * O menu nasce posicionado **dentro** do `.table-wrapper`, e esse wrapper
 * recorta: há `overflow: hidden` no componente e
 * `.app-shell .table-wrapper { overflow-x: auto; overflow-y: hidden }` no
 * global — este último existe para tabela larga rolar em vez de estourar o
 * layout, então não dá para simplesmente removê-lo.
 *
 * Verificado em navegador: na última linha o menu estoura 58px abaixo da borda
 * do wrapper e `elementFromPoint` no fim dele devolve outro elemento. O
 * `z-index: 9999` não ajuda — z-index não escapa de recorte, só de ordem de
 * pintura. `container="body"` tira o menu da árvore que recorta.
 *
 * O bug estava em **cinco** listas ao mesmo tempo, porque o bloco foi copiado
 * de uma para a outra. Este teste existe para a sexta não nascer igual.
 */
const RAIZ = resolve(__dirname, '..', '..');

function templates(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);

    if (statSync(caminho).isDirectory()) return templates(caminho);

    return nome.endsWith('.component.html') ? [caminho] : [];
  });
}

/** Abertura da tag que carrega o `ngbDropdown`, com os atributos dela. */
function aberturasComDropdown(html: string): string[] {
  return [...html.matchAll(/<[a-zA-Z][^>]*\bngbDropdown\b[^>]*>/g)].map((m) => m[0]);
}

describe('ngbDropdown dentro de tabela', () => {
  const encontrados = templates(RAIZ).flatMap((caminho) => {
    const html = readFileSync(caminho, 'utf8');

    return aberturasComDropdown(html).map((abertura) => ({
      arquivo: relative(RAIZ, caminho),
      abertura,
    }));
  });

  it('existe pelo menos um dropdown para o teste ter o que guardar', () => {
    expect(encontrados.length).toBeGreaterThan(0);
  });

  it('todos escapam do recorte com container="body"', () => {
    const semContainer = encontrados
      .filter(({ abertura }) => !/container\s*=\s*"body"/.test(abertura))
      .map(({ arquivo }) => arquivo);

    expect(semContainer).toEqual([]);
  });
});
