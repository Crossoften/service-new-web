import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { ToastService } from '@core/services/toast.service';
import { UsersService } from '../../services/users.service';
import { AdminUser, AdminUserProfileType, AdminUserStatus } from '../../models/user.model';
import {
  formatFollowers,
  formatFullAddress,
  formatLocation,
  getBillingTypeLabel,
  getSocialNetworkLabel,
} from '../../utils/user-display.utils';

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
  readonly isTogglingStatus = signal(false);

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
        this.toastService.showError('Erro ao carregar usuário.');
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
        loadedUser.profileType !== 'Unknown' ? loadedUser.profileType : existingUser.profileType,
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
        return 'Não informado';
    }
  }

  formatBirthDate(value: string | null | undefined): string {
    if (!value) {
      return 'Não informado';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Não informado';
    }

    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  getBillingTypeLabel = getBillingTypeLabel;
  getSocialNetworkLabel = getSocialNetworkLabel;
  formatFollowers = formatFollowers;
  formatFullAddress = formatFullAddress;
  formatLocation = formatLocation;

  onBack(): void {
    this.router.navigate(['/users']);
  }

  onEdit(): void {
    this.router.navigate(['/users', this.id, 'editar']);
  }

  /** Rótulo derivado do estado carregado — a rota do back-end é um alternador. */
  rotuloDeStatus(): string {
    return this.user()?.status === 'Active' ? 'INATIVAR' : 'ATIVAR';
  }

  /**
   * O servidor decide o destino; a tela exibe o que ele devolveu.
   *
   * Inverter o status localmente pareceria equivalente e não é: se o registro
   * tiver mudado por outra via, a tela passaria a mostrar o oposto do que está
   * gravado, sem nada indicar o desencontro.
   */
  onToggleStatus(): void {
    const atual = this.user();

    if (!atual || this.isTogglingStatus()) return;

    this.isTogglingStatus.set(true);

    this.usersService.toggleUserStatus(atual.id).subscribe({
      next: (atualizado) => {
        this.user.set({ ...atual, status: atualizado.status });

        this.toastService.showSuccess(
          atualizado.status === 'Active' ? 'Usuário ativado.' : 'Usuário inativado.'
        );

        this.isTogglingStatus.set(false);
      },
      error: () => {
        // O `errorInterceptor` já exibe a mensagem.
        this.isTogglingStatus.set(false);
      },
    });
  }
}
