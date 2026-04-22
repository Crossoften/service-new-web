import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { PagedResult, Supplier, SupplierListParams } from '../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SuppliersService {
  getSuppliers(_params: SupplierListParams): Observable<PagedResult<Supplier>> {
    return throwError(
      () =>
        new Error(
          'O contrato atual do backend nao documenta endpoints para o modulo de fornecedores.'
        )
    );
  }

  getSupplierById(_id: string): Observable<Supplier | undefined> {
    return throwError(
      () =>
        new Error(
          'O contrato atual do backend nao documenta endpoints para o modulo de fornecedores.'
        )
    );
  }

  updateSupplier(_id: string, _changes: Partial<Supplier>): Observable<Supplier> {
    return throwError(
      () =>
        new Error(
          'O contrato atual do backend nao documenta endpoints para o modulo de fornecedores.'
        )
    );
  }
}
