import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { UsersService } from './users.service';

type ApiServiceMock = {
  get: jest.Mock;
  patch: jest.Mock;
};

describe('UsersService', () => {
  let service: UsersService;
  let apiService: ApiServiceMock;

  beforeEach(() => {
    apiService = { get: jest.fn(), patch: jest.fn() };

    TestBed.configureTestingModule({
      providers: [UsersService, { provide: ApiService, useValue: apiService }],
    });

    service = TestBed.inject(UsersService);
  });

  it('maps optional list address without converting the state name', async () => {
    apiService.get.mockReturnValue(
      of({
        users: [
          {
            id: 25,
            name: 'Rafael Lima Santos',
            email: 'rafael@email.com',
            phone: null,
            status: 'Active',
            birthDate: null,
            profileType: 'Delivery',
            fileUrl: null,
            address: {
              id: 5,
              city: 'Rio de Janeiro',
              state: 'Rio de Janeiro',
            },
          },
          {
            id: 19,
            name: 'Isabela',
            email: 'isabela@email.com',
            phone: null,
            status: 'Active',
            birthDate: null,
            profileType: 'Influencer',
            fileUrl: null,
            address: null,
          },
        ],
        currentPage: 1,
        totalPages: 1,
        totalRecords: 2,
      })
    );

    const result = await firstValueFrom(service.getUsers({ take: 10 }));

    expect(result.users[0].address).toEqual({
      id: 5,
      city: 'Rio de Janeiro',
      state: 'Rio de Janeiro',
    });
    expect(result.users[1].address).toBeNull();
  });
});

describe('UsersService · edição e status', () => {
  let service: UsersService;
  let apiService: ApiServiceMock;

  const DETALHE = {
    id: 7,
    name: 'Rafael Lima',
    email: 'rafael@email.com',
    phone: '+5534998701109',
    document: '123.456.789-10',
    biography: 'Pintor residencial há 12 anos.',
    status: 'Active',
    birthDate: '1990-05-20T00:00:00.000Z',
    profileType: 'Supplier',
    fileUrl: null,
    fileKey: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };

  beforeEach(() => {
    apiService = { get: jest.fn(), patch: jest.fn() };

    TestBed.configureTestingModule({
      providers: [UsersService, { provide: ApiService, useValue: apiService }],
    });

    service = TestBed.inject(UsersService);
  });

  it('envia a atualização para a rota do usuário', async () => {
    apiService.patch.mockReturnValue(of(DETALHE));

    await firstValueFrom(
      service.updateUser(7, {
        name: 'Rafael Lima',
        email: 'rafael@email.com',
        document: '123.456.789-10',
        phone: '+5534998701109',
        birthDate: '1990-05-20',
        biography: 'Pintor residencial há 12 anos.',
      })
    );

    expect(apiService.patch).toHaveBeenCalledWith('/v1/admin-users/7', {
      name: 'Rafael Lima',
      email: 'rafael@email.com',
      document: '123.456.789-10',
      phone: '+5534998701109',
      birthDate: '1990-05-20',
      biography: 'Pintor residencial há 12 anos.',
    });
  });

  /**
   * O detalhe é a única origem desses dois campos — a listagem não os traz.
   * Sem o mapeamento, a tela de edição abriria com documento e biografia
   * vazios e gravaria vazio por cima ao salvar.
   */
  it('traz document e biography do detalhe', async () => {
    apiService.patch.mockReturnValue(of(DETALHE));

    const atualizado = await firstValueFrom(
      service.updateUser(7, {
        name: 'Rafael Lima',
        email: 'rafael@email.com',
        document: null,
        phone: null,
        birthDate: null,
        biography: null,
      })
    );

    expect(atualizado.document).toBe('123.456.789-10');
    expect(atualizado.biography).toBe('Pintor residencial há 12 anos.');
  });

  it('alterna o status pela rota própria, sem mandar destino no corpo', async () => {
    apiService.patch.mockReturnValue(of({ ...DETALHE, status: 'Inactive' }));

    const atualizado = await firstValueFrom(service.toggleUserStatus(7));

    expect(apiService.patch).toHaveBeenCalledWith('/v1/admin-users/7/status-active', {});
    expect(atualizado.status).toBe('Inactive');
  });

  /**
   * A rota inverte o que está gravado, então o resultado precisa vir do
   * servidor. Aqui ela devolve `Active` para um usuário que estava `Pending` —
   * uma inversão calculada na tela teria chegado a `Inactive`.
   */
  it('adota o status devolvido, e não uma inversão calculada', async () => {
    apiService.patch.mockReturnValue(of({ ...DETALHE, status: 'Active' }));

    const atualizado = await firstValueFrom(service.toggleUserStatus(7));

    expect(atualizado.status).toBe('Active');
  });

  it('não inventa document nem biography na listagem', async () => {
    apiService.get.mockReturnValue(
      of({
        users: [
          {
            id: 7,
            name: 'Rafael Lima',
            email: 'rafael@email.com',
            phone: null,
            status: 'Active',
            birthDate: null,
            profileType: 'Supplier',
            fileUrl: null,
          },
        ],
        totalPages: 1,
        totalRecords: 1,
      })
    );

    const { users } = await firstValueFrom(service.getUsers({ take: 10 }));

    expect(users[0].document).toBeNull();
    expect(users[0].biography).toBeNull();
  });
});
