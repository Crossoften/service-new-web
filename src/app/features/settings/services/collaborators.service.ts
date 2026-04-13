import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Collaborator, PagedResult, CollaboratorListParams } from '../models/collaborator.model';

const MOCK_COLLABORATORS: Collaborator[] = Array.from({ length: 12 }, (_, i) => ({
  id: `col-${i + 1}`,
  cod: String(10 + i).padStart(2, '0'),
  name: `Nome usuário ${i + 1}`,
  email: `mail@email.com`,
  token: `TK${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  role: i % 3 === 0 ? 'Admin Master' : 'Admin',
  status: i % 4 === 0 ? 'inactive' : 'active',
  permissions: {
    dashboard: true,
    users: i % 2 === 0,
    services: i % 3 !== 0,
    finance: i % 4 === 0,
    settings: i % 5 === 0,
  },
}));

@Injectable({ providedIn: 'root' })
export class CollaboratorsService {
  getCollaborators(params: CollaboratorListParams): Observable<PagedResult<Collaborator>> {
    const filtered = MOCK_COLLABORATORS.filter((c) =>
      c.name.toLowerCase().includes(params.search.toLowerCase()) ||
      c.email.toLowerCase().includes(params.search.toLowerCase())
    );
    const start = (params.page - 1) * params.pageSize;
    const data = filtered.slice(start, start + params.pageSize);
    return of({ data, total: filtered.length, page: params.page, pageSize: params.pageSize }).pipe(delay(400));
  }

  getCollaboratorById(id: string): Observable<Collaborator | undefined> {
    return of(MOCK_COLLABORATORS.find((c) => c.id === id)).pipe(delay(300));
  }

  saveCollaborator(collaborator: Partial<Collaborator>): Observable<Collaborator> {
    if (collaborator.id) {
      const idx = MOCK_COLLABORATORS.findIndex((c) => c.id === collaborator.id);
      if (idx !== -1) Object.assign(MOCK_COLLABORATORS[idx], collaborator);
      return of(MOCK_COLLABORATORS[idx]).pipe(delay(500));
    }
    const newOne: Collaborator = {
      id: `col-${Date.now()}`,
      cod: String(MOCK_COLLABORATORS.length + 10).padStart(2, '0'),
      name: collaborator.name ?? '',
      email: collaborator.email ?? '',
      token: `TK${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      role: collaborator.role ?? 'Admin',
      status: 'active',
      permissions: collaborator.permissions ?? { dashboard: false, users: false, services: false, finance: false, settings: false },
    };
    MOCK_COLLABORATORS.push(newOne);
    return of(newOne).pipe(delay(500));
  }
}
