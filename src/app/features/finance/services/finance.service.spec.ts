import { TestBed } from '@angular/core/testing';
import { of, firstValueFrom } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { CreatePlanPayload, Plan } from '../models/finance.model';
import { FinanceService } from './finance.service';

type ApiServiceMock = {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};

describe('FinanceService plan contract', () => {
  let service: FinanceService;
  let apiService: ApiServiceMock;

  beforeEach(() => {
    apiService = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [FinanceService, { provide: ApiService, useValue: apiService }],
    });

    service = TestBed.inject(FinanceService);
  });

  it('keeps the optional service category id when creating segment-specific plans', async () => {
    const payload: CreatePlanPayload = {
      name: 'Plano Advogados',
      slug: 'plano-advogados',
      price: 99.9,
      interval: 'Month',
      intervalCount: 1,
      categoryId: 3,
    };
    const plan: Plan = {
      id: 7,
      name: payload.name,
      slug: payload.slug,
      description: null,
      price: '99.90',
      interval: 'Month',
      intervalCount: 1,
      bonusMonths: 0,
      monthlyPrice: '99.90',
      isActive: true,
      sortOrder: 1,
      categoryId: 3,
      createdAt: '2026-03-20T12:00:00.000Z',
      updatedAt: '2026-03-20T12:00:00.000Z',
    };
    apiService.post.mockReturnValue(of(plan));

    const response = await firstValueFrom(service.createPlan(payload));

    expect(apiService.post).toHaveBeenCalledWith('/v1/plans', payload);
    expect(response.categoryId).toBe(3);
  });
});
