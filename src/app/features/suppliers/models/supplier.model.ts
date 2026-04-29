export type AdminProviderStatus = 'Active' | 'Pending' | 'Inactive';

export interface AdminProviderListItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  code: string;
  status: AdminProviderStatus;
  fileUrl: string | null;
  fileKey: string | null;
  totalServices: number;
  averageRating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProvider {
  id: number;
  name: string;
  email: string;
  phone: string;
  code: string;
  status: AdminProviderStatus;
  fileUrl: string | null;
  fileKey: string | null;
  totalServices: number;
  averageRating: number | null;
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderServiceHistoryItem {
  id: number;
  serviceName: string;
  clientName: string;
  clientFileUrl: string | null;
  status: string;
  value: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface AdminProviderListResponse {
  providers: AdminProviderListItem[];
  pages: number;
  count: number;
}

export interface AdminProviderHistoryResponse {
  history: ProviderServiceHistoryItem[];
  pages: number;
  count: number;
}

export interface AdminProviderListParams {
  search?: string;
  status?: AdminProviderStatus;
  take?: number;
  skip?: number;
}

export interface AdminProviderHistoryParams {
  take?: number;
  skip?: number;
}

// API response interfaces — raw shapes from the real API
export interface AdminProviderApiListItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  fileUrl: string;
  ranking: number;
  totalServices: number;
  status: string;
}

export interface AdminProviderApiListResponse {
  providers: AdminProviderApiListItem[];
  currentPage: number;
  totalPages: number;
  totalRecords: number;
}

export interface AdminProviderApiDetail {
  id: number;
  name: string;
  email: string;
  phone: string;
  document: string;
  fileUrl: string;
  status: string;
  openServices: number;
  positiveReviews: number;
  negativeReviews: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderHistoryApiItem {
  workId: number;
  serviceName: string;
  requesterName: string;
  requesterFileUrl: string;
  totalValue: number;
  status: string;
  serviceDate: string;
  createdAt: string;
}

export interface AdminProviderHistoryApiResponse {
  history: ProviderHistoryApiItem[];
  currentPage: number;
  totalPages: number;
  totalRecords: number;
}

// Legacy aliases
export type SupplierStatus = AdminProviderStatus;
export type Supplier = AdminProvider;
export type ServiceHistoryItem = ProviderServiceHistoryItem;

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
