import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { environment } from '@environments/environment';

import { UploadsService } from './uploads.service';

/**
 * As rotas `/v1/one-file/*` usam `ParseIntPipe` — recebem o **id** do arquivo,
 * não a `fileKey`. A tela de admin passava a chave e as três ferramentas
 * respondiam `400`. Estes testes fixam a montagem da URL para o erro não
 * voltar por outro caminho.
 */
describe('UploadsService — rotas de arquivo por id', () => {
  let service: UploadsService;
  let http: HttpTestingController;

  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UploadsService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UploadsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta pelo id, sem escapar nada', () => {
    service.getFile(42).subscribe();

    const req = http.expectOne(`${base}/v1/one-file/42`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 42, fileUrl: 'http://x/a.png', fileKey: 'a.png' });
  });

  it('remove pelo id', () => {
    service.deleteFile(42).subscribe();

    const req = http.expectOne(`${base}/v1/one-file/42`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Arquivo deletado com sucesso.' });
  });

  // A rota devolve só uma mensagem. A interface antiga prometia
  // `{ id, name, fileUrl, fileKey }` e a tela mostrava a caixa em branco.
  it('entrega a mensagem que a remoção devolve', (done) => {
    service.deleteFile(42).subscribe((resposta) => {
      expect(resposta.message).toBe('Arquivo deletado com sucesso.');
      done();
    });

    http.expectOne(`${base}/v1/one-file/42`).flush({ message: 'Arquivo deletado com sucesso.' });
  });

  it('baixa pelo id, como blob', () => {
    service.downloadFile(42).subscribe();

    const req = http.expectOne(`${base}/v1/one-file/download/42`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['x']));
  });

  it('entrega o id que o envio devolve, que é o que as ferramentas usam', (done) => {
    service.uploadOne(new File(['x'], 'a.png')).subscribe((resposta) => {
      expect(resposta.id).toBe(42);
      done();
    });

    http
      .expectOne(`${base}/v1/upload/one-file`)
      .flush({ id: 42, fileUrl: 'http://x/a.png', fileKey: 'a.png' });
  });

  // A remoção da foto de perfil é a única que usa chave: a rota é por `fileKey`
  // em query, não por id.
  it('remove a foto de perfil pela chave, em query', () => {
    service.removeProfilePhoto('perfis/a.png').subscribe();

    const req = http.expectOne((r) => r.url === `${base}/v1/profile-photo`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.params.get('fileKey')).toBe('perfis/a.png');
    req.flush({});
  });
});
