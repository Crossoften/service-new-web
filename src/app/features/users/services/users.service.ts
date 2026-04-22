import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import {
  PagedResult,
  User,
  UserApiItem,
  UserListParams,
  UserRole,
  UserStatus,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private readonly apiService: ApiService) {}

  getAllUsers(): Observable<User[]> {
    return this.apiService.get<UserApiItem[]>('/v1/no-auth/users').pipe(
      map((users) =>
        users
          .map((user) => this.mapUser(user))
          .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
      )
    );
  }

  getUsers(params: UserListParams): Observable<PagedResult<User>> {
    return this.getAllUsers().pipe(
      map((users) => {
        const search = params.search.trim().toLowerCase();
        const filtered = users.filter(
          (user) =>
            !search ||
            user.name.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search) ||
            user.phone.toLowerCase().includes(search) ||
            user.role.toLowerCase().includes(search) ||
            user.code.toLowerCase().includes(search)
        );
        const start = (params.page - 1) * params.pageSize;

        return {
          data: filtered.slice(start, start + params.pageSize),
          total: filtered.length,
          page: params.page,
          pageSize: params.pageSize,
        };
      })
    );
  }

  getUserById(id: string): Observable<User | undefined> {
    return this.getAllUsers().pipe(
      map((users) => users.find((user) => user.id === Number(id)))
    );
  }

  private mapUser(item: UserApiItem): User {
    return {
      id: item.id,
      code: item.code || `#${String(item.id).padStart(3, '0')}`,
      name: item.name,
      email: item.email,
      phone: item.phone || '-',
      role: this.mapRole(item.role),
      status: this.mapStatus(item.status),
      fileUrl: item.fileUrl || null,
      fileKey: item.fileKey || null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapRole(role: string): UserRole {
    switch (role) {
      case 'Master':
      case 'Admin':
      case 'User':
        return role;
      default:
        return 'User';
    }
  }

  private mapStatus(status: string): UserStatus {
    switch (status) {
      case 'Active':
      case 'Pending':
      case 'Inactive':
        return status;
      default:
        return 'Inactive';
    }
  }
}
