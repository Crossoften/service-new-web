import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
  Plan,
  CreatePlanPayload,
  UpdatePlanPayload,
  PlansListResponse,
} from '../models/finance.model';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  constructor(private readonly apiService: ApiService) {}

  getPlans(): Observable<PlansListResponse> {
    return this.apiService.get<PlansListResponse>('/v1/plans');
  }

  createPlan(payload: CreatePlanPayload): Observable<Plan> {
    return this.apiService.post<Plan>('/v1/plans', payload);
  }

  updatePlan(id: number, payload: UpdatePlanPayload): Observable<Plan> {
    return this.apiService.patch<Plan>(`/v1/plans/${id}`, payload);
  }

  deletePlan(id: number): Observable<void> {
    return this.apiService.delete<void>(`/v1/plans/${id}`);
  }

  // TODO: endpoint não documentado — aguardando backend
  // getSupplierRates(): Observable<SupplierRate[]>

  // TODO: endpoint não documentado — aguardando backend
  // getPartnerCommissions(): Observable<PartnerCommission[]>
}
