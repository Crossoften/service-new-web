import { TestBed } from '@angular/core/testing';
import { of, firstValueFrom } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { InfluencersService } from './influencers.service';

type ApiServiceMock = {
  get: jest.Mock;
};

describe('InfluencersService', () => {
  let service: InfluencersService;
  let apiService: ApiServiceMock;

  beforeEach(() => {
    apiService = { get: jest.fn() };

    TestBed.configureTestingModule({
      providers: [InfluencersService, { provide: ApiService, useValue: apiService }],
    });

    service = TestBed.inject(InfluencersService);
  });

  it('sends status, sorting and pagination filters supported by the admin influencers contract', async () => {
    apiService.get.mockReturnValue(
      of({ influencers: [], currentPage: 1, totalPages: 1, totalRecords: 0 })
    );

    await firstValueFrom(
      service.getInfluencers({
        take: 25,
        skip: 2,
        status: 'Active',
        sortBy: 'name',
        sortDirection: 'asc',
      })
    );

    expect(apiService.get).toHaveBeenCalledWith('/v1/admin-influencers', {
      take: 25,
      skip: 2,
      status: 'Active',
      sortBy: 'name',
      sortDirection: 'asc',
    });
  });

  it('loads referrals from the influencer referrals route', async () => {
    apiService.get.mockReturnValue(
      of({
        referrals: [
          {
            id: 7,
            name: 'Maria Cliente',
            email: 'maria@email.com',
            phone: '(34) 99999-0000',
            status: 'Active',
            profileType: 'Client',
            billingType: 'Subscription',
            address: { city: 'Uberlândia', state: 'MG' },
            fileUrl: null,
            createdAt: '2026-03-17T01:00:00.000Z',
          },
        ],
      })
    );

    const referrals = await firstValueFrom(service.getInfluencerReferrals(15));

    expect(apiService.get).toHaveBeenCalledWith('/v1/admin-influencers/15/referrals');
    expect(referrals).toEqual([
      {
        id: 7,
        name: 'Maria Cliente',
        email: 'maria@email.com',
        phone: '(34) 99999-0000',
        status: 'Active',
        profileType: 'Client',
        billingType: 'Subscription',
        city: 'Uberlândia',
        state: 'MG',
        fileUrl: null,
        createdAt: '2026-03-17T01:00:00.000Z',
      },
    ]);
  });

  it('maps influencer address independently from total referrals', async () => {
    apiService.get.mockReturnValue(
      of({
        influencers: [
          {
            id: 19,
            name: 'Isabela',
            email: 'isabela@email.com',
            phone: null,
            fileUrl: null,
            ranking: 2,
            totalReferrals: 1,
            status: 'Active',
            address: null,
          },
          {
            id: 25,
            name: 'Rafael Lima Santos',
            email: 'rafael@email.com',
            phone: null,
            fileUrl: null,
            ranking: 3,
            totalReferrals: 0,
            status: 'Active',
            address: {
              id: 5,
              city: 'Rio de Janeiro',
              state: 'Rio de Janeiro',
            },
          },
        ],
        currentPage: 1,
        totalPages: 1,
        totalRecords: 2,
      })
    );

    const result = await firstValueFrom(service.getInfluencers({ take: 10 }));

    expect(result.influencers[0].address).toBeNull();
    expect(result.influencers[0].stats.totalReferrals).toBe(1);
    expect(result.influencers[1].address).toEqual({
      id: 5,
      city: 'Rio de Janeiro',
      state: 'Rio de Janeiro',
    });
    expect(result.influencers[1].stats.totalReferrals).toBe(0);
  });

  it('loads influencer regional ranking with required city and state filters', async () => {
    apiService.get.mockReturnValue(
      of({
        ranking: [
          {
            position: 1,
            city: 'Uberlândia',
            state: 'MG',
            totalInfluencers: 3,
            totalReferrals: 27,
          },
        ],
      })
    );

    const ranking = await firstValueFrom(
      service.getRegionalRanking({ state: 'MG', city: 'Uberlândia' })
    );

    expect(apiService.get).toHaveBeenCalledWith('/v1/admin-influencers/ranking/location', {
      state: 'MG',
      city: 'Uberlândia',
    });
    expect(ranking).toEqual([
      {
        position: 1,
        city: 'Uberlândia',
        state: 'MG',
        totalInfluencers: 3,
        totalReferrals: 27,
      },
    ]);
  });
});
