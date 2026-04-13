import { Component, OnInit, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { ToastService } from '@core/services/toast.service';
import { ServicesService } from '../../services/services.service';
import { Service } from '../../models/service.model';

interface Booking {
  id: string;
  date: string;
  client: string;
  value: number;
  rating: number;
}

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

  readonly service = signal<Service | undefined>(undefined);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);

  readonly bookings = signal<Booking[]>([]);
  readonly totalBookings = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = 8;

  ngOnInit(): void {
    this.isLoading.set(true);
    this.servicesService.getServices({ page: 1, pageSize: 100, search: '' }).subscribe({
      next: (result) => {
        const found = result.data.find((s) => s.id === this.id);
        if (!found) {
          this.toastService.showError('Serviço não encontrado.');
          this.router.navigate(['/services']);
          return;
        }
        this.service.set(found);
        this.generateBookings(found);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.showError('Erro ao carregar serviço.');
        this.isLoading.set(false);
      },
    });
  }

  private generateBookings(service: Service): void {
    const clients = ['Ana Silva', 'Carlos Souza', 'Maria Oliveira', 'Pedro Santos', 'Juliana Costa', 'Roberto Lima', 'Sandra Vieira', 'Felipe Gomes'];
    const all: Booking[] = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(2024, i % 12, (i * 3 + 1) % 28 + 1);
      return {
        id: `bk-${service.id}-${i}`,
        date: d.toISOString().slice(0, 10),
        client: clients[i % clients.length],
        value: service.price * (0.9 + Math.random() * 0.2),
        rating: Math.floor(Math.random() * 3) + 3,
      };
    });
    this.bookings.set(all.slice(0, this.pageSize));
    this.totalBookings.set(all.length);
  }

  get paginationInfo(): string {
    const total = this.totalBookings();
    if (total === 0) return '0 itens';
    const start = (this.currentPage() - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage() * this.pageSize, total);
    return `${start}-${end} de ${total} itens`;
  }

  get totalPages(): number {
    return Math.ceil(this.totalBookings() / this.pageSize);
  }

  formatDate(str: string): string {
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  renderStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  onSave(): void {
    this.isSaving.set(true);
    setTimeout(() => {
      this.toastService.showSuccess('Serviço atualizado com sucesso.');
      this.isSaving.set(false);
    }, 700);
  }

  onCancel(): void {
    this.router.navigate(['/services']);
  }
}
