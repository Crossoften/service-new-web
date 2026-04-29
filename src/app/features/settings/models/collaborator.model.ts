export type CollaboratorStatus = 'Active' | 'Pending' | 'Inactive';
export type CollaboratorRole = 'Admin' | 'Master';
export type CollaboratorPermission = 'Dashboard' | 'Settings' | 'Services' | 'Financial' | 'Users';

export interface Collaborator {
  id: number;
  code: string;
  name: string;
  email: string;
  document: string;
  phone: string;
  password?: string;
  role: CollaboratorRole;
  status: CollaboratorStatus;
  permissions: CollaboratorPermission[];
  fileUrl: string | null;
  fileKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CollaboratorListResponse {
  data: Collaborator[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CollaboratorListParams {
  page: number;
  pageSize: number;
  search: string;
  status?: CollaboratorStatus | '';
}

export interface SaveCollaboratorInput {
  id?: number;
  name: string;
  email: string;
  document: string;
  phone: string;
  password?: string;
  status?: CollaboratorStatus;
  permissions: CollaboratorPermission[];
  fileUrl?: string | null;
  fileKey?: string | null;
}

export interface CollaboratorApiItem {
  id: number;
  name: string;
  email: string;
  document: string;
  phone: string;
  role: string;
  status: string;
  fileUrl: string;
  fileKey: string;
  adminPermissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CollaboratorListApiResponse {
  admins: CollaboratorApiItem[];
  pages: number;
  count: number;
}
