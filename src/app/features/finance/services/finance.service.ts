import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
  CreatePlanPayload,
  FinanceServiceFilters,
  FinanceServicesResponse,
  Plan,
  PlanFilters,
  PlansResponse,
  PlatformSettings,
  UpdatePlanPayload,
  UpdatePlatformSettingsPayload,
} from '../models/finance.model';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  constructor(private readonly apiService: ApiService) {}

  getPlatformSettings(): Observable<PlatformSettings> {
    return this.apiService.get<PlatformSettings>('/v1/admin-settings/platform');
  }

  getFinanceServices(filters: FinanceServiceFilters = {}): Observable<FinanceServicesResponse> {
    return this.apiService.get<FinanceServicesResponse>(
      '/v1/admin-services',
      this.toQueryParams(filters)
    );
  }

  updatePlatformSettings(payload: UpdatePlatformSettingsPayload): Observable<PlatformSettings> {
    return this.apiService.patch<PlatformSettings>('/v1/admin-settings/platform', payload);
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
    return this.apiService.post<Plan>('/v1/plans', payload);
  }

  updatePlan(id: number, payload: UpdatePlanPayload): Observable<Plan> {
    return this.apiService.patch<Plan>(`/v1/plans/${id}`, payload);
  }

  deletePlan(id: number): Observable<{ message?: string }> {
    return this.apiService.delete<{ message?: string }>(`/v1/plans/${id}`);
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
