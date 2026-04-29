export type AdminUserStatus = 'Active' | 'Pending' | 'Inactive';
export type AdminUserRole = 'Master' | 'Admin' | 'User';
export type AdminUserProfileType = 'Client' | 'Supplier' | 'Influencer';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  code: string;
  role: AdminUserRole;
  profileType: AdminUserProfileType;
  status: AdminUserStatus;
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
  fileUrl: string;
}

export interface AdminUserApiDetail {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  document: string;
  status: string;
  openServices: number;
  fileUrl: string;
  fileKey: string;
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
