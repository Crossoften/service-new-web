import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { Collaborator, CollaboratorStatus } from '../../models/collaborator.model';
import { CollaboratorsService } from '../../services/collaborators.service';

@Component({
  selector: 'app-collaborators-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbDropdownModule,
    SidebarComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
  ],
  templateUrl: './collaborators-list.component.html',
  styleUrls: ['./collaborators-list.component.scss'],
})
export class CollaboratorsListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly collaboratorsService = inject(CollaboratorsService);
  private readonly destroy$ = new Subject<void>();

  readonly searchControl = new FormControl('');
  readonly collaborators = signal<Collaborator[]>([]);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly isLoading = signal(false);

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly paginationInfo = computed(() => {
    if (this.total() === 0) return '0 itens';
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(this.currentPage() * this.pageSize(), this.total());
    return `${start}-${end} de ${this.total()} itens`;
  });

  ngOnInit(): void {
    this.loadCollaborators();
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadCollaborators();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCollaborators(): void {
    this.isLoading.set(true);
    this.collaboratorsService
      .getCollaborators({
        page: this.currentPage(),
        pageSize: this.pageSize(),
        search: this.searchControl.value ?? '',
      })
      .subscribe({
        next: (result) => {
          this.collaborators.set(result.data);
          this.total.set(result.total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadCollaborators();
  }

  addCollaborator(): void {
    this.router.navigate(['/settings/new']);
  }

  openApiTools(): void {
    this.router.navigate(['/settings/api']);
  }

  editCollaborator(id: number): void {
    this.router.navigate(['/settings', id]);
  }

  getStatusLabel(status: CollaboratorStatus): string {
    switch (status) {
      case 'Active':
        return 'Ativo';
      case 'Pending':
        return 'Pendente';
      default:
        return 'Inativo';
    }
  }

  getStatusClass(status: CollaboratorStatus): string {
    return status.toLowerCase();
  }
}
