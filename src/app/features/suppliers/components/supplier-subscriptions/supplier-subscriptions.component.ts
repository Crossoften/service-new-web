import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit, TemplateRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ToastService } from '@core/services/toast.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';

import {
  PlanOption,
  ProviderSubscription,
  SubscriptionStatus,
} from '../../models/supplier-subscription.model';
import { SuppliersService } from '../../services/suppliers.service';

/** Mesmos limites do `GrantSubscriptionDto`, para não ir ao servidor ouvir o óbvio. */
const MESES_MINIMO = 1;
const MESES_MAXIMO_CONCESSAO = 120;
const MOTIVO_MAXIMO = 255;

type FormularioConcessao = FormGroup<{
  planId: FormControl<number | null>;
  months: FormControl<number | null>;
  reason: FormControl<string>;
}>;

type FormularioBonus = FormGroup<{
  months: FormControl<number | null>;
}>;

@Component({
  selector: 'app-supplier-subscriptions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './supplier-subscriptions.component.html',
  styleUrls: ['./supplier-subscriptions.component.scss'],
})
export class SupplierSubscriptionsComponent implements OnInit {
  @Input({ required: true }) providerId!: number;

  private readonly modal = inject(NgbModal);
  private readonly suppliersService = inject(SuppliersService);
  private readonly toastService = inject(ToastService);

  readonly assinaturas = signal<ProviderSubscription[]>([]);
  readonly concessaoVigenteId = signal<number | null>(null);
  readonly planos = signal<PlanOption[]>([]);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly isSaving = signal(false);
  readonly bonusAlvo = signal<ProviderSubscription | undefined>(undefined);

  readonly mesesMaximoConcessao = MESES_MAXIMO_CONCESSAO;
  readonly motivoMaximo = MOTIVO_MAXIMO;

  private modalRef: NgbModalRef | null = null;

  readonly formConcessao: FormularioConcessao = new FormGroup({
    planId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    months: new FormControl<number | null>(12, {
      validators: [
        Validators.required,
        Validators.min(MESES_MINIMO),
        Validators.max(MESES_MAXIMO_CONCESSAO),
      ],
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
  }

  carregar(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.suppliersService.getSupplierSubscriptions(this.providerId).subscribe({
      next: (res) => {
        this.assinaturas.set(res.subscriptions);
        this.concessaoVigenteId.set(res.activeGrantId);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Conceder fica bloqueado quando já existe concessão vigente, porque o
   * back-end responderia 409. Melhor dizer isso antes do formulário do que
   * depois de preenchê-lo.
   */
  get podeConceder(): boolean {
    return this.concessaoVigenteId() === null;
  }

  abrirConcessao(template: TemplateRef<unknown>): void {
    if (!this.podeConceder) return;

    this.formConcessao.reset({ planId: null, months: 12, reason: '' });
    this.modalRef = this.modal.open(template, { centered: true, backdrop: 'static' });
  }

  abrirBonus(assinatura: ProviderSubscription, template: TemplateRef<unknown>): void {
    this.bonusAlvo.set(assinatura);
    this.formBonus.reset({ months: 1 });
    this.modalRef = this.modal.open(template, { centered: true, backdrop: 'static' });
  }

  fecharModal(): void {
    this.modalRef?.dismiss();
    this.modalRef = null;
    this.bonusAlvo.set(undefined);
  }

  conceder(): void {
    if (this.formConcessao.invalid) {
      this.formConcessao.markAllAsTouched();
      return;
    }

    const { planId, months, reason } = this.formConcessao.getRawValue();
    const motivo = reason.trim();

    this.isSaving.set(true);

    this.suppliersService
      .grantSubscription(this.providerId, {
        planId: Number(planId),
        months: Number(months),
        ...(motivo && { reason: motivo }),
      })
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Assinatura concedida.');
          this.isSaving.set(false);
          this.fecharModal();
          this.carregar();
        },
        error: (erro: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(
            this.mensagemDeErro(erro, 'Não foi possível conceder a assinatura.')
          );
          // Um 409 significa que apareceu uma concessão depois do último
          // carregamento. Recarregar troca o botão de conceder pelo de
          // bonificar, que é o caminho que resta.
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
      .addSubscriptionBonus(this.providerId, alvo.subscriptionId, { months: Number(months) })
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

  rotuloCobertura(assinatura: ProviderSubscription): string {
    if (assinatura.categoryId === null) return 'Todas as categorias';
    return assinatura.categoryName ?? `Categoria #${assinatura.categoryId}`;
  }

  rotuloOrigem(assinatura: ProviderSubscription): string {
    return assinatura.isGranted ? 'Concedida' : 'Paga';
  }

  rotuloStatus(status: SubscriptionStatus): string {
    switch (status) {
      case 'Active':
        return 'Ativa';
      case 'Pending':
        return 'Pendente';
      case 'Cancelled':
        return 'Cancelada';
      default:
        return 'Expirada';
    }
  }

  /** Modificadores de `.status-badge`, a convenção que a página do fornecedor usa. */
  classeStatus(assinatura: ProviderSubscription): string {
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

  private carregarPlanos(): void {
    this.suppliersService.getActivePlanOptions().subscribe({
      next: (planos) => this.planos.set(planos),
      // Sem planos o seletor fica vazio e o formulário não valida. O card em si
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
