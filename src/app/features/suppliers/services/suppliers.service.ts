import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Supplier, PagedResult, SupplierListParams } from '../models/supplier.model';

const MOCK_SUPPLIERS: Supplier[] = Array.from({ length: 25 }, (_, i) => ({
  id: `sup-${i + 1}`,
  name: `Fornecedor ${i + 1}`,
  email: `fornecedor${i + 1}@email.com`,
  phone: `(${11 + (i % 80)}) 9 ${3000 + i}-${4000 + i}`,
  dateOfBirth: `198${i % 10}-0${(i % 12) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
  openServices: Math.floor(Math.random() * 15),
  rating: Math.floor(Math.random() * 800) + 200,
  comments: Math.floor(Math.random() * 300) + 30,
  status: i % 5 === 0 ? 'inactive' : 'active',
  serviceHistory: [
    {
      id: `sh-${i}-1`,
      serviceName: 'Instalação Elétrica',
      clientName: 'Sandra Vieira',
      date: '2024-03-15',
      value: 350 + i * 10,
    },
    {
      id: `sh-${i}-2`,
      serviceName: 'Reparo Hidráulico',
      clientName: 'Carlos Mendes',
      date: '2024-02-20',
      value: 280 + i * 5,
    },
  ],
}));

@Injectable({ providedIn: 'root' })
export class SuppliersService {
  getSuppliers(params: SupplierListParams): Observable<PagedResult<Supplier>> {
    const filtered = MOCK_SUPPLIERS.filter((s) =>
      s.name.toLowerCase().includes(params.search.toLowerCase()) ||
      s.email.toLowerCase().includes(params.search.toLowerCase())
    );
    const start = (params.page - 1) * params.pageSize;
    const data = filtered.slice(start, start + params.pageSize);
    return of({ data, total: filtered.length, page: params.page, pageSize: params.pageSize }).pipe(delay(400));
  }

  getSupplierById(id: string): Observable<Supplier | undefined> {
    return of(MOCK_SUPPLIERS.find((s) => s.id === id)).pipe(delay(300));
  }

  updateSupplier(id: string, changes: Partial<Supplier>): Observable<Supplier> {
    const idx = MOCK_SUPPLIERS.findIndex((s) => s.id === id);
    if (idx !== -1) Object.assign(MOCK_SUPPLIERS[idx], changes);
    return of(MOCK_SUPPLIERS[idx]).pipe(delay(500));
  }
}
