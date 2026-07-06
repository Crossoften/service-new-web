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
});
