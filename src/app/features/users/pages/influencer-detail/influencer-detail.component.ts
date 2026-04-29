import { Component, OnInit, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { ToastService } from '@core/services/toast.service';
import { InfluencersService } from '../../services/influencers.service';
import { AdminInfluencer } from '../../models/influencer.model';

@Component({
  selector: 'app-influencer-detail',
  standalone: true,
  imports: [CommonModule, SidebarComponent, LoadingSkeletonComponent],
  templateUrl: './influencer-detail.component.html',
  styleUrls: ['./influencer-detail.component.scss'],
})
export class InfluencerDetailComponent implements OnInit {
  @Input() id!: string;

  private readonly router = inject(Router);
  private readonly influencersService = inject(InfluencersService);
  private readonly toastService = inject(ToastService);

  readonly influencer = signal<AdminInfluencer | undefined>(undefined);
  readonly isLoading = signal(false);

  ngOnInit(): void {
    this.isLoading.set(true);
    this.influencersService.getInfluencerById(Number(this.id)).subscribe({
      next: (inf) => {
        this.influencer.set(inf);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.showError('Erro ao carregar influencer.');
        this.isLoading.set(false);
        this.router.navigate(['/users/influencers']);
      },
    });
  }

  get avatarInitials(): string {
    return (this.influencer()?.name ?? '')
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  formatCurrency(value: number | null): string {
    if (value == null) return 'N/D';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'Active': return 'Ativo';
      case 'Pending': return 'Pendente';
      default: return 'Inativo';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'badge-active';
      case 'Pending': return 'badge-pending';
      default: return 'badge-inactive';
    }
  }

  onBack(): void {
    this.router.navigate(['/users/influencers']);
  }
}
