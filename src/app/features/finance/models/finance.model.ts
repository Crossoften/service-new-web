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
}

export type UpdatePlanPayload = Partial<CreatePlanPayload>;
