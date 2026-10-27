import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, TemplateRef, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { ToastService } from '@core/services/toast.service';
import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';

import { AdminProvider } from '../../models/supplier.model';
import {
  AdminSubscriptionListItem,
  PlanOption,
  SUBSCRIPTION_ORIGINS,
  SUBSCRIPTION_STATUSES,
  SubscriptionOrigin,
  SubscriptionStatus,
} from '../../models/supplier-subscription.model';
import { SuppliersService } from '../../services/suppliers.service';

/** Mesmos limites do `GrantSubscriptionDto`. */
const MESES_MINIMO = 1;
const MESES_MAXIMO = 120;
const MOTIVO_MAXIMO = 255;

const TAMANHO_DA_PAGINA = 10;

/** O seletor de fornecedor busca no servidor; acima disso use a busca. */
const LIMITE_DA_BUSCA = 10;

type FormularioConcessao = FormGroup<{
  providerId: FormControl<number | null>;
  planId: FormControl<number | null>;
  months: FormControl<number | null>;
  reason: FormControl<string>;
}>;

type FormularioBonus = FormGroup<{
  months: FormControl<number | null>;
}>;

@Component({
  selector: 'app-supplier-subscriptions-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss'],
})
export class SupplierSubscriptionsPanelComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly modal = inject(NgbModal);
  private readonly suppliersService = inject(SuppliersService);
  private readonly toastService = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  readonly origens = SUBSCRIPTION_ORIGINS;
  readonly situacoes = SUBSCRIPTION_STATUSES;
  readonly mesesMaximo = MESES_MAXIMO;
  readonly motivoMaximo = MOTIVO_MAXIMO;

  readonly assinaturas = signal<AdminSubscriptionListItem[]>([]);
  readonly total = signal(0);
  readonly pagina = signal(1);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly isSaving = signal(false);

  readonly origem = signal<SubscriptionOrigin | null>(null);
  readonly situacao = signal<SubscriptionStatus | null>(null);

  readonly planos = signal<PlanOption[]>([]);
  readonly fornecedores = signal<AdminProvider[]>([]);
  readonly isBuscandoFornecedor = signal(false);
  readonly bonusAlvo = signal<AdminSubscriptionListItem | undefined>(undefined);

  readonly buscaControl = new FormControl('', { nonNullable: true });
  readonly fornecedorControl = new FormControl('', { nonNullable: true });

  readonly totalDePaginas = computed(() =>
    Math.max(1, Math.ceil(this.total() / TAMANHO_DA_PAGINA))
  );

  readonly resumoDaPaginacao = computed(() => {
    const total = this.total();
    if (total === 0) return '0 assinaturas';

    const inicio = (this.pagina() - 1) * TAMANHO_DA_PAGINA + 1;
    const fim = Math.min(this.pagina() * TAMANHO_DA_PAGINA, total);
    return `${inicio}-${fim} de ${total} assinaturas`;
  });

  /** Quantas, na página, são cortesia do admin. */
  readonly concedidasNaPagina = computed(
    () => this.assinaturas().filter((assinatura) => assinatura.isGranted).length
  );

  private modalRef: NgbModalRef | null = null;

  readonly formConcessao: FormularioConcessao = new FormGroup({
    providerId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    planId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    months: new FormControl<number | null>(12, {
      validators: [Validators.required, Validators.min(MESES_MINIMO), Validators.max(MESES_MAXIMO)],
    }),
    reason: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(MOTIVO_MAXIMO)],
    }),
  });

  readonly formBonus: FormularioBonus = new FormGroup({
    months: new FormControl<number | null>(1, {
      validators: [Validators.required, Validators.min(MESES_MINIMO)],
    }),
  });

  ngOnInit(): void {
    this.carregar();
    this.carregarPlanos();

    this.buscaControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pagina.set(1);
        this.carregar();
      });

    this.fornecedorControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((termo) => this.buscarFornecedores(termo));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregar(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.suppliersService
      .getSubscriptions({
        take: TAMANHO_DA_PAGINA,
        skip: this.pagina(),
        // Espalhar em vez de passar `undefined` deixa o objeto dizer o que
        // ele é: filtro ausente não aparece como chave vazia.
        ...(this.buscaControl.value.trim() && { search: this.buscaControl.value.trim() }),
        ...(this.origem() && { origin: this.origem()! }),
        ...(this.situacao() && { status: this.situacao()! }),
      })
      .subscribe({
        next: (res) => {
          this.assinaturas.set(res.subscriptions);
          this.total.set(res.count);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  filtrarPorOrigem(valor: string): void {
    const origem = (valor || null) as SubscriptionOrigin | null;
    if (origem === this.origem()) return;

    this.origem.set(origem);
    this.pagina.set(1);
    this.carregar();
  }

  filtrarPorSituacao(valor: string): void {
    const situacao = (valor || null) as SubscriptionStatus | null;
    if (situacao === this.situacao()) return;

    this.situacao.set(situacao);
    this.pagina.set(1);
    this.carregar();
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalDePaginas()) return;

    this.pagina.set(pagina);
    this.carregar();
  }

  abrirConcessao(template: TemplateRef<unknown>): void {
    this.formConcessao.reset({ providerId: null, planId: null, months: 12, reason: '' });
    this.fornecedorControl.setValue('', { emitEvent: false });
    this.fornecedores.set([]);
    this.modalRef = this.modal.open(template, { centered: true, backdrop: 'static' });
  }

  abrirBonus(assinatura: AdminSubscriptionListItem, template: TemplateRef<unknown>): void {
    this.bonusAlvo.set(assinatura);
    this.formBonus.reset({ months: 1 });
    this.modalRef = this.modal.open(template, { centered: true, backdrop: 'static' });
  }

  fecharModal(): void {
    this.modalRef?.dismiss();
    this.modalRef = null;
    this.bonusAlvo.set(undefined);
  }

  escolherFornecedor(valor: string): void {
    this.formConcessao.controls.providerId.setValue(valor ? Number(valor) : null);
  }

  conceder(): void {
    if (this.formConcessao.invalid) {
      this.formConcessao.markAllAsTouched();
      return;
    }

    const { providerId, planId, months, reason } = this.formConcessao.getRawValue();
    const motivo = reason.trim();

    this.isSaving.set(true);

    this.suppliersService
      .grantSubscription(Number(providerId), {
        planId: Number(planId),
        months: Number(months),
        ...(motivo && { reason: motivo }),
      })
      .subscribe({
        next: (concedida) => {
          this.toastService.showSuccess(
            `Assinatura liberada para ${this.nomeDoFornecedorEscolhido(Number(providerId))}, válida até ${this.formatarData(concedida.currentPeriodEnd)}.`
          );
          this.isSaving.set(false);
          this.fecharModal();
          this.carregar();
        },
        error: (erro: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(
            this.mensagemDeErro(erro, 'Não foi possível liberar a assinatura.')
          );

          // O 409 diz que esse fornecedor já tem concessão vigente. Recarregar
          // traz a linha dele para o painel, onde o caminho é bonificar.
          if (erro.status === 409) this.carregar();
        },
      });
  }

  bonificar(): void {
    const alvo = this.bonusAlvo();
    if (!alvo) return;

    if (this.formBonus.invalid) {
      this.formBonus.markAllAsTouched();
      return;
    }

    const { months } = this.formBonus.getRawValue();

    this.isSaving.set(true);

    this.suppliersService
      .addSubscriptionBonus(alvo.provider.id, alvo.subscriptionId, { months: Number(months) })
      .subscribe({
        next: (res) => {
          this.toastService.showSuccess(
            `Bônus aplicado. Total de ${res.totalBonusMonths} ${
              res.totalBonusMonths === 1 ? 'mês' : 'meses'
            } de bônus.`
          );
          this.isSaving.set(false);
          this.fecharModal();
          this.carregar();
        },
        error: (erro: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(
            this.mensagemDeErro(erro, 'Não foi possível aplicar o bônus.')
          );
        },
      });
  }

  rotuloCobertura(assinatura: AdminSubscriptionListItem): string {
    if (assinatura.categoryId === null) return 'Todas as categorias';
    return assinatura.categoryName ?? `Categoria #${assinatura.categoryId}`;
  }

  rotuloOrigem(assinatura: AdminSubscriptionListItem): string {
    return assinatura.isGranted ? 'Concedida' : 'Paga';
  }

  rotuloStatus(status: SubscriptionStatus): string {
    return this.situacoes.find((s) => s.valor === status)?.rotulo ?? status;
  }

  classeStatus(assinatura: AdminSubscriptionListItem): string {
    if (assinatura.isCurrent) return 'active';
    if (assinatura.status === 'Pending') return 'pending';
    return 'inactive';
  }

  rotuloPlano(plano: PlanOption): string {
    const periodo = plano.interval === 'Year' ? 'ano' : 'mês';
    return `${plano.name} — ${this.formatarMoeda(Number(plano.price))}/${periodo}`;
  }

  formatarData(valor: string | null): string {
    if (!valor) return 'Sem prazo';
    return new Date(valor).toLocaleDateString('pt-BR');
  }

  formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  irParaFornecedor(assinatura: AdminSubscriptionListItem): void {
    this.router.navigate(['/suppliers', assinatura.provider.id]);
  }

  voltar(): void {
    this.router.navigate(['/suppliers']);
  }

  private buscarFornecedores(termo: string): void {
    const busca = termo.trim();

    if (busca.length < 2) {
      this.fornecedores.set([]);
      return;
    }

    this.isBuscandoFornecedor.set(true);

    this.suppliersService.getSuppliers({ take: LIMITE_DA_BUSCA, search: busca }).subscribe({
      next: (res) => {
        this.fornecedores.set(res.providers);
        this.isBuscandoFornecedor.set(false);
      },
      error: () => {
        this.fornecedores.set([]);
        this.isBuscandoFornecedor.set(false);
      },
    });
  }

  private nomeDoFornecedorEscolhido(id: number): string {
    return this.fornecedores().find((fornecedor) => fornecedor.id === id)?.name ?? 'o fornecedor';
  }

  private carregarPlanos(): void {
    this.suppliersService.getActivePlanOptions().subscribe({
      next: (planos) => this.planos.set(planos),
      // Sem planos o seletor fica vazio e o formulário não valida. O painel
      // continua mostrando as assinaturas, que é a parte que não depende disso.
      error: () => this.planos.set([]),
    });
  }

  private mensagemDeErro(erro: HttpErrorResponse, padrao: string): string {
    const corpo = erro.error as { message?: string | string[] } | null;
    const mensagem = corpo?.message;

    if (Array.isArray(mensagem) && mensagem.length) return mensagem[0];
    if (typeof mensagem === 'string' && mensagem.trim()) return mensagem;

    return padrao;
  }
}
