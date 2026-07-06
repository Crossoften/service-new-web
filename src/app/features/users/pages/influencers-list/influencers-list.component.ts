import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { InfluencersService } from '../../services/influencers.service';
import { AdminInfluencer, AdminInfluencerStatus } from '../../models/influencer.model';

@Component({
  selector: 'app-influencers-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbDropdownModule,
    SidebarComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './influencers-list.component.html',
  styleUrls: ['./influencers-list.component.scss'],
})
export class InfluencersListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly influencersService = inject(InfluencersService);
  private readonly destroy$ = new Subject<void>();
  private lastFilterPointerToggleAt = 0;

  readonly searchControl = new FormControl('');
  readonly statusControl = new FormControl<AdminInfluencerStatus | ''>('');
  readonly influencers = signal<AdminInfluencer[]>([]);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly showFilters = signal(false);
  readonly statusOptions: Array<{ label: string; value: AdminInfluencerStatus | '' }> = [
    { label: 'Todos os status', value: '' },
    { label: 'Ativos', value: 'Active' },
    { label: 'Pendentes', value: 'Pending' },
    { label: 'Inativos', value: 'Inactive' },
  ];

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly paginationInfo = computed(() => {
    if (this.total() === 0) return '0 itens';
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(this.currentPage() * this.pageSize(), this.total());
    return `${start}-${end} de ${this.total()} itens`;
  });

  ngOnInit(): void {
    this.loadInfluencers();
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadInfluencers();
      });

    this.statusControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.currentPage.set(1);
      this.loadInfluencers();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInfluencers(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.influencersService
      .getInfluencers({
        take: this.pageSize(),
        skip: this.currentPage(),
        search: this.searchControl.value ?? undefined,
        status: this.statusControl.value || undefined,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      })
      .subscribe({
        next: (result) => {
          this.influencers.set(result.influencers);
          this.total.set(result.count);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadInfluencers();
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/users/influencers', id]);
  }

  goToUsers(): void {
    this.router.navigate(['/users']);
  }

  goToSuppliers(): void {
    this.router.navigate(['/suppliers']);
  }

  toggleFilters(): void {
    this.showFilters.update((isOpen) => !isOpen);
  }

  toggleFiltersFromPointer(event: PointerEvent): void {
    event.preventDefault();
    this.lastFilterPointerToggleAt = Date.now();
    this.toggleFilters();
  }

  toggleFiltersFromClick(): void {
    if (Date.now() - this.lastFilterPointerToggleAt < 400) {
      return;
    }

    this.toggleFilters();
  }

  clearFilters(): void {
    this.statusControl.setValue('');
  }

  getStatusLabel(status: AdminInfluencerStatus): string {
    switch (status) {
      case 'Active':
        return 'Ativo';
      case 'Pending':
        return 'Pendente';
      default:
        return 'Inativo';
    }
  }

  getCommissionLabel(inf: AdminInfluencer): string {
    if (inf.commissionRate != null) {
      return `${inf.commissionRate.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
    }

    if (inf.effectiveCommissionRate != null) {
      return `${inf.effectiveCommissionRate.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
    }

    return 'Taxa global';
  }

  getStatusClass(status: AdminInfluencerStatus): string {
    switch (status) {
      case 'Active':
        return 'badge-active';
      case 'Pending':
        return 'badge-pending';
      default:
        return 'badge-inactive';
    }
  }
}
