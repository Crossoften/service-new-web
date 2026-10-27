import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';

import {
  DELIVERY_PAYOUT_METHODS,
  DeliveryPayout,
  DeliveryPayoutMethod,
  PayoutCourierOption,
} from '../../models/delivery-payout.model';
import { DeliveryPayoutsService } from '../../services/delivery-payouts.service';

/**
 * A rota de histórico não é paginada: devolve tudo, já ordenado por `paidAt`
 * desc. A paginação aqui é sobre a lista que chegou.
 */
const TAMANHO_DA_PAGINA = 10;

@Component({
  selector: 'app-payout-history',
  standalone: true,
  imports: [CommonModule, LoadingSkeletonComponent, EmptyStateComponent, ErrorStateComponent],
  templateUrl: './payout-history.component.html',
  styleUrls: ['./payout-history.component.scss'],
})
export class PayoutHistoryComponent implements OnInit {
  private readonly payoutsService = inject(DeliveryPayoutsService);

  readonly repasses = signal<DeliveryPayout[]>([]);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly entregadorId = signal<number | null>(null);
  readonly pagina = signal(1);

  /**
   * Montadas só na carga sem filtro. Se fossem derivadas da lista filtrada, o
   * próprio filtro reduziria as opções a uma e o admin ficaria preso nela.
   */
  readonly entregadores = signal<PayoutCourierOption[]>([]);

  readonly totalDeRegistros = computed(() => this.repasses().length);

  readonly totalDePaginas = computed(() =>
    Math.max(1, Math.ceil(this.totalDeRegistros() / TAMANHO_DA_PAGINA))
  );

  readonly paginaAtual = computed(() => {
    const inicio = (this.pagina() - 1) * TAMANHO_DA_PAGINA;
    return this.repasses().slice(inicio, inicio + TAMANHO_DA_PAGINA);
  });

  readonly resumoDaPaginacao = computed(() => {
    const total = this.totalDeRegistros();
    if (total === 0) return '0 repasses';

    const inicio = (this.pagina() - 1) * TAMANHO_DA_PAGINA + 1;
    const fim = Math.min(this.pagina() * TAMANHO_DA_PAGINA, total);
    return `${inicio}-${fim} de ${total} repasses`;
  });

  /** Soma do que está em tela, respeitando o filtro. */
  readonly totalPago = computed(() =>
    this.repasses().reduce((soma, repasse) => soma + Number(repasse.amount), 0)
  );

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    const filtro = this.entregadorId();

    this.payoutsService.getHistory(filtro ?? undefined).subscribe({
      next: (lista) => {
        const repasses = lista ?? [];
        this.repasses.set(repasses);

        if (filtro === null) this.entregadores.set(this.montarEntregadores(repasses));

        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  filtrarPor(valor: string): void {
    const id = valor ? Number(valor) : null;
    if (id === this.entregadorId()) return;

    this.entregadorId.set(id);
    this.pagina.set(1);
    this.carregar();
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalDePaginas()) return;
    this.pagina.set(pagina);
  }

  rotuloDoMetodo(metodo: DeliveryPayoutMethod): string {
    return DELIVERY_PAYOUT_METHODS.find((m) => m.valor === metodo)?.rotulo ?? metodo;
  }

  formatarMoeda(valor: string | number): string {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarDataHora(valor: string): string {
    return new Date(valor).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private montarEntregadores(repasses: DeliveryPayout[]): PayoutCourierOption[] {
    const porId = new Map<number, string>();
    repasses.forEach((repasse) => porId.set(repasse.courierId, repasse.courierName));

    return [...porId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }
}
