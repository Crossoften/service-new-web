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

/** Origem da assinatura, como o `GET /v1/admin-subscriptions` filtra. */
export type SubscriptionOrigin = 'Granted' | 'Paid';

export const SUBSCRIPTION_ORIGINS: ReadonlyArray<{ valor: SubscriptionOrigin; rotulo: string }> = [
  { valor: 'Granted', rotulo: 'Concedidas' },
  { valor: 'Paid', rotulo: 'Pagas' },
];

export const SUBSCRIPTION_STATUSES: ReadonlyArray<{
  valor: SubscriptionStatus;
  rotulo: string;
}> = [
  { valor: 'Active', rotulo: 'Ativa' },
  { valor: 'Pending', rotulo: 'Pendente' },
  { valor: 'Cancelled', rotulo: 'Cancelada' },
  { valor: 'Expired', rotulo: 'Expirada' },
];

export interface SubscriptionPerson {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

/** Uma linha do painel: a assinatura mais o fornecedor a que pertence. */
export interface AdminSubscriptionListItem {
  subscriptionId: number;
  provider: SubscriptionPerson;
  planName: string;
  planInterval: SubscriptionInterval;
  amount: number;
  status: SubscriptionStatus;
  categoryId: number | null;
  categoryName: string | null;
  isGranted: boolean;
  /** Quem concedeu. Nulo nas assinaturas pagas. */
  grantedBy: SubscriptionPerson | null;
  grantReason: string | null;
  bonusMonths: number;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  isCurrent: boolean;
  createdAt: string;
}

export interface AdminSubscriptionListParams {
  search?: string;
  origin?: SubscriptionOrigin;
  status?: SubscriptionStatus;
  providerId?: number;
  take?: number;
  skip?: number;
}

export interface AdminSubscriptionListResponse {
  subscriptions: AdminSubscriptionListItem[];
  pages: number;
  count: number;
}

interface SubscriptionPersonApi {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
}

export interface AdminSubscriptionApiItem {
  subscriptionId: number;
  provider: SubscriptionPersonApi;
  planName: string;
  planInterval: SubscriptionInterval;
  amount: number;
  status: SubscriptionStatus;
  categoryId?: number | null;
  categoryName?: string | null;
  isGranted: boolean;
  grantedBy?: SubscriptionPersonApi | null;
  grantReason?: string | null;
  bonusMonths: number;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  isCurrent: boolean;
  createdAt: string;
}

export interface AdminSubscriptionApiResponse {
  subscriptions?: AdminSubscriptionApiItem[];
  currentPage: number;
  totalPages: number;
  totalRecords: number;
}
