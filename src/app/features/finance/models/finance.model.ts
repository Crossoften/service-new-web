// Plans
export interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanPayload {
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
}

export interface UpdatePlanPayload {
  name?: string;
  description?: string;
  price?: number;
  interval?: string;
  features?: string[];
  isActive?: boolean;
}

export interface PlansListResponse {
  plans: Plan[];
}

// Subscriptions
export type SubscriptionStatus = 'Active' | 'Cancelled' | 'Expired';

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  interval: string;
}

export interface Subscription {
  id: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface SubscriptionsListResponse {
  subscriptions: Subscription[];
  pages: number;
  count: number;
}

// TODO: endpoint não documentado — aguardando backend
export interface SupplierRate {
  id: string;
  category: string;
  percentage: number;
}

// TODO: endpoint não documentado — aguardando backend
export interface PartnerCommission {
  id: string;
  name: string;
  percentage: number;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
