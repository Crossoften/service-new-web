import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { PagedResult, Service, ServiceListParams } from '../models/service.model';

@Injectable({ providedIn: 'root' })
export class ServicesService {
  getServices(_params: ServiceListParams): Observable<PagedResult<Service>> {
    return throwError(
      () =>
        new Error(
          'O contrato atual do backend nao documenta endpoints para o modulo de servicos.'
        )
    );
  }
}
