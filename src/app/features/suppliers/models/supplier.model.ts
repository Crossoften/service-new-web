export type AdminProviderStatus = 'Active' | 'Pending' | 'Inactive';

export interface AdminProviderListItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  code: string;
  status: AdminProviderStatus;
  fileUrl: string | null;
  fileKey: string | null;
  ranking: number | null;
  totalServices: number;
  averageRating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProvider {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  code: string;
  status: AdminProviderStatus;
  fileUrl: string | null;
  fileKey: string | null;
  ranking: number | null;
  birthDate: string | null;
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
  value: number | null;
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
  sortBy?: 'name' | 'email' | 'status' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

export interface AdminProviderHistoryParams {
  take?: number;
  skip?: number;
  sortBy?: 'createdAt' | 'serviceDate' | 'totalValue' | 'status';
  sortDirection?: 'asc' | 'desc';
}

export interface ProviderRegionalRankingFilters {
  state: string;
  city: string;
}

export interface ProviderRegionalRankingItem {
  position: number | null;
  city: string | null;
  state: string | null;
  totalProviders: number | null;
  totalActiveServices: number | null;
}

// API response interfaces — raw shapes from the real API
export interface AdminProviderApiListItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  fileUrl: string | null;
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
  phone: string | null;
  document: string | null;
  fileUrl: string | null;
  birthDate: string | null;
  status: string;
  openServices: number;
  positiveReviews: number;
  negativeReviews: number;
  totalReviews: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderHistoryApiItem {
  workId: number;
  serviceName: string;
  serviceDescription?: string | null;
  requesterName: string;
  requesterFileUrl: string | null;
  totalValue: number | null;
  status: string;
  serviceDate: string | null;
  createdAt: string;
}

export interface AdminProviderHistoryApiResponse {
  history: ProviderHistoryApiItem[];
  currentPage: number;
  totalPages: number;
  totalRecords: number;
}

export interface ProviderRegionalRankingApiItem {
  position?: number | null;
  ranking?: number | null;
  rank?: number | null;
  city?: string | null;
  state?: string | null;
  totalProviders?: number | null;
  providersCount?: number | null;
  totalSuppliers?: number | null;
  totalActiveServices?: number | null;
  activeServices?: number | null;
  totalServices?: number | null;
}

export type ProviderRegionalRankingApiResponse =
  | ProviderRegionalRankingApiItem[]
  | {
      providers?: ProviderRegionalRankingApiItem[];
      ranking?: ProviderRegionalRankingApiItem[];
      rankings?: ProviderRegionalRankingApiItem[];
      data?: ProviderRegionalRankingApiItem[];
      items?: ProviderRegionalRankingApiItem[];
      results?: ProviderRegionalRankingApiItem[];
    };

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
