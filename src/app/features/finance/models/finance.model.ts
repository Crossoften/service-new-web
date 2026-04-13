export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'paid' | 'pending' | 'cancelled';

export interface Transaction {
  id: string;
  description: string;
  provider: string;
  value: number;
  date: string;
  type: TransactionType;
  status: TransactionStatus;
}

export interface FinanceEntry {
  id: string;
  service: string;
  category: string;
  value: number;
  platformValue: number;
  rating: number;
  status: 'active' | 'inactive';
}

export interface FinanceSummary {
  totalRevenue: number;
  pendingPayments: number;
  activePartners: number;
}

export interface SupplierRate {
  id: string;
  category: string;
  percentage: number;
}

export interface PartnerCommission {
  id: string;
  name: string;
  percentage: number;
}

export interface SubscriptionParam {
  id: string;
  plan: string;
  action: string;
  value: number;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TransactionListParams {
  page: number;
  pageSize: number;
  search: string;
}
