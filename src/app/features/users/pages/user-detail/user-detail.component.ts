import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { ToastService } from '@core/services/toast.service';
import { UsersService } from '../../services/users.service';
import { User, UserStatus } from '../../models/user.model';

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

  readonly user = signal<User | undefined>(undefined);
  readonly isLoading = signal(false);
  readonly missingEndpoints = [
    'GET /v1/users/{id} ou endpoint equivalente para consulta individual autenticada em producao.',
    'GET /v1/users ou endpoint equivalente para substituir o uso de /v1/no-auth/users fora do ambiente DEV.',
    'PATCH /v1/users/{id} ou endpoint equivalente para atualizar cadastro e status.',
  ];

  ngOnInit(): void {
    this.isLoading.set(true);
    this.usersService.getUserById(this.id).subscribe({
      next: (user) => {
        if (!user) {
          this.toastService.showError('Usuario nao encontrado.');
          this.router.navigate(['/users']);
          return;
        }

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
