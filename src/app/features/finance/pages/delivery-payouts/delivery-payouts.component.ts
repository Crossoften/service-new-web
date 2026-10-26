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

import { DeliveryPayoutMethod, PendingPayout } from '../../models/delivery-payout.model';
import { DeliveryPayoutsService } from '../../services/delivery-payouts.service';

const METODOS: Array<{ valor: DeliveryPayoutMethod; rotulo: string }> = [
  { valor: 'Pix', rotulo: 'Pix' },
  { valor: 'BankTransfer', rotulo: 'Transferência bancária' },
  { valor: 'Cash', rotulo: 'Dinheiro' },
  { valor: 'Other', rotulo: 'Outro' },
];

type FormularioRepasse = FormGroup<{
  method: FormControl<DeliveryPayoutMethod>;
  reference: FormControl<string>;
  notes: FormControl<string>;
}>;

@Component({
  selector: 'app-delivery-payouts',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './delivery-payouts.component.html',
  styleUrls: ['./delivery-payouts.component.scss'],
})
export class DeliveryPayoutsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly modal = inject(NgbModal);
  private readonly payoutsService = inject(DeliveryPayoutsService);
  private readonly toastService = inject(ToastService);

  readonly pendentes = signal<PendingPayout[]>([]);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly isSaving = signal(false);
  readonly selecionado = signal<PendingPayout | undefined>(undefined);

  readonly metodos = METODOS;

  private modalRef: NgbModalRef | null = null;

  readonly form: FormularioRepasse = new FormGroup({
    method: new FormControl<DeliveryPayoutMethod>('Pix', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    reference: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.payoutsService.getPending().subscribe({
      next: (lista) => {
        this.pendentes.set(lista);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  /** Soma de tudo que a plataforma deve agora. */
  totalDevido(): number {
    return this.pendentes().reduce((soma, p) => soma + Number(p.amount), 0);
  }

  abrirRepasse(pendente: PendingPayout, template: TemplateRef<unknown>): void {
    this.selecionado.set(pendente);
    this.form.reset({ method: 'Pix', reference: '', notes: '' });
    this.modalRef = this.modal.open(template, { centered: true, backdrop: 'static' });
  }

  fecharModal(): void {
    this.modalRef?.dismiss();
    this.modalRef = null;
    this.selecionado.set(undefined);
  }

  confirmarRepasse(): void {
    const pendente = this.selecionado();

    if (!pendente || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    this.payoutsService
      .registerPayout({
        courierId: pendente.courierId,
        method: this.form.controls.method.value,
        reference: this.form.controls.reference.value.trim() || undefined,
        notes: this.form.controls.notes.value.trim() || undefined,
        // O valor que ESTA tela mostrou. Divergiu, o back-end recusa com 409 e
        // não liquida nada.
        expectedAmount: Number(pendente.amount),
      })
      .subscribe({
        next: (repasse) => {
          this.toastService.showSuccess(
            `Repasse de ${this.formatarMoeda(repasse.amount)} registrado para ${repasse.courierName}.`
          );
          this.isSaving.set(false);
          this.fecharModal();
          this.carregar();
        },
        error: (erro: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(this.mensagemDeErro(erro));

          // Conflito significa que o saldo desta tela não vale mais. Recarregar
          // é parte da correção, não cortesia: sem isso o admin tentaria de
          // novo com o mesmo número errado.
          if (erro.status === 409) {
            this.fecharModal();
            this.carregar();
          }
        },
      });
  }

  /**
   * O back-end escreve mensagens específicas para os três conflitos possíveis —
   * saldo mudou, sem saldo, repasse concorrente. Elas dizem ao admin o que
   * fazer; trocá-las por um texto genérico perderia a informação.
   */
  private mensagemDeErro(erro: HttpErrorResponse): string {
    const corpo = erro.error as { message?: string | string[] } | null;
    const mensagem = corpo?.message;

    if (Array.isArray(mensagem) && mensagem.length) return mensagem[0];
    if (typeof mensagem === 'string' && mensagem.trim()) return mensagem;

    return 'Não foi possível registrar o repasse.';
  }

  formatarMoeda(valor: string | number): string {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  temEstorno(pendente: PendingPayout): boolean {
    return pendente.refundedDeliveries > 0;
  }

  voltar(): void {
    this.router.navigate(['/finance']);
  }
}
