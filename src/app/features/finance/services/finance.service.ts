import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import {
  FinanceSummary,
  PagedResult,
  Transaction,
  TransactionListParams,
} from '../models/finance.model';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  getSummary(): Observable<FinanceSummary> {
    return throwError(
      () =>
        new Error(
          'O contrato atual do backend nao documenta endpoints para o modulo financeiro.'
        )
    );
  }

  getTransactions(_params: TransactionListParams): Observable<PagedResult<Transaction>> {
    return throwError(
      () =>
        new Error(
          'O contrato atual do backend nao documenta endpoints para o modulo financeiro.'
        )
    );
  }
}
