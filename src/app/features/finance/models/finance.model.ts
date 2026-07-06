export type PlanInterval = 'Month' | 'Year';

export interface PlatformSettings {
  influencerCommissionRate: number;
  updatedAt: string;
}

export interface UpdatePlatformSettingsPayload {
  influencerCommissionRate?: number;
}

export interface Plan {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  price: string;
  interval: PlanInterval;
  intervalCount: number;
  bonusMonths: number;
  monthlyPrice: string;
  isActive: boolean;
  sortOrder: number;
  categoryId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlansResponse {
  plans: Plan[];
  currentPage: number;
  totalPages: number;
  totalRecords: number;
}

export interface PlanFilters {
  search?: string;
  isActive?: boolean;
  take?: number;
  skip?: number;
}

export interface CreatePlanPayload {
  name: string;
  slug: string;
  description?: string;
  price: number;
  interval: PlanInterval;
  intervalCount: number;
  bonusMonths?: number;
  isActive?: boolean;
  sortOrder?: number;
  categoryId?: number | null;
}

export type UpdatePlanPayload = Partial<CreatePlanPayload>;

export interface ServiceCategoryFinance {
  id: number;
  name: string;
  platformFeeRate: number;
  isActive?: boolean;
  sortOrder?: number;
  updatedAt?: string;
}

export interface UpdateServiceCategoryPlatformFeePayload {
  platformFeeRate: number;
}

export interface FinanceInfluencerCommission {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  fileUrl: string | null;
  totalReferrals: number;
  rankingPosition: number | null;
  commissionRate: number | null;
  effectiveCommissionRate: number | null;
  status: string;
}

export interface FinanceInfluencerCommissionApiItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  fileUrl: string | null;
  ranking?: number | null;
  totalReferrals?: number | null;
  commissionRate?: number | null;
  effectiveCommissionRate?: number | null;
  status: string;
}

export interface FinanceInfluencerCommissionApiResponse {
  influencers: FinanceInfluencerCommissionApiItem[];
  currentPage: number;
  totalPages: number;
  totalRecords: number;
}

export interface UpdateInfluencerCommissionPayload {
  commissionRate: number | null;
}
