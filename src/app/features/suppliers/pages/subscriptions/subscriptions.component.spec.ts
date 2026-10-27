import { HttpErrorResponse } from '@angular/common/http';
import { TemplateRef } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';

import { ToastService } from '@core/services/toast.service';

import { AdminSubscriptionListItem } from '../../models/supplier-subscription.model';
import { SuppliersService } from '../../services/suppliers.service';
import { SupplierSubscriptionsPanelComponent } from './subscriptions.component';

const TPL = {} as TemplateRef<unknown>;

function assinatura(parcial: Partial<AdminSubscriptionListItem> = {}): AdminSubscriptionListItem {
  return {
    subscriptionId: 12,
    provider: { id: 7, name: 'Marina Souza', email: 'marina@email.com', phone: null },
    planName: 'Plano Mensal',
    planInterval: 'Month',
    amount: 0,
    status: 'Active',
    categoryId: null,
    categoryName: null,
    isGranted: true,
    grantedBy: { id: 1, name: 'Admin', email: 'admin@email.com', phone: null },
    grantReason: 'Conta de testes',
    bonusMonths: 0,
    cancelAtPeriodEnd: false,
    currentPeriodStart: '2026-01-10T08:00:00.000Z',
    currentPeriodEnd: '2027-01-10T08:00:00.000Z',
    isCurrent: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    ...parcial,
  };
}

