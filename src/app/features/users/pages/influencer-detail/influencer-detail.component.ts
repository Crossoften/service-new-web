import { Component, OnInit, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { ToastService } from '@core/services/toast.service';
import { InfluencersService } from '../../services/influencers.service';
import { AdminInfluencer, AdminInfluencerReferral } from '../../models/influencer.model';
import { formatFollowers, getSocialNetworkLabel } from '../../utils/user-display.utils';

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
  readonly referrals = signal<AdminInfluencerReferral[]>([]);
  readonly isLoading = signal(false);
  readonly isLoadingReferrals = signal(false);
  readonly hasReferralsError = signal(false);

  ngOnInit(): void {
    this.isLoading.set(true);
    this.influencersService.getInfluencerById(Number(this.id)).subscribe({
      next: (inf) => {
        this.influencer.set(inf);
        this.isLoading.set(false);
        this.loadReferrals(inf.id);
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
    if (value == null) return 'Não informado';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatCount(value: number | null): string {
    return value == null ? 'Não informado' : String(value);
  }

  formatLocation(referral: AdminInfluencerReferral): string {
    return [referral.city, referral.state].filter(Boolean).join(' / ') || 'Não informada';
  }

  formatDate(value: string | null): string {
    if (!value) return 'Não informado';

    return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
  }

  formatPercent(value: number | null | undefined): string {
    if (value == null) return 'Não informado';
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  }

  getCommissionLabel(influencer: AdminInfluencer): string {
    if (influencer.commissionRate != null) {
      return `${this.formatPercent(influencer.commissionRate)} exclusiva`;
    }

    if (influencer.effectiveCommissionRate != null) {
      return `${this.formatPercent(influencer.effectiveCommissionRate)} global`;
    }

    return 'Comissão global';
  }

  getCommissionHelp(influencer: AdminInfluencer): string {
    if (influencer.commissionRate != null) {
      return 'Este influencer possui uma comissão própria, diferente da comissão global da plataforma.';
    }

    return 'Este influencer usa a comissão global configurada no financeiro da plataforma.';
  }

  getSocialNetworkLabel = getSocialNetworkLabel;
  formatFollowers = formatFollowers;

  getReferralBillingTypeLabel(billingType: string | null): string {
    switch (billingType) {
      case 'Subscription':
        return 'Assinatura';
      case 'Commission':
        return 'Comissão';
      case 'None':
        return 'Não definido';
      default:
        return 'Não paga';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'Active':
        return 'Ativo';
      case 'Pending':
        return 'Pendente';
      default:
        return 'Inativo';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'badge-active';
      case 'Pending':
        return 'badge-pending';
      default:
        return 'badge-inactive';
    }
  }

  onBack(): void {
    this.router.navigate(['/users/influencers']);
  }

  private loadReferrals(influencerId: number): void {
    this.isLoadingReferrals.set(true);
    this.hasReferralsError.set(false);

    this.influencersService.getInfluencerReferrals(influencerId).subscribe({
      next: (referrals) => {
        this.referrals.set(referrals);
        this.isLoadingReferrals.set(false);
      },
      error: () => {
        this.hasReferralsError.set(true);
        this.isLoadingReferrals.set(false);
      },
    });
  }
}
