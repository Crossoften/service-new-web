export type SubscriptionStatus = 'Pending' | 'Active' | 'Cancelled' | 'Expired';
export type SubscriptionInterval = 'Month' | 'Year';

/**
 * Assinatura de um fornecedor.
 *
 * `categoryId` nulo é cobertura ampla — o caso das concessões. Preenchido é
 * assinatura paga de uma categoria, e o fornecedor pode ter várias.
 */
export interface ProviderSubscription {
  subscriptionId: number;
  planId: number;
  planName: string;
  planInterval: SubscriptionInterval;
  intervalCount: number;
  amount: number;
  status: SubscriptionStatus;
  categoryId: number | null;
  categoryName: string | null;
  isGranted: boolean;
  grantedById: number | null;
  grantReason: string | null;
  bonusMonths: number;
  cancelAtPeriodEnd: boolean;
  startedAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  isCurrent: boolean;
  createdAt: string;
}

export interface ProviderSubscriptions {
  providerId: number;
  /**
   * Concessão vigente, quando houver. Nulo significa que conceder está
   * liberado; preenchido significa que conceder responderia 409 e que o
   * caminho é bonificar esta assinatura.
   *
   * Vem calculado pelo back-end de propósito: é o mesmo critério do 409, e
   * recalculá-lo aqui faria a regra existir em dois lugares.
   */
  activeGrantId: number | null;
  subscriptions: ProviderSubscription[];
}

export interface ProviderSubscriptionApiItem {
  subscriptionId: number;
  planId: number;
  planName: string;
  planInterval: SubscriptionInterval;
  intervalCount: number;
  amount: number;
  status: SubscriptionStatus;
  categoryId?: number | null;
  categoryName?: string | null;
  isGranted: boolean;
  grantedById?: number | null;
  grantReason?: string | null;
  bonusMonths: number;
  cancelAtPeriodEnd: boolean;
  startedAt?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  isCurrent: boolean;
  createdAt: string;
}

export interface ProviderSubscriptionsApiResponse {
  providerId: number;
  activeGrantId?: number | null;
  subscriptions?: ProviderSubscriptionApiItem[];
}

export interface GrantSubscriptionInput {
  planId: number;
  months: number;
  reason?: string;
}

export interface AddSubscriptionBonusInput {
  months: number;
}

export interface GrantedSubscription {
  subscriptionId: number;
  providerId: number;
  planName: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  grantedById: number;
  grantReason?: string;
}

export interface SubscriptionBonusResult {
  subscriptionId: number;
  totalBonusMonths: number;
  currentPeriodEnd: string;
  status: SubscriptionStatus;
}

/** Opção do seletor de plano do formulário de concessão. */
export interface PlanOption {
  id: number;
  name: string;
  price: string;
  interval: SubscriptionInterval;
}
