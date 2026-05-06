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
import { SuppliersService } from '../../services/suppliers.service';
import { AdminProvider, AdminProviderStatus } from '../../models/supplier.model';

@Component({
  selector: 'app-suppliers-list',
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
  templateUrl: './suppliers-list.component.html',
  styleUrls: ['./suppliers-list.component.scss'],
})
export class SuppliersListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly suppliersService = inject(SuppliersService);
  private readonly destroy$ = new Subject<void>();

  readonly searchControl = new FormControl('');
  readonly suppliers = signal<AdminProvider[]>([]);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly paginationInfo = computed(() => {
    if (this.total() === 0) return '0 itens';
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(this.currentPage() * this.pageSize(), this.total());
    return `${start}-${end} de ${this.total()} itens`;
  });

  ngOnInit(): void {
    this.loadSuppliers();
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.currentPage.set(1); this.loadSuppliers(); });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadSuppliers(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.suppliersService.getSuppliers({
      take: this.pageSize(),
      skip: (this.currentPage() - 1) * this.pageSize(),
      search: this.searchControl.value ?? undefined,
    }).subscribe({
      next: (result) => {
        this.suppliers.set(result.providers);
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
    this.loadSuppliers();
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/suppliers', id]);
  }

  goToUsers(): void {
    this.router.navigate(['/users']);
  }

  goToInfluencers(): void {
    this.router.navigate(['/users/influencers']);
  }

  getStatusLabel(status: AdminProviderStatus): string {
    switch (status) {
      case 'Active': return 'Ativo';
      case 'Pending': return 'Pendente';
      default: return 'Inativo';
    }
  }

  getStatusClass(status: AdminProviderStatus): string {
    switch (status) {
      case 'Active': return 'badge-active';
      case 'Pending': return 'badge-pending';
      default: return 'badge-inactive';
    }
  }
}
