export type UserStatus = 'Active' | 'Pending' | 'Inactive';
export type UserRole = 'Master' | 'Admin' | 'User';

export interface User {
  id: number;
  code: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  fileUrl: string | null;
  fileKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserListParams {
  page: number;
  pageSize: number;
  search: string;
}

export interface UserApiItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  code: string;
  role: UserRole | string;
  status: UserStatus | string;
  fileUrl: string;
  fileKey: string;
  createdAt: string;
  updatedAt: string;
}
