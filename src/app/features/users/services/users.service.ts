import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { ApiService } from '@core/services/api.service';
import { User, PagedResult, UserListParams } from '../models/user.model';

const MOCK_USERS: User[] = [
  { id: '1',  name: 'Marina Silva',        email: 'marina.silva@email.com',     phone: '34 9 9999-0000', dateOfBirth: '1990-05-14', openServices: 2, status: 'active'   },
  { id: '2',  name: 'Carlos Menezes',      email: 'carlos.menezes@email.com',   phone: '11 9 8877-6655', dateOfBirth: '1985-11-22', openServices: 0, status: 'inactive' },
  { id: '3',  name: 'Fernanda Rocha',      email: 'fernanda.rocha@email.com',   phone: '21 9 9123-4567', dateOfBirth: '1992-03-08', openServices: 1, status: 'active'   },
  { id: '4',  name: 'Ricardo Alves',       email: 'ricardo.alves@email.com',    phone: '31 9 7654-3210', dateOfBirth: '1988-07-19', openServices: 3, status: 'inactive' },
  { id: '5',  name: 'Juliana Nunes',       email: 'juliana.nunes@email.com',    phone: '41 9 9876-5432', dateOfBirth: '1995-09-30', openServices: 0, status: 'active'   },
  { id: '6',  name: 'Thiago Carvalho',     email: 'thiago.carvalho@email.com',  phone: '51 9 8765-4321', dateOfBirth: '1983-12-05', openServices: 2, status: 'inactive' },
  { id: '7',  name: 'Patrícia Ferreira',   email: 'patricia.ferreira@email.com',phone: '71 9 9234-5678', dateOfBirth: '1998-01-17', openServices: 1, status: 'active'   },
  { id: '8',  name: 'Eduardo Martins',     email: 'eduardo.martins@email.com',  phone: '85 9 9345-6789', dateOfBirth: '1991-06-25', openServices: 0, status: 'inactive' },
  { id: '9',  name: 'Camila Souza',        email: 'camila.souza@email.com',     phone: '61 9 9456-7890', dateOfBirth: '1994-04-12', openServices: 4, status: 'active'   },
  { id: '10', name: 'Rodrigo Pereira',     email: 'rodrigo.pereira@email.com',  phone: '27 9 9567-8901', dateOfBirth: '1987-10-03', openServices: 0, status: 'inactive' },
  { id: '11', name: 'Amanda Lima',         email: 'amanda.lima@email.com',      phone: '48 9 9678-9012', dateOfBirth: '1996-02-28', openServices: 1, status: 'active'   },
  { id: '12', name: 'Felipe Barbosa',      email: 'felipe.barbosa@email.com',   phone: '62 9 9789-0123', dateOfBirth: '1989-08-16', openServices: 2, status: 'inactive' },
  { id: '13', name: 'Larissa Monteiro',    email: 'larissa.monteiro@email.com', phone: '92 9 9890-1234', dateOfBirth: '1993-11-09', openServices: 0, status: 'active'   },
  { id: '14', name: 'Bruno Teixeira',      email: 'bruno.teixeira@email.com',   phone: '82 9 9901-2345', dateOfBirth: '1986-03-21', openServices: 3, status: 'inactive' },
  { id: '15', name: 'Vanessa Gomes',       email: 'vanessa.gomes@email.com',    phone: '69 9 9012-3456', dateOfBirth: '1997-07-07', openServices: 1, status: 'active'   },
];

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private readonly apiService: ApiService) {}

  getUsers(params: UserListParams): Observable<PagedResult<User>> {
    if (environment.useMock) {
      const search = params.search.toLowerCase();
      const filtered = MOCK_USERS.filter(
        (u) =>
          !search ||
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
      );
      const start = (params.page - 1) * params.pageSize;
      const data = filtered.slice(start, start + params.pageSize);
      return of({ data, total: filtered.length, page: params.page, pageSize: params.pageSize }).pipe(
        delay(environment.mockDelay)
      );
    }
    return this.apiService.get<PagedResult<User>>('/api/users', {
      page: String(params.page),
      pageSize: String(params.pageSize),
      search: params.search,
    });
  }

  getUserById(id: string): Observable<User | undefined> {
    if (environment.useMock) {
      return of(MOCK_USERS.find((u) => u.id === id)).pipe(delay(environment.mockDelay));
    }
    return this.apiService.get<User>(`/api/users/${id}`);
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    if (environment.useMock) {
      const idx = MOCK_USERS.findIndex((u) => u.id === id);
      const updated: User = { ...MOCK_USERS[idx], ...data };
      MOCK_USERS[idx] = updated;
      return of(updated).pipe(delay(environment.mockDelay));
    }
    return this.apiService.put<User>(`/api/users/${id}`, data).pipe(
      map((user) => user)
    );
  }
}
