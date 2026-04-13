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
import { SuppliersService } from '../../services/suppliers.service';
import { Supplier } from '../../models/supplier.model';

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
  ],
  templateUrl: './suppliers-list.component.html',
  styleUrls: ['./suppliers-list.component.scss'],
})
export class SuppliersListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly suppliersService = inject(SuppliersService);
  private readonly destroy$ = new Subject<void>();

  readonly searchControl = new FormControl('');
  readonly suppliers = signal<Supplier[]>([]);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly isLoading = signal(false);

  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));
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
    this.suppliersService.getSuppliers({
      page: this.currentPage(),
      pageSize: this.pageSize(),
      search: this.searchControl.value ?? '',
    }).subscribe({
      next: (result) => {
        this.suppliers.set(result.data);
        this.total.set(result.total);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadSuppliers();
  }

  navigateToDetail(id: string): void {
    this.router.navigate(['/suppliers', id]);
  }
}
