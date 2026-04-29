import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import {
  DashboardCards,
  DashboardChart,
  DashboardCardsApiResponse,
  DashboardChartApiResponse,
} from '../models/dashboard.model';

const MONTH_NAMES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
                     'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly apiService: ApiService) {}

  getCards(): Observable<DashboardCards> {
    return this.apiService
      .get<DashboardCardsApiResponse>('/v1/admin-dashboard/cards')
      .pipe(
        map((res) => ({
          totalUsers: res.totalUsers,
          totalServices: res.totalServices,
          totalCashValue: res.totalCashValue,
        }))
      );
  }

  getChart(year?: number): Observable<DashboardChart> {
    const query = year ? { year } : undefined;

    return this.apiService
      .get<DashboardChartApiResponse>('/v1/admin-dashboard/chart', query)
      .pipe(
        map((res) => ({
          months: MONTH_NAMES.map((month, index) => {
            const apiMonth = res.data.find((item) => item.month === index + 1);
            return {
              month,
              users: apiMonth?.users ?? 0,
              services: apiMonth?.services ?? 0,
            };
          }),
        }))
      );
  }
}
