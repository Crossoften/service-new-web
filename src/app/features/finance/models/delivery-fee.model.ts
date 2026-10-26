/**
 * Faixas de distância que determinam a taxa de entrega.
 *
 * O servidor aplica a faixa que contém a distância entre restaurante e cliente.
 * Sem nenhuma faixa cadastrada, vale a taxa padrão do servidor.
 */

export type DeliveryFeeType = 'Fixed' | 'Percent';

/**
 * Como a API **devolve** a faixa.
 *
 * `minKm`, `maxKm` e `value` chegam como **string**: são `Decimal` no banco e
 * serializados assim para não perder casa decimal. O envio, por outro lado,
 * espera `number` — a assimetria é do contrato, não descuido.
 */
export interface DeliveryFeeRule {
  id: number;
  minKm: string;
  /** Ausente significa "daqui em diante", sem limite superior. */
  maxKm?: string | null;
  type: DeliveryFeeType;
  value: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Como a API **recebe** a faixa, na criação e na edição. */
export interface UpsertDeliveryFeeRuleInput {
  /** Início da faixa, em km. Inclusivo. */
  minKm: number;
  /** Fim da faixa, em km. Exclusivo. Omitir para "daqui em diante". */
  maxKm?: number;
  type: DeliveryFeeType;
  /** Reais quando `Fixed`, percentual quando `Percent`. */
  value: number;
  isActive?: boolean;
}

/** Um problema de cobertura entre faixas, detectado no cliente. */
export interface FaixaInconsistente {
  tipo: 'buraco' | 'sobreposicao';
  de: number;
  ate: number;
}
