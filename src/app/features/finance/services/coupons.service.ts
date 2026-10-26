import { HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiService } from '@core/services/api.service';
import { SUPPRESS_GLOBAL_ERROR_TOAST } from '@core/tokens/http-context.tokens';

import { Coupon, RestaurantOption, UpsertCouponInput } from '../models/coupon.model';

const ROTA = '/v1/admin-coupons';

/** O seletor de restaurante busca uma página só; acima disso precisaria de busca. */
const LIMITE_DE_RESTAURANTES = 100;

@Injectable({ providedIn: 'root' })
export class CouponsService {
  private readonly apiService = inject(ApiService);

  getAll(): Observable<Coupon[]> {
    return this.apiService.get<Coupon[]>(ROTA);
  }

  getById(id: number): Observable<Coupon> {
    return this.apiService.get<Coupon>(`${ROTA}/${id}`);
  }

  /**
   * O toast global é suprimido na criação e na edição porque o back-end valida
   * relações entre campos e responde `400` com texto específico: "Cupom de
   * percentual ou valor fixo precisa de um valor.", "Um cupom percentual não
   * pode passar de 100%.", "O fim da vigência precisa ser depois do início.",
   * "Já existe um cupom com o código X." O `errorInterceptor` trocaria todas
   * por "Revise os dados informados", que não diz qual campo.
   */
  create(payload: UpsertCouponInput): Observable<Coupon> {
    return this.apiService.post<Coupon>(ROTA, payload, { context: this.semToast() });
  }

  update(id: number, payload: Partial<UpsertCouponInput>): Observable<Coupon> {
    return this.apiService.patch<Coupon>(`${ROTA}/${id}`, payload, {
      context: this.semToast(),
    });
  }

  /**
   * **Desativa, não apaga.** Cupom já resgatado tem pedidos apontando para ele,
   * e remover a linha quebraria o histórico de quem usou o desconto. A rota é
   * `DELETE` por convenção REST, mas o efeito é `isActive: false` — por isso
   * ela devolve o cupom, e não vazio.
   */
  deactivate(id: number): Observable<Coupon> {
    return this.apiService.delete<Coupon>(`${ROTA}/${id}`);
  }

  /** Reativa pelo `PATCH`; o `DELETE` só sabe desativar. */
  reactivate(id: number): Observable<Coupon> {
    return this.update(id, { isActive: true });
  }

  /**
   * Opções para o seletor de restaurante do formulário.
   *
   * Mora aqui porque o cupom é o único consumidor. Se outra tela precisar da
   * mesma lista, vale promover para um serviço próprio em vez de duplicar.
   */
  getRestaurantOptions(): Observable<RestaurantOption[]> {
    return this.apiService
      .get<{ restaurants: Array<{ id: number; name: string }> }>('/v1/restaurants', {
        take: LIMITE_DE_RESTAURANTES,
      })
      .pipe(map((res) => (res.restaurants ?? []).map((r) => ({ id: r.id, name: r.name }))));
  }

  private semToast(): HttpContext {
    return new HttpContext().set(SUPPRESS_GLOBAL_ERROR_TOAST, true);
  }
}
