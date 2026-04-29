import { Component, OnInit, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { ToastService } from '@core/services/toast.service';
import { ServicesService } from '../../services/services.service';
import { AdminService, ServiceClientItem } from '../../models/service.model';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, SidebarComponent, LoadingSkeletonComponent],
  templateUrl: './service-detail.component.html',
  styleUrls: ['./service-detail.component.scss'],
})
export class ServiceDetailComponent implements OnInit {
  @Input() id!: string;

  private readonly router = inject(Router);
  private readonly servicesService = inject(ServicesService);
  private readonly toastService = inject(ToastService);

  readonly service = signal<AdminService | undefined>(undefined);
  readonly clients = signal<ServiceClientItem[]>([]);
  readonly clientsTotal = signal(0);
  readonly isLoading = signal(false);
  readonly isLoadingClients = signal(false);
  readonly currentPage = signal(1);
  readonly pageSize = 10;

  ngOnInit(): void {
    this.isLoading.set(true);
    this.servicesService.getServiceById(Number(this.id)).subscribe({
      next: (svc) => {
        this.service.set(svc);
        this.isLoading.set(false);
        this.loadClients();
      },
      error: () => {
        this.toastService.showError('Erro ao carregar serviço.');
        this.isLoading.set(false);
        this.router.navigate(['/services']);
      },
    });
  }

  loadClients(): void {
    this.isLoadingClients.set(true);
    this.servicesService.getServiceClients(Number(this.id), {
      take: this.pageSize,
      skip: this.currentPage(),
    }).subscribe({
      next: (res) => {
        this.clients.set(res.clients);
        this.clientsTotal.set(res.count);
        this.isLoadingClients.set(false);
      },
      error: () => this.isLoadingClients.set(false),
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadClients();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.clientsTotal() / this.pageSize));
  }

  get paginationInfo(): string {
    const total = this.clientsTotal();
    if (total === 0) return '0 itens';
    const start = (this.currentPage() - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage() * this.pageSize, total);
    return `${start}-${end} de ${total} itens`;
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDate(str: string): string {
    if (!str) return '-';
    const [y, m, d] = str.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'Active': return 'Ativo';
      case 'Pending': return 'Pendente';
      default: return 'Inativo';
    }
  }

  onBack(): void {
    this.router.navigate(['/services']);
  }
}
