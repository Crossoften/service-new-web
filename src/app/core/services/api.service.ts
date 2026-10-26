import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  protected baseUrl = environment.apiUrl;

  constructor(protected http: HttpClient) {}

  get<T>(
    endpoint: string,
    params?: HttpParams | Record<string, string | number | boolean>
  ): Observable<T> {
    let httpParams: HttpParams | undefined;
    if (params && !(params instanceof HttpParams)) {
      httpParams = Object.entries(params).reduce(
        (acc, [k, v]) => acc.set(k, String(v)),
        new HttpParams()
      );
    } else {
      httpParams = params as HttpParams | undefined;
    }
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params: httpParams });
  }

  post<T>(endpoint: string, data: unknown, options?: { context?: HttpContext }): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data, options);
  }

  put<T>(endpoint: string, data: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data);
  }

  /**
   * O `options` existe aqui pelo mesmo motivo que no `post`: permitir que a
   * chamada desligue o toast global e trate o erro por conta própria. Rotas
   * que validam corpo devolvem `400` com mensagem específica, e o
   * `errorInterceptor` a substituiria por um texto genérico.
   */
  patch<T>(endpoint: string, data: unknown, options?: { context?: HttpContext }): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, data, options);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`);
  }
}
