import { HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '@core/services/api.service';
import { SUPPRESS_GLOBAL_ERROR_TOAST } from '@core/tokens/http-context.tokens';

import {
  DeliveryPayout,
  PendingPayout,
  RegisterPayoutInput,
} from '../models/delivery-payout.model';

@Injectable({ providedIn: 'root' })
export class DeliveryPayoutsService {
  private readonly apiService = inject(ApiService);

  /** Quanto a plataforma deve a cada entregador, com os dados bancários. */
  getPending(): Observable<PendingPayout[]> {
    return this.apiService.get<PendingPayout[]>('/v1/admin-delivery-payouts/pending');
  }

  /** Histórico de repasses já pagos, opcionalmente de um entregador só. */
  getHistory(courierId?: number): Observable<DeliveryPayout[]> {
    return this.apiService.get<DeliveryPayout[]>(
      '/v1/admin-delivery-payouts',
      courierId ? { courierId } : undefined
    );
  }

  /**
   * Registra um repasse já pago. Liquida **todo** o saldo em aberto.
   *
   * O toast global é suprimido de propósito: o back-end devolve três conflitos
   * diferentes em `409` — saldo mudou, sem saldo em aberto, repasse concorrente
   * — cada um com a sua mensagem pronta e específica. O `errorInterceptor` não
   * tem caso para `409` e cairia no genérico "Algo deu errado", descartando
   * justamente a informação que o admin precisa para decidir o que fazer.
   */
  registerPayout(payload: RegisterPayoutInput): Observable<DeliveryPayout> {
    const context = new HttpContext().set(SUPPRESS_GLOBAL_ERROR_TOAST, true);

    return this.apiService.post<DeliveryPayout>('/v1/admin-delivery-payouts', payload, {
      context,
    });
  }
}
