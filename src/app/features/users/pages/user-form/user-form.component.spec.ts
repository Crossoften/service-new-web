import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ToastService } from '@core/services/toast.service';
import { UploadsService } from '@core/services/uploads.service';

import { AdminUser } from '../../models/user.model';
import { UsersService } from '../../services/users.service';
import { UserFormComponent } from './user-form.component';

function usuario(parcial: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 7,
    name: 'Rafael Lima',
    email: 'rafael@email.com',
    phone: '+5534998701109',
    document: '123.456.789-10',
    biography: 'Pintor residencial há 12 anos.',
    code: '#007',
    role: 'User',
    profileType: 'Customer',
    status: 'Active',
    billingType: null,
    address: null,
    socialMedias: [],
    referralCode: 'RAF123',
    openServices: 0,
    birthDate: '1990-05-20T00:00:00.000Z',
    fileUrl: 'https://cdn/rafael.png',
    fileKey: 'perfis/rafael.png',
    deliveryCommissionRate: 15.5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...parcial,
  } as AdminUser;
}

function eventoDeArquivo(arquivo?: File): Event {
  return { target: { files: arquivo ? [arquivo] : [] } } as unknown as Event;
}

describe('UserFormComponent', () => {
  const getUserById = jest.fn();
  const updateUser = jest.fn();
  const uploadOne = jest.fn();
  const showSuccess = jest.fn();
  const navigate = jest.fn();

  function montar(): UserFormComponent {
    const component = TestBed.runInInjectionContext(() => new UserFormComponent());
    component.id = '7';
    return component;
  }

  function iniciado(parcial: Partial<AdminUser> = {}): UserFormComponent {
    getUserById.mockReturnValue(of(usuario(parcial)));
    const component = montar();
    component.ngOnInit();
    return component;
  }

  beforeEach(() => {
    [getUserById, updateUser, uploadOne, showSuccess, navigate].forEach((m) => m.mockReset());
    getUserById.mockReturnValue(of(usuario()));
    updateUser.mockReturnValue(of(usuario()));
    uploadOne.mockReturnValue(of({ fileUrl: 'https://cdn/nova.png', fileKey: 'perfis/nova.png' }));

    TestBed.configureTestingModule({
      providers: [
        { provide: UsersService, useValue: { getUserById, updateUser } },
        { provide: UploadsService, useValue: { uploadOne } },
        { provide: ToastService, useValue: { showSuccess, showError: jest.fn() } },
        { provide: Router, useValue: { navigate } },
      ],
    });
  });

  it('preenche o formulário com o detalhe carregado', () => {
    const component = iniciado();

    expect(getUserById).toHaveBeenCalledWith(7);
    expect(component.form.controls.name.value).toBe('Rafael Lima');
    expect(component.form.controls.biography.value).toBe('Pintor residencial há 12 anos.');
    expect(component.form.controls.birthDate.value).toBe('1990-05-20');
    expect(component.form.controls.deliveryCommissionRate.value).toBe(15.5);
    expect(component.fotoUrl()).toBe('https://cdn/rafael.png');
    expect(component.fotoKey()).toBe('perfis/rafael.png');
  });

  it('volta para a listagem quando o usuário não carrega', () => {
    getUserById.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    const component = montar();

    component.ngOnInit();

    expect(navigate).toHaveBeenCalledWith(['/users']);
  });

  // Mandar os dois campos vazios apagaria a foto de quem só mudou o nome.
  it('repete a foto gravada quando o admin não mexe nela', () => {
    const component = iniciado();

    component.onSave();

    expect(uploadOne).not.toHaveBeenCalled();
    expect(updateUser.mock.calls[0][1]).toMatchObject({
      fileUrl: 'https://cdn/rafael.png',
      fileKey: 'perfis/rafael.png',
    });
  });

  it('manda os dois campos nulos ao remover a foto, sem subir nada', () => {
    const component = iniciado();

    component.onRemoverFoto();
    component.onSave();

    expect(uploadOne).not.toHaveBeenCalled();
    expect(updateUser.mock.calls[0][1]).toMatchObject({ fileUrl: null, fileKey: null });
  });

  /**
   * O upload só acontece ao salvar. Subir na escolha deixaria arquivo órfão no
   * storage toda vez que o admin desistisse — e não há rota para o admin
   * limpar o arquivo de outro usuário.
   */
  it('sobe a imagem só ao salvar, e grava o par devolvido', () => {
    const component = iniciado();
    const arquivo = new File(['x'], 'nova.png', { type: 'image/png' });

    component.onSelecionarFoto(eventoDeArquivo(arquivo));
    expect(uploadOne).not.toHaveBeenCalled();

    component.onSave();

    expect(uploadOne).toHaveBeenCalledWith(arquivo);
    expect(updateUser.mock.calls[0][1]).toMatchObject({
      fileUrl: 'https://cdn/nova.png',
      fileKey: 'perfis/nova.png',
    });
  });

  it('não grava nada quando o upload falha', () => {
    uploadOne.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const component = iniciado();
    component.onSelecionarFoto(eventoDeArquivo(new File(['x'], 'nova.png')));

    component.onSave();

    expect(updateUser).not.toHaveBeenCalled();
    expect(component.isSaving()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ignora a escolha quando nenhum arquivo foi selecionado', () => {
    const component = iniciado();

    component.onSelecionarFoto(eventoDeArquivo());

    expect(component.novaFoto()).toBeUndefined();
  });

  it('escolher uma imagem cancela a remoção pendente', () => {
    const component = iniciado();
    component.onRemoverFoto();

    component.onSelecionarFoto(eventoDeArquivo(new File(['x'], 'nova.png')));

    expect(component.fotoMarcadaParaRemover()).toBe(false);
    expect(component.novaFoto()).toBeDefined();
  });

  it('desfazer limpa tanto a nova imagem quanto a remoção', () => {
    const component = iniciado();
    component.onRemoverFoto();

    component.onDesfazerFoto();

    expect(component.fotoMarcadaParaRemover()).toBe(false);
    expect(component.novaFoto()).toBeUndefined();
    expect(component.fotoEmExibicao).toBe('https://cdn/rafael.png');
  });

  it('esconde a foto em exibição enquanto a remoção está pendente', () => {
    const component = iniciado();

    component.onRemoverFoto();

    expect(component.fotoEmExibicao).toBeNull();
  });

  it('usa as iniciais quando não há foto', () => {
    const component = iniciado({ fileUrl: null, fileKey: null });

    expect(component.fotoEmExibicao).toBeNull();
    expect(component.iniciais).toBe('RL');
  });

  // Em branco devolve o usuário ao padrão da plataforma; zero é comissão
  // zerada. Tratar os dois igual cobraria de quem tem isenção.
  it('manda null quando a comissão fica em branco', () => {
    const component = iniciado();
    component.form.controls.deliveryCommissionRate.setValue(null);

    component.onSave();

    expect(updateUser.mock.calls[0][1].deliveryCommissionRate).toBeNull();
  });

  it('manda zero quando a comissão é zero', () => {
    const component = iniciado();
    component.form.controls.deliveryCommissionRate.setValue(0);

    component.onSave();

    expect(updateUser.mock.calls[0][1].deliveryCommissionRate).toBe(0);
  });

  it('carrega zero como zero, não como campo vazio', () => {
    const component = iniciado({ deliveryCommissionRate: 0 });

    expect(component.form.controls.deliveryCommissionRate.value).toBe(0);
  });

  it('carrega campo vazio quando o usuário não tem comissão própria', () => {
    const component = iniciado({ deliveryCommissionRate: null });

    expect(component.form.controls.deliveryCommissionRate.value).toBeNull();
  });

  it.each([
    [101, 'A comissão não pode passar de 100%.'],
    [-1, 'A comissão não pode ser menor que 0%.'],
    [15.555, 'Use no máximo 2 casas decimais.'],
  ])('recusa comissão de %s e explica o motivo', (valor, mensagem) => {
    const component = iniciado();
    component.form.controls.deliveryCommissionRate.setValue(valor);
    component.form.controls.deliveryCommissionRate.markAsTouched();

    component.onSave();

    expect(updateUser).not.toHaveBeenCalled();
    expect(component.erroDaComissao).toBe(mensagem);
  });

  it('aceita duas casas decimais', () => {
    const component = iniciado();
    component.form.controls.deliveryCommissionRate.setValue(15.5);

    component.onSave();

    expect(updateUser.mock.calls[0][1].deliveryCommissionRate).toBe(15.5);
    expect(component.erroDaComissao).toBeNull();
  });

  it('não mostra erro de comissão antes de o campo ser tocado', () => {
    const component = iniciado();
    component.form.controls.deliveryCommissionRate.setValue(101);

    expect(component.erroDaComissao).toBeNull();
  });

  it('avisa e navega para o detalhe ao salvar', () => {
    const component = iniciado();

    component.onSave();

    expect(showSuccess).toHaveBeenCalledWith('Usuário atualizado.');
    expect(navigate).toHaveBeenCalledWith(['/users', '7']);
  });

  it('não envia formulário com email inválido', () => {
    const component = iniciado();
    component.form.controls.email.setValue('nao-e-email');

    component.onSave();

    expect(updateUser).not.toHaveBeenCalled();
    expect(uploadOne).not.toHaveBeenCalled();
  });
});
