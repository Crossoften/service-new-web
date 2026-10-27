import { HttpErrorResponse } from '@angular/common/http';
import { TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';

import { ToastService } from '@core/services/toast.service';
import { UploadsService } from '@core/services/uploads.service';

import { AdminCategory } from '../../models/category.model';
import { CategoriesService } from '../../services/categories.service';
import { CategoriesComponent } from './categories.component';

const TPL = {} as TemplateRef<unknown>;

function eventoDeArquivo(arquivo?: File): Event {
  return { target: { files: arquivo ? [arquivo] : [] } } as unknown as Event;
}

function categoria(parcial: Partial<AdminCategory> = {}): AdminCategory {
  return {
    id: 1,
    name: 'Limpeza',
    slug: 'limpeza',
    iconUrl: null,
    iconKey: null,
    isActive: true,
    sortOrder: 2,
    platformFeeRate: 7.5,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
    ...parcial,
  };
}

describe('CategoriesComponent', () => {
  const getAll = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const inactivate = jest.fn();
  const reactivate = jest.fn();
  const showSuccess = jest.fn();
  const showError = jest.fn();
  const open = jest.fn();
  const navigate = jest.fn();
  const uploadOne = jest.fn();

  function montar(): CategoriesComponent {
    return TestBed.runInInjectionContext(() => new CategoriesComponent());
  }

  beforeEach(() => {
    [
      getAll,
      create,
      update,
      inactivate,
      reactivate,
      showSuccess,
      showError,
      open,
      navigate,
      uploadOne,
    ].forEach((mock) => mock.mockReset());

    getAll.mockReturnValue(of([categoria()]));
    open.mockReturnValue({ dismiss: jest.fn() });
    uploadOne.mockReturnValue(
      of({ fileUrl: 'http://localhost:8000/v1/files/nova.png', fileKey: 'icones/nova.png' })
    );

    TestBed.configureTestingModule({
      providers: [
        {
          provide: CategoriesService,
          useValue: { getAll, create, update, inactivate, reactivate },
        },
        { provide: ToastService, useValue: { showSuccess, showError } },
        { provide: UploadsService, useValue: { uploadOne } },
        { provide: NgbModal, useValue: { open } },
        { provide: Router, useValue: { navigate, url: '/settings/categorias' } },
      ],
    });
  });

  it('abre no contexto de serviços', () => {
    const component = montar();
    component.ngOnInit();

    expect(getAll).toHaveBeenCalledWith('services');
    expect(component.contexto()).toBe('services');
    expect(component.categorias()).toHaveLength(1);
    expect(component.mostraTaxa).toBe(true);
  });

  it('marca erro quando a busca falha', () => {
    getAll.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    const component = montar();
    component.ngOnInit();

    expect(component.hasError()).toBe(true);
    expect(component.isLoading()).toBe(false);
  });

  it.each(['products', 'accommodations', 'transportations'] as const)(
    'troca para %s e esconde a taxa',
    (contexto) => {
      const component = montar();
      component.ngOnInit();

      component.trocarContexto(contexto);

      expect(getAll).toHaveBeenLastCalledWith(contexto);
      expect(component.mostraTaxa).toBe(false);
    }
  );

  it('não recarrega ao clicar no contexto já selecionado', () => {
    const component = montar();
    component.ngOnInit();

    component.trocarContexto('services');

    expect(getAll).toHaveBeenCalledTimes(1);
  });

  it('limpa a lista ao trocar de contexto, para não mostrar dado do anterior', () => {
    getAll.mockReturnValueOnce(of([categoria()]));
    const component = montar();
    component.ngOnInit();
    expect(component.categorias()).toHaveLength(1);

    getAll.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.trocarContexto('products');

    expect(component.categorias()).toEqual([]);
  });

  it('sugere a taxa padrão de 10% ao criar em serviços', () => {
    const component = montar();
    component.ngOnInit();

    component.abrirNovo(TPL);

    expect(component.form.controls.platformFeeRate.value).toBe(10);
  });

  it('não sugere taxa ao criar fora de serviços', () => {
    const component = montar();
    component.ngOnInit();
    component.trocarContexto('products');

    component.abrirNovo(TPL);

    expect(component.form.controls.platformFeeRate.value).toBeNull();
  });

  it('manda a taxa ao criar em serviços', () => {
    create.mockReturnValue(of(categoria()));

    const component = montar();
    component.ngOnInit();
    component.abrirNovo(TPL);
    component.form.patchValue({ name: 'Pintura', slug: 'pintura', platformFeeRate: 12 });

    component.salvar();

    expect(create).toHaveBeenCalledWith('services', {
      name: 'Pintura',
      slug: 'pintura',
      sortOrder: 0,
      isActive: true,
      platformFeeRate: 12,
    });
  });

  // Mandar a taxa fora de services faz o back-end responder 400.
  it.each(['products', 'accommodations', 'transportations'] as const)(
    'não manda a taxa ao criar em %s',
    (contexto) => {
      create.mockReturnValue(of(categoria({ platformFeeRate: null })));

      const component = montar();
      component.ngOnInit();
      component.trocarContexto(contexto);
      component.abrirNovo(TPL);
      // A taxa é preenchida à força: sem isso o teste passaria só porque
      // `abrirNovo` já a deixa nula fora de services, sem exercer a guarda.
      component.form.patchValue({ name: 'Bebidas', slug: 'bebidas', platformFeeRate: 12 });

      component.salvar();

      expect('platformFeeRate' in create.mock.calls[0][1]).toBe(false);
      expect(create.mock.calls[0][0]).toBe(contexto);
    }
  );

  // Abrir o formulário em serviços e trocar o contexto antes de salvar não pode
  // arrastar a taxa antiga para um contexto que a recusa.
  it('não arrasta a taxa quando o contexto muda com o formulário aberto', () => {
    create.mockReturnValue(of(categoria({ platformFeeRate: null })));

    const component = montar();
    component.ngOnInit();
    component.abrirNovo(TPL);
    expect(component.form.controls.platformFeeRate.value).toBe(10);

    component.trocarContexto('products');
    component.form.patchValue({ name: 'Bebidas', slug: 'bebidas' });
    component.salvar();

    expect('platformFeeRate' in create.mock.calls[0][1]).toBe(false);
  });

  it('edita pelo id da categoria aberta', () => {
    update.mockReturnValue(of(categoria()));

    const component = montar();
    component.ngOnInit();
    component.abrirEdicao(categoria({ id: 42 }), TPL);
    component.form.patchValue({ name: 'Limpeza pesada' });

    component.salvar();

    expect(update.mock.calls[0][0]).toBe('services');
    expect(update.mock.calls[0][1]).toBe(42);
    expect(update.mock.calls[0][2].name).toBe('Limpeza pesada');
  });

  // Na criação sem imagem não há nada a repetir nem a apagar, então o par fica
  // fora do payload.
  it('omite o par da imagem ao criar sem imagem', () => {
    create.mockReturnValue(of(categoria()));

    const component = montar();
    component.ngOnInit();
    component.abrirNovo(TPL);
    component.form.patchValue({ name: 'Pintura', slug: 'pintura' });

    component.salvar();

    expect(uploadOne).not.toHaveBeenCalled();
    expect('iconUrl' in create.mock.calls[0][1]).toBe(false);
    expect('iconKey' in create.mock.calls[0][1]).toBe(false);
  });

  it('não envia formulário sem nome nem slug', () => {
    const component = montar();
    component.ngOnInit();
    component.abrirNovo(TPL);

    component.salvar();

    expect(create).not.toHaveBeenCalled();
    expect(component.form.controls.name.touched).toBe(true);
  });

  it('recusa taxa acima de 100', () => {
    const component = montar();
    component.ngOnInit();
    component.abrirNovo(TPL);
    component.form.patchValue({ name: 'Pintura', slug: 'pintura', platformFeeRate: 101 });

    component.salvar();

    expect(create).not.toHaveBeenCalled();
  });

  it('mostra a mensagem do back-end quando o slug já existe', () => {
    create.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: "Já existe uma categoria com o nome 'Limpeza' ou slug 'limpeza'." },
          })
      )
    );

    const component = montar();
    component.ngOnInit();
    component.abrirNovo(TPL);
    component.form.patchValue({ name: 'Limpeza', slug: 'limpeza' });
    component.salvar();

    expect(showError).toHaveBeenCalledWith(
      "Já existe uma categoria com o nome 'Limpeza' ou slug 'limpeza'."
    );
    expect(component.isSaving()).toBe(false);
  });

  it('cai numa mensagem própria quando o erro não traz texto', () => {
    create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    const component = montar();
    component.ngOnInit();
    component.abrirNovo(TPL);
    component.form.patchValue({ name: 'Pintura', slug: 'pintura' });
    component.salvar();

    expect(showError).toHaveBeenCalledWith('Não foi possível salvar a categoria.');
  });

  it('sugere o slug a partir do nome enquanto o campo não foi editado', () => {
    const component = montar();
    component.ngOnInit();
    component.abrirNovo(TPL);

    component.form.controls.name.setValue('Manutenção Elétrica');

    expect(component.form.controls.slug.value).toBe('manutencao-eletrica');
  });

  it('para de sugerir o slug depois que o admin o edita', () => {
    const component = montar();
    component.ngOnInit();
    component.abrirNovo(TPL);
    component.form.controls.slug.setValue('meu-slug');
    component.form.controls.slug.markAsDirty();

    component.form.controls.name.setValue('Manutenção Elétrica');

    expect(component.form.controls.slug.value).toBe('meu-slug');
  });

  // Em edição o slug já existe e está em uso; recalculá-lo trocaria a chave
  // pública da categoria sem o admin pedir.
  it('não sugere slug durante a edição', () => {
    const component = montar();
    component.ngOnInit();
    component.abrirEdicao(categoria({ slug: 'limpeza' }), TPL);

    component.form.controls.name.setValue('Limpeza pesada');

    expect(component.form.controls.slug.value).toBe('limpeza');
  });

  it('inativa pela rota de inativar e atualiza a linha', () => {
    inactivate.mockReturnValue(of(categoria({ id: 1, isActive: false })));

    const component = montar();
    component.ngOnInit();

    component.alternarAtivo(categoria({ id: 1, isActive: true }));

    expect(inactivate).toHaveBeenCalledWith('services', 1);
    expect(component.categorias()[0].isActive).toBe(false);
    expect(showSuccess).toHaveBeenCalledWith('Categoria inativada.');
    expect(component.alternandoId()).toBeNull();
  });

  it('reativa quando a categoria está inativa', () => {
    reactivate.mockReturnValue(of(categoria({ id: 1, isActive: true })));

    const component = montar();
    component.ngOnInit();

    component.alternarAtivo(categoria({ id: 1, isActive: false }));

    expect(reactivate).toHaveBeenCalledWith('services', 1);
    expect(showSuccess).toHaveBeenCalledWith('Categoria reativada.');
  });

  it('ignora um segundo clique enquanto o primeiro não respondeu', () => {
    inactivate.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const component = montar();
    component.ngOnInit();
    component.alternandoId.set(9);

    component.alternarAtivo(categoria({ id: 1, isActive: true }));

    expect(inactivate).not.toHaveBeenCalled();
  });

  it('mostra travessão quando o contexto não tem taxa', () => {
    const component = montar();

    expect(component.formatarTaxa(null)).toBe('—');
    expect(component.formatarTaxa(7.5)).toBe('7,5%');
  });

  it('carrega a imagem gravada ao abrir a edição', () => {
    const component = montar();
    component.ngOnInit();

    component.abrirEdicao(
      categoria({
        iconUrl: 'http://localhost:8000/v1/files/atual.png',
        iconKey: 'icones/atual.png',
      }),
      TPL
    );

    expect(component.iconeUrl()).toBe('http://localhost:8000/v1/files/atual.png');
    expect(component.iconeKey()).toBe('icones/atual.png');
    expect(component.iconeEmExibicao).toBe('http://localhost:8000/v1/files/atual.png');
  });

  // Abrir o formulário tem de zerar escolha e remoção pendentes, senão elas
  // vazam para a próxima categoria. O teste suja os dois estados de propósito:
  // afirmar que estão limpos sem tê-los sujado não prova nada.
  it('limpa escolha e remoção pendentes ao abrir outro formulário', () => {
    const component = montar();
    component.ngOnInit();
    component.abrirEdicao(categoria({ iconUrl: 'http://x/a.png', iconKey: 'icones/a.png' }), TPL);
    component.onSelecionarIcone(eventoDeArquivo(new File(['x'], 'nova.png')));
    expect(component.novoIcone()).toBeDefined();

    component.abrirNovo(TPL);

    expect(component.iconeUrl()).toBeNull();
    expect(component.iconeKey()).toBeNull();
    expect(component.novoIcone()).toBeUndefined();
  });

  it('limpa a remoção pendente ao abrir outro formulário', () => {
    const component = montar();
    component.ngOnInit();
    component.abrirEdicao(categoria({ iconUrl: 'http://x/a.png', iconKey: 'icones/a.png' }), TPL);
    component.onRemoverIcone();
    expect(component.iconeMarcadoParaRemover()).toBe(true);

    component.abrirEdicao(categoria({ id: 9, iconUrl: 'http://x/b.png' }), TPL);

    expect(component.iconeMarcadoParaRemover()).toBe(false);
    expect(component.iconeEmExibicao).toBe('http://x/b.png');
  });

  /**
   * O upload só acontece ao salvar. Subir na escolha deixaria arquivo órfão no
   * storage toda vez que o admin desistisse do formulário.
   */
  it('sobe a imagem só ao salvar, e grava o par devolvido', () => {
    create.mockReturnValue(of(categoria()));
    const component = montar();
    component.ngOnInit();
    component.abrirNovo(TPL);
    const arquivo = new File(['x'], 'nova.png', { type: 'image/png' });

    component.onSelecionarIcone(eventoDeArquivo(arquivo));
    expect(uploadOne).not.toHaveBeenCalled();

    component.form.patchValue({ name: 'Pintura', slug: 'pintura' });
    component.salvar();

    expect(uploadOne).toHaveBeenCalledWith(arquivo);
    expect(create.mock.calls[0][1]).toMatchObject({
      iconUrl: 'http://localhost:8000/v1/files/nova.png',
      iconKey: 'icones/nova.png',
    });
  });

  it('não grava nada quando o upload falha', () => {
    uploadOne.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const component = montar();
    component.ngOnInit();
    component.abrirNovo(TPL);
    component.onSelecionarIcone(eventoDeArquivo(new File(['x'], 'nova.png')));
    component.form.patchValue({ name: 'Pintura', slug: 'pintura' });

    component.salvar();

    expect(create).not.toHaveBeenCalled();
    expect(component.isSaving()).toBe(false);
  });

  // Repetir o par é o que diferencia "não mexi" de "remover". Sem isto, editar
  // só o nome apagaria a imagem da categoria.
  it('repete a imagem gravada ao editar sem mexer nela', () => {
    update.mockReturnValue(of(categoria()));
    const component = montar();
    component.ngOnInit();
    component.abrirEdicao(
      categoria({ id: 5, iconUrl: 'http://x/atual.png', iconKey: 'icones/atual.png' }),
      TPL
    );

    component.form.patchValue({ name: 'Limpeza pesada' });
    component.salvar();

    expect(uploadOne).not.toHaveBeenCalled();
    expect(update.mock.calls[0][2]).toMatchObject({
      iconUrl: 'http://x/atual.png',
      iconKey: 'icones/atual.png',
    });
  });

  it('manda o par nulo ao remover a imagem, que é o que apaga o arquivo antigo', () => {
    update.mockReturnValue(of(categoria()));
    const component = montar();
    component.ngOnInit();
    component.abrirEdicao(
      categoria({ id: 5, iconUrl: 'http://x/atual.png', iconKey: 'icones/atual.png' }),
      TPL
    );

    component.onRemoverIcone();
    component.salvar();

    expect(uploadOne).not.toHaveBeenCalled();
    expect(update.mock.calls[0][2]).toMatchObject({ iconUrl: null, iconKey: null });
  });

  it('esconde a imagem em exibição enquanto a remoção está pendente', () => {
    const component = montar();
    component.ngOnInit();
    component.abrirEdicao(categoria({ iconUrl: 'http://x/atual.png' }), TPL);

    component.onRemoverIcone();

    expect(component.iconeEmExibicao).toBeNull();
  });

  it('escolher uma imagem cancela a remoção pendente', () => {
    const component = montar();
    component.ngOnInit();
    component.abrirEdicao(categoria({ iconUrl: 'http://x/atual.png' }), TPL);
    component.onRemoverIcone();

    component.onSelecionarIcone(eventoDeArquivo(new File(['x'], 'nova.png')));

    expect(component.iconeMarcadoParaRemover()).toBe(false);
    expect(component.novoIcone()).toBeDefined();
  });

  it('desfazer volta ao estado gravado', () => {
    const component = montar();
    component.ngOnInit();
    component.abrirEdicao(categoria({ iconUrl: 'http://x/atual.png' }), TPL);
    component.onRemoverIcone();

    component.onDesfazerIcone();

    expect(component.iconeEmExibicao).toBe('http://x/atual.png');
    expect(component.novoIcone()).toBeUndefined();
  });

  it('ignora a escolha quando nenhum arquivo foi selecionado', () => {
    const component = montar();
    component.ngOnInit();

    component.onSelecionarIcone(eventoDeArquivo());

    expect(component.novoIcone()).toBeUndefined();
  });
});
