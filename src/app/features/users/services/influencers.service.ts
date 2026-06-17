import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import {
  AdminInfluencer,
  AdminInfluencerListParams,
  AdminInfluencerStatus,
  AdminInfluencerApiListItem,
  AdminInfluencerApiListResponse,
  AdminInfluencerApiDetail,
} from '../models/influencer.model';

@Injectable({ providedIn: 'root' })
export class InfluencersService {
  constructor(private readonly apiService: ApiService) {}

  getInfluencers(
    params: AdminInfluencerListParams
  ): Observable<{ influencers: AdminInfluencer[]; pages: number; count: number }> {
    const query: Record<string, string | number> = {
      take: params.take ?? 10,
    };
    if (params.skip && params.skip > 0) query['skip'] = params.skip;
    if (params.search) query['search'] = params.search;
    if (params.status) query['status'] = params.status;

    return this.apiService.get<AdminInfluencerApiListResponse>('/v1/admin-influencers', query).pipe(
      map((res) => ({
        influencers: res.influencers.map((i) => this.mapInfluencerFromList(i)),
        pages: res.totalPages,
        count: res.totalRecords,
      }))
    );
  }

  getInfluencerById(id: number): Observable<AdminInfluencer> {
    return this.apiService
      .get<AdminInfluencerApiDetail>(`/v1/admin-influencers/${id}`)
      .pipe(map((i) => this.mapInfluencerFromDetail(i)));
  }

  private mapInfluencerFromList(item: AdminInfluencerApiListItem): AdminInfluencer {
    return {
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone || null,
      code: `#${String(item.id).padStart(3, '0')}`,
      status: this.mapStatus(item.status),
      fileUrl: item.fileUrl || null,
      fileKey: null,
      birthDate: null,
      referralCode: null,
      commissionRate: item.commissionRate ?? null,
      effectiveCommissionRate: item.effectiveCommissionRate ?? null,
      stats: {
        totalReferrals: item.totalReferrals ?? 0,
        totalPaying: null,
        accumulatedCommission: null,
        rankingPosition: item.ranking ?? null,
      },
      createdAt: '',
      updatedAt: '',
    };
  }

  private mapInfluencerFromDetail(item: AdminInfluencerApiDetail): AdminInfluencer {
    return {
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone || null,
      code: `#${String(item.id).padStart(3, '0')}`,
      status: this.mapStatus(item.status),
      fileUrl: item.fileUrl || null,
      fileKey: null,
      birthDate: item.birthDate ?? null,
      referralCode: item.referralCode ?? null,
      commissionRate: item.commissionRate ?? null,
      effectiveCommissionRate: item.effectiveCommissionRate ?? null,
      stats: {
        totalReferrals: item.stats?.totalReferrals ?? 0,
        totalPaying: item.stats?.totalPaying ?? null,
        accumulatedCommission: item.stats?.accumulatedCommission ?? null,
        rankingPosition: item.stats?.rankingPosition ?? null,
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapStatus(status: string): AdminInfluencerStatus {
    if (status === 'Active' || status === 'Pending' || status === 'Inactive') return status;
    return 'Inactive';
  }
}
