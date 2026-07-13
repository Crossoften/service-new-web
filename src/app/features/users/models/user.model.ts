export type AdminUserStatus = 'Active' | 'Pending' | 'Inactive';
export type AdminUserRole = 'Master' | 'Admin' | 'User';
export type AdminUserBillingType = 'None' | 'Subscription' | 'Commission' | null;
export type AdminUserSocialNetwork =
  | 'Instagram'
  | 'TikTok'
  | 'YouTube'
  | 'Facebook'
  | 'X'
  | 'Other';
export type AdminUserProfileType =
  | 'Client'
  | 'Supplier'
  | 'Partner'
  | 'Delivery'
  | 'Influencer'
  | 'Unknown';

export interface AdminUserAddress {
  id?: number;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUserSocialMedia {
  id?: number;
  network: AdminUserSocialNetwork;
  url: string;
  followers: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  code: string;
  role: AdminUserRole;
  profileType: AdminUserProfileType;
  status: AdminUserStatus;
  billingType: AdminUserBillingType;
  address: AdminUserAddress | null;
  socialMedias: AdminUserSocialMedia[];
  referralCode: string | null;
  openServices: number | null;
  birthDate: string | null;
  fileUrl: string | null;
  fileKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserListItem extends AdminUser {}

export interface AdminUserListResponse {
  users: AdminUserListItem[];
  pages: number;
  count: number;
}

export interface AdminUserListParams {
  search?: string;
  status?: AdminUserStatus;
  profileType?: Exclude<AdminUserProfileType, 'Unknown'>;
  billingType?: Exclude<AdminUserBillingType, null>;
  city?: string;
  state?: string;
  referredByInfluencerId?: number;
  minReferrals?: number;
  serviceCategoryId?: number;
  hasActiveService?: boolean;
  hasSubscription?: boolean;
  minSubscriptionAmount?: number;
  maxSubscriptionAmount?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
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
  openServices?: number | null;
  birthDate: string | null;
  profileType: string;
  fileUrl: string | null;
  billingType?: string | null;
  address?: AdminUserAddress | null;
  socialMedias?: AdminUserSocialMedia[];
  referralCode?: string | null;
}

export interface AdminUserApiDetail {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  status: string;
  openServices?: number | null;
  fileUrl: string | null;
  fileKey: string | null;
  birthDate: string | null;
  profileType?: string;
  billingType?: string | null;
  address?: AdminUserAddress | null;
  socialMedias?: AdminUserSocialMedia[];
  referralCode?: string | null;
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
