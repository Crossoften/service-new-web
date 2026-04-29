import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { map, Observable } from 'rxjs';
import {
  Collaborator,
  CollaboratorApiItem,
  CollaboratorListApiResponse,
  CollaboratorListParams,
  CollaboratorListResponse,
  CollaboratorPermission,
  CollaboratorRole,
  CollaboratorStatus,
  SaveCollaboratorInput,
} from '../models/collaborator.model';

interface CreateAdminPayload {
  name: string;
  email: string;
  document: string;
  phone?: string;
  password: string;
  adminPermissions: CollaboratorPermission[];
  fileUrl?: string;
  fileKey?: string;
}

interface UpdateAdminPayload {
  name?: string;
  document?: string;
  email?: string;
  phone?: string;
  status?: CollaboratorStatus;
  password?: string;
  adminPermissions: CollaboratorPermission[];
  fileUrl?: string;
  fileKey?: string;
}

type PermissionApiItem =
  | string
  | {
      id: number;
      name: string;
      createdAt: string;
      updatedAt: string;
    };

@Injectable({ providedIn: 'root' })
export class CollaboratorsService {
  private readonly apiService = inject(ApiService);

  getAvailablePermissions(): Observable<CollaboratorPermission[]> {
    return this.apiService
      .get<PermissionApiItem[]>('/v1/admin-settings/all-permissions')
      .pipe(
        map((permissions) =>
          permissions
            .map((permission) => (typeof permission === 'string' ? permission : permission.name))
            .filter(this.isCollaboratorPermission)
        )
      );
  }

  getCollaborators(params: CollaboratorListParams): Observable<CollaboratorListResponse> {
    const query: Record<string, string> = {
      take: String(params.pageSize),
    };
    if (params.page > 0) query['skip'] = String(params.page);

    if (params.search.trim()) {
      query['search'] = params.search.trim();
    }

    if (params.status) {
      query['status'] = params.status;
    }

    return this.apiService.get<CollaboratorListApiResponse>('/v1/admin-settings', query).pipe(
      map((response) => ({
        data: response.admins.map((item) => this.mapCollaborator(item)),
        total: response.count,
        page: params.page,
        pageSize: params.pageSize,
      }))
    );
  }

  getCollaboratorById(id: number | string): Observable<Collaborator> {
    return this.apiService
      .get<CollaboratorApiItem>(`/v1/admin-settings/${id}`)
      .pipe(map((response) => this.mapCollaborator(response)));
  }

  saveCollaborator(collaborator: SaveCollaboratorInput): Observable<Collaborator> {
    if (collaborator.id) {
      return this.apiService
        .patch<CollaboratorApiItem>(
          `/v1/admin-settings/${collaborator.id}`,
          this.buildUpdatePayload(collaborator)
        )
        .pipe(map((response) => this.mapCollaborator(response)));
    }

    return this.apiService
      .post<{ message: string; admin: CollaboratorApiItem }>(
        '/v1/admin-settings',
        this.buildCreatePayload(collaborator)
      )
      .pipe(map((response) => this.mapCollaborator(response.admin)));
  }

  deleteCollaborator(id: number): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(`/v1/admin-settings/${id}`);
  }

  private buildCreatePayload(collaborator: SaveCollaboratorInput): CreateAdminPayload {
    return {
      name: collaborator.name,
      email: collaborator.email,
      document: collaborator.document,
      phone: collaborator.phone || undefined,
      password: collaborator.password ?? '',
      adminPermissions: collaborator.permissions,
      fileUrl: collaborator.fileUrl ?? undefined,
      fileKey: collaborator.fileKey ?? undefined,
    };
  }

  private buildUpdatePayload(collaborator: SaveCollaboratorInput): UpdateAdminPayload {
    return {
      name: collaborator.name,
      document: collaborator.document,
      email: collaborator.email,
      phone: collaborator.phone || undefined,
      status: collaborator.status,
      password: collaborator.password || undefined,
      adminPermissions: collaborator.permissions,
      fileUrl: collaborator.fileUrl ?? undefined,
      fileKey: collaborator.fileKey ?? undefined,
    };
  }

  private mapCollaborator(item: CollaboratorApiItem): Collaborator {
    return {
      id: item.id,
      code: `#${String(item.id).padStart(3, '0')}`,
      name: item.name,
      email: item.email,
      document: item.document,
      phone: item.phone,
      role: this.mapRole(item.role),
      status: this.mapStatus(item.status),
      permissions: item.adminPermissions.filter(this.isCollaboratorPermission),
      fileUrl: item.fileUrl || null,
      fileKey: item.fileKey || null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapRole(role: string): CollaboratorRole {
    return role === 'Master' ? 'Master' : 'Admin';
  }

  private mapStatus(status: string): CollaboratorStatus {
    switch (status) {
      case 'Active':
      case 'Pending':
      case 'Inactive':
        return status;
      default:
        return 'Inactive';
    }
  }

  private isCollaboratorPermission(
    permission: string
  ): permission is CollaboratorPermission {
    return (
      permission === 'Dashboard' ||
      permission === 'Settings' ||
      permission === 'Services' ||
      permission === 'Financial' ||
      permission === 'Users'
    );
  }
}
