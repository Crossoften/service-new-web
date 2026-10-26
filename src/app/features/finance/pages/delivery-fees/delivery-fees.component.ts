import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, TemplateRef, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ToastService } from '@core/services/toast.service';
import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';

import { DeliveryFeeRule, DeliveryFeeType } from '../../models/delivery-fee.model';
import { DeliveryFeesService } from '../../services/delivery-fees.service';
import { comecaEmZero, conferirCobertura } from '../../utils/delivery-fee-coverage';

const TIPOS: Array<{ valor: DeliveryFeeType; rotulo: string }> = [
  { valor: 'Fixed', rotulo: 'Valor fixo (R$)' },
  { valor: 'Percent', rotulo: 'Percentual sobre os itens (%)' },
];

type FormularioFaixa = FormGroup<{
  minKm: FormControl<number | null>;
  maxKm: FormControl<number | null>;
  type: FormControl<DeliveryFeeType>;
  value: FormControl<number | null>;
  isActive: FormControl<boolean>;
}>;

@Component({
  selector: 'app-delivery-fees',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './delivery-fees.component.html',
  styleUrls: ['./delivery-fees.component.scss'],
})
export class DeliveryFeesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly modal = inject(NgbModal);
  private readonly feesService = inject(DeliveryFeesService);
  private readonly toastService = inject(ToastService);

  readonly faixas = signal<DeliveryFeeRule[]>([]);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly isSaving = signal(false);
  readonly emEdicao = signal<DeliveryFeeRule | undefined>(undefined);
  readonly alternandoId = signal<number | null>(null);

  readonly tipos = TIPOS;

  /** Buracos e sobreposições entre as faixas ativas. */
  readonly inconsistencias = computed(() => conferirCobertura(this.faixas()));
  readonly faltaComecoEmZero = computed(
    () => this.faixas().length > 0 && !comecaEmZero(this.faixas())
  );

  private modalRef: NgbModalRef | null = null;

  readonly form: FormularioFaixa = new FormGroup({
    minKm: new FormControl<number | null>(0, [Validators.required, Validators.min(0)]),
    maxKm: new FormControl<number | null>(null, [Validators.min(0)]),
    type: new FormControl<DeliveryFeeType>('Fixed', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    value: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    isActive: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.feesService.getAll().subscribe({
      next: (lista) => {
        this.faixas.set(lista);
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

  abrirNova(template: TemplateRef<unknown>): void {
    this.emEdicao.set(undefined);
    this.form.reset({ minKm: 0, maxKm: null, type: 'Fixed', value: null, isActive: true });
    this.modalRef = this.modal.open(template, { centered: true, backdrop: 'static' });
  }

  abrirEdicao(regra: DeliveryFeeRule, template: TemplateRef<unknown>): void {
    this.emEdicao.set(regra);
    this.form.reset({
      minKm: Number(regra.minKm),
      maxKm: regra.maxKm === null || regra.maxKm === undefined ? null : Number(regra.maxKm),
      type: regra.type,
      value: Number(regra.value),
      isActive: regra.isActive,
    });
    this.modalRef = this.modal.open(template, { centered: true, backdrop: 'static' });
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

    const payload = {
      minKm: Number(this.form.controls.minKm.value),
      // Vazio significa "daqui em diante". `undefined` omite o campo; `null`
      // seria enviado e reprovado pelo `@IsNumber` do back-end.
      maxKm:
        this.form.controls.maxKm.value === null || this.form.controls.maxKm.value === undefined
          ? undefined
          : Number(this.form.controls.maxKm.value),
      type: this.form.controls.type.value,
      value: Number(this.form.controls.value.value),
      isActive: this.form.controls.isActive.value,
    };

    const emEdicao = this.emEdicao();
    const requisicao = emEdicao
      ? this.feesService.update(emEdicao.id, payload)
      : this.feesService.create(payload);

    this.isSaving.set(true);

    requisicao.subscribe({
      next: () => {
        this.toastService.showSuccess(emEdicao ? 'Faixa atualizada.' : 'Faixa criada.');
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

  alternarAtiva(regra: DeliveryFeeRule): void {
    if (this.alternandoId() !== null) return;

    this.alternandoId.set(regra.id);

    this.feesService.setActive(regra, !regra.isActive).subscribe({
      next: (atualizada) => {
        this.faixas.update((lista) => lista.map((f) => (f.id === atualizada.id ? atualizada : f)));
        this.toastService.showSuccess(atualizada.isActive ? 'Faixa ativada.' : 'Faixa desativada.');
        this.alternandoId.set(null);
      },
      error: (erro: HttpErrorResponse) => {
        this.toastService.showError(this.mensagemDeErro(erro));
        this.alternandoId.set(null);
      },
    });
  }

  confirmarRemocao(regra: DeliveryFeeRule, template: TemplateRef<unknown>): void {
    this.emEdicao.set(regra);
    this.modalRef = this.modal.open(template, { centered: true });
  }

  remover(): void {
    const regra = this.emEdicao();

    if (!regra) return;

    this.isSaving.set(true);

    this.feesService.remove(regra.id).subscribe({
      next: () => {
        this.toastService.showSuccess('Faixa removida.');
        this.isSaving.set(false);
        this.fecharModal();
        this.carregar();
      },
      error: () => {
        this.isSaving.set(false);
      },
    });
  }

  rotuloFaixa(regra: DeliveryFeeRule): string {
    const inicio = this.formatarKm(regra.minKm);

    if (regra.maxKm === null || regra.maxKm === undefined) {
      return `${inicio} km ou mais`;
    }

    return `${inicio} a ${this.formatarKm(regra.maxKm)} km`;
  }

  rotuloValor(regra: DeliveryFeeRule): string {
    return regra.type === 'Fixed'
      ? Number(regra.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : `${Number(regra.value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  }

  formatarKm(valor: string | number): string {
    return Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }

  voltar(): void {
    this.router.navigate(['/finance']);
  }

  private mensagemDeErro(erro: HttpErrorResponse): string {
    const corpo = erro.error as { message?: string | string[] } | null;
    const mensagem = corpo?.message;

    if (Array.isArray(mensagem) && mensagem.length) return mensagem[0];
    if (typeof mensagem === 'string' && mensagem.trim()) return mensagem;

    return 'Não foi possível salvar a faixa.';
  }
}
