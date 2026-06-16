export type AdminInfluencerStatus = 'Active' | 'Pending' | 'Inactive';

export interface AdminInfluencerListItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  code: string;
  status: AdminInfluencerStatus;
  fileUrl: string | null;
  fileKey: string | null;
  totalReferrals: number;
  totalPaying: number | null;
  accumulatedCommission: number | null;
  rankingPosition: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInfluencerStats {
  totalReferrals: number;
  totalPaying: number | null;
  accumulatedCommission: number | null;
  rankingPosition: number | null;
}

export interface AdminInfluencer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  code: string;
  status: AdminInfluencerStatus;
  fileUrl: string | null;
  fileKey: string | null;
  birthDate: string | null;
  referralCode: string | null;
  commissionRate: number | null;
  effectiveCommissionRate: number | null;
  stats: AdminInfluencerStats;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInfluencerListResponse {
  influencers: AdminInfluencerListItem[];
  pages: number;
  count: number;
}

export interface AdminInfluencerListParams {
  search?: string;
  status?: AdminInfluencerStatus;
  take?: number;
  skip?: number;
}

// API response interfaces — raw shapes from the real API
export interface AdminInfluencerApiListItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  fileUrl: string | null;
  ranking: number;
  totalReferrals: number;
  status: string;
}

export interface AdminInfluencerApiListResponse {
  influencers: AdminInfluencerApiListItem[];
  currentPage: number;
  totalPages: number;
  totalRecords: number;
}

export interface AdminInfluencerApiStats {
  totalReferrals: number;
  totalPaying: number;
  accumulatedCommission: number;
  rankingPosition: number;
}

export interface AdminInfluencerApiDetail {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  fileUrl: string | null;
  referralCode: string | null;
  birthDate: string | null;
  status: string;
  stats?: AdminInfluencerApiStats;
  commissionRate: number | null;
  effectiveCommissionRate: number | null;
  createdAt: string;
  updatedAt: string;
}

// Legacy alias
export type InfluencerStatus = AdminInfluencerStatus;
export type Influencer = AdminInfluencer;

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
