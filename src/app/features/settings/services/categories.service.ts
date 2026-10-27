import { HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiService } from '@core/services/api.service';
import { SUPPRESS_GLOBAL_ERROR_TOAST } from '@core/tokens/http-context.tokens';

import {
  AdminCategory,
  AdminCategoryApiItem,
  CategoryContext,
  UpsertCategoryInput,
} from '../models/category.model';

const ROTA = '/v1/admin-categories';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly apiService = inject(ApiService);

  getAll(context: CategoryContext): Observable<AdminCategory[]> {
    return this.apiService
      .get<AdminCategoryApiItem[]>(`${ROTA}/${context}`)
      .pipe(map((itens) => (itens ?? []).map((item) => this.mapCategory(item))));
  }

  getById(context: CategoryContext, id: number): Observable<AdminCategory> {
    return this.apiService
      .get<AdminCategoryApiItem>(`${ROTA}/${context}/${id}`)
      .pipe(map((item) => this.mapCategory(item)));
  }

  /**
   * O toast global é suprimido na criação e na edição porque o back-end responde
   * com texto específico que a tela precisa mostrar: `409` "Já existe uma
   * categoria com o nome 'X' ou slug 'Y' no módulo de services." e `400` "A taxa
   * da plataforma existe apenas nas categorias de services." O `errorInterceptor`
   * trocaria as duas por uma mensagem genérica, que não diz qual campo corrigir.
   */
  create(context: CategoryContext, payload: UpsertCategoryInput): Observable<AdminCategory> {
    return this.apiService
      .post<AdminCategoryApiItem>(`${ROTA}/${context}`, payload, { context: this.semToast() })
      .pipe(map((item) => this.mapCategory(item)));
  }

  update(
    context: CategoryContext,
    id: number,
    payload: Partial<UpsertCategoryInput>
  ): Observable<AdminCategory> {
    return this.apiService
      .patch<AdminCategoryApiItem>(`${ROTA}/${context}/${id}`, payload, {
        context: this.semToast(),
      })
      .pipe(map((item) => this.mapCategory(item)));
  }

  /**
   * **Inativa, não apaga.** A categoria é referenciada por serviços, anúncios e
   * assinaturas por categoria; remover a linha quebraria esses vínculos. Por
   * isso o back-end não expõe `DELETE`.
   */
  inactivate(context: CategoryContext, id: number): Observable<AdminCategory> {
    return this.apiService
      .patch<AdminCategoryApiItem>(`${ROTA}/${context}/${id}/inactivate`, {})
      .pipe(map((item) => this.mapCategory(item)));
  }

  /** Não há rota de reativar; o `PATCH` de edição faz o caminho de volta. */
  reactivate(context: CategoryContext, id: number): Observable<AdminCategory> {
    return this.update(context, id, { isActive: true });
  }

  private mapCategory(item: AdminCategoryApiItem): AdminCategory {
    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      iconUrl: item.iconUrl ?? null,
      iconKey: item.iconKey ?? null,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private semToast(): HttpContext {
    return new HttpContext().set(SUPPRESS_GLOBAL_ERROR_TOAST, true);
  }
}
