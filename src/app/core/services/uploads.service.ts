import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';

export interface UploadedFileResponse {
  /**
   * Identificador numérico do arquivo. É **ele** que as rotas `/v1/one-file/*`
   * aceitam — não a `fileKey`. O back-end documenta isso no próprio DTO:
   * "Identificador do arquivo, usado em /one-file/{id} e no download."
   */
  id: number;
  fileUrl: string;
  fileKey: string;
}

/**
 * O que `DELETE /v1/one-file/{id}` devolve de verdade: só uma mensagem.
 *
 * Antes esta interface declarava `{ id, name, fileUrl, fileKey }`, campos que a
 * rota nunca enviou — a tela lia `undefined` e mostrava a caixa de confirmação
 * em branco.
 */
export interface DeletedFileResponse {
  message: string;
}

type ManyFilesResponse =
  | UploadedFileResponse[]
  | { files: UploadedFileResponse[] }
  | { items: UploadedFileResponse[] };

@Injectable({
  providedIn: 'root',
})
export class UploadsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  uploadOne(file: File): Observable<UploadedFileResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<UploadedFileResponse>(`${this.baseUrl}/v1/upload/one-file`, formData);
  }

  uploadMany(files: File[]): Observable<UploadedFileResponse[]> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file, file.name);
    });

    return this.http
      .post<ManyFilesResponse>(`${this.baseUrl}/v1/upload/many-files`, formData)
      .pipe(map((response) => this.normalizeManyFiles(response)));
  }

  /**
   * As três rotas abaixo recebem `number`, não `string`.
   *
   * Eram tipadas como `string` e a tela passava uma `fileKey`; as rotas usam
   * `ParseIntPipe`, então consultar, baixar e remover respondiam `400`. O tipo
   * é o que impede o erro de voltar — com `string` qualquer coisa compilava.
   */
  getFile(fileId: number): Observable<UploadedFileResponse> {
    return this.http.get<UploadedFileResponse>(`${this.baseUrl}/v1/one-file/${fileId}`);
  }

  deleteFile(fileId: number): Observable<DeletedFileResponse> {
    return this.http.delete<DeletedFileResponse>(`${this.baseUrl}/v1/one-file/${fileId}`);
  }

  downloadFile(fileId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/v1/one-file/download/${fileId}`, {
      responseType: 'blob',
    });
  }

  removeProfilePhoto(fileKey: string): Observable<unknown> {
    const params = new HttpParams().set('fileKey', fileKey);

    return this.http.delete(`${this.baseUrl}/v1/profile-photo`, { params });
  }

  private normalizeManyFiles(response: ManyFilesResponse): UploadedFileResponse[] {
    if (Array.isArray(response)) {
      return response;
    }

    if ('files' in response) {
      return response.files;
    }

    return response.items;
  }
}
