import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import {
  AdminService,
  AdminServiceListParams,
  AdminServiceClientsParams,
  AdminServiceClientsResponse,
  AdminServiceType,
  AdminServiceApiListItem,
  AdminServiceApiDetail,
  ServiceClientApiItem,
  AdminServiceApiListResponse,
  AdminServiceClientsApiResponse,
  ServiceClientItem,
} from '../models/service.model';

@Injectable({ providedIn: 'root' })
export class ServicesService {
  constructor(private readonly apiService: ApiService) {}

  getServices(
    params: AdminServiceListParams
  ): Observable<{ services: AdminService[]; pages: number; count: number }> {
    const query: Record<string, string | number | boolean> = {
      take: params.take ?? 10,
    };
    if (params.skip && params.skip > 0) query['skip'] = params.skip;
    if (params.search) query['search'] = params.search;
    if (params.isActive !== undefined) query['isActive'] = params.isActive;
    if (params.isActive === undefined && params.status === 'Active') query['isActive'] = true;
    if (params.isActive === undefined && params.status === 'Inactive') query['isActive'] = false;
    if (params.type) query['type'] = params.type;
    if (params.categoryId) query['categoryId'] = params.categoryId;

    return this.apiService.get<AdminServiceApiListResponse>('/v1/admin-services', query).pipe(
      map((res) => ({
        services: res.services.map((s) => this.mapServiceFromList(s)),
        pages: res.totalPages,
        count: res.totalRecords,
      }))
    );
  }

  getServiceById(id: number): Observable<AdminService> {
    return this.apiService
      .get<AdminServiceApiDetail>(`/v1/admin-services/${id}`)
      .pipe(map((s) => this.mapServiceFromDetail(s)));
  }

  getServiceClients(
    id: number,
    params: AdminServiceClientsParams
  ): Observable<AdminServiceClientsResponse> {
    const query: Record<string, string | number> = {
      take: params.take ?? 10,
    };
    if (params.skip && params.skip > 0) query['skip'] = params.skip;

    return this.apiService
      .get<AdminServiceClientsApiResponse>(`/v1/admin-services/${id}/clients`, query)
      .pipe(
        map((res) => ({
          clients: res.clients.map((c) => this.mapClient(c)),
          pages: res.totalPages,
          count: res.totalRecords,
        }))
      );
  }

  private mapServiceFromList(item: AdminServiceApiListItem): AdminService {
    return {
      id: item.id,
      name: item.name,
      description: '',
      type: this.mapType(item.type),
      category: item.category,
      provider: item.provider,
      price: item.price,
      averageRating: null,
      totalRatings: item.totalReviews ?? null,
      positiveReviews: item.positiveReviews ?? null,
      negativeReviews: item.negativeReviews ?? null,
      totalWorks: item.totalWorks ?? null,
      status: item.isActive ? 'Active' : 'Inactive',
      fileUrl: null,
      createdAt: '',
      updatedAt: '',
    };
  }

  private mapServiceFromDetail(item: AdminServiceApiDetail): AdminService {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      type: this.mapType(item.type),
      category: item.category,
      provider: item.provider,
      price: item.price,
      averageRating: null,
      totalRatings: item.totalReviews ?? null,
      positiveReviews: item.positiveReviews ?? null,
      negativeReviews: item.negativeReviews ?? null,
      totalWorks: item.totalWorks ?? null,
      status: item.isActive ? 'Active' : 'Inactive',
      fileUrl: item.imageUrl || null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapClient(item: ServiceClientApiItem): ServiceClientItem {
    return {
      id: item.workId,
      clientName: item.clientName,
      clientFileUrl: item.clientFileUrl || null,
      status: item.status,
      value: item.totalValue,
      createdAt: item.createdAt,
      finishedAt: item.serviceDate || null,
    };
  }

  private mapType(type: string): AdminServiceType {
    if (type === 'Online' || type === 'Presential' || type === 'Home') {
      return type;
    }
    return 'Online';
  }
}
