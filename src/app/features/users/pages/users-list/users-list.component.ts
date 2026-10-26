import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { ToastService } from '@core/services/toast.service';
import { UsersService } from '../../services/users.service';
import { InfluencersService } from '../../services/influencers.service';
import { AdminInfluencer } from '../../models/influencer.model';
import {
  AdminUser,
  AdminUserBillingType,
  AdminUserProfileType,
  AdminUserStatus,
} from '../../models/user.model';
import {
  billingTypeOptions,
  booleanFilterOptions,
  getBillingTypeLabel,
  getCityDisplay,
  getStateDisplay,
  normalizeBillingTypeFilterValue,
  normalizeBooleanFilterValue,
  normalizeNumberFilterValue,
  normalizeTextFilterValue,
  profileTypeOptions,
  statusOptions,
} from '../../utils/user-display.utils';

interface IbgeCityResponse {
  nome: string;
}

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
    ErrorStateComponent,
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly usersService = inject(UsersService);
  private readonly toastService = inject(ToastService);
  private readonly influencersService = inject(InfluencersService);
  private readonly destroy$ = new Subject<void>();
  private cityRequestId = 0;
  private lastFilterPointerToggleAt = 0;

  readonly searchControl = new FormControl('');
  readonly billingTypeControl = new FormControl<Exclude<AdminUserBillingType, null> | ''>('');
  readonly statusControl = new FormControl<AdminUserStatus | ''>('');
  readonly profileTypeControl = new FormControl<Exclude<AdminUserProfileType, 'Unknown'> | ''>('');
  readonly cityControl = new FormControl('');
  readonly stateControl = new FormControl('');
  readonly referredByInfluencerIdControl = new FormControl<number | ''>('');
  readonly hasActiveServiceControl = new FormControl<'true' | 'false' | ''>('');
  readonly hasSubscriptionControl = new FormControl<'true' | 'false' | ''>('');
  readonly minSubscriptionAmountControl = new FormControl('');
  readonly maxSubscriptionAmountControl = new FormControl('');
  readonly users = signal<AdminUser[]>([]);
  /** Id em alternância, para desabilitar o item e evitar clique duplo. */
  readonly alternandoStatusDe = signal<number | null>(null);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly showAdvancedFilters = signal(false);
  readonly influencers = signal<AdminInfluencer[]>([]);
  readonly cityOptions = signal<string[]>([]);
  readonly isLoadingCities = signal(false);

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly billingTypeOptions = billingTypeOptions;
  readonly statusOptions = statusOptions;
  readonly profileTypeOptions = profileTypeOptions;
  readonly booleanFilterOptions = booleanFilterOptions;
  readonly getCityDisplay = getCityDisplay;
  readonly getStateDisplay = getStateDisplay;
  readonly stateOptions = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' },
  ];
  readonly paginationInfo = computed(() => {
    if (this.total() === 0) return '0 itens';
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(this.currentPage() * this.pageSize(), this.total());
    return `${start}-${end} de ${this.total()} itens`;
  });

  ngOnInit(): void {
    this.loadUsers();
    this.loadInfluencerOptions();
    this.registerFilterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.usersService
      .getUsers({
        take: this.pageSize(),
        skip: this.currentPage(),
        search: normalizeTextFilterValue(this.searchControl.value),
        status: this.statusControl.value || undefined,
        profileType: this.profileTypeControl.value || undefined,
        billingType: normalizeBillingTypeFilterValue(this.billingTypeControl.value),
        city: normalizeTextFilterValue(this.cityControl.value),
        state: this.getSelectedStateName(),
        referredByInfluencerId: this.referredByInfluencerIdControl.value || undefined,
        hasActiveService: normalizeBooleanFilterValue(this.hasActiveServiceControl.value),
        hasSubscription: normalizeBooleanFilterValue(this.hasSubscriptionControl.value),
        minSubscriptionAmount: normalizeNumberFilterValue(this.minSubscriptionAmountControl.value),
        maxSubscriptionAmount: normalizeNumberFilterValue(this.maxSubscriptionAmountControl.value),
      })
      .subscribe({
        next: (result) => {
          this.users.set(result.users);
          this.total.set(result.count);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.update((value) => !value);
  }

  toggleAdvancedFiltersFromPointer(event: PointerEvent): void {
    event.preventDefault();
    this.lastFilterPointerToggleAt = Date.now();
    this.toggleAdvancedFilters();
  }

  toggleAdvancedFiltersFromClick(): void {
    if (Date.now() - this.lastFilterPointerToggleAt < 400) {
      return;
    }

    this.toggleAdvancedFilters();
  }

  activeAdvancedFiltersCount(): number {
    return [
      this.statusControl.value,
      this.profileTypeControl.value,
      this.billingTypeControl.value,
      this.cityControl.value?.trim(),
      this.stateControl.value?.trim(),
      this.referredByInfluencerIdControl.value,
      this.hasActiveServiceControl.value,
      this.hasSubscriptionControl.value,
      this.minSubscriptionAmountControl.value?.trim(),
      this.maxSubscriptionAmountControl.value?.trim(),
    ].filter(Boolean).length;
  }

  clearAdvancedFilters(): void {
    this.statusControl.setValue('', { emitEvent: false });
    this.profileTypeControl.setValue('', { emitEvent: false });
    this.billingTypeControl.setValue('', { emitEvent: false });
    this.cityControl.setValue('', { emitEvent: false });
    this.cityOptions.set([]);
    this.isLoadingCities.set(false);
    this.stateControl.setValue('', { emitEvent: false });
    this.referredByInfluencerIdControl.setValue('', { emitEvent: false });
    this.hasActiveServiceControl.setValue('', { emitEvent: false });
    this.hasSubscriptionControl.setValue('', { emitEvent: false });
    this.minSubscriptionAmountControl.setValue('', { emitEvent: false });
    this.maxSubscriptionAmountControl.setValue('', { emitEvent: false });
    this.currentPage.set(1);
    this.loadUsers();
  }

  private getSelectedStateName(): string | undefined {
    const selectedState = normalizeTextFilterValue(this.stateControl.value);
    if (!selectedState) {
      return undefined;
    }

    return this.stateOptions.find((state) => state.value === selectedState)?.label ?? selectedState;
  }

  private registerFilterChanges(): void {
    merge(
      this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
      this.cityControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
      this.minSubscriptionAmountControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.maxSubscriptionAmountControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.statusControl.valueChanges.pipe(distinctUntilChanged()),
      this.profileTypeControl.valueChanges.pipe(distinctUntilChanged()),
      this.billingTypeControl.valueChanges.pipe(distinctUntilChanged()),
      this.stateControl.valueChanges.pipe(
        distinctUntilChanged(),
        tap((state) => {
          this.cityControl.setValue('', { emitEvent: false });
          void this.loadCityOptions(state || '');
        })
      ),
      this.referredByInfluencerIdControl.valueChanges.pipe(distinctUntilChanged()),
      this.hasActiveServiceControl.valueChanges.pipe(distinctUntilChanged()),
      this.hasSubscriptionControl.valueChanges.pipe(distinctUntilChanged())
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadUsers();
      });
  }

  private async loadCityOptions(state: string): Promise<void> {
    const requestId = ++this.cityRequestId;
    this.cityOptions.set([]);

    if (!state) {
      this.isLoadingCities.set(false);
      return;
    }

    this.isLoadingCities.set(true);

    try {
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${encodeURIComponent(
          state
        )}/municipios?orderBy=nome`
      );

      if (!response.ok) {
        throw new Error('Não foi possível carregar cidades.');
      }

      const cities = (await response.json()) as IbgeCityResponse[];

      if (requestId !== this.cityRequestId) {
        return;
      }

      this.cityOptions.set(cities.map((city) => city.nome).filter(Boolean));
    } catch {
      if (requestId === this.cityRequestId) {
        this.cityOptions.set([]);
      }
    } finally {
      if (requestId === this.cityRequestId) {
        this.isLoadingCities.set(false);
      }
    }
  }

  private loadInfluencerOptions(): void {
    this.influencersService
      .getInfluencers({ take: 100, skip: 1 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => this.influencers.set(result.influencers),
        error: () => this.influencers.set([]),
      });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  navigateToDetail(id: number): void {
    const selectedUser = this.users().find((user) => user.id === id);
    this.router.navigate(['/users', id], {
      state: selectedUser ? { user: selectedUser } : undefined,
    });
  }

  navigateToEdit(id: number): void {
    this.router.navigate(['/users', id, 'editar']);
  }

  /**
   * Alterna o status pelo servidor.
   *
   * A rota não recebe o destino — ela inverte o que está gravado. Por isso a
   * linha é atualizada com **o usuário devolvido**, e não com uma inversão
   * calculada aqui: se outra aba tiver mexido no mesmo registro, o que vale é
   * o que o servidor respondeu.
   */
  onToggleStatus(user: AdminUser): void {
    if (this.alternandoStatusDe() !== null) return;

    this.alternandoStatusDe.set(user.id);

    this.usersService.toggleUserStatus(user.id).subscribe({
      next: (atualizado) => {
        this.users.update((lista) =>
          lista.map((item) =>
            item.id === atualizado.id ? { ...item, status: atualizado.status } : item
          )
        );

        this.toastService.showSuccess(
          atualizado.status === 'Active' ? 'Usuário ativado.' : 'Usuário inativado.'
        );

        this.alternandoStatusDe.set(null);
      },
      error: () => {
        // O `errorInterceptor` já avisa; aqui basta liberar o botão.
        this.alternandoStatusDe.set(null);
      },
    });
  }

  /** Rótulo da ação, derivado do estado atual — nunca fixo. */
  rotuloDeStatus(user: AdminUser): string {
    return user.status === 'Active' ? 'Inativar' : 'Ativar';
  }

  goToCollaborators(): void {
    this.router.navigate(['/settings']);
  }

  goToInfluencers(): void {
    this.router.navigate(['/users/influencers']);
  }

  goToSuppliers(): void {
    this.router.navigate(['/suppliers']);
  }

  getBillingTypeLabel = getBillingTypeLabel;

  getStatusLabel(status: AdminUserStatus): string {
    switch (status) {
      case 'Active':
        return 'Ativo';
      case 'Pending':
        return 'Pendente';
      default:
        return 'Inativo';
    }
  }

  getStatusClass(status: AdminUserStatus): string {
    switch (status) {
      case 'Active':
        return 'badge-active';
      case 'Pending':
        return 'badge-pending';
      default:
        return 'badge-inactive';
    }
  }

  getProfileTypeLabel(profileType: AdminUserProfileType): string {
    switch (profileType) {
      case 'Client':
        return 'Cliente';
      case 'Supplier':
        return 'Fornecedor';
      case 'Influencer':
        return 'Influencer';
      case 'Partner':
        return 'Parceiro';
      case 'Delivery':
        return 'Entregador';
      default:
        return 'Não informado';
    }
  }
}
