import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  PlanInterval,
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

type PlanSegmentMode = 'all' | 'specific';

type PlatformForm = FormGroup<{
  influencerCommissionRate: FormControl<number | null>;
}>;

type ServiceCategoryRateForm = FormGroup<{
  platformFeeRate: FormControl<number | null>;
}>;

type PartnerCommissionForm = FormGroup<{
  commissionRate: FormControl<number | null>;
  useGlobalRate: FormControl<boolean | null>;
}>;

type PlanForm = FormGroup<{
  name: FormControl<string | null>;
  slug: FormControl<string | null>;
  description: FormControl<string | null>;
  price: FormControl<number | null>;
  interval: FormControl<'Month' | 'Year' | null>;
  bonusMonths: FormControl<number | null>;
  categoryId: FormControl<number | null>;
  isActive: FormControl<boolean | null>;
  sortOrder: FormControl<number | null>;
}>;

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
  private readonly financeService = inject(FinanceService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('feedbackModalTpl') private feedbackModalTpl?: TemplateRef<unknown>;

  readonly platformSettings = signal<PlatformSettings | null>(null);
  readonly isLoadingPlatform = signal(false);
  readonly hasPlatformError = signal(false);
  readonly isSavingPlatform = signal(false);

  readonly serviceCategories = signal<ServiceCategoryFinance[]>([]);
  readonly planCategorySearch = signal('');
  readonly planSegmentMode = signal<PlanSegmentMode>('all');
  readonly filteredPlanCategories = computed(() => {
    const term = this.normalizeSearch(this.planCategorySearch());
    if (!term) {
      return this.serviceCategories();
    }

    return this.serviceCategories().filter((category) =>
      this.normalizeSearch(category.name).includes(term)
    );
  });
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

  platformForm!: PlatformForm;
  serviceCategoryRateForm!: ServiceCategoryRateForm;
  partnerCommissionForm!: PartnerCommissionForm;
  planForm!: PlanForm;
  private activeModalRef: NgbModalRef | null = null;
  private confirmationModalRef: NgbModalRef | null = null;
  private feedbackModalRef: NgbModalRef | null = null;

  ngOnInit(): void {
    this.loadPlatformSettings();
    this.loadServiceCategories();
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
    this.platformForm = new FormGroup({
      influencerCommissionRate: new FormControl(
        this.platformSettings()?.influencerCommissionRate ?? 0,
        [Validators.required, Validators.min(0), Validators.max(100)]
      ),
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
    this.serviceCategoryRateForm = new FormGroup({
      platformFeeRate: new FormControl(category.platformFeeRate, [
        Validators.required,
        Validators.min(0),
        Validators.max(100),
      ]),
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
        platformFeeRate: Number(this.serviceCategoryRateForm.controls.platformFeeRate.value),
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
    this.partnerCommissionForm = new FormGroup({
      commissionRate: new FormControl(
        partner.commissionRate ?? partner.effectiveCommissionRate ?? 0,
        [Validators.min(0), Validators.max(100)]
      ),
      useGlobalRate: new FormControl(partner.commissionRate == null),
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

    const useGlobalRate = Boolean(this.partnerCommissionForm.controls.useGlobalRate.value);
    const commissionRateValue = Number(this.partnerCommissionForm.controls.commissionRate.value);
    const commissionRate = useGlobalRate ? null : commissionRateValue;

    this.isSavingPartnerCommission.set(true);
    this.financeService
      .updateInfluencerCommission(partner.id, { commissionRate })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSavingPartnerCommission.set(false);
          this.showFeedbackModal({
            title: 'Comissão atualizada',
            description: 'A comissão do parceiro foi salva com sucesso.',
            icon: 'bi-check2-circle',
            variant: 'success',
          });
          this.loadPartnerCommissions();
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
        influencerCommissionRate: Number(this.platformForm.controls.influencerCommissionRate.value),
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
    this.planCategorySearch.set('');
    this.planSegmentMode.set('all');
    this.planForm = this.createPlanForm();
    this.activeModalRef = this.modal.open(templateRef, { centered: true, size: 'lg' });
  }

  openEditPlanModal(plan: Plan, templateRef: TemplateRef<unknown>): void {
    this.selectedPlan.set(plan);
    this.planCategorySearch.set('');
    this.planSegmentMode.set(plan.categoryId ? 'specific' : 'all');
    this.planForm = this.createPlanForm(plan);
    this.configureCategoryValidation();
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
            title: 'Plano atualizado',
            description: 'As informações do plano foram salvas com sucesso.',
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
            title: 'Plano cadastrado',
            description: 'O novo plano foi cadastrado com sucesso.',
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
            title: 'Plano removido',
            description: 'O plano selecionado foi removido com sucesso.',
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
      return 'Não informado';
    }

    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  }

  providerNetValueLabel(): string {
    return 'Valor líquido ainda não disponível';
  }

  updatePlanCategorySearch(value: Event): void {
    const target = value.target as HTMLInputElement | null;
    this.planCategorySearch.set(target?.value ?? '');
  }

  selectPlanCategory(categoryId: number | null): void {
    this.planForm.controls.categoryId.setValue(categoryId);
    this.planForm.controls.categoryId.markAsTouched();
  }

  selectPlanInterval(interval: PlanInterval): void {
    this.planForm.controls.interval.setValue(interval);
    this.planForm.controls.interval.markAsTouched();
  }

  selectPlanSegmentMode(mode: PlanSegmentMode): void {
    this.planSegmentMode.set(mode);
    if (mode === 'all') {
      this.planForm.controls.categoryId.setValue(null);
      this.planCategorySearch.set('');
    }
    this.configureCategoryValidation();
  }

  isPlanCategorySelected(categoryId: number | null): boolean {
    return this.planForm.controls.categoryId.value === categoryId;
  }

  selectedPlanCategory(): ServiceCategoryFinance | undefined {
    const categoryId = this.planForm.controls.categoryId.value;
    return this.serviceCategories().find((category) => category.id === categoryId);
  }

  isPlanControlInvalid(controlName: keyof PlanForm['controls']): boolean {
    const control = this.planForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  private normalizeSearch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
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
      return 'Não informado';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Não informado';
    }

    return date.toLocaleString('pt-BR');
  }

  formatCurrency(value: string | number | null | undefined): string {
    if (value == null || value === '') {
      return 'Não informado';
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return 'Não informado';
    }

    return numericValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatInterval(plan: Plan): string {
    const intervalLabel = plan.interval === 'Year' ? 'ano' : 'mês';
    const base = `A cada ${intervalLabel}`;
    return plan.bonusMonths ? `${base} + ${plan.bonusMonths} mês(es) bônus` : base;
  }

  planStatusLabel(plan: Plan): string {
    return plan.isActive ? 'Ativo' : 'Inativo';
  }

  planSegmentLabel(plan: Plan | CreatePlanPayload | null): string {
    if (!plan?.categoryId) {
      return 'Todos os segmentos';
    }

    return (
      this.serviceCategories().find((category) => category.id === plan.categoryId)?.name ??
      'Segmento não encontrado'
    );
  }

  formatPayloadInterval(payload: CreatePlanPayload | null): string {
    if (!payload) {
      return 'Não informado';
    }

    const intervalLabel = payload.interval === 'Year' ? 'ano' : 'mês';
    const base = `A cada ${intervalLabel}`;
    return payload.bonusMonths ? `${base} + ${payload.bonusMonths} mês(es) bônus` : base;
  }

  private createPlanForm(plan?: Plan): PlanForm {
    return new FormGroup({
      name: new FormControl(plan?.name ?? '', [Validators.required, Validators.maxLength(120)]),
      slug: new FormControl(plan?.slug ?? '', [Validators.maxLength(120)]),
      description: new FormControl(plan?.description ?? '', [Validators.maxLength(500)]),
      price: new FormControl(plan ? Number(plan.price) : 0, [
        Validators.required,
        Validators.min(0),
      ]),
      interval: new FormControl<PlanInterval>(plan?.interval ?? 'Month', [Validators.required]),
      bonusMonths: new FormControl(plan?.bonusMonths ?? 0, [Validators.min(0)]),
      categoryId: new FormControl(plan?.categoryId ?? null),
      isActive: new FormControl(plan?.isActive ?? true),
      sortOrder: new FormControl(plan?.sortOrder ?? this.plans().length + 1, [Validators.min(0)]),
    });
  }

  private buildPlanPayload(): CreatePlanPayload | UpdatePlanPayload {
    const value = this.planForm.getRawValue();
    const name = String(value.name ?? '').trim();
    const description = String(value.description ?? '').trim();
    const slug = String(value.slug ?? '').trim() || this.createPlanSlug(name);

    return {
      name,
      slug,
      ...(description ? { description } : {}),
      price: Number(value.price),
      interval: value.interval ?? 'Month',
      intervalCount: 1,
      bonusMonths: Number(value.bonusMonths ?? 0),
      categoryId: value.categoryId != null ? Number(value.categoryId) : null,
      isActive: Boolean(value.isActive),
      sortOrder: Number(value.sortOrder ?? 0),
    };
  }

  private configureCategoryValidation(): void {
    const categoryControl = this.planForm.controls.categoryId;
    if (this.planSegmentMode() === 'specific') {
      categoryControl.setValidators([Validators.required]);
    } else {
      categoryControl.clearValidators();
    }
    categoryControl.updateValueAndValidity();
  }

  private createPlanSlug(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
