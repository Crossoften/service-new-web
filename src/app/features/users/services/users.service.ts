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
  AdminUserBillingType,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private readonly apiService: ApiService) {}

  getUsers(
    params: AdminUserListParams
  ): Observable<{ users: AdminUser[]; pages: number; count: number }> {
    const query: Record<string, string | number> = {
      take: params.take ?? 10,
    };
    if (params.skip && params.skip > 0) query['skip'] = params.skip;
    if (params.search) query['search'] = params.search;
    if (params.status) query['status'] = params.status;
    if (params.profileType) query['profileType'] = params.profileType;
    if (params.billingType) query['billingType'] = params.billingType;
    if (params.city) query['city'] = params.city;
    if (params.state) query['state'] = params.state;
    if (params.referredByInfluencerId)
      query['referredByInfluencerId'] = params.referredByInfluencerId;
    if (params.minReferrals) query['minReferrals'] = params.minReferrals;
    if (params.serviceCategoryId) query['serviceCategoryId'] = params.serviceCategoryId;
    if (params.hasActiveService !== undefined)
      query['hasActiveService'] = String(params.hasActiveService);
    if (params.hasSubscription !== undefined)
      query['hasSubscription'] = String(params.hasSubscription);
    if (params.minSubscriptionAmount !== undefined)
      query['minSubscriptionAmount'] = params.minSubscriptionAmount;
    if (params.maxSubscriptionAmount !== undefined)
      query['maxSubscriptionAmount'] = params.maxSubscriptionAmount;
    if (params.sortBy) query['sortBy'] = params.sortBy;
    if (params.sortDirection) query['sortDirection'] = params.sortDirection;

    return this.apiService.get<AdminUserApiListResponse>('/v1/admin-users', query).pipe(
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
      phone: item.phone || null,
      code: `#${String(item.id).padStart(3, '0')}`,
      role: 'User' as AdminUserRole,
      profileType: this.mapProfileType(item.profileType),
      status: this.mapStatus(item.status),
      billingType: this.mapBillingType(item.billingType),
      address: item.address ?? null,
      socialMedias: item.socialMedias ?? [],
      referralCode: item.referralCode ?? null,
      openServices: item.openServices ?? null,
      birthDate: item.birthDate ?? null,
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
      phone: item.phone || null,
      code: `#${String(item.id).padStart(3, '0')}`,
      role: 'User' as AdminUserRole,
      profileType: this.mapProfileType(item.profileType),
      status: this.mapStatus(item.status),
      billingType: this.mapBillingType(item.billingType),
      address: item.address ?? null,
      socialMedias: item.socialMedias ?? [],
      referralCode: item.referralCode ?? null,
      openServices: item.openServices ?? null,
      birthDate: item.birthDate ?? null,
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

  private mapBillingType(billingType: string | null | undefined): AdminUserBillingType {
    if (billingType === 'None' || billingType === 'Subscription' || billingType === 'Commission') {
      return billingType;
    }
    return null;
  }

  private mapProfileType(profileType: string | undefined): AdminUserProfileType {
    switch (profileType) {
      case 'Client':
      case 'Supplier':
      case 'Partner':
      case 'Delivery':
      case 'Influencer':
        return profileType;
      default:
        return 'Unknown';
    }
  }
}
