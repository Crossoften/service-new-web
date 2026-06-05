import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { FinanceService } from '../../services/finance.service';
import {
  CreatePlanPayload,
  FinanceServiceListItem,
  Plan,
  PlatformSettings,
  UpdatePlanPayload,
} from '../../models/finance.model';

type FeedbackModalState = {
  title: string;
  description: string;
  icon: string;
  variant: 'success';
};

@Component({
  selector: 'app-finance-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './finance-page.component.html',
  styleUrls: ['./finance-page.component.scss'],
})
export class FinancePageComponent implements OnInit, OnDestroy {
  private readonly modal = inject(NgbModal);
  private readonly fb = inject(FormBuilder);
  private readonly financeService = inject(FinanceService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('feedbackModalTpl') private feedbackModalTpl?: TemplateRef<unknown>;

  readonly platformSettings = signal<PlatformSettings | null>(null);
  readonly isLoadingPlatform = signal(false);
  readonly hasPlatformError = signal(false);
  readonly isSavingPlatform = signal(false);

  readonly financeServices = signal<FinanceServiceListItem[]>([]);
  readonly totalFinanceServices = signal(0);
  readonly financeServicesCurrentPage = signal(1);
  readonly financeServicesPageSize = signal(10);
  readonly isLoadingFinanceServices = signal(false);
  readonly hasFinanceServicesError = signal(false);
  readonly serviceSearchControl = new FormControl('', { nonNullable: true });
  readonly financeServicesTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalFinanceServices() / this.financeServicesPageSize()))
  );
  readonly financeServicesPaginationInfo = computed(() => {
    if (this.totalFinanceServices() === 0) {
      return '0 itens';
    }

    const start = (this.financeServicesCurrentPage() - 1) * this.financeServicesPageSize() + 1;
    const end = Math.min(
      this.financeServicesCurrentPage() * this.financeServicesPageSize(),
      this.totalFinanceServices()
    );

    return `${start}-${end} de ${this.totalFinanceServices()} itens`;
  });

  readonly plans = signal<Plan[]>([]);
  readonly totalPlans = signal(0);
  readonly isLoadingPlans = signal(false);
  readonly hasPlansError = signal(false);
  readonly isSavingPlan = signal(false);
  readonly isDeletingPlanId = signal<number | null>(null);
  readonly selectedPlan = signal<Plan | null>(null);
  readonly pendingPlanPayload = signal<CreatePlanPayload | null>(null);
  readonly planToDelete = signal<Plan | null>(null);
  readonly feedbackModal = signal<FeedbackModalState | null>(null);

  platformForm!: FormGroup;
  planForm!: FormGroup;
  private activeModalRef: NgbModalRef | null = null;
  private confirmationModalRef: NgbModalRef | null = null;
  private feedbackModalRef: NgbModalRef | null = null;

  ngOnInit(): void {
    this.loadPlatformSettings();
    this.loadPlans();
    this.loadFinanceServices();

    this.serviceSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.financeServicesCurrentPage.set(1);
        this.loadFinanceServices();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPlatformSettings(): void {
    this.isLoadingPlatform.set(true);
    this.hasPlatformError.set(false);

    this.financeService.getPlatformSettings().pipe(takeUntil(this.destroy$)).subscribe({
      next: (settings) => {
        this.platformSettings.set(settings);
        this.isLoadingPlatform.set(false);
      },
      error: () => {
        this.hasPlatformError.set(true);
        this.isLoadingPlatform.set(false);
      },
    });
  }

  loadPlans(): void {
    this.isLoadingPlans.set(true);
    this.hasPlansError.set(false);

    this.financeService
      .getPlans({ take: 50, skip: 1 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.plans.set(response.plans ?? []);
          this.totalPlans.set(response.totalRecords ?? response.plans?.length ?? 0);
          this.isLoadingPlans.set(false);
        },
        error: () => {
          this.hasPlansError.set(true);
          this.isLoadingPlans.set(false);
        },
      });
  }

  loadFinanceServices(): void {
    this.isLoadingFinanceServices.set(true);
    this.hasFinanceServicesError.set(false);

    const search = this.serviceSearchControl.value.trim();

    this.financeService
      .getFinanceServices({
        take: this.financeServicesPageSize(),
        skip: this.financeServicesCurrentPage(),
        ...(search ? { search } : {}),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.financeServices.set(response.services ?? []);
          this.totalFinanceServices.set(response.totalRecords ?? response.services?.length ?? 0);
          this.isLoadingFinanceServices.set(false);
        },
        error: () => {
          this.hasFinanceServicesError.set(true);
          this.isLoadingFinanceServices.set(false);
        },
      });
  }

  onFinanceServicesPageChange(page: number): void {
    if (page < 1 || page > this.financeServicesTotalPages()) {
      return;
    }

    this.financeServicesCurrentPage.set(page);
    this.loadFinanceServices();
  }

  openPlatformModal(templateRef: TemplateRef<unknown>): void {
    this.platformForm = this.fb.group({
      influencerCommissionRate: [
        this.platformSettings()?.influencerCommissionRate ?? 0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
    });

    this.activeModalRef = this.modal.open(templateRef, { centered: true, size: 'md' });
  }

  savePlatformSettings(): void {
    if (this.platformForm.invalid) {
      this.platformForm.markAllAsTouched();
      return;
    }

    this.isSavingPlatform.set(true);

    this.financeService
      .updatePlatformSettings({
        influencerCommissionRate: Number(this.platformForm.value.influencerCommissionRate),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.platformSettings.set(settings);
          this.isSavingPlatform.set(false);
          this.activeModalRef?.close();
          this.showFeedbackModal({
            title: 'Comissão atualizada',
            description: 'A comissão global de influenciadores foi salva com sucesso.',
            icon: 'bi-check2-circle',
            variant: 'success',
          });
        },
        error: () => this.isSavingPlatform.set(false),
      });
  }

  openCreatePlanModal(templateRef: TemplateRef<unknown>): void {
    this.selectedPlan.set(null);
    this.planForm = this.createPlanForm();
    this.activeModalRef = this.modal.open(templateRef, { centered: true, size: 'lg' });
  }

  openEditPlanModal(plan: Plan, templateRef: TemplateRef<unknown>): void {
    this.selectedPlan.set(plan);
    this.planForm = this.createPlanForm(plan);
    this.activeModalRef = this.modal.open(templateRef, { centered: true, size: 'lg' });
  }
  savePlan(confirmTemplateRef?: TemplateRef<unknown>): void {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    const selectedPlan = this.selectedPlan();
    const payload = this.buildPlanPayload();

    if (!selectedPlan) {
      this.pendingPlanPayload.set(payload as CreatePlanPayload);
      if (confirmTemplateRef) {
        this.confirmationModalRef = this.modal.open(confirmTemplateRef, {
          centered: true,
          size: 'md',
          backdrop: 'static',
        });
      }
      return;
    }

    this.isSavingPlan.set(true);
    this.financeService
      .updatePlan(selectedPlan.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSavingPlan.set(false);
          this.activeModalRef?.close();
          this.showFeedbackModal({
            title: 'Assinatura atualizada',
            description: 'As informações da assinatura foram salvas com sucesso.',
            icon: 'bi-check2-circle',
            variant: 'success',
          });
          this.loadPlans();
        },
        error: () => this.isSavingPlan.set(false),
      });
  }

  confirmCreatePlan(): void {
    const payload = this.pendingPlanPayload();
    if (!payload) {
      return;
    }

    this.isSavingPlan.set(true);
    this.financeService
      .createPlan(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSavingPlan.set(false);
          this.pendingPlanPayload.set(null);
          this.confirmationModalRef?.close();
          this.activeModalRef?.close();
          this.showFeedbackModal({
            title: 'Assinatura cadastrada',
            description: 'A nova assinatura foi cadastrada com sucesso.',
            icon: 'bi-check2-circle',
            variant: 'success',
          });
          this.loadPlans();
        },
        error: () => this.isSavingPlan.set(false),
      });
  }

  cancelCreatePlanConfirmation(): void {
    this.pendingPlanPayload.set(null);
    this.confirmationModalRef?.dismiss();
  }

  openDeletePlanModal(plan: Plan, templateRef: TemplateRef<unknown>): void {
    this.planToDelete.set(plan);
    this.confirmationModalRef = this.modal.open(templateRef, {
      centered: true,
      size: 'md',
      backdrop: 'static',
    });
  }

  confirmDeletePlan(): void {
    const plan = this.planToDelete();
    if (!plan) {
      return;
    }

    this.isDeletingPlanId.set(plan.id);
    this.financeService
      .deletePlan(plan.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isDeletingPlanId.set(null);
          this.planToDelete.set(null);
          this.confirmationModalRef?.close();
          this.showFeedbackModal({
            title: 'Assinatura removida',
            description: 'A assinatura selecionada foi removida com sucesso.',
            icon: 'bi-check2-circle',
            variant: 'success',
          });
          this.loadPlans();
        },
        error: () => this.isDeletingPlanId.set(null),
      });
  }

  cancelDeletePlanConfirmation(): void {
    this.planToDelete.set(null);
    this.confirmationModalRef?.dismiss();
  }

  dismissModal(): void {
    this.activeModalRef?.dismiss();
  }

  dismissFeedbackModal(): void {
    this.feedbackModalRef?.close();
    this.feedbackModal.set(null);
  }

  private showFeedbackModal(feedback: FeedbackModalState): void {
    this.feedbackModal.set(feedback);

    if (!this.feedbackModalTpl) {
      return;
    }

    this.feedbackModalRef = this.modal.open(this.feedbackModalTpl, {
      centered: true,
      size: 'md',
    });

    void this.feedbackModalRef.result.finally(() => this.feedbackModal.set(null));
  }

  formatPercent(value: number | null | undefined): string {
    if (value == null) {
      return 'N/D';
    }

    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'N/D';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'N/D';
    }

    return date.toLocaleString('pt-BR');
  }

  formatCurrency(value: string | number | null | undefined): string {
    if (value == null || value === '') {
      return 'N/D';
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return 'N/D';
    }

    return numericValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatInterval(plan: Plan): string {
    const intervalLabel = plan.interval === 'Year' ? 'ano' : 'mês';
    const count = plan.intervalCount || 1;
    const base = count === 1 ? `A cada ${intervalLabel}` : `A cada ${count} ${intervalLabel}s`;
    return plan.bonusMonths ? `${base} + ${plan.bonusMonths} mês(es) bônus` : base;
  }

  planStatusLabel(plan: Plan): string {
    return plan.isActive ? 'Ativo' : 'Inativo';
  }

  serviceStatusLabel(service: FinanceServiceListItem): string {
    return service.isActive ? 'Ativo' : 'Desativado';
  }

  financeServicesRangeLabel(): string {
    return this.financeServicesPaginationInfo();
  }

  formatPayloadInterval(payload: CreatePlanPayload | null): string {
    if (!payload) {
      return 'N/D';
    }

    const intervalLabel = payload.interval === 'Year' ? 'ano' : 'mês';
    const count = payload.intervalCount || 1;
    const base = count === 1 ? `A cada ${intervalLabel}` : `A cada ${count} ${intervalLabel}s`;
    return payload.bonusMonths ? `${base} + ${payload.bonusMonths} mês(es) bônus` : base;
  }

  private createPlanForm(plan?: Plan): FormGroup {
    return this.fb.group({
      name: [plan?.name ?? '', [Validators.required, Validators.maxLength(120)]],
      slug: [plan?.slug ?? '', [Validators.required, Validators.maxLength(120)]],
      description: [plan?.description ?? '', [Validators.maxLength(500)]],
      price: [plan ? Number(plan.price) : 0, [Validators.required, Validators.min(0)]],
      interval: [plan?.interval ?? 'Month', [Validators.required]],
      intervalCount: [plan?.intervalCount ?? 1, [Validators.required, Validators.min(1)]],
      bonusMonths: [plan?.bonusMonths ?? 0, [Validators.min(0)]],
      isActive: [plan?.isActive ?? true],
      sortOrder: [plan?.sortOrder ?? this.plans().length + 1, [Validators.min(0)]],
    });
  }

  private buildPlanPayload(): CreatePlanPayload | UpdatePlanPayload {
    const value = this.planForm.value;
    const description = String(value.description ?? '').trim();

    return {
      name: String(value.name ?? '').trim(),
      slug: String(value.slug ?? '').trim(),
      ...(description ? { description } : {}),
      price: Number(value.price),
      interval: value.interval,
      intervalCount: Number(value.intervalCount),
      bonusMonths: Number(value.bonusMonths ?? 0),
      isActive: Boolean(value.isActive),
      sortOrder: Number(value.sortOrder ?? 0),
    };
  }
}
