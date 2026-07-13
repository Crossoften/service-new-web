import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import {
  AdminProvider,
  AdminProviderListParams,
  AdminProviderHistoryParams,
  AdminProviderHistoryResponse,
  AdminProviderStatus,
  ProviderServiceHistoryItem,
  AdminProviderApiListItem,
  AdminProviderApiListResponse,
  AdminProviderApiDetail,
  ProviderHistoryApiItem,
  AdminProviderHistoryApiResponse,
  ProviderRegionalRankingApiItem,
  ProviderRegionalRankingApiResponse,
  ProviderRegionalRankingFilters,
  ProviderRegionalRankingItem,
} from '../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SuppliersService {
  constructor(private readonly apiService: ApiService) {}

  getSuppliers(
    params: AdminProviderListParams
  ): Observable<{ providers: AdminProvider[]; pages: number; count: number }> {
    const query: Record<string, string | number> = {
      take: params.take ?? 10,
    };
    if (params.skip && params.skip > 0) query['skip'] = params.skip;
    if (params.search) query['search'] = params.search;
    if (params.status) query['status'] = params.status;
    if (params.sortBy) query['sortBy'] = params.sortBy;
    if (params.sortDirection) query['sortDirection'] = params.sortDirection;

    return this.apiService.get<AdminProviderApiListResponse>('/v1/admin-providers', query).pipe(
      map((res) => ({
        providers: res.providers.map((p) => this.mapProviderFromList(p)),
        pages: res.totalPages,
        count: res.totalRecords,
      }))
    );
  }

  getSupplierById(id: number): Observable<AdminProvider> {
    return this.apiService
      .get<AdminProviderApiDetail>(`/v1/admin-providers/${id}`)
      .pipe(map((p) => this.mapProviderFromDetail(p)));
  }

  getSupplierHistory(
    id: number,
    params: AdminProviderHistoryParams
  ): Observable<AdminProviderHistoryResponse> {
    const query: Record<string, string | number> = {
      take: params.take ?? 10,
    };
    if (params.skip && params.skip > 0) query['skip'] = params.skip;
    if (params.sortBy) query['sortBy'] = params.sortBy;
    if (params.sortDirection) query['sortDirection'] = params.sortDirection;

    return this.apiService
      .get<AdminProviderHistoryApiResponse>(`/v1/admin-providers/${id}/history`, query)
      .pipe(
        map((res) => ({
          history: res.history.map((h) => this.mapHistoryItem(h)),
          pages: res.totalPages,
          count: res.totalRecords,
        }))
      );
  }

  getRegionalRanking(
    filters: ProviderRegionalRankingFilters
  ): Observable<ProviderRegionalRankingItem[]> {
    return this.apiService
      .get<ProviderRegionalRankingApiResponse>('/v1/admin-users/ranking/providers-by-location', {
        state: filters.state,
        city: filters.city,
      })
      .pipe(map((response) => this.mapRegionalRankingResponse(response)));
  }

  private mapProviderFromList(item: AdminProviderApiListItem): AdminProvider {
    return {
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone || null,
      code: `#${String(item.id).padStart(3, '0')}`,
      status: this.mapStatus(item.status),
      fileUrl: item.fileUrl || null,
      fileKey: null,
      ranking: item.ranking ?? null,
      birthDate: null,
      totalServices: item.totalServices ?? 0,
      averageRating: null,
      totalRatings: 0,
      createdAt: '',
      updatedAt: '',
    };
  }

  private mapProviderFromDetail(item: AdminProviderApiDetail): AdminProvider {
    return {
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone || null,
      code: `#${String(item.id).padStart(3, '0')}`,
      status: this.mapStatus(item.status),
      fileUrl: item.fileUrl || null,
      fileKey: null,
      ranking: null,
      birthDate: item.birthDate ?? null,
      totalServices: item.openServices ?? 0,
      averageRating: item.averageRating ?? null,
      totalRatings: item.totalReviews ?? 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapHistoryItem(item: ProviderHistoryApiItem): ProviderServiceHistoryItem {
    return {
      id: item.workId,
      serviceName: item.serviceName,
      clientName: item.requesterName,
      clientFileUrl: item.requesterFileUrl || null,
      status: item.status,
      value: item.totalValue,
      startedAt: item.serviceDate || null,
      finishedAt: null,
      createdAt: item.createdAt,
    };
  }

  private mapStatus(status: string): AdminProviderStatus {
    if (status === 'Active' || status === 'Pending' || status === 'Inactive') return status;
    return 'Inactive';
  }

  private mapRegionalRankingResponse(
    response: ProviderRegionalRankingApiResponse
  ): ProviderRegionalRankingItem[] {
    const items = Array.isArray(response)
      ? response
      : (response.providers ??
        response.ranking ??
        response.rankings ??
        response.data ??
        response.items ??
        response.results ??
        []);

    return items.map((item) => this.mapRegionalRankingItem(item));
  }

  private mapRegionalRankingItem(
    item: ProviderRegionalRankingApiItem
  ): ProviderRegionalRankingItem {
    return {
      position: item.position ?? item.ranking ?? item.rank ?? null,
      city: item.city ?? null,
      state: item.state ?? null,
      totalProviders: item.totalProviders ?? item.providersCount ?? item.totalSuppliers ?? null,
      totalActiveServices:
        item.totalActiveServices ?? item.activeServices ?? item.totalServices ?? null,
    };
  }
}
