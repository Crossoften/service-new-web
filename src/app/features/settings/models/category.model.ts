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

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  iconUrl: string | null;
  iconKey: string | null;
  isActive: boolean;
  sortOrder: number;
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
  createdAt: string;
  updatedAt: string;
}

export interface UpsertCategoryInput {
  name: string;
  slug: string;
  /**
   * A imagem vai em par: `iconUrl` é o que renderiza, `iconKey` é a chave no
   * storage. `null` nos dois é o caminho para **remover** a imagem — omitir
   * deixaria a atual no lugar, que é outra coisa.
   */
  iconUrl?: string | null;
  iconKey?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}