describe('SupplierSubscriptionsPanelComponent', () => {
  const getSubscriptions = jest.fn();
  const getSuppliers = jest.fn();
  const getActivePlanOptions = jest.fn();
  const grantSubscription = jest.fn();
  const addSubscriptionBonus = jest.fn();
  const showSuccess = jest.fn();
  const showError = jest.fn();
  const open = jest.fn();
  const navigate = jest.fn();

  function montar(): SupplierSubscriptionsPanelComponent {
    return TestBed.runInInjectionContext(() => new SupplierSubscriptionsPanelComponent());
  }

  function iniciado(): SupplierSubscriptionsPanelComponent {
    const component = montar();
    component.ngOnInit();
    return component;
  }

  beforeEach(() => {
    [
      getSubscriptions,
      getSuppliers,
      getActivePlanOptions,
      grantSubscription,
      addSubscriptionBonus,
      showSuccess,
      showError,
      open,
      navigate,
    ].forEach((mock) => mock.mockReset());

    getSubscriptions.mockReturnValue(of({ subscriptions: [assinatura()], pages: 1, count: 1 }));
    getSuppliers.mockReturnValue(
      of({
        providers: [{ id: 7, name: 'Marina Souza', email: 'marina@email.com' }],
        pages: 1,
        count: 1,
      })
    );
    getActivePlanOptions.mockReturnValue(
      of([{ id: 2, name: 'Plano Mensal', price: '49.90', interval: 'Month' }])
    );
    grantSubscription.mockReturnValue(
      of({ subscriptionId: 30, currentPeriodEnd: '2027-01-10T08:00:00.000Z' })
    );
    addSubscriptionBonus.mockReturnValue(of({ subscriptionId: 12, totalBonusMonths: 3 }));
    open.mockReturnValue({ dismiss: jest.fn() });

    TestBed.configureTestingModule({
      providers: [
        {
          provide: SuppliersService,
          useValue: {
            getSubscriptions,
            getSuppliers,
            getActivePlanOptions,
            grantSubscription,
            addSubscriptionBonus,
          },
        },
        { provide: ToastService, useValue: { showSuccess, showError } },
        { provide: NgbModal, useValue: { open } },
        { provide: Router, useValue: { navigate, url: '/suppliers/assinaturas' } },
      ],
    });
  });

  it('carrega o painel e os planos ao abrir', () => {
    const component = iniciado();

    expect(getSubscriptions).toHaveBeenCalledWith({ take: 10, skip: 1 });
    expect(component.assinaturas()).toHaveLength(1);
    expect(component.planos()).toHaveLength(1);
    expect(component.isLoading()).toBe(false);
    component.ngOnDestroy();
  });

  it('marca erro quando a busca falha', () => {
    getSubscriptions.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    const component = iniciado();

    expect(component.hasError()).toBe(true);
    component.ngOnDestroy();
  });

  it('sobrevive à falha ao buscar planos', () => {
    getActivePlanOptions.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    const component = iniciado();

    expect(component.planos()).toEqual([]);
    expect(component.hasError()).toBe(false);
    component.ngOnDestroy();
  });

  it('filtra por origem', () => {
    const component = iniciado();

    component.filtrarPorOrigem('Granted');

    expect(getSubscriptions).toHaveBeenLastCalledWith({ take: 10, skip: 1, origin: 'Granted' });
    component.ngOnDestroy();
  });

  it('volta a buscar tudo ao limpar a origem', () => {
    const component = iniciado();
    component.filtrarPorOrigem('Granted');

    component.filtrarPorOrigem('');

    expect(component.origem()).toBeNull();
    expect('origin' in getSubscriptions.mock.calls[2][0]).toBe(false);
    component.ngOnDestroy();
  });

  it('não refaz a busca ao escolher a origem já ativa', () => {
    const component = iniciado();
    component.filtrarPorOrigem('Granted');

    component.filtrarPorOrigem('Granted');

    expect(getSubscriptions).toHaveBeenCalledTimes(2);
    component.ngOnDestroy();
  });

  it('filtra por status', () => {
    const component = iniciado();

    component.filtrarPorSituacao('Cancelled');

    expect(getSubscriptions).toHaveBeenLastCalledWith({ take: 10, skip: 1, status: 'Cancelled' });
    component.ngOnDestroy();
  });

  it('volta para a primeira página ao filtrar', () => {
    getSubscriptions.mockReturnValue(of({ subscriptions: [assinatura()], pages: 3, count: 25 }));
    const component = iniciado();
    component.irParaPagina(3);
    expect(component.pagina()).toBe(3);

    component.filtrarPorOrigem('Paid');

    expect(component.pagina()).toBe(1);
    component.ngOnDestroy();
  });

  it('busca no servidor ao digitar, depois do debounce', fakeAsync(() => {
    const component = iniciado();

    component.buscaControl.setValue('Marina');
    tick(300);

    expect(getSubscriptions).toHaveBeenLastCalledWith({ take: 10, skip: 1, search: 'Marina' });
    component.ngOnDestroy();
  }));

  it('pagina pelo servidor', () => {
    getSubscriptions.mockReturnValue(of({ subscriptions: [assinatura()], pages: 3, count: 25 }));
    const component = iniciado();

    component.irParaPagina(2);

    expect(getSubscriptions).toHaveBeenLastCalledWith({ take: 10, skip: 2 });
    expect(component.totalDePaginas()).toBe(3);
    component.ngOnDestroy();
  });

  it('recusa página fora do intervalo', () => {
    getSubscriptions.mockReturnValue(of({ subscriptions: [assinatura()], pages: 3, count: 25 }));
    const component = iniciado();

    component.irParaPagina(0);
    component.irParaPagina(4);

    expect(component.pagina()).toBe(1);
    component.ngOnDestroy();
  });

  it('conta quantas da página são concedidas', () => {
    getSubscriptions.mockReturnValue(
      of({
        subscriptions: [
          assinatura({ subscriptionId: 1, isGranted: true }),
          assinatura({ subscriptionId: 2, isGranted: false }),
          assinatura({ subscriptionId: 3, isGranted: true }),
        ],
        pages: 1,
        count: 3,
      })
    );

    const component = iniciado();

    expect(component.concedidasNaPagina()).toBe(2);
    component.ngOnDestroy();
  });

  // O seletor de fornecedor busca no servidor; disparar com uma letra só
  // devolveria quase a base inteira a cada tecla.
  it('só busca fornecedor a partir de dois caracteres', fakeAsync(() => {
    const component = iniciado();

    component.fornecedorControl.setValue('M');
    tick(300);
    expect(getSuppliers).not.toHaveBeenCalled();

    component.fornecedorControl.setValue('Ma');
    tick(300);
    expect(getSuppliers).toHaveBeenCalledWith({ take: 10, search: 'Ma' });
    component.ngOnDestroy();
  }));

  it('limpa o fornecedor escolhido ao reabrir o formulário', fakeAsync(() => {
    const component = iniciado();
    component.fornecedorControl.setValue('Marina');
    tick(300);
    component.escolherFornecedor('7');
    expect(component.formConcessao.controls.providerId.value).toBe(7);

    component.abrirConcessao(TPL);

    expect(component.formConcessao.controls.providerId.value).toBeNull();
    expect(component.fornecedores()).toEqual([]);
    component.ngOnDestroy();
  }));

  it('não libera sem fornecedor e sem plano', () => {
    const component = iniciado();
    component.abrirConcessao(TPL);

    component.conceder();

    expect(grantSubscription).not.toHaveBeenCalled();
    expect(component.formConcessao.controls.providerId.touched).toBe(true);
    component.ngOnDestroy();
  });

  it('recusa duração acima do teto do back-end', () => {
    const component = iniciado();
    component.abrirConcessao(TPL);
    component.formConcessao.setValue({ providerId: 7, planId: 2, months: 121, reason: '' });

    component.conceder();

    expect(grantSubscription).not.toHaveBeenCalled();
    component.ngOnDestroy();
  });

  it('libera a assinatura do fornecedor escolhido', () => {
    const component = iniciado();
    component.abrirConcessao(TPL);
    component.formConcessao.setValue({
      providerId: 7,
      planId: 2,
      months: 6,
      reason: '  Ambiente de testes  ',
    });

    component.conceder();

    expect(grantSubscription).toHaveBeenCalledWith(7, {
      planId: 2,
      months: 6,
      reason: 'Ambiente de testes',
    });
    expect(showSuccess).toHaveBeenCalled();
    component.ngOnDestroy();
  });

  it('omite o motivo quando ele vem vazio', () => {
    const component = iniciado();
    component.abrirConcessao(TPL);
    component.formConcessao.setValue({ providerId: 7, planId: 2, months: 6, reason: '   ' });

    component.conceder();

    expect(grantSubscription).toHaveBeenCalledWith(7, { planId: 2, months: 6 });
    component.ngOnDestroy();
  });

  it('recarrega o painel depois de liberar', () => {
    const component = iniciado();
    component.abrirConcessao(TPL);
    component.formConcessao.setValue({ providerId: 7, planId: 2, months: 6, reason: '' });

    component.conceder();

    expect(getSubscriptions).toHaveBeenCalledTimes(2);
    component.ngOnDestroy();
  });

  /**
   * O 409 diz que o fornecedor já tem concessão vigente. Recarregar traz a
   * linha dele para o painel, onde o caminho é bonificar.
   */
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

    const component = iniciado();
    component.abrirConcessao(TPL);
    component.formConcessao.setValue({ providerId: 7, planId: 2, months: 6, reason: '' });
    component.conceder();

    expect(showError).toHaveBeenCalledWith('Este fornecedor já possui a concessão #12 ativa.');
    expect(getSubscriptions).toHaveBeenCalledTimes(2);
    expect(component.isSaving()).toBe(false);
    component.ngOnDestroy();
  });

  it('cai numa mensagem própria quando o erro não traz texto', () => {
    grantSubscription.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    const component = iniciado();
    component.abrirConcessao(TPL);
    component.formConcessao.setValue({ providerId: 7, planId: 2, months: 6, reason: '' });
    component.conceder();

    expect(showError).toHaveBeenCalledWith('Não foi possível liberar a assinatura.');
    component.ngOnDestroy();
  });

  // O bônus precisa do par fornecedor + assinatura, e os dois saem da linha
  // clicada. Trocar um pelo outro mandaria o id errado.
  it('bonifica usando o fornecedor e a assinatura da linha', () => {
    const component = iniciado();
    component.abrirBonus(
      assinatura({
        subscriptionId: 30,
        provider: { id: 9, name: 'Outro', email: 'outro@email.com', phone: null },
      }),
      TPL
    );
    component.formBonus.setValue({ months: 2 });

    component.bonificar();

    expect(addSubscriptionBonus).toHaveBeenCalledWith(9, 30, { months: 2 });
    expect(showSuccess).toHaveBeenCalledWith('Bônus aplicado. Total de 3 meses de bônus.');
    component.ngOnDestroy();
  });

  it('não envia bônus sem assinatura escolhida', () => {
    const component = iniciado();
    component.formBonus.setValue({ months: 2 });

    component.bonificar();

    expect(addSubscriptionBonus).not.toHaveBeenCalled();
    component.ngOnDestroy();
  });

  it('não envia bônus com meses inválidos', () => {
    const component = iniciado();
    component.abrirBonus(assinatura(), TPL);
    component.formBonus.setValue({ months: 0 });

    component.bonificar();

    expect(addSubscriptionBonus).not.toHaveBeenCalled();
    component.ngOnDestroy();
  });

  it('descreve cobertura ampla e por categoria', () => {
    const component = montar();

    expect(component.rotuloCobertura(assinatura({ categoryId: null }))).toBe('Todas as categorias');
    expect(component.rotuloCobertura(assinatura({ categoryId: 4, categoryName: 'Pintura' }))).toBe(
      'Pintura'
    );
    expect(component.rotuloCobertura(assinatura({ categoryId: 4, categoryName: null }))).toBe(
      'Categoria #4'
    );
  });

  it('distingue concedida de paga', () => {
    const component = montar();

    expect(component.rotuloOrigem(assinatura({ isGranted: true }))).toBe('Concedida');
    expect(component.rotuloOrigem(assinatura({ isGranted: false }))).toBe('Paga');
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

  it('abre o fornecedor da linha', () => {
    const component = montar();

    component.irParaFornecedor(assinatura());

    expect(navigate).toHaveBeenCalledWith(['/suppliers', 7]);
  });

  it('mostra sem prazo quando a vigência é aberta', () => {
    const component = montar();

    expect(component.formatarData(null)).toBe('Sem prazo');
  });
});
