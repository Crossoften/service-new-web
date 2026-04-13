export type CollaboratorStatus = 'active' | 'inactive';
export type CollaboratorRole = 'Admin' | 'Admin Master';

export interface CollaboratorPermissions {
  dashboard: boolean;
  users: boolean;
  services: boolean;
  finance: boolean;
  settings: boolean;
}

export interface Collaborator {
  id: string;
  cod: string;
  name: string;
  email: string;
  senha?: string;
  token: string;
  role: CollaboratorRole;
  status: CollaboratorStatus;
  permissions: CollaboratorPermissions;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CollaboratorListParams {
  page: number;
  pageSize: number;
  search: string;
}
