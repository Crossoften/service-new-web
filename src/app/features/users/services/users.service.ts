import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import {
  AdminUser,
  AdminUserListParams,
  AdminUserApiListItem,
  AdminUserApiDetail,
  AdminUserApiListResponse,
  AdminUserRole,
  AdminUserStatus,
  AdminUserProfileType,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private readonly apiService: ApiService) {}

  getUsers(params: AdminUserListParams): Observable<{ users: AdminUser[]; pages: number; count: number }> {
    const query: Record<string, string | number> = {
      take: params.take ?? 10,
    };
    if (params.skip && params.skip > 0) query['skip'] = params.skip;
    if (params.search) query['search'] = params.search;
    if (params.status) query['status'] = params.status;

    return this.apiService
      .get<AdminUserApiListResponse>('/v1/admin-users', query)
      .pipe(
        map((res) => ({
          users: res.users.map((u) => this.mapUserFromList(u)),
          pages: res.totalPages,
          count: res.totalRecords,
        }))
      );
  }

  getUserById(id: number): Observable<AdminUser> {
    return this.apiService
      .get<AdminUserApiDetail>(`/v1/admin-users/${id}`)
      .pipe(map((u) => this.mapUserFromDetail(u)));
  }

  private mapUserFromList(item: AdminUserApiListItem): AdminUser {
    return {
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone || '-',
      code: `#${String(item.id).padStart(3, '0')}`,
      role: 'User' as AdminUserRole,
      profileType: 'Client' as AdminUserProfileType,
      status: this.mapStatus(item.status),
      openServices: item.openServices ?? 0,
      fileUrl: item.fileUrl || null,
      fileKey: null,
      createdAt: '',
      updatedAt: '',
    };
  }

  private mapUserFromDetail(item: AdminUserApiDetail): AdminUser {
    return {
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone || '-',
      code: `#${String(item.id).padStart(3, '0')}`,
      role: 'User' as AdminUserRole,
      profileType: 'Client' as AdminUserProfileType,
      status: this.mapStatus(item.status),
      openServices: item.openServices ?? 0,
      fileUrl: item.fileUrl || null,
      fileKey: item.fileKey || null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapStatus(status: string): AdminUserStatus {
    if (status === 'Active' || status === 'Pending' || status === 'Inactive') return status;
    return 'Inactive';
  }
}
