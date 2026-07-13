import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { UsersService } from './users.service';

type ApiServiceMock = {
  get: jest.Mock;
};

describe('UsersService', () => {
  let service: UsersService;
  let apiService: ApiServiceMock;

  beforeEach(() => {
    apiService = { get: jest.fn() };

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
