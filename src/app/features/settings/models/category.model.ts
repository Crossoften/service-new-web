/**
 * Os quatro contextos que `/v1/admin-categories/{context}` aceita.
 *
 * Categorias de restaurante ficam de fora de propósito: o cardápio tem rotas
 * próprias (`/v1/restaurants/menu-categories`), não este `{context}`.
 */
export type CategoryContext = 'services' | 'products' | 'accommodations' | 'transportations';

export const CATEGORY_CONTEXTS: ReadonlyArray<{ valor: CategoryContext; rotulo: string }> = [
  { valor: 'services', rotulo: 'Serviços' },
  { valor: 'products', rotulo: 'Produtos' },
  { valor: 'accommodations', rotulo: 'Hospedagens' },
  { valor: 'transportations', rotulo: 'Transportes' },
];

/**
 * Só `services` tem taxa da plataforma — é o único contexto com a coluna no
 * banco. Nos outros três o back-end recusa o campo com 400, então a tela não
 * pode nem oferecê-lo.
 */
export const CONTEXTO_COM_TAXA: CategoryContext = 'services';

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  iconUrl: string | null;
  iconKey: string | null;
  isActive: boolean;
  sortOrder: number;
  /** Nulo nos contextos que não têm a coluna. */
  platformFeeRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoryApiItem {
  id: number;
  name: string;
  slug: string;
  iconUrl?: string | null;
  iconKey?: string | null;
  isActive: boolean;
  sortOrder: number;
  platformFeeRate?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertCategoryInput {
  name: string;
  slug: string;
  iconUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
  platformFeeRate?: number;
}
