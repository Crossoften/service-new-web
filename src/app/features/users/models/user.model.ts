export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  openServices: number;
  status: UserStatus;
  avatarUrl?: string;
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
