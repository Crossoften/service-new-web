export type AdminUserStatus = 'Active' | 'Pending' | 'Inactive';
export type AdminUserRole = 'Master' | 'Admin' | 'User';
export type AdminUserProfileType =
  | 'Client'
  | 'Supplier'
  | 'Partner'
  | 'Delivery'
  | 'Influencer'
  | 'Unknown';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  code: string;
  role: AdminUserRole;
  profileType: AdminUserProfileType;
  status: AdminUserStatus;
  openServices: number;
  birthDate: string | null;
  fileUrl: string | null;
  fileKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserListItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  code: string;
  role: AdminUserRole;
  profileType: AdminUserProfileType;
  status: AdminUserStatus;
  openServices: number;
  birthDate: string | null;
  fileUrl: string | null;
  fileKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserListResponse {
  users: AdminUserListItem[];
  pages: number;
  count: number;
}

export interface AdminUserListParams {
  search?: string;
  status?: AdminUserStatus;
  take?: number;
  skip?: number;
}

// API response interfaces — raw shapes from the real API
export interface AdminUserApiListItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  openServices: number;
  birthDate: string | null;
  profileType: string;
  fileUrl: string | null;
}

export interface AdminUserApiDetail {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  status: string;
  openServices: number;
  fileUrl: string | null;
  fileKey: string | null;
  birthDate: string | null;
  profileType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserApiListResponse {
  users: AdminUserApiListItem[];
  currentPage: number;
  totalPages: number;
  totalRecords: number;
}

// Legacy aliases
export type UserStatus = AdminUserStatus;
export type UserRole = AdminUserRole;
export type User = AdminUser;

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
