import { HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '@core/services/api.service';
import { SUPPRESS_GLOBAL_ERROR_TOAST } from '@core/tokens/http-context.tokens';

import { DeliveryFeeRule, UpsertDeliveryFeeRuleInput } from '../models/delivery-fee.model';

const ROTA = '/v1/admin-delivery-fees';

@Injectable({ providedIn: 'root' })
export class DeliveryFeesService {
  private readonly apiService = inject(ApiService);

  /** Já vêm ordenadas por distância inicial. */
  getAll(): Observable<DeliveryFeeRule[]> {
    return this.apiService.get<DeliveryFeeRule[]>(ROTA);
  }

  /**
   * O toast global é suprimido na criação e na edição para a tela poder exibir
   * a mensagem do back-end. Ele valida a faixa e responde `400` com texto
   * próprio — por exemplo, "A distância máxima da faixa precisa ser maior que a
   * mínima." O `errorInterceptor` trocaria isso por "Revise os dados
   * informados", que não diz qual dado nem por quê.
   */
  create(payload: UpsertDeliveryFeeRuleInput): Observable<DeliveryFeeRule> {
    return this.apiService.post<DeliveryFeeRule>(ROTA, payload, { context: this.semToast() });
  }

  update(id: number, payload: UpsertDeliveryFeeRuleInput): Observable<DeliveryFeeRule> {
    return this.apiService.patch<DeliveryFeeRule>(`${ROTA}/${id}`, payload, {
      context: this.semToast(),
    });
  }

  /**
   * Atalho para ligar e desligar a faixa sem abrir o formulário.
   *
   * O `PATCH` exige o corpo inteiro (`minKm`, `type` e `value` são
   * obrigatórios), então a faixa atual é reenviada com `isActive` trocado —
   * mandar só o booleano devolveria `400`.
   */
  setActive(regra: DeliveryFeeRule, isActive: boolean): Observable<DeliveryFeeRule> {
    return this.update(regra.id, {
      minKm: Number(regra.minKm),
      maxKm: regra.maxKm === null || regra.maxKm === undefined ? undefined : Number(regra.maxKm),
      type: regra.type,
      value: Number(regra.value),
      isActive,
    });
  }

  remove(id: number): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(`${ROTA}/${id}`);
  }

  private semToast(): HttpContext {
    return new HttpContext().set(SUPPRESS_GLOBAL_ERROR_TOAST, true);
  }
}
