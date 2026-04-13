import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { ApiService } from '@core/services/api.service';
import {
  Transaction,
  FinanceSummary,
  PagedResult,
  TransactionListParams,
} from '../models/finance.model';

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1',  description: 'Instalação Elétrica',      provider: 'João Eletricista',   value: 250.00,  date: '2026-04-10', type: 'income',  status: 'paid'      },
  { id: '2',  description: 'Pintura Residencial',       provider: 'Carlos Pintor',      value: 800.00,  date: '2026-04-09', type: 'income',  status: 'paid'      },
  { id: '3',  description: 'Desentupimento',            provider: 'Ana Encanadora',     value: 180.00,  date: '2026-04-08', type: 'income',  status: 'pending'   },
  { id: '4',  description: 'Ar Condicionado',           provider: 'Pedro Técnico',      value: 350.00,  date: '2026-04-07', type: 'income',  status: 'paid'      },
  { id: '5',  description: 'Limpeza Pós-Obra',          provider: 'Maria Limpeza',      value: 420.00,  date: '2026-04-06', type: 'income',  status: 'paid'      },
  { id: '6',  description: 'Taxa de Plataforma',        provider: 'Service',            value: 120.00,  date: '2026-04-05', type: 'expense', status: 'paid'      },
  { id: '7',  description: 'Manutenção de Telhado',     provider: 'Roberto Telhador',   value: 600.00,  date: '2026-04-04', type: 'income',  status: 'paid'      },
  { id: '8',  description: 'Jardinagem',                provider: 'Luciana Jardins',    value: 150.00,  date: '2026-04-03', type: 'income',  status: 'pending'   },
  { id: '9',  description: 'Montagem de Móveis',        provider: 'Fábio Montador',     value: 200.00,  date: '2026-04-02', type: 'income',  status: 'cancelled' },
  { id: '10', description: 'Comissão Parceiro',         provider: 'Parceiro A',         value: 80.00,   date: '2026-04-01', type: 'expense', status: 'paid'      },
  { id: '11', description: 'Pintura de Fachada',        provider: 'Diego Pintor',       value: 1500.00, date: '2026-03-31', type: 'income',  status: 'paid'      },
  { id: '12', description: 'Instalação de Câmeras',     provider: 'Renata Segurança',   value: 450.00,  date: '2026-03-30', type: 'income',  status: 'pending'   },
  { id: '13', description: 'Piso e Revestimento',       provider: 'Antônio Azulejista', value: 900.00,  date: '2026-03-29', type: 'income',  status: 'paid'      },
  { id: '14', description: 'Impermeabilização',         provider: 'Sandra Impermeável', value: 700.00,  date: '2026-03-28', type: 'income',  status: 'paid'      },
  { id: '15', description: 'Infraestrutura Servidor',   provider: 'Service',            value: 350.00,  date: '2026-03-27', type: 'expense', status: 'paid'      },
];

export const MOCK_SUMMARY: FinanceSummary = {
  totalRevenue: 7150.00,
  pendingPayments: 750.00,
  activePartners: 12,
};

@Injectable({ providedIn: 'root' })
export class FinanceService {
  constructor(private readonly apiService: ApiService) {}

  getSummary(): Observable<FinanceSummary> {
    if (environment.useMock) {
      return of(MOCK_SUMMARY).pipe(delay(environment.mockDelay));
    }
    return this.apiService.get<FinanceSummary>('/api/finance/summary');
  }

  getTransactions(params: TransactionListParams): Observable<PagedResult<Transaction>> {
    if (environment.useMock) {
      const search = params.search.toLowerCase();
      const filtered = MOCK_TRANSACTIONS.filter(
        (t) =>
          !search ||
          t.description.toLowerCase().includes(search) ||
          t.provider.toLowerCase().includes(search)
      );
      const start = (params.page - 1) * params.pageSize;
      const data = filtered.slice(start, start + params.pageSize);
      return of({ data, total: filtered.length, page: params.page, pageSize: params.pageSize }).pipe(
        delay(environment.mockDelay)
      );
    }
    return this.apiService.get<PagedResult<Transaction>>('/api/finance/transactions', {
      page: String(params.page),
      pageSize: String(params.pageSize),
      search: params.search,
    });
  }
}
