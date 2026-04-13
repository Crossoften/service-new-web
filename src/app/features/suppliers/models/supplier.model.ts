export type SupplierStatus = 'active' | 'inactive';

export interface ServiceHistoryItem {
  id: string;
  serviceName: string;
  clientName: string;
  date: string;
  value: number;
  avatarUrl?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  openServices: number;
  rating: number;
  comments: number;
  status: SupplierStatus;
  serviceHistory: ServiceHistoryItem[];
  avatarUrl?: string;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SupplierListParams {
  page: number;
  pageSize: number;
  search: string;
}
