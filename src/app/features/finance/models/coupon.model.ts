/**
 * Cupons de desconto.
 *
 * O desconto é **custeado pela plataforma**: o restaurante recebe os itens
 * integrais e o entregador recebe frete e gorjeta normalmente. Por isso o
 * desconto de um pedido nunca passa da comissão dele — `minOrderValue` e
 * `maxDiscountValue` são o que mantém o cupom dentro desse limite. Sem eles,
 * o cupom é recusado nos pedidos menores.
 */

export type CouponType = 'Percent' | 'Fixed' | 'FreeShipping';

/**
 * Como a API **devolve** o cupom.
 *
 * `value`, `maxDiscountValue` e `minOrderValue` chegam como **string** — são
 * `Decimal` no banco. O envio espera `number`. A assimetria é do contrato.
 */
export interface Coupon {
  id: number;
  code: string;
  description?: string | null;
  type: CouponType;
  value?: string | null;
  maxDiscountValue?: string | null;
  minOrderValue?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  maxUses?: number | null;
  maxUsesPerCustomer?: number | null;
  restaurantId?: number | null;
  isActive: boolean;
  /** Quantas vezes já foi resgatado. */
  timesUsed: number;
  createdAt: string;
}

/** Como a API **recebe** o cupom. Campos ausentes significam "sem limite". */
export interface UpsertCouponInput {
  code: string;
  description?: string;
  type: CouponType;
  /** Percentual (0–100) em `Percent`, reais em `Fixed`. Ignorado em `FreeShipping`. */
  value?: number;
  maxDiscountValue?: number;
  minOrderValue?: number;
  startsAt?: string;
  endsAt?: string;
  maxUses?: number;
  maxUsesPerCustomer?: number;
  restaurantId?: number;
  isActive?: boolean;
}

/** Só o que a tela precisa para montar o seletor de restaurante. */
export interface RestaurantOption {
  id: number;
  name: string;
}
