import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, TemplateRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ToastService } from '@core/services/toast.service';
import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';

import { Coupon, CouponType, RestaurantOption, UpsertCouponInput } from '../../models/coupon.model';
import { CouponsService } from '../../services/coupons.service';
import { campoLocalParaIso, isoParaCampoLocal } from '../../utils/coupon-dates';

const TIPOS: Array<{ valor: CouponType; rotulo: string }> = [
  { valor: 'Percent', rotulo: 'Percentual sobre os itens (%)' },
  { valor: 'Fixed', rotulo: 'Valor fixo nos itens (R$)' },
  { valor: 'FreeShipping', rotulo: 'Frete grátis' },
];

type FormularioCupom = FormGroup<{
  code: FormControl<string>;
  description: FormControl<string>;
  type: FormControl<CouponType>;
  value: FormControl<number | null>;
  maxDiscountValue: FormControl<number | null>;
  minOrderValue: FormControl<number | null>;
  startsAt: FormControl<string>;
  endsAt: FormControl<string>;
  maxUses: FormControl<number | null>;
  maxUsesPerCustomer: FormControl<number | null>;
  restaurantId: FormControl<number | null>;
  isActive: FormControl<boolean>;
}>;

@Component({
  selector: 'app-coupons',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './coupons.component.html',
  styleUrls: ['./coupons.component.scss'],
})
export class CouponsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly modal = inject(NgbModal);
  private readonly couponsService = inject(CouponsService);
  private readonly toastService = inject(ToastService);

  readonly cupons = signal<Coupon[]>([]);
  readonly restaurantes = signal<RestaurantOption[]>([]);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly isSaving = signal(false);
  readonly emEdicao = signal<Coupon | undefined>(undefined);
  readonly alternandoId = signal<number | null>(null);

  readonly tipos = TIPOS;

  private modalRef: NgbModalRef | null = null;

  readonly form: FormularioCupom = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    description: new FormControl('', { nonNullable: true }),
    type: new FormControl<CouponType>('Percent', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    value: new FormControl<number | null>(null, [Validators.min(0)]),
    maxDiscountValue: new FormControl<number | null>(null, [Validators.min(0)]),
    minOrderValue: new FormControl<number | null>(null, [Validators.min(0)]),
    startsAt: new FormControl('', { nonNullable: true }),
    endsAt: new FormControl('', { nonNullable: true }),
    maxUses: new FormControl<number | null>(null, [Validators.min(1)]),
    maxUsesPerCustomer: new FormControl<number | null>(null, [Validators.min(1)]),
    restaurantId: new FormControl<number | null>(null),
    isActive: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.carregar();
    this.carregarRestaurantes();
  }

  carregar(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.couponsService.getAll().subscribe({
      next: (lista) => {
        this.cupons.set(lista);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  get estaEditando(): boolean {
    return this.emEdicao() !== undefined;
  }

  /** `FreeShipping` zera o frete e ignora o valor — o campo some do formulário. */
  get exigeValor(): boolean {
    return this.form.controls.type.value !== 'FreeShipping';
  }

  get ehPercentual(): boolean {
    return this.form.controls.type.value === 'Percent';
  }

  abrirNovo(template: TemplateRef<unknown>): void {
    this.emEdicao.set(undefined);
    this.form.reset({
      code: '',
      description: '',
      type: 'Percent',
      value: null,
      maxDiscountValue: null,
      minOrderValue: null,
      startsAt: '',
      endsAt: '',
      maxUses: null,
      maxUsesPerCustomer: null,
      restaurantId: null,
      isActive: true,
    });
    this.modalRef = this.modal.open(template, { centered: true, backdrop: 'static', size: 'lg' });
  }

  abrirEdicao(cupom: Coupon, template: TemplateRef<unknown>): void {
    this.emEdicao.set(cupom);
    this.form.reset({
      code: cupom.code,
      description: cupom.description ?? '',
      type: cupom.type,
      value: cupom.value === null || cupom.value === undefined ? null : Number(cupom.value),
      maxDiscountValue:
        cupom.maxDiscountValue === null || cupom.maxDiscountValue === undefined
          ? null
          : Number(cupom.maxDiscountValue),
      minOrderValue:
        cupom.minOrderValue === null || cupom.minOrderValue === undefined
          ? null
          : Number(cupom.minOrderValue),
      startsAt: isoParaCampoLocal(cupom.startsAt),
      endsAt: isoParaCampoLocal(cupom.endsAt),
      maxUses: cupom.maxUses ?? null,
      maxUsesPerCustomer: cupom.maxUsesPerCustomer ?? null,
      restaurantId: cupom.restaurantId ?? null,
      isActive: cupom.isActive,
    });
    this.modalRef = this.modal.open(template, { centered: true, backdrop: 'static', size: 'lg' });
  }

  fecharModal(): void {
    this.modalRef?.dismiss();
    this.modalRef = null;
    this.emEdicao.set(undefined);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // As mesmas duas relações que o back-end confere. Verificar aqui evita uma
    // ida ao servidor para ouvir o óbvio; o servidor continua sendo a autoridade.
    if (this.exigeValor && this.form.controls.value.value === null) {
      this.toastService.showError('Cupom de percentual ou valor fixo precisa de um valor.');
      return;
    }

    if (this.ehPercentual && Number(this.form.controls.value.value) > 100) {
      this.toastService.showError('Um cupom percentual não pode passar de 100%.');
      return;
    }

    const emEdicao = this.emEdicao();
    const payload = this.montarPayload();

    this.isSaving.set(true);

    const requisicao = emEdicao
      ? this.couponsService.update(emEdicao.id, payload)
      : this.couponsService.create(payload);

    requisicao.subscribe({
      next: () => {
        this.toastService.showSuccess(emEdicao ? 'Cupom atualizado.' : 'Cupom criado.');
        this.isSaving.set(false);
        this.fecharModal();
        this.carregar();
      },
      error: (erro: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.toastService.showError(this.mensagemDeErro(erro));
      },
    });
  }

  alternarAtivo(cupom: Coupon): void {
    if (this.alternandoId() !== null) return;

    this.alternandoId.set(cupom.id);

    const requisicao = cupom.isActive
      ? this.couponsService.deactivate(cupom.id)
      : this.couponsService.reactivate(cupom.id);

    requisicao.subscribe({
      next: (atualizado) => {
        this.cupons.update((lista) => lista.map((c) => (c.id === atualizado.id ? atualizado : c)));
        this.toastService.showSuccess(
          atualizado.isActive ? 'Cupom reativado.' : 'Cupom desativado.'
        );
        this.alternandoId.set(null);
      },
      error: (erro: HttpErrorResponse) => {
        this.toastService.showError(this.mensagemDeErro(erro));
        this.alternandoId.set(null);
      },
    });
  }

  rotuloValor(cupom: Coupon): string {
    if (cupom.type === 'FreeShipping') return 'Frete grátis';

    const valor = Number(cupom.value ?? 0);

    return cupom.type === 'Percent'
      ? `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
      : valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  rotuloUsos(cupom: Coupon): string {
    return cupom.maxUses ? `${cupom.timesUsed} / ${cupom.maxUses}` : String(cupom.timesUsed);
  }

  nomeDoRestaurante(id: number | null | undefined): string {
    if (!id) return 'Todos';

    return this.restaurantes().find((r) => r.id === id)?.name ?? `#${id}`;
  }

  formatarMoeda(valor: string | number | null | undefined): string {
    return Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  voltar(): void {
    this.router.navigate(['/finance']);
  }

  private montarPayload(): UpsertCouponInput {
    const c = this.form.controls;
    const numero = (controle: FormControl<number | null>): number | undefined =>
      controle.value === null || controle.value === undefined ? undefined : Number(controle.value);

    return {
      // O back-end grava e compara em maiúsculas; mandar assim evita a
      // impressão de que o cupom mudou sozinho depois de salvo.
      code: c.code.value.trim().toUpperCase(),
      description: c.description.value.trim() || undefined,
      type: c.type.value,
      value: this.exigeValor ? numero(c.value) : undefined,
      maxDiscountValue: numero(c.maxDiscountValue),
      minOrderValue: numero(c.minOrderValue),
      startsAt: campoLocalParaIso(c.startsAt.value),
      endsAt: campoLocalParaIso(c.endsAt.value),
      maxUses: numero(c.maxUses),
      maxUsesPerCustomer: numero(c.maxUsesPerCustomer),
      restaurantId: numero(c.restaurantId),
      isActive: c.isActive.value,
    };
  }

  private carregarRestaurantes(): void {
    this.couponsService.getRestaurantOptions().subscribe({
      next: (lista) => this.restaurantes.set(lista),
      // Sem a lista, o seletor fica só com "Todos" — o cupom geral continua
      // possível, e nenhuma outra parte da tela depende disso.
      error: () => this.restaurantes.set([]),
    });
  }

  private mensagemDeErro(erro: HttpErrorResponse): string {
    const corpo = erro.error as { message?: string | string[] } | null;
    const mensagem = corpo?.message;

    if (Array.isArray(mensagem) && mensagem.length) return mensagem[0];
    if (typeof mensagem === 'string' && mensagem.trim()) return mensagem;

    return 'Não foi possível salvar o cupom.';
  }
}
