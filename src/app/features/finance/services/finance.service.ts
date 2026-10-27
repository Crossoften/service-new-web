import { Injectable } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import { SUPPRESS_GLOBAL_ERROR_TOAST } from '@core/tokens/http-context.tokens';
import {
  CreatePlanPayload,
  FinanceInfluencerCommission,
  FinanceInfluencerCommissionApiItem,
  FinanceInfluencerCommissionApiResponse,
  Plan,
  PlanFilters,
  PlansResponse,
  PlatformSettings,
  ServiceCategoryFinance,
  UpdateInfluencerCommissionPayload,
  UpdatePlanPayload,
  UpdatePlatformSettingsPayload,
} from '../models/finance.model';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  constructor(private readonly apiService: ApiService) {}

  getPlatformSettings(): Observable<PlatformSettings> {
    return this.apiService.get<PlatformSettings>('/v1/admin-settings/platform');
  }

  updatePlatformSettings(payload: UpdatePlatformSettingsPayload): Observable<PlatformSettings> {
    return this.apiService.patch<PlatformSettings>('/v1/admin-settings/platform', payload);
  }

  getServiceCategories(): Observable<ServiceCategoryFinance[]> {
    return this.apiService.get<ServiceCategoryFinance[]>('/v1/admin-categories/services');
  }

  getInfluencerCommissions(): Observable<FinanceInfluencerCommission[]> {
    return this.apiService
      .get<FinanceInfluencerCommissionApiResponse>('/v1/admin-influencers', {
        take: 50,
        skip: 1,
      })
      .pipe(map((res) => res.influencers.map((item) => this.mapInfluencerCommission(item))));
  }

  updateInfluencerCommission(
    id: number,
    payload: UpdateInfluencerCommissionPayload
  ): Observable<void> {
    return this.apiService.patch<void>(`/v1/admin-influencers/${id}/commission`, payload);
  }

  getPlans(filters: PlanFilters = {}): Observable<PlansResponse> {
    return this.apiService.get<PlansResponse>('/v1/plans', this.toQueryParams(filters));
  }

  getActivePlans(filters: PlanFilters = {}): Observable<PlansResponse> {
    return this.apiService.get<PlansResponse>('/v1/plans/active', this.toQueryParams(filters));
  }

  getPlanById(id: number): Observable<Plan> {
    return this.apiService.get<Plan>(`/v1/plans/${id}`);
  }

  createPlan(payload: CreatePlanPayload): Observable<Plan> {
    const context = new HttpContext().set(SUPPRESS_GLOBAL_ERROR_TOAST, true);
    return this.apiService.post<Plan>('/v1/plans', payload, { context });
  }

  updatePlan(id: number, payload: UpdatePlanPayload): Observable<Plan> {
    return this.apiService.patch<Plan>(`/v1/plans/${id}`, payload);
  }

  deletePlan(id: number): Observable<{ message?: string }> {
    return this.apiService.delete<{ message?: string }>(`/v1/plans/${id}`);
  }

  private mapInfluencerCommission(
    item: FinanceInfluencerCommissionApiItem
  ): FinanceInfluencerCommission {
    return {
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone || null,
      fileUrl: item.fileUrl || null,
      totalReferrals: item.totalReferrals ?? 0,
      rankingPosition: item.ranking ?? null,
      commissionRate: item.commissionRate ?? null,
      effectiveCommissionRate: item.effectiveCommissionRate ?? null,
      status: item.status,
    };
  }

  private toQueryParams(filters: PlanFilters): Record<string, string | number | boolean> {
    return Object.entries(filters).reduce<Record<string, string | number | boolean>>(
      (params, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params[key] = value;
        }
        return params;
      },
      {}
    );
  }
}
