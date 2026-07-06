import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, firstValueFrom } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { SessionService } from '@core/services/session.service';
import { AuthApiService } from './auth-api.service';
import { BillingType, MySelfResponse, UpdateAddressPayload } from '../models/auth.model';

type ApiServiceMock = {
  get: jest.Mock;
  patch: jest.Mock;
  post: jest.Mock;
};

describe('AuthApiService profile contract', () => {
  let service: AuthApiService;
  let apiService: ApiServiceMock;

  const profileResponse: MySelfResponse = {
    id: 19,
    name: 'João Carlos',
    email: 'joao@email.com',
    document: '123.456.789-10',
    phone: '(34) 99999-0000',
    biography: 'Profissional com 8 anos de experiência.',
    role: 'User',
    profileType: 'Supplier',
    status: 'Active',
    fileUrl: 'https://cdn.seudominio.com/users/profile.png',
    fileKey: 'users/profile.png',
    referralCode: 'joaosilva',
    birthDate: '1990-01-01T00:00:00.000Z',
    commissionRate: 10.5,
    billingType: 'Subscription',
    socialMedias: [
      {
        id: 1,
        network: 'Instagram',
        url: 'https://instagram.com/joaosilva',
        followers: 15400,
        createdAt: '2026-03-17T01:00:00.000Z',
        updatedAt: '2026-03-17T01:00:00.000Z',
      },
    ],
    address: {
      id: 1,
      street: 'Rua das Palmeiras',
      number: '458',
      neighborhood: 'Centro',
      city: 'Uberlândia',
      state: 'Minas Gerais',
      zipCode: '38400-000',
      createdAt: '2026-03-17T01:00:00.000Z',
      updatedAt: '2026-03-17T01:00:00.000Z',
    },
    createdAt: '2026-03-17T01:00:00.000Z',
    updatedAt: '2026-03-17T01:00:00.000Z',
  };

  beforeEach(() => {
    apiService = {
      get: jest.fn(),
      patch: jest.fn(),
      post: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthApiService,
        { provide: ApiService, useValue: apiService },
        { provide: SessionService, useValue: { setSession: jest.fn(), clearSession: jest.fn() } },
        { provide: HttpClient, useValue: { get: jest.fn() } },
      ],
    });

    service = TestBed.inject(AuthApiService);
  });

  it('loads the expanded authenticated profile from /v1/profile/me', async () => {
    apiService.get.mockReturnValue(of(profileResponse));

    const response = await firstValueFrom(service.getMySelf());

    expect(apiService.get).toHaveBeenCalledWith('/v1/profile/me');
    expect(response.billingType).toBe('Subscription');
    expect(response.socialMedias[0].followers).toBe(15400);
    expect(response.address?.number).toBe('458');
  });

  it('updates the authenticated user address through the dedicated profile address route', async () => {
    const payload: UpdateAddressPayload = {
      street: 'Rua das Palmeiras',
      number: '458',
      neighborhood: 'Centro',
      city: 'Uberlândia',
      state: 'Minas Gerais',
      zipCode: '38400-000',
    };
    apiService.patch.mockReturnValue(of(profileResponse.address));

    const response = await firstValueFrom(service.updateMyAddress(payload));

    expect(apiService.patch).toHaveBeenCalledWith('/v1/profile/me/address', payload);
    expect(response.number).toBe('458');
  });

  it('updates the authenticated user billing type through the dedicated profile billing route', async () => {
    const billingType: BillingType = 'Commission';
    apiService.patch.mockReturnValue(of({ ...profileResponse, billingType }));

    const response = await firstValueFrom(service.updateMyBillingType({ billingType }));

    expect(apiService.patch).toHaveBeenCalledWith('/v1/profile/me/billing-type', { billingType });
    expect(response.billingType).toBe('Commission');
  });
});
