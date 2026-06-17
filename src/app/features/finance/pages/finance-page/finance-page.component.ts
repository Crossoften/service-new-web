import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { FinanceService } from '../../services/finance.service';
import {
  CreatePlanPayload,
  FinanceInfluencerCommission,
  Plan,
  PlatformSettings,
  ServiceCategoryFinance,
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

  readonly serviceCategories = signal<ServiceCategoryFinance[]>([]);
  readonly isLoadingServiceCategories = signal(false);
  readonly hasServiceCategoriesError = signal(false);
  readonly selectedServiceCategory = signal<ServiceCategoryFinance | null>(null);
  readonly isSavingServiceCategory = signal(false);

  readonly partnerCommissions = signal<FinanceInfluencerCommission[]>([]);
  readonly isLoadingPartnerCommissions = signal(false);
  readonly hasPartnerCommissionsError = signal(false);
  readonly selectedPartnerCommission = signal<FinanceInfluencerCommission | null>(null);
  readonly isSavingPartnerCommission = signal(false);

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
  serviceCategoryRateForm!: FormGroup;
  partnerCommissionForm!: FormGroup;
  planForm!: FormGroup;
  private activeModalRef: NgbModalRef | null = null;
  private confirmationModalRef: NgbModalRef | null = null;
  private feedbackModalRef: NgbModalRef | null = null;

  ngOnInit(): void {
    this.loadPlatformSettings();
    this.loadPlans();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPlatformSettings(): void {
    this.isLoadingPlatform.set(true);
    this.hasPlatformError.set(false);

    this.financeService
      .getPlatformSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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

  openPlatformModal(templateRef: TemplateRef<unknown>): void {
    this.platformForm = this.fb.group({
      influencerCommissionRate: [
        this.platformSettings()?.influencerCommissionRate ?? 0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
    });

    this.activeModalRef = this.modal.open(templateRef, { centered: true, size: 'md' });
  }

  openProviderPercentageModal(templateRef: TemplateRef<unknown>): void {
    this.selectedServiceCategory.set(null);
    this.loadServiceCategories();
    this.activeModalRef = this.modal.open(templateRef, { centered: true, size: 'lg' });
  }

  loadServiceCategories(): void {
    this.isLoadingServiceCategories.set(true);
    this.hasServiceCategoriesError.set(false);

    this.financeService
      .getServiceCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.serviceCategories.set(categories ?? []);
          this.isLoadingServiceCategories.set(false);
        },
        error: () => {
          this.hasServiceCategoriesError.set(true);
          this.isLoadingServiceCategories.set(false);
        },
      });
  }

  selectServiceCategory(category: ServiceCategoryFinance): void {
    this.selectedServiceCategory.set(category);
    this.serviceCategoryRateForm = this.fb.group({
      platformFeeRate: [
        category.platformFeeRate,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
    });
  }

  saveServiceCategoryRate(): void {
    const category = this.selectedServiceCategory();
    if (!category) {
      return;
    }

    if (this.serviceCategoryRateForm.invalid) {
      this.serviceCategoryRateForm.markAllAsTouched();
      return;
    }

    this.isSavingServiceCategory.set(true);
    this.financeService
      .updateServiceCategoryPlatformFeeRate(category.id, {
        platformFeeRate: Number(this.serviceCategoryRateForm.value.platformFeeRate),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedCategory) => {
          this.serviceCategories.update((categories) =>
            categories.map((item) => (item.id === updatedCategory.id ? updatedCategory : item))
          );
          this.selectedServiceCategory.set(updatedCategory);
          this.isSavingServiceCategory.set(false);
          this.showFeedbackModal({
            title: 'Porcentagem atualizada',
            description: 'A taxa da plataforma para esta categoria foi salva com sucesso.',
            icon: 'bi-check2-circle',
            variant: 'success',
          });
        },
        error: () => this.isSavingServiceCategory.set(false),
      });
  }

  openPartnerCommissionModal(templateRef: TemplateRef<unknown>): void {
    this.selectedPartnerCommission.set(null);
    this.loadPartnerCommissions();
    this.activeModalRef = this.modal.open(templateRef, { centered: true, size: 'lg' });
  }

  loadPartnerCommissions(): void {
    this.isLoadingPartnerCommissions.set(true);
    this.hasPartnerCommissionsError.set(false);

    this.financeService
      .getInfluencerCommissions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (partners) => {
          this.partnerCommissions.set(partners ?? []);
          this.isLoadingPartnerCommissions.set(false);
        },
        error: () => {
          this.hasPartnerCommissionsError.set(true);
          this.isLoadingPartnerCommissions.set(false);
        },
      });
  }

  selectPartnerCommission(partner: FinanceInfluencerCommission): void {
    this.selectedPartnerCommission.set(partner);
    this.partnerCommissionForm = this.fb.group({
      commissionRate: [
        partner.commissionRate ?? partner.effectiveCommissionRate ?? 0,
        [Validators.min(0), Validators.max(100)],
      ],
      useGlobalRate: [partner.commissionRate == null],
    });
  }

  savePartnerCommission(): void {
    const partner = this.selectedPartnerCommission();
    if (!partner) {
      return;
    }

    if (this.partnerCommissionForm.invalid) {
      this.partnerCommissionForm.markAllAsTouched();
      return;
    }

    const useGlobalRate = Boolean(this.partnerCommissionForm.value.useGlobalRate);
    const commissionRateValue = Number(this.partnerCommissionForm.value.commissionRate);
    const commissionRate = useGlobalRate ? null : String(commissionRateValue);

    this.isSavingPartnerCommission.set(true);
    this.financeService
      .updateInfluencerCommission(partner.id, { commissionRate })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const updatedPartner: FinanceInfluencerCommission = {
            ...partner,
            commissionRate: useGlobalRate ? null : commissionRateValue,
            effectiveCommissionRate: useGlobalRate
              ? partner.effectiveCommissionRate
              : commissionRateValue,
          };
          this.partnerCommissions.update((partners) =>
            partners.map((item) => (item.id === partner.id ? updatedPartner : item))
          );
          this.selectedPartnerCommission.set(updatedPartner);
          this.isSavingPartnerCommission.set(false);
          this.showFeedbackModal({
            title: 'Comissão atualizada',
            description: 'A comissão do parceiro foi salva com sucesso.',
            icon: 'bi-check2-circle',
            variant: 'success',
          });
        },
        error: () => this.isSavingPartnerCommission.set(false),
      });
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

  formatProviderRate(category: ServiceCategoryFinance): string {
    return this.formatPercent(100 - Number(category.platformFeeRate ?? 0));
  }

  partnerCommissionLabel(partner: FinanceInfluencerCommission): string {
    if (partner.commissionRate != null) {
      return `${this.formatPercent(partner.commissionRate)} exclusiva`;
    }

    if (partner.effectiveCommissionRate != null) {
      return `${this.formatPercent(partner.effectiveCommissionRate)} global`;
    }

    return 'Taxa global';
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
