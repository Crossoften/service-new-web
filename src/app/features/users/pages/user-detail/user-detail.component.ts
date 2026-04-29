import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { ToastService } from '@core/services/toast.service';
import { UsersService } from '../../services/users.service';
import { AdminUser, AdminUserStatus } from '../../models/user.model';

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
    this.isLoading.set(true);
    this.usersService.getUserById(Number(this.id)).subscribe({
      next: (user) => {
        this.user.set(user);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.showError('Erro ao carregar usuario.');
        this.isLoading.set(false);
      },
    });
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

  onBack(): void {
    this.router.navigate(['/users']);
  }
}
