import { HttpErrorResponse } from '@angular/common/http';
import { TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';

import { ToastService } from '@core/services/toast.service';

import { ProviderSubscription } from '../../models/supplier-subscription.model';
import { SuppliersService } from '../../services/suppliers.service';
import { SupplierSubscriptionsComponent } from './supplier-subscriptions.component';

const FORNECEDOR = 7;
const TPL = {} as TemplateRef<unknown>;

function assinatura(parcial: Partial<ProviderSubscription> = {}): ProviderSubscription {
  return {
    subscriptionId: 12,
    planId: 2,
    planName: 'Plano Mensal',
    planInterval: 'Month',
    intervalCount: 1,
    amount: 0,
    status: 'Active',
    categoryId: null,
    categoryName: null,
    isGranted: true,
    grantedById: 1,
    grantReason: null,
    bonusMonths: 0,
    cancelAtPeriodEnd: false,
    startedAt: '2026-01-10T08:00:00.000Z',
    currentPeriodStart: '2026-01-10T08:00:00.000Z',
    currentPeriodEnd: '2027-01-10T08:00:00.000Z',
    isCurrent: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    ...parcial,
  };
}

describe('SupplierSubscriptionsComponent', () => {
  const getSupplierSubscriptions = jest.fn();
  const grantSubscription = jest.fn();
  const addSubscriptionBonus = jest.fn();
  const getActivePlanOptions = jest.fn();
  const showSuccess = jest.fn();
  const showError = jest.fn();
  const open = jest.fn();

  function montar(): SupplierSubscriptionsComponent {
    const component = TestBed.runInInjectionContext(() => new SupplierSubscriptionsComponent());
    component.providerId = FORNECEDOR;
    return component;
  }

  beforeEach(() => {
    [
      getSupplierSubscriptions,
      grantSubscription,
      addSubscriptionBonus,
      getActivePlanOptions,
      showSuccess,
      showError,
      open,
    ].forEach((mock) => mock.mockReset());

    getSupplierSubscriptions.mockReturnValue(
      of({ providerId: FORNECEDOR, activeGrantId: null, subscriptions: [] })
    );
    getActivePlanOptions.mockReturnValue(
      of([{ id: 2, name: 'Plano Mensal', price: '49.90', interval: 'Month' }])
    );
    open.mockReturnValue({ dismiss: jest.fn() });

    TestBed.configureTestingModule({
      providers: [
        {
          provide: SuppliersService,
          useValue: {
            getSupplierSubscriptions,
            grantSubscription,
            addSubscriptionBonus,
            getActivePlanOptions,
          },
        },
        { provide: ToastService, useValue: { showSuccess, showError } },
        { provide: NgbModal, useValue: { open } },
      ],
    });
  });

  it('carrega assinaturas e planos ao iniciar', () => {
    getSupplierSubscriptions.mockReturnValue(
      of({ providerId: FORNECEDOR, activeGrantId: 12, subscriptions: [assinatura()] })
    );

    const component = montar();
    component.ngOnInit();

    expect(getSupplierSubscriptions).toHaveBeenCalledWith(FORNECEDOR);
    expect(component.assinaturas()).toHaveLength(1);
    expect(component.concessaoVigenteId()).toBe(12);
    expect(component.planos()).toHaveLength(1);
    expect(component.isLoading()).toBe(false);
  });

  it('marca erro quando a busca falha', () => {
    getSupplierSubscriptions.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    const component = montar();
    component.ngOnInit();

    expect(component.hasError()).toBe(true);
    expect(component.isLoading()).toBe(false);
  });

  // O card existe para mostrar as assinaturas; falhar o seletor de planos não
  // pode levar o card embora.
  it('sobrevive à falha ao buscar planos', () => {
    getActivePlanOptions.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    const component = montar();
    component.ngOnInit();

    expect(component.planos()).toEqual([]);
    expect(component.hasError()).toBe(false);
    expect(component.assinaturas()).toEqual([]);
  });

  it('bloqueia conceder quando já existe concessão vigente', () => {
    getSupplierSubscriptions.mockReturnValue(
      of({ providerId: FORNECEDOR, activeGrantId: 12, subscriptions: [assinatura()] })
    );

    const component = montar();
    component.ngOnInit();

    expect(component.podeConceder).toBe(false);

    component.abrirConcessao(TPL);

    expect(open).not.toHaveBeenCalled();
  });

  it('libera conceder quando não existe concessão vigente', () => {
    const component = montar();
    component.ngOnInit();

    expect(component.podeConceder).toBe(true);

    component.abrirConcessao(TPL);

    expect(open).toHaveBeenCalledTimes(1);
  });

  it('não envia concessão com formulário inválido', () => {
    const component = montar();
    component.ngOnInit();
    component.abrirConcessao(TPL);

    component.conceder();

    expect(grantSubscription).not.toHaveBeenCalled();
    expect(component.formConcessao.controls.planId.touched).toBe(true);
  });

  it('recusa duração acima do teto do back-end', () => {
    const component = montar();
    component.ngOnInit();
    component.abrirConcessao(TPL);
    component.formConcessao.setValue({ planId: 2, months: 121, reason: '' });

    component.conceder();

    expect(grantSubscription).not.toHaveBeenCalled();
  });

  it('omite o motivo quando ele vem vazio, em vez de mandar string vazia', () => {
    grantSubscription.mockReturnValue(of({ subscriptionId: 30 }));

    const component = montar();
    component.ngOnInit();
    component.abrirConcessao(TPL);
    component.formConcessao.setValue({ planId: 2, months: 6, reason: '   ' });

    component.conceder();

    expect(grantSubscription).toHaveBeenCalledWith(FORNECEDOR, { planId: 2, months: 6 });
    expect(showSuccess).toHaveBeenCalled();
  });

  it('envia o motivo sem espaços nas pontas', () => {
    grantSubscription.mockReturnValue(of({ subscriptionId: 30 }));

    const component = montar();
    component.ngOnInit();
    component.abrirConcessao(TPL);
    component.formConcessao.setValue({ planId: 2, months: 6, reason: '  Cortesia parceiro X  ' });

    component.conceder();

    expect(grantSubscription).toHaveBeenCalledWith(FORNECEDOR, {
      planId: 2,
      months: 6,
      reason: 'Cortesia parceiro X',
    });
  });

  // O 409 traz o id da concessão que já existe. Recarregar troca o botão de
  // conceder pelo de bonificar, que é o caminho que resta ao admin.
  it('mostra a mensagem do back-end e recarrega no 409', () => {
    grantSubscription.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'Este fornecedor já possui a concessão #12 ativa.' },
          })
      )
    );

    const component = montar();
    component.ngOnInit();
    expect(getSupplierSubscriptions).toHaveBeenCalledTimes(1);

    component.abrirConcessao(TPL);
    component.formConcessao.setValue({ planId: 2, months: 6, reason: '' });
    component.conceder();

    expect(showError).toHaveBeenCalledWith('Este fornecedor já possui a concessão #12 ativa.');
    expect(getSupplierSubscriptions).toHaveBeenCalledTimes(2);
    expect(component.isSaving()).toBe(false);
  });

  it('cai numa mensagem própria quando o erro não traz texto', () => {
    grantSubscription.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    const component = montar();
    component.ngOnInit();
    component.abrirConcessao(TPL);
    component.formConcessao.setValue({ planId: 2, months: 6, reason: '' });
    component.conceder();

    expect(showError).toHaveBeenCalledWith('Não foi possível conceder a assinatura.');
  });

  it('aplica o bônus na assinatura escolhida', () => {
    addSubscriptionBonus.mockReturnValue(of({ subscriptionId: 30, totalBonusMonths: 4 }));

    const component = montar();
    component.ngOnInit();
    component.abrirBonus(assinatura({ subscriptionId: 30 }), TPL);
    component.formBonus.setValue({ months: 2 });

    component.bonificar();

    expect(addSubscriptionBonus).toHaveBeenCalledWith(FORNECEDOR, 30, { months: 2 });
    expect(showSuccess).toHaveBeenCalledWith('Bônus aplicado. Total de 4 meses de bônus.');
  });

  it('concorda o plural do total de bônus', () => {
    addSubscriptionBonus.mockReturnValue(of({ subscriptionId: 30, totalBonusMonths: 1 }));

    const component = montar();
    component.ngOnInit();
    component.abrirBonus(assinatura({ subscriptionId: 30 }), TPL);
    component.formBonus.setValue({ months: 1 });

    component.bonificar();

    expect(showSuccess).toHaveBeenCalledWith('Bônus aplicado. Total de 1 mês de bônus.');
  });

  it('não envia bônus sem assinatura escolhida', () => {
    const component = montar();
    component.ngOnInit();
    component.formBonus.setValue({ months: 2 });

    component.bonificar();

    expect(addSubscriptionBonus).not.toHaveBeenCalled();
  });

  it('não envia bônus com meses inválidos', () => {
    const component = montar();
    component.ngOnInit();
    component.abrirBonus(assinatura(), TPL);
    component.formBonus.setValue({ months: 0 });

    component.bonificar();

    expect(addSubscriptionBonus).not.toHaveBeenCalled();
  });

  it('descreve cobertura ampla e cobertura por categoria', () => {
    const component = montar();

    expect(component.rotuloCobertura(assinatura({ categoryId: null }))).toBe('Todas as categorias');
    expect(component.rotuloCobertura(assinatura({ categoryId: 4, categoryName: 'Pintura' }))).toBe(
      'Pintura'
    );
    expect(component.rotuloCobertura(assinatura({ categoryId: 4, categoryName: null }))).toBe(
      'Categoria #4'
    );
  });

  it('usa a vigência, não só o status, para colorir o badge', () => {
    const component = montar();

    expect(component.classeStatus(assinatura({ isCurrent: true }))).toBe('active');
    expect(component.classeStatus(assinatura({ status: 'Pending', isCurrent: false }))).toBe(
      'pending'
    );
    expect(component.classeStatus(assinatura({ status: 'Active', isCurrent: false }))).toBe(
      'inactive'
    );
  });

  it('mostra assinatura sem prazo como sem prazo', () => {
    const component = montar();

    expect(component.formatarData(null)).toBe('Sem prazo');
  });
});
