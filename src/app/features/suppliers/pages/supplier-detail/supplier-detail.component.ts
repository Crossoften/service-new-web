import { Component, OnInit, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { ToastService } from '@core/services/toast.service';
import { SuppliersService } from '../../services/suppliers.service';
import { AdminProvider, ProviderServiceHistoryItem } from '../../models/supplier.model';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [CommonModule, SidebarComponent, LoadingSkeletonComponent],
  templateUrl: './supplier-detail.component.html',
  styleUrls: ['./supplier-detail.component.scss'],
})
export class SupplierDetailComponent implements OnInit {
  @Input() id!: string;

  private readonly router = inject(Router);
  private readonly suppliersService = inject(SuppliersService);
  private readonly toastService = inject(ToastService);

  readonly supplier = signal<AdminProvider | undefined>(undefined);
  readonly history = signal<ProviderServiceHistoryItem[]>([]);
  readonly historyTotal = signal(0);
  readonly isLoading = signal(false);
  readonly isLoadingHistory = signal(false);
  readonly currentPage = signal(1);
  readonly pageSize = 10;

  ngOnInit(): void {
    this.isLoading.set(true);
    this.suppliersService.getSupplierById(Number(this.id)).subscribe({
      next: (sup) => {
        this.supplier.set(sup);
        this.isLoading.set(false);
        this.loadHistory();
      },
      error: () => {
        this.toastService.showError('Erro ao carregar fornecedor.');
        this.isLoading.set(false);
        this.router.navigate(['/suppliers']);
      },
    });
  }

  loadHistory(): void {
    this.isLoadingHistory.set(true);
    this.suppliersService.getSupplierHistory(Number(this.id), {
      take: this.pageSize,
      skip: this.currentPage(),
    }).subscribe({
      next: (res) => {
        this.history.set(res.history);
        this.historyTotal.set(res.count);
        this.isLoadingHistory.set(false);
      },
      error: () => this.isLoadingHistory.set(false),
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadHistory();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.historyTotal() / this.pageSize));
  }

  get avatarInitials(): string {
    return (this.supplier()?.name ?? '')
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  formatCurrency(value: number): string {
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
    this.router.navigate(['/suppliers']);
  }
}
