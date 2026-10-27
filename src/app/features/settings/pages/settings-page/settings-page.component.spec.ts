import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ToastService } from '@core/services/toast.service';
import { UploadsService } from '@core/services/uploads.service';
import { AuthApiService } from '@features/auth/services/auth-api.service';

import { SettingsPageComponent } from './settings-page.component';

function eventoDeArquivo(...arquivos: File[]): Event {
  return { target: { files: arquivos } } as unknown as Event;
}

const ENVIADO = {
  id: 42,
  fileUrl: 'http://localhost:8000/v1/files/a.png',
  fileKey: 'uploads/a.png',
};

describe('SettingsPageComponent — ferramentas de arquivo', () => {
  const getMySelf = jest.fn();
  const uploadOne = jest.fn();
  const uploadMany = jest.fn();
  const getFile = jest.fn();
  const deleteFile = jest.fn();
  const downloadFile = jest.fn();
  const showSuccess = jest.fn();
  const showError = jest.fn();

  function montar(): SettingsPageComponent {
    return TestBed.runInInjectionContext(() => new SettingsPageComponent());
  }

  beforeEach(() => {
    [
      getMySelf,
      uploadOne,
      uploadMany,
      getFile,
      deleteFile,
      downloadFile,
      showSuccess,
      showError,
    ].forEach((mock) => mock.mockReset());

    getMySelf.mockReturnValue(of({ id: 1, name: 'Admin', fileKey: null, socialMedias: [] }));
    uploadOne.mockReturnValue(of(ENVIADO));
    uploadMany.mockReturnValue(of([ENVIADO]));
    getFile.mockReturnValue(of(ENVIADO));
    deleteFile.mockReturnValue(of({ message: 'Arquivo deletado com sucesso.' }));
    downloadFile.mockReturnValue(of(new Blob(['x'])));

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApiService, useValue: { getMySelf } },
        {
          provide: UploadsService,
          useValue: { uploadOne, uploadMany, getFile, deleteFile, downloadFile },
        },
        { provide: ToastService, useValue: { showSuccess, showError } },
      ],
    });
  });

  /**
   * A causa do bug: o campo recebia `response.fileKey`, e as rotas
   * `/v1/one-file/*` usam `ParseIntPipe` — consultar, baixar e remover
   * respondiam 400.
   */
  it('guarda o id do envio simples, não a chave do storage', () => {
    const component = montar();
    component.ngOnInit();

    component.onSingleFileSelected(eventoDeArquivo(new File(['x'], 'a.png')));

    expect(component.toolsForm.controls.fileId.value).toBe(42);
  });

  it('guarda o id do primeiro arquivo no envio múltiplo', () => {
    const component = montar();
    component.ngOnInit();

    component.onManyFilesSelected(eventoDeArquivo(new File(['x'], 'a.png')));

    expect(component.toolsForm.controls.fileId.value).toBe(42);
  });

  it('consulta passando o id', () => {
    const component = montar();
    component.ngOnInit();
    component.toolsForm.controls.fileId.setValue(42);

    component.lookupFile();

    expect(getFile).toHaveBeenCalledWith(42);
    expect(component.fileLookupResult()).toEqual(ENVIADO);
  });

  it('remove passando o id', () => {
    const component = montar();
    component.ngOnInit();
    component.toolsForm.controls.fileId.setValue(42);

    component.deleteFile();

    expect(deleteFile).toHaveBeenCalledWith(42);
  });

  it('baixa passando o id', () => {
    const component = montar();
    component.ngOnInit();
    component.toolsForm.controls.fileId.setValue(42);

    component.downloadFile();

    expect(downloadFile).toHaveBeenCalledWith(42);
  });

  // A rota devolve só `{ message }`. A tela mostrava `name`/`fileKey`, que
  // nunca vieram — a caixa de confirmação aparecia em branco.
  it('guarda a mensagem que a remoção devolve', () => {
    const component = montar();
    component.ngOnInit();
    component.toolsForm.controls.fileId.setValue(42);

    component.deleteFile();

    expect(component.deletedFileResult()?.message).toBe('Arquivo deletado com sucesso.');
  });

  it('limpa o campo depois de remover, para não repetir um id que não existe mais', () => {
    const component = montar();
    component.ngOnInit();
    component.toolsForm.controls.fileId.setValue(42);

    component.deleteFile();

    expect(component.toolsForm.controls.fileId.value).toBeNull();
  });

  it('não chama o serviço com o campo vazio', () => {
    const component = montar();
    component.ngOnInit();
    component.toolsForm.controls.fileId.setValue(null);

    component.lookupFile();
    component.downloadFile();
    component.deleteFile();

    expect(getFile).not.toHaveBeenCalled();
    expect(downloadFile).not.toHaveBeenCalled();
    expect(deleteFile).not.toHaveBeenCalled();
    expect(component.toolsForm.controls.fileId.touched).toBe(true);
  });

  // Zero é id inválido no banco, mas é um número — a guarda tem de ser por
  // ausência, não por valor falsy, senão um `0` digitado passaria batido.
  it('trata o campo vazio por ausência, não por valor falsy', () => {
    const component = montar();
    component.ngOnInit();
    component.toolsForm.controls.fileId.setValue(0);

    component.lookupFile();

    expect(getFile).toHaveBeenCalledWith(0);
  });

  it('ignora a seleção quando nenhum arquivo vem no evento', () => {
    const component = montar();
    component.ngOnInit();

    component.onSingleFileSelected(eventoDeArquivo());

    expect(uploadOne).not.toHaveBeenCalled();
  });

  it('libera o botão quando o envio falha', () => {
    uploadOne.mockReturnValue(throwError(() => new Error('falhou')));
    const component = montar();
    component.ngOnInit();

    component.onSingleFileSelected(eventoDeArquivo(new File(['x'], 'a.png')));

    expect(component.isUploadingSingle()).toBe(false);
    expect(component.toolsForm.controls.fileId.value).toBeNull();
  });
});
