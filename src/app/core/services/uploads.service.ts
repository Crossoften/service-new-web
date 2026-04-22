import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';

export interface UploadedFileResponse {
  fileUrl: string;
  fileKey: string;
}

export interface DeletedFileResponse {
  id: number;
  name: string;
  fileUrl: string;
  fileKey: string;
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

  getFile(fileId: string): Observable<UploadedFileResponse> {
    return this.http.get<UploadedFileResponse>(
      `${this.baseUrl}/v1/one-file/${encodeURIComponent(fileId)}`
    );
  }

  deleteFile(fileId: string): Observable<DeletedFileResponse> {
    return this.http.delete<DeletedFileResponse>(
      `${this.baseUrl}/v1/one-file/${encodeURIComponent(fileId)}`
    );
  }

  downloadFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/v1/one-file/download/${encodeURIComponent(fileId)}`, {
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
