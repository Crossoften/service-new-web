import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import { UsersService } from './users.service';
import { AdminUser } from '../models/user.model';
import {
  AdminInfluencer,
  AdminInfluencerListParams,
  AdminInfluencerStatus,
  AdminInfluencerApiListItem,
  AdminInfluencerApiListResponse,
  AdminInfluencerApiDetail,
  AdminInfluencerReferral,
  AdminInfluencerReferralApiItem,
  InfluencerRegionalRankingApiItem,
  InfluencerRegionalRankingApiResponse,
  InfluencerRegionalRankingFilters,
  InfluencerRegionalRankingItem,
} from '../models/influencer.model';

@Injectable({ providedIn: 'root' })
export class InfluencersService {
  constructor(
    private readonly apiService: ApiService,
    private readonly usersService: UsersService
  ) {}

  getInfluencers(
    params: AdminInfluencerListParams
  ): Observable<{ influencers: AdminInfluencer[]; pages: number; count: number }> {
    const hasLocationFilter = Boolean(params.state || params.city);
    const query: Record<string, string | number> = {
      take: params.take ?? 10,
    };
    if (params.skip && params.skip > 0) query['skip'] = params.skip;
    if (params.search) query['search'] = params.search;
    if (params.status) query['status'] = params.status;
    if (params.sortBy) query['sortBy'] = params.sortBy;
    if (params.sortDirection) query['sortDirection'] = params.sortDirection;

    const influencersRequest = this.apiService.get<AdminInfluencerApiListResponse>(
      '/v1/admin-influencers',
      query
    );
    const adminUsersRequest = this.usersService.getUsers({
      take: params.take ?? 10,
      skip: params.skip,
      search: params.search,
      status: params.status,
      profileType: 'Influencer',
      city: params.city,
      state: params.state,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    });
    const usersRequest = hasLocationFilter
      ? adminUsersRequest
      : adminUsersRequest.pipe(catchError(() => of({ users: [], pages: 0, count: 0 })));

    return forkJoin({ influencersResponse: influencersRequest, usersResponse: usersRequest }).pipe(
      map(({ influencersResponse, usersResponse }) => {
        const influencerItemsById = new Map(
          influencersResponse.influencers.map((item) => [item.id, item])
        );
        const influencerItemsByEmail = new Map(
          influencersResponse.influencers.map((item) => [item.email, item])
        );

        if (hasLocationFilter) {
          return {
            influencers: usersResponse.users.map((user) => {
              const matchingItem =
                influencerItemsById.get(user.id) ?? influencerItemsByEmail.get(user.email);
              const influencer = matchingItem
                ? this.mapInfluencerFromList(matchingItem)
                : this.mapAdminUserAsInfluencer(user);

              return {
                ...influencer,
                address: user.address ?? influencer.address,
              };
            }),
            pages: usersResponse.pages,
            count: usersResponse.count,
          };
        }

        const usersById = new Map(usersResponse.users.map((user) => [user.id, user]));
        const usersByEmail = new Map(usersResponse.users.map((user) => [user.email, user]));

        return {
          influencers: influencersResponse.influencers.map((item) => {
            const influencer = this.mapInfluencerFromList(item);
            const matchingUser = usersById.get(item.id) ?? usersByEmail.get(item.email);

            return {
              ...influencer,
              address: influencer.address ?? matchingUser?.address ?? null,
            };
          }),
          pages: influencersResponse.totalPages,
          count: influencersResponse.totalRecords,
        };
      })
    );
  }

  getInfluencerById(id: number): Observable<AdminInfluencer> {
    return this.apiService
      .get<AdminInfluencerApiDetail>(`/v1/admin-influencers/${id}`)
      .pipe(map((i) => this.mapInfluencerFromDetail(i)));
  }

  getInfluencerReferrals(id: number): Observable<AdminInfluencerReferral[]> {
    return this.apiService
      .get<
        | AdminInfluencerReferralApiItem[]
        | { referrals?: AdminInfluencerReferralApiItem[]; users?: AdminInfluencerReferralApiItem[] }
      >(`/v1/admin-influencers/${id}/referrals`)
      .pipe(map((response) => this.mapReferralResponse(response)));
  }

  getRegionalRanking(
    filters: InfluencerRegionalRankingFilters
  ): Observable<InfluencerRegionalRankingItem[]> {
    return this.apiService
      .get<InfluencerRegionalRankingApiResponse>('/v1/admin-influencers/ranking/location', {
        state: filters.state,
        city: filters.city,
      })
      .pipe(map((response) => this.mapRegionalRankingResponse(response)));
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
      address: item.address ?? null,
      socialMedias: [],
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
      address: item.address ?? null,
      socialMedias: item.socialMedias ?? [],
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

  private mapAdminUserAsInfluencer(user: AdminUser): AdminInfluencer {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      code: user.code,
      status: user.status,
      fileUrl: user.fileUrl,
      fileKey: user.fileKey,
      birthDate: user.birthDate,
      referralCode: user.referralCode,
      commissionRate: null,
      effectiveCommissionRate: null,
      address: user.address,
      socialMedias: user.socialMedias,
      stats: {
        totalReferrals: 0,
        totalPaying: null,
        accumulatedCommission: null,
        rankingPosition: null,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private mapStatus(status: string): AdminInfluencerStatus {
    if (status === 'Active' || status === 'Pending' || status === 'Inactive') return status;
    return 'Inactive';
  }

  private mapReferralResponse(
    response:
      | AdminInfluencerReferralApiItem[]
      | { referrals?: AdminInfluencerReferralApiItem[]; users?: AdminInfluencerReferralApiItem[] }
  ): AdminInfluencerReferral[] {
    const referrals = Array.isArray(response)
      ? response
      : (response.referrals ?? response.users ?? []);
    return referrals.map((item) => this.mapReferral(item));
  }

  private mapReferral(item: AdminInfluencerReferralApiItem): AdminInfluencerReferral {
    return {
      id: item.id ?? 0,
      name: item.name ?? 'Usuário sem nome',
      email: item.email ?? 'Não informado',
      phone: item.phone ?? null,
      status: item.status ?? null,
      profileType: item.profileType ?? null,
      billingType: item.billingType ?? null,
      city: item.city ?? item.address?.city ?? null,
      state: item.state ?? item.address?.state ?? null,
      fileUrl: item.fileUrl ?? null,
      createdAt: item.createdAt ?? null,
    };
  }

  private mapRegionalRankingResponse(
    response: InfluencerRegionalRankingApiResponse
  ): InfluencerRegionalRankingItem[] {
    const items = Array.isArray(response)
      ? response
      : (response.influencers ??
        response.ranking ??
        response.rankings ??
        response.data ??
        response.items ??
        response.results ??
        []);

    return items.map((item) => this.mapRegionalRankingItem(item));
  }

  private mapRegionalRankingItem(
    item: InfluencerRegionalRankingApiItem
  ): InfluencerRegionalRankingItem {
    return {
      position: item.position ?? item.ranking ?? item.rank ?? null,
      city: item.city ?? null,
      state: item.state ?? null,
      totalInfluencers: item.totalInfluencers ?? item.influencersCount ?? item.total ?? null,
      totalReferrals: item.totalReferrals ?? item.referralsCount ?? null,
    };
  }
}
