export type AdminServiceStatus = 'Active' | 'Pending' | 'Inactive';
export type AdminServiceType = 'Online' | 'Presential' | 'Home';

export interface AdminServiceCategory {
  id: number;
  name: string;
  iconUrl?: string | null;
}

export interface AdminServiceProvider {
  id: number;
  name: string;
  fileUrl: string | null;
  email?: string | null;
  phone?: string | null;
  averageRating?: number;
}

export interface AdminServiceListItem {
  id: number;
  name: string;
  description: string;
  type: AdminServiceType;
  category: AdminServiceCategory;
  provider: AdminServiceProvider;
  price: number;
  averageRating: number | null;
  totalRatings: number;
  positiveReviews: number;
  negativeReviews: number;
  totalWorks: number | null;
  status: AdminServiceStatus;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminService {
  id: number;
  name: string;
  description: string;
  type: AdminServiceType;
  category: AdminServiceCategory;
  provider: AdminServiceProvider;
  price: number;
  averageRating: number | null;
  totalRatings: number;
  positiveReviews: number;
  negativeReviews: number;
  totalWorks: number | null;
  status: AdminServiceStatus;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceClientItem {
  id: number;
  clientName: string;
  clientFileUrl: string | null;
  status: string;
  value: number | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface AdminServiceListResponse {
  services: AdminServiceListItem[];
  pages: number;
  count: number;
}

export interface AdminServiceClientsResponse {
  clients: ServiceClientItem[];
  pages: number;
  count: number;
}

export interface AdminServiceListParams {
  search?: string;
  status?: AdminServiceStatus;
  type?: AdminServiceType;
  categoryId?: number;
  isActive?: boolean;
  take?: number;
  skip?: number;
}

export interface AdminServiceClientsParams {
  take?: number;
  skip?: number;
}

// API response interfaces — raw shapes from the real API
export interface AdminServiceApiListItem {
  id: number;
  name: string;
  type: string;
  category: AdminServiceCategory;
  provider: AdminServiceProvider;
  price: number;
  positiveReviews: number;
  negativeReviews: number;
  totalReviews: number;
  isActive: boolean;
}

export interface AdminServiceApiDetail {
  id: number;
  name: string;
  type: string;
  registrationCode: string;
  price: number;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
  category: AdminServiceCategory;
  provider: AdminServiceProvider;
  positiveReviews: number;
  negativeReviews: number;
  totalReviews: number;
  totalWorks: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceClientApiItem {
  workId: number;
  serviceDate: string | null;
  createdAt: string;
  clientName: string;
  clientFileUrl: string | null;
  totalValue: number | null;
  status: string;
  reviewType?: string | null;
}

export interface AdminServiceApiListResponse {
  services: AdminServiceApiListItem[];
  currentPage: number;
  totalPages: number;
  totalRecords: number;
}

export interface AdminServiceClientsApiResponse {
  clients: ServiceClientApiItem[];
  currentPage: number;
  totalPages: number;
  totalRecords: number;
}

// Legacy alias
export type Service = AdminService;

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
