import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { ApiService } from '@core/services/api.service';
import { SUPPRESS_GLOBAL_ERROR_TOAST } from '@core/tokens/http-context.tokens';

import { CategoriesService } from './categories.service';

const COMPLETA = {
  id: 1,
  name: 'Limpeza',
  slug: 'limpeza',
  iconUrl: 'https://cdn/limpeza.png',
  iconKey: 'icones/limpeza.png',
  isActive: true,
  sortOrder: 2,
  platformFeeRate: 7.5,
  createdAt: '2026-01-10T08:00:00.000Z',
  updatedAt: '2026-01-11T08:00:00.000Z',
};

const SEM_OPCIONAIS = {
  id: 2,
  name: 'Bebidas',
  slug: 'bebidas',
  isActive: true,
  sortOrder: 0,
  createdAt: '2026-01-10T08:00:00.000Z',
  updatedAt: '2026-01-10T08:00:00.000Z',
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let apiService: jest.Mocked<Pick<ApiService, 'get' | 'post' | 'patch'>>;

  beforeEach(() => {
    apiService = { get: jest.fn(), post: jest.fn(), patch: jest.fn() };

    TestBed.configureTestingModule({
      providers: [CategoriesService, { provide: ApiService, useValue: apiService }],
    });

    service = TestBed.inject(CategoriesService);
  });

  it('lista pelo contexto pedido', async () => {
    apiService.get.mockReturnValue(of([COMPLETA]));

    const categorias = await firstValueFrom(service.getAll('services'));

    expect(apiService.get).toHaveBeenCalledWith('/v1/admin-categories/services');
    expect(categorias[0].platformFeeRate).toBe(7.5);
  });

  it.each(['products', 'accommodations', 'transportations'] as const)(
    'lista o contexto %s pela mesma rota',
    async (contexto) => {
      apiService.get.mockReturnValue(of([SEM_OPCIONAIS]));

      await firstValueFrom(service.getAll(contexto));

      expect(apiService.get).toHaveBeenCalledWith(`/v1/admin-categories/${contexto}`);
    }
  );

  // Os contextos sem a coluna não mandam o campo. Sem o `?? null` a tela
  // receberia `undefined` e a coluna de taxa mostraria vazio em vez de "—".
  it('normaliza os campos ausentes para null', async () => {
    apiService.get.mockReturnValue(of([SEM_OPCIONAIS]));

    const [categoria] = await firstValueFrom(service.getAll('products'));

    expect(categoria.platformFeeRate).toBeNull();
    expect(categoria.iconUrl).toBeNull();
    expect(categoria.iconKey).toBeNull();
  });

  it('tolera lista vazia e resposta sem corpo', async () => {
    apiService.get.mockReturnValue(of(null));

    const categorias = await firstValueFrom(service.getAll('products'));

    expect(categorias).toEqual([]);
  });

  it('busca uma categoria pelo id dentro do contexto', async () => {
    apiService.get.mockReturnValue(of(COMPLETA));

    const categoria = await firstValueFrom(service.getById('services', 1));

    expect(apiService.get).toHaveBeenCalledWith('/v1/admin-categories/services/1');
    expect(categoria.name).toBe('Limpeza');
  });

  it('cria suprimindo o toast global, para o 409 chegar à tela', async () => {
    apiService.post.mockReturnValue(of(COMPLETA));

    await firstValueFrom(
      service.create('services', { name: 'Limpeza', slug: 'limpeza', platformFeeRate: 7.5 })
    );

    const [rota, corpo, opcoes] = apiService.post.mock.calls[0];
    expect(rota).toBe('/v1/admin-categories/services');
    expect(corpo).toEqual({ name: 'Limpeza', slug: 'limpeza', platformFeeRate: 7.5 });
    expect(opcoes?.context?.get(SUPPRESS_GLOBAL_ERROR_TOAST)).toBe(true);
  });

  it('edita suprimindo o toast global', async () => {
    apiService.patch.mockReturnValue(of(COMPLETA));

    await firstValueFrom(service.update('products', 2, { name: 'Bebidas geladas' }));

    const [rota, corpo, opcoes] = apiService.patch.mock.calls[0];
    expect(rota).toBe('/v1/admin-categories/products/2');
    expect(corpo).toEqual({ name: 'Bebidas geladas' });
    expect(opcoes?.context?.get(SUPPRESS_GLOBAL_ERROR_TOAST)).toBe(true);
  });

  it('inativa pela rota própria, sem apagar', async () => {
    apiService.patch.mockReturnValue(of({ ...COMPLETA, isActive: false }));

    const categoria = await firstValueFrom(service.inactivate('services', 1));

    expect(apiService.patch).toHaveBeenCalledWith('/v1/admin-categories/services/1/inactivate', {});
    expect(categoria.isActive).toBe(false);
  });

  // Não existe rota de reativar; o caminho de volta é o PATCH de edição.
  it('reativa pelo patch de edição', async () => {
    apiService.patch.mockReturnValue(of(COMPLETA));

    await firstValueFrom(service.reactivate('products', 2));

    const [rota, corpo] = apiService.patch.mock.calls[0];
    expect(rota).toBe('/v1/admin-categories/products/2');
    expect(corpo).toEqual({ isActive: true });
  });
});
