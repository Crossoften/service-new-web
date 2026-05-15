import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
  PlatformSettings,
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
}
