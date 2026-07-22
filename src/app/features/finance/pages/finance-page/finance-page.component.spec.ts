import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { FinanceService } from '../../services/finance.service';
import {
  CreatePlanPayload,
  FinanceInfluencerCommission,
  Plan,
  PlatformSettings,
  ServiceCategoryFinance,
} from '../../models/finance.model';
import { FinancePageComponent } from './finance-page.component';

type FinanceServiceMock = {
  getPlatformSettings: jest.Mock;
  getPlans: jest.Mock;
  getServiceCategories: jest.Mock;
  updateInfluencerCommission: jest.Mock;
  createPlan: jest.Mock;
};

type FinancePagePrivate = {
  createPlanForm: (plan?: Plan) => FinancePageComponent['planForm'];
  buildPlanPayload: () => CreatePlanPayload;
};

describe('FinancePageComponent partner commissions', () => {
  let fixture: ComponentFixture<FinancePageComponent>;
  let component: FinancePageComponent;
  let financeService: FinanceServiceMock;

  const platformSettings: PlatformSettings = {
    influencerCommissionRate: 12.5,
    updatedAt: '2026-05-01T10:00:00.000Z',
  };

  const partner: FinanceInfluencerCommission = {
    id: 9,
    name: 'Influencer Parceiro',
    email: 'parceiro@email.com',
    phone: null,
    fileUrl: null,
    totalReferrals: 20,
    rankingPosition: 1,
    commissionRate: null,
    effectiveCommissionRate: 12.5,
    status: 'Active',
  };

  const serviceCategory: ServiceCategoryFinance = {
    id: 3,
    name: 'Advogados',
    platformFeeRate: 10,
  };

  const plan: Plan = {
    id: 12,
    name: 'Plano Advogados',
    slug: 'plano-advogados',
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

  beforeEach(async () => {
    financeService = {
      getPlatformSettings: jest.fn().mockReturnValue(of(platformSettings)),
      getPlans: jest.fn().mockReturnValue(of({ plans: [], totalRecords: 0 })),
      getServiceCategories: jest.fn().mockReturnValue(of([serviceCategory])),
      updateInfluencerCommission: jest.fn().mockReturnValue(of(undefined)),
      createPlan: jest.fn().mockReturnValue(of(plan)),
    };

    await TestBed.configureTestingModule({
      imports: [
        FinancePageComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: FinanceService, useValue: financeService },
        {
          provide: NgbModal,
          useValue: {
            open: jest.fn(() => ({
              close: jest.fn(),
              dismiss: jest.fn(),
              result: Promise.resolve(),
            })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FinancePageComponent);
    component = fixture.componentInstance;
  });

  it('sends a numeric exclusive commission value instead of a string', () => {
    component.selectPartnerCommission(partner);
    component.partnerCommissionForm.patchValue({ useGlobalRate: false, commissionRate: 17.75 });

    component.savePartnerCommission();

    expect(financeService.updateInfluencerCommission).toHaveBeenCalledWith(9, {
      commissionRate: 17.75,
    });
  });

  it('explains when a partner is using the current global commission rate', () => {
    expect(component.partnerCommissionLabel(partner)).toBe('12,5% global');
  });

  it('includes the selected segment when building a plan payload', () => {
    component.serviceCategories.set([serviceCategory]);
    const privateComponent = component as unknown as FinancePagePrivate;
    component.planForm = privateComponent.createPlanForm(plan);

    const payload = privateComponent.buildPlanPayload();

    expect(payload.categoryId).toBe(3);
    expect(component.planSegmentLabel(plan)).toBe('Advogados');
  });

  it.each([
    ['monthly', 'Month', 1, 'Mensal'],
    ['quarterly', 'Month', 3, 'Trimestral'],
    ['semiannual', 'Month', 6, 'Semestral'],
    ['annual', 'Year', 1, 'Anual'],
  ] as const)(
    'maps the %s business period to the backend contract',
    (billingCycle, interval, intervalCount, label) => {
      const privateComponent = component as unknown as FinancePagePrivate;
      component.planForm = privateComponent.createPlanForm();

      component.selectPlanBillingCycle(billingCycle);
      const payload = privateComponent.buildPlanPayload();

      expect(component.planForm.contains('intervalCount')).toBe(false);
      expect(payload.interval).toBe(interval);
      expect(payload.intervalCount).toBe(intervalCount);
      expect(component.selectedPlanBillingCycleLabel()).toBe(label);
    }
  );

  it.each([
    [{ interval: 'Month', intervalCount: 1 }, 'monthly', 'Mensal'],
    [{ interval: 'Month', intervalCount: 3 }, 'quarterly', 'Trimestral'],
    [{ interval: 'Month', intervalCount: 6 }, 'semiannual', 'Semestral'],
    [{ interval: 'Year', intervalCount: 1 }, 'annual', 'Anual'],
  ] as const)('restores an existing plan period when editing', (cycle, billingCycle, label) => {
    const privateComponent = component as unknown as FinancePagePrivate;
    const existingPlan = { ...plan, ...cycle };

    component.planForm = privateComponent.createPlanForm(existingPlan);

    expect(component.planForm.controls.billingCycle.value).toBe(billingCycle);
    expect(component.formatInterval(existingPlan)).toBe(label);
  });

  it('generates the internal plan code from the name when creating a plan', () => {
    const privateComponent = component as unknown as FinancePagePrivate;
    component.planForm = privateComponent.createPlanForm();
    component.planForm.patchValue({ name: 'Plano Saúde & Bem-estar', price: 79.9 });

    const payload = privateComponent.buildPlanPayload();

    expect(payload.slug).toBe('plano-saude-bem-estar');
  });

  it('requires a category only when the plan is limited to a specific segment', () => {
    const privateComponent = component as unknown as FinancePagePrivate;
    component.planForm = privateComponent.createPlanForm();

    component.selectPlanSegmentMode('specific');
    expect(component.planForm.controls.categoryId.hasError('required')).toBe(true);

    component.selectPlanCategory(serviceCategory.id);
    expect(component.planForm.controls.categoryId.valid).toBe(true);

    component.selectPlanSegmentMode('all');
    expect(component.planForm.controls.categoryId.value).toBeNull();
    expect(component.planForm.controls.categoryId.valid).toBe(true);
  });

  it('shows a specific modal before submitting a plan whose name already exists', () => {
    const privateComponent = component as unknown as FinancePagePrivate;
    component.plans.set([plan]);
    component.planForm = privateComponent.createPlanForm();
    component.planForm.patchValue({ name: '  PLANO ADVOGADOS  ', price: 99.9 });

    component.savePlan();

    expect(component.feedbackModal()).toEqual(
      expect.objectContaining({
        title: 'Plano já cadastrado',
        variant: 'error',
      })
    );
    expect(component.feedbackModal()?.description).toContain('Plano Advogados');
    expect(component.pendingPlanPayload()).toBeNull();
    expect(financeService.createPlan).not.toHaveBeenCalled();
  });

  it('shows the duplicate-plan modal when the API reports that the name already exists', () => {
    const privateComponent = component as unknown as FinancePagePrivate;
    component.planForm = privateComponent.createPlanForm();
    component.planForm.patchValue({ name: 'Plano repetido', price: 140 });
    component.pendingPlanPayload.set(privateComponent.buildPlanPayload());
    financeService.createPlan.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { message: 'A plan with this name already exists.' },
          })
      )
    );

    component.confirmCreatePlan();

    expect(component.feedbackModal()).toEqual(
      expect.objectContaining({
        title: 'Plano já cadastrado',
        variant: 'error',
      })
    );
    expect(component.pendingPlanPayload()).toBeNull();
    expect(component.isSavingPlan()).toBe(false);
  });
});
