import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';

/**
 * Nenhuma tela do admin oferece porcentagem da plataforma sobre serviço.
 *
 * Regra do produto: o fornecedor paga a assinatura — mensal ou anual — e o
 * único que tem percentual **além** dela é o delivery, por
 * `User.deliveryCommissionRate`, e só quando o `billingType` é `Commission`.
 *
 * O backend parou de reter em serviço e em negociação de produto (BE-Y25): o
 * `marketplace_fee` não vai mais no corpo da preferência, então o pagamento
 * inteiro cai na conta do fornecedor. Enquanto existia, o modal "Porcentagem
 * de fornecedores" era pior que inútil: `rateForService` caía na taxa global
 * quando a categoria estava em zero, então uma categoria exibindo
 * "Plataforma: 0%" retinha 10% de verdade.
 *
 * O campo saiu também de Configurações > Categorias: enquanto estava lá, era o
 * único lugar do admin que ainda exibia e editava um percentual inerte — uma
 * coluna "Taxa" mostrando 10% que não afetava pagamento nenhum.
 *
 * O backend **continua** aceitando `platformFeeRate` em
 * `/v1/admin-categories/services` e guardando a coluna, para um uso futuro. O
 * que não pode voltar é o admin apresentar isso como receita.
 *
 * Isto NÃO vale para o delivery: `deliveryCommissionRate` é outro campo, de
 * outro domínio, e é configurado em Usuários > editar fornecedor.
 */
const RAIZ = resolve(__dirname, '..', '..');
const FEATURES = join(RAIZ, 'features');

/** Pelo que nenhuma tela pode voltar a falar de retenção em serviço. */
const PROIBIDOS = [/platformFeeRate/, /Porcentagem de fornecedores/, /platformValueReceived/];

function templates(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);

    if (statSync(caminho).isDirectory()) return templates(caminho);

    return nome.endsWith('.component.html') ? [caminho] : [];
  });
}

describe('porcentagem da plataforma no admin', () => {
  const encontrados = templates(FEATURES);

  it('existe template para o teste ter o que guardar', () => {
    expect(encontrados.length).toBeGreaterThan(0);
  });

  it('nenhum template edita ou exibe retenção de serviço', () => {
    const comRetencao = encontrados
      .filter((caminho) => {
        const html = readFileSync(caminho, 'utf8');

        return PROIBIDOS.some((proibido) => proibido.test(html));
      })
      .map((caminho) => relative(RAIZ, caminho));

    expect(comRetencao).toEqual([]);
  });
});
