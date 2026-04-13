import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormBuilder, FormArray, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { FinanceService } from '../../services/finance.service';
import { FinanceEntry, SupplierRate, PartnerCommission, SubscriptionParam } from '../../models/finance.model';

const MOCK_ENTRIES: FinanceEntry[] = [
  { id:'1', service:'Instalação Elétrica', category:'Elétrica',     value:250,   platformValue:30,   rating:5, status:'active'   },
  { id:'2', service:'Pintura Residencial', category:'Pintura',       value:800,   platformValue:96,   rating:4, status:'active'   },
  { id:'3', service:'Desentupimento',      category:'Hidráulica',    value:180,   platformValue:18,   rating:3, status:'inactive' },
  { id:'4', service:'Ar Condicionado',     category:'Climatização',  value:350,   platformValue:42,   rating:5, status:'active'   },
  { id:'5', service:'Limpeza Pós-Obra',    category:'Limpeza',       value:420,   platformValue:33.6, rating:4, status:'active'   },
  { id:'6', service:'Reforma de Banheiro', category:'Reformas',      value:3200,  platformValue:480,  rating:2, status:'inactive' },
  { id:'7', service:'Manutenção Telhado',  category:'Construção',    value:600,   platformValue:72,   rating:4, status:'active'   },
  { id:'8', service:'Jardinagem',          category:'Jardinagem',    value:150,   platformValue:12,   rating:5, status:'active'   },
  { id:'9', service:'Montagem de Móveis',  category:'Marcenaria',    value:200,   platformValue:20,   rating:3, status:'inactive' },
  { id:'10',service:'Reparo Eletro.',      category:'Elétrica',      value:130,   platformValue:15.6, rating:4, status:'active'   },
];

const DEFAULT_RATES: SupplierRate[] = [
  { id:'1', category:'Elétrica',     percentage:12 },
  { id:'2', category:'Hidráulica',   percentage:10 },
  { id:'3', category:'Pintura',      percentage:10 },
  { id:'4', category:'Reformas',     percentage:15 },
  { id:'5', category:'Climatização', percentage:12 },
  { id:'6', category:'Limpeza',      percentage:8  },
  { id:'7', category:'Jardinagem',   percentage:8  },
  { id:'8', category:'Segurança',    percentage:12 },
];

const DEFAULT_COMMISSIONS: PartnerCommission[] = [
  { id:'1', name:'Construtora Alpha', percentage:5  },
  { id:'2', name:'EletroMax',         percentage:7  },
  { id:'3', name:'Hidro Serviços',    percentage:6  },
  { id:'4', name:'ClimaTech',         percentage:8  },
  { id:'5', name:'Pintura Total',     percentage:5  },
  { id:'6', name:'Verde & Cia',       percentage:4  },
];

const DEFAULT_PARAMS: SubscriptionParam[] = [
  { id:'1', plan:'Basic',      action:'Mensal',   value:29.90  },
  { id:'2', plan:'Pro',        action:'Mensal',   value:59.90  },
  { id:'3', plan:'Enterprise', action:'Mensal',   value:199.90 },
  { id:'4', plan:'Basic',      action:'Anual',    value:299.00 },
  { id:'5', plan:'Pro',        action:'Anual',    value:599.00 },
  { id:'6', plan:'Enterprise', action:'Anual',    value:1990.00},
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

  readonly searchControl = new FormControl('');
  readonly entries = signal<FinanceEntry[]>([]);
  readonly allEntries = signal<FinanceEntry[]>(MOCK_ENTRIES);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly isLoading = signal(false);
  readonly isSavingModal = signal(false);

  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));
  readonly paginationInfo = computed(() => {
    if (this.total() === 0) return '0 itens';
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(this.currentPage() * this.pageSize(), this.total());
    return `${start}-${end} de ${this.total()} itens`;
  });

  // Modal forms
  ratesForm!: FormGroup;
  commissionsForm!: FormGroup;
  paramsForm!: FormGroup;
  private activeModalRef: NgbModalRef | null = null;

  ngOnInit(): void {
    this.loadEntries();
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.currentPage.set(1); this.loadEntries(); });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadEntries(): void {
    this.isLoading.set(true);
    const search = (this.searchControl.value ?? '').toLowerCase();
    const filtered = MOCK_ENTRIES.filter(e =>
      e.service.toLowerCase().includes(search) ||
      e.category.toLowerCase().includes(search)
    );
    const start = (this.currentPage() - 1) * this.pageSize();
    this.entries.set(filtered.slice(start, start + this.pageSize()));
    this.total.set(filtered.length);
    setTimeout(() => this.isLoading.set(false), 300);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadEntries();
  }

  formatCurrency(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  renderStars(r: number): string {
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  // ── Modal: Porcentagem Fornecedores ──────────────────────────────────────
  openRatesModal(templateRef: any): void {
    this.ratesForm = this.fb.group({
      rates: this.fb.array(DEFAULT_RATES.map(r => this.fb.group({ id: [r.id], category: [r.category], percentage: [r.percentage] }))),
    });
    this.activeModalRef = this.modal.open(templateRef, { centered: true, size: 'lg' });
  }

  get ratesArray(): FormArray { return this.ratesForm.get('rates') as FormArray; }

  saveRates(): void {
    this.isSavingModal.set(true);
    setTimeout(() => { this.isSavingModal.set(false); this.activeModalRef?.close(); }, 600);
  }

  // ── Modal: Comissão Parceiros ────────────────────────────────────────────
  openCommissionsModal(templateRef: any): void {
    this.commissionsForm = this.fb.group({
      commissions: this.fb.array(DEFAULT_COMMISSIONS.map(c => this.fb.group({ id: [c.id], name: [c.name], percentage: [c.percentage] }))),
    });
    this.activeModalRef = this.modal.open(templateRef, { centered: true, size: 'lg' });
  }

  get commissionsArray(): FormArray { return this.commissionsForm.get('commissions') as FormArray; }

  saveCommissions(): void {
    this.isSavingModal.set(true);
    setTimeout(() => { this.isSavingModal.set(false); this.activeModalRef?.close(); }, 600);
  }

  // ── Modal: Parâmetros Assinatura ─────────────────────────────────────────
  openParamsModal(templateRef: any): void {
    this.paramsForm = this.fb.group({
      params: this.fb.array(DEFAULT_PARAMS.map(p => this.fb.group({ id: [p.id], plan: [p.plan], action: [p.action], value: [p.value] }))),
    });
    this.activeModalRef = this.modal.open(templateRef, { centered: true, size: 'lg' });
  }

  get paramsArray(): FormArray { return this.paramsForm.get('params') as FormArray; }

  saveParams(): void {
    this.isSavingModal.set(true);
    setTimeout(() => { this.isSavingModal.set(false); this.activeModalRef?.close(); }, 600);
  }

  dismissModal(): void { this.activeModalRef?.dismiss(); }
}
