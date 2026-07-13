import type { AdminUserAddress } from './user.model';

export type AdminInfluencerStatus = 'Active' | 'Pending' | 'Inactive';
export type AdminInfluencerSocialNetwork =
  | 'Instagram'
  | 'TikTok'
  | 'YouTube'
  | 'Facebook'
  | 'X'
  | 'Other';

export interface AdminInfluencerSocialMedia {
  id?: number;
  network: AdminInfluencerSocialNetwork;
  url: string;
  followers: number;
  createdAt?: string;
  updatedAt?: string;
}

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
  address: AdminUserAddress | null;
  socialMedias: AdminInfluencerSocialMedia[];
  stats: AdminInfluencerStats;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInfluencerReferral {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string | null;
  profileType: string | null;
  billingType: string | null;
  city: string | null;
  state: string | null;
  fileUrl: string | null;
  createdAt: string | null;
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
  sortBy?: 'name' | 'email' | 'status' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

export interface InfluencerRegionalRankingFilters {
  state: string;
  city: string;
}

export interface InfluencerRegionalRankingItem {
  position: number | null;
  city: string | null;
  state: string | null;
  totalInfluencers: number | null;
  totalReferrals: number | null;
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
  commissionRate?: number | null;
  effectiveCommissionRate?: number | null;
  address?: AdminUserAddress | null;
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
  address?: AdminUserAddress | null;
  socialMedias?: AdminInfluencerSocialMedia[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminInfluencerReferralApiItem {
  id?: number;
  name?: string;
  email?: string;
  phone?: string | null;
  status?: string | null;
  profileType?: string | null;
  billingType?: string | null;
  fileUrl?: string | null;
  createdAt?: string | null;
  city?: string | null;
  state?: string | null;
  address?: {
    city?: string | null;
    state?: string | null;
  } | null;
}

export interface InfluencerRegionalRankingApiItem {
  position?: number | null;
  ranking?: number | null;
  rank?: number | null;
  city?: string | null;
  state?: string | null;
  totalInfluencers?: number | null;
  influencersCount?: number | null;
  total?: number | null;
  totalReferrals?: number | null;
  referralsCount?: number | null;
}

export type InfluencerRegionalRankingApiResponse =
  | InfluencerRegionalRankingApiItem[]
  | {
      influencers?: InfluencerRegionalRankingApiItem[];
      ranking?: InfluencerRegionalRankingApiItem[];
      rankings?: InfluencerRegionalRankingApiItem[];
      data?: InfluencerRegionalRankingApiItem[];
      items?: InfluencerRegionalRankingApiItem[];
      results?: InfluencerRegionalRankingApiItem[];
    };

// Legacy alias
export type InfluencerStatus = AdminInfluencerStatus;
export type Influencer = AdminInfluencer;

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
