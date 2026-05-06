import { Component, OnInit, OnDestroy, TemplateRef, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { FinanceService } from '../../services/finance.service';
import { Plan, SupplierRate, PartnerCommission } from '../../models/finance.model';

// TODO: endpoint não documentado — aguardando backend para porcentagem de fornecedores
const MOCK_RATES: SupplierRate[] = [
  { id: '1', category: 'Elétrica',     percentage: 12 },
  { id: '2', category: 'Hidráulica',   percentage: 10 },
  { id: '3', category: 'Pintura',      percentage: 10 },
  { id: '4', category: 'Reformas',     percentage: 15 },
  { id: '5', category: 'Climatização', percentage: 12 },
  { id: '6', category: 'Limpeza',      percentage: 8  },
];

// TODO: endpoint não documentado — aguardando backend para comissão de parceiros
const MOCK_COMMISSIONS: PartnerCommission[] = [
  { id: '1', name: 'Construtora Alpha', percentage: 5 },
  { id: '2', name: 'EletroMax',         percentage: 7 },
  { id: '3', name: 'Hidro Serviços',    percentage: 6 },
  { id: '4', name: 'ClimaTech',         percentage: 8 },
];

@Component({
  selector: 'app-finance-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
  ],
  templateUrl: './finance-page.component.html',
  styleUrls: ['./finance-page.component.scss'],
})
export class FinancePageComponent implements OnInit, OnDestroy {
  private readonly modal = inject(NgbModal);
  private readonly fb = inject(FormBuilder);
  private readonly financeService = inject(FinanceService);
  private readonly destroy$ = new Subject<void>();

  // Plans (API real)
  readonly plans = signal<Plan[]>([]);
  readonly isLoadingPlans = signal(false);
  readonly hasPlansError = signal(false);
  readonly isSavingPlan = signal(false);

  // Rates (TODO: sem endpoint documentado — dados mock)
  readonly rates = signal<SupplierRate[]>(MOCK_RATES);
  readonly hasSupplierRatesEndpoint = false;

  // Commissions (TODO: sem endpoint documentado — dados mock)
  readonly commissions = signal<PartnerCommission[]>(MOCK_COMMISSIONS);
  readonly hasPartnerCommissionsEndpoint = false;

  // Modal state
  ratesForm!: FormGroup;
  commissionsForm!: FormGroup;
  planForm!: FormGroup;
  editingPlan = signal<Plan | null>(null);
  private activeModalRef: NgbModalRef | null = null;
  readonly isSavingModal = signal(false);

  ngOnInit(): void {
    this.loadPlans();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Plans (API real) ─────────────────────────────────────────────────────

  loadPlans(): void {
    this.isLoadingPlans.set(true);
    this.hasPlansError.set(false);
    this.financeService.getPlans().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.plans.set(res.plans ?? []);
        this.isLoadingPlans.set(false);
      },
      error: () => {
        this.hasPlansError.set(true);
        this.isLoadingPlans.set(false);
      },
    });
  }

  openCreatePlanModal(templateRef: TemplateRef<unknown>): void {
    this.editingPlan.set(null);
    this.planForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      interval: ['Month', Validators.required],
      intervalCount: [1, [Validators.required, Validators.min(1)]],
    });
    this.activeModalRef = this.modal.open(templateRef, { centered: true, size: 'md' });
  }

  openEditPlanModal(plan: Plan, templateRef: TemplateRef<unknown>): void {
    this.editingPlan.set(plan);
    this.planForm = this.fb.group({
      name: [plan.name, Validators.required],
      description: [plan.description],
      price: [Number(plan.price), [Validators.required, Validators.min(0)]],
      interval: [plan.interval, Validators.required],
      intervalCount: [plan.intervalCount ?? 1, [Validators.required, Validators.min(1)]],
    });
    this.activeModalRef = this.modal.open(templateRef, { centered: true, size: 'md' });
  }

  savePlan(): void {
    if (this.planForm.invalid) return;
    this.isSavingPlan.set(true);
    const raw = this.planForm.value;
    const editing = this.editingPlan();

    const request$ = editing
      ? this.financeService.updatePlan(editing.id, {
          name: raw.name,
          description: raw.description,
          price: raw.price,
          interval: raw.interval,
          intervalCount: raw.intervalCount,
        })
      : this.financeService.createPlan({
          name: raw.name,
          slug: raw.name.toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          description: raw.description ?? '',
          price: raw.price,
          interval: raw.interval,
          intervalCount: raw.intervalCount,
          benefits: [],
          isActive: true,
          sortOrder: 1,
        });

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSavingPlan.set(false);
        this.activeModalRef?.close();
        this.loadPlans();
      },
      error: () => this.isSavingPlan.set(false),
    });
  }

  deletePlan(id: number): void {
    this.financeService.deletePlan(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.loadPlans(),
    });
  }

  // ── Modal: Porcentagem Fornecedores (TODO: sem endpoint) ─────────────────

  openRatesModal(templateRef: TemplateRef<unknown>): void {
    this.ratesForm = this.fb.group({
      rates: this.fb.array(
        this.rates().map((r) =>
          this.fb.group({ id: [r.id], category: [r.category], percentage: [r.percentage] })
        )
      ),
    });
    this.activeModalRef = this.modal.open(templateRef, { centered: true, size: 'lg' });
  }

  get ratesArray(): FormArray { return this.ratesForm.get('rates') as FormArray; }

  saveRates(): void {
    // TODO: endpoint não documentado — aguardando backend
    if (!this.hasSupplierRatesEndpoint) return;
  }

  // ── Modal: Comissão Parceiros (TODO: sem endpoint) ───────────────────────

  openCommissionsModal(templateRef: TemplateRef<unknown>): void {
    this.commissionsForm = this.fb.group({
      commissions: this.fb.array(
        this.commissions().map((c) =>
          this.fb.group({ id: [c.id], name: [c.name], percentage: [c.percentage] })
        )
      ),
    });
    this.activeModalRef = this.modal.open(templateRef, { centered: true, size: 'lg' });
  }

  get commissionsArray(): FormArray { return this.commissionsForm.get('commissions') as FormArray; }

  saveCommissions(): void {
    // TODO: endpoint não documentado — aguardando backend
    if (!this.hasPartnerCommissionsEndpoint) return;
  }

  dismissModal(): void { this.activeModalRef?.dismiss(); }

  formatCurrency(v: number | string): string {
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatInterval(interval: string): string {
    switch (interval) {
      case 'Month': return 'Mensal';
      case 'Quarter': return 'Trimestral';
      case 'Year': return 'Anual';
      default: return interval ?? '-';
    }
  }
}
