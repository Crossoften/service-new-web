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
import { UsersService } from '../../services/users.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbDropdownModule,
    SidebarComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly usersService = inject(UsersService);
  private readonly destroy$ = new Subject<void>();

  readonly searchControl = new FormControl('');

  readonly users = signal<User[]>([]);
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
    this.loadUsers();
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadUsers();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.usersService
      .getUsers({
        page: this.currentPage(),
        pageSize: this.pageSize(),
        search: this.searchControl.value ?? '',
      })
      .subscribe({
        next: (result) => {
          this.users.set(result.data);
          this.total.set(result.total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  navigateToDetail(id: string): void {
    this.router.navigate(['/users', id]);
  }

  goToInfluencers(): void {
    this.router.navigate(['/users/influencers']);
  }
}
