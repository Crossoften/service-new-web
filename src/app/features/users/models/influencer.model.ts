export type InfluencerStatus = 'active' | 'inactive';

export interface Influencer {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  openServices: number;
  rating: number;
  comments: number;
  totalReferrals: number;
  totalPlatformValue: number;
  accumulatedCommission: number;
  rankingPosition: number;
  status: InfluencerStatus;
  avatarUrl?: string;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InfluencerListParams {
  page: number;
  pageSize: number;
  search: string;
}
