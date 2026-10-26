/**
 * Repasses ao entregador.
 *
 * O dinheiro sai por fora do sistema — o admin faz o Pix e registra aqui. O
 * back-end liquida **todo** o saldo em aberto do entregador de uma vez; não há
 * repasse parcial.
 */

export type DeliveryPayoutMethod = 'Pix' | 'BankTransfer' | 'Cash' | 'Other';

export interface PayoutBankAccount {
  bankName: string;
  accountType: string;
  agency: string;
  account: string;
  cpf: string;
  /** Chave Pix já normalizada pelo back-end. É por ela que o repasse é pago. */
  pixKey?: string | null;
  pixKeyType?: string | null;
}

export interface PendingPayout {
  courierId: number;
  courierName: string;
  courierPhone?: string | null;
  /**
   * Em reais, como **string**. O back-end usa `Decimal` e serializa assim para
   * não perder centavo em ponto flutuante — converter só na exibição.
   */
  amount: string;
  deliveries: number;
  oldestAt: string;
  /** Entregas do saldo que pertencem a pedidos estornados. */
  refundedDeliveries: number;
  refundedAmount: string;
  /** Ausente quando o entregador não cadastrou conta. */
  bankAccount?: PayoutBankAccount | null;
}

export interface DeliveryPayout {
  id: number;
  courierId: number;
  courierName: string;
  amount: string;
  method: DeliveryPayoutMethod;
  reference?: string | null;
  notes?: string | null;
  transactionsCount: number;
  paidAt: string;
  createdById: number;
  createdAt: string;
}

export interface RegisterPayoutInput {
  courierId: number;
  method: DeliveryPayoutMethod;
  reference?: string;
  notes?: string;
  /**
   * O saldo que a tela mostrava. Se tiver mudado nesse intervalo, o back-end
   * devolve **409** e não liquida nada — é o que impede dar baixa em dinheiro
   * que não foi pago.
   */
  expectedAmount: number;
}
