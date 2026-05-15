import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { ToastService } from '@core/services/toast.service';
import { UsersService } from '../../services/users.service';
import { AdminUser, AdminUserProfileType, AdminUserStatus } from '../../models/user.model';

type UserStatus = AdminUserStatus;

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, SidebarComponent, LoadingSkeletonComponent],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
})
export class UserDetailComponent implements OnInit {
  @Input() id!: string;

  private readonly router = inject(Router);
  private readonly usersService = inject(UsersService);
  private readonly toastService = inject(ToastService);

  readonly user = signal<AdminUser | undefined>(undefined);
  readonly isLoading = signal(false);

  ngOnInit(): void {
    const navigationState = history.state as { user?: AdminUser };
    if (navigationState.user?.id === Number(this.id)) {
      this.user.set(navigationState.user);
    }

    this.isLoading.set(true);
    this.usersService.getUserById(Number(this.id)).subscribe({
      next: (loadedUser) => {
        this.user.set(this.mergeWithExistingUser(loadedUser));
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.showError('Erro ao carregar usuario.');
        this.isLoading.set(false);
      },
    });
  }

  private mergeWithExistingUser(loadedUser: AdminUser): AdminUser {
    const existingUser = this.user();

    if (!existingUser) {
      return loadedUser;
    }

    return {
      ...loadedUser,
      profileType:
        loadedUser.profileType !== 'Unknown'
          ? loadedUser.profileType
          : existingUser.profileType,
      birthDate: loadedUser.birthDate ?? existingUser.birthDate,
    };
  }

  get avatarInitials(): string {
    const name = this.user()?.name ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  getStatusLabel(status: UserStatus): string {
    switch (status) {
      case 'Active':
        return 'Ativo';
      case 'Pending':
        return 'Pendente';
      default:
        return 'Inativo';
    }
  }

  getProfileTypeLabel(profileType: AdminUserProfileType | undefined): string {
    switch (profileType) {
      case 'Client':
        return 'Cliente';
      case 'Supplier':
        return 'Fornecedor';
      case 'Influencer':
        return 'Influencer';
      case 'Partner':
        return 'Parceiro';
      case 'Delivery':
        return 'Entregador';
      default:
        return 'N/D';
    }
  }

  formatBirthDate(value: string | null | undefined): string {
    if (!value) {
      return 'N/D';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'N/D';
    }

    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  onBack(): void {
    this.router.navigate(['/users']);
  }
}
