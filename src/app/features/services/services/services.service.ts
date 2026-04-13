import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { ApiService } from '@core/services/api.service';
import { Service, PagedResult, ServiceListParams } from '../models/service.model';

const MOCK_SERVICES: Service[] = [
  { id: '1',  name: 'Instalação Elétrica',      category: 'Elétrica',     provider: 'João Eletricista',    price: 250.00, likes: 98,  dislikes: 5,  negotiations: 120, status: 'active'   },
  { id: '2',  name: 'Pintura Residencial',        category: 'Pintura',      provider: 'Carlos Pintor',       price: 800.00, likes: 75,  dislikes: 12, negotiations: 85,  status: 'active'   },
  { id: '3',  name: 'Desentupimento',             category: 'Hidráulica',   provider: 'Ana Encanadora',      price: 180.00, likes: 60,  dislikes: 8,  negotiations: 70,  status: 'inactive' },
  { id: '4',  name: 'Ar Condicionado',            category: 'Climatização', provider: 'Pedro Técnico',       price: 350.00, likes: 110, dislikes: 3,  negotiations: 200, status: 'active'   },
  { id: '5',  name: 'Limpeza Pós-Obra',           category: 'Limpeza',      provider: 'Maria Limpeza',       price: 420.00, likes: 88,  dislikes: 7,  negotiations: 95,  status: 'active'   },
  { id: '6',  name: 'Reforma de Banheiro',        category: 'Reformas',     provider: 'Marcos Pedreiro',     price: 3200.00,likes: 45,  dislikes: 15, negotiations: 55,  status: 'inactive' },
  { id: '7',  name: 'Manutenção de Telhado',      category: 'Construção',   provider: 'Roberto Telhador',    price: 600.00, likes: 70,  dislikes: 10, negotiations: 80,  status: 'active'   },
  { id: '8',  name: 'Jardinagem',                 category: 'Jardinagem',   provider: 'Luciana Jardins',     price: 150.00, likes: 92,  dislikes: 4,  negotiations: 110, status: 'active'   },
  { id: '9',  name: 'Montagem de Móveis',         category: 'Marcenaria',   provider: 'Fábio Montador',      price: 200.00, likes: 83,  dislikes: 9,  negotiations: 90,  status: 'inactive' },
  { id: '10', name: 'Reparo de Eletrodomésticos', category: 'Elétrica',     provider: 'Sílvio Reparador',    price: 130.00, likes: 55,  dislikes: 20, negotiations: 60,  status: 'active'   },
  { id: '11', name: 'Pintura de Fachada',         category: 'Pintura',      provider: 'Diego Pintor',        price: 1500.00,likes: 40,  dislikes: 18, negotiations: 48,  status: 'active'   },
  { id: '12', name: 'Instalação de Câmeras',      category: 'Segurança',    provider: 'Renata Segurança',    price: 450.00, likes: 78,  dislikes: 6,  negotiations: 88,  status: 'inactive' },
  { id: '13', name: 'Piso e Revestimento',        category: 'Reformas',     provider: 'Antônio Azulejista',  price: 900.00, likes: 65,  dislikes: 11, negotiations: 72,  status: 'active'   },
  { id: '14', name: 'Impermeabilização',          category: 'Construção',   provider: 'Sandra Impermeável',  price: 700.00, likes: 50,  dislikes: 14, negotiations: 58,  status: 'active'   },
  { id: '15', name: 'Dedetização',                category: 'Limpeza',      provider: 'Paulo Dedetizador',   price: 280.00, likes: 95,  dislikes: 2,  negotiations: 115, status: 'inactive' },
];

@Injectable({ providedIn: 'root' })
export class ServicesService {
  constructor(private readonly apiService: ApiService) {}

  getServices(params: ServiceListParams): Observable<PagedResult<Service>> {
    if (environment.useMock) {
      const search = params.search.toLowerCase();
      const filtered = MOCK_SERVICES.filter(
        (s) =>
          !search ||
          s.name.toLowerCase().includes(search) ||
          s.category.toLowerCase().includes(search) ||
          s.provider.toLowerCase().includes(search)
      );
      const start = (params.page - 1) * params.pageSize;
      const data = filtered.slice(start, start + params.pageSize);
      return of({ data, total: filtered.length, page: params.page, pageSize: params.pageSize }).pipe(
        delay(environment.mockDelay)
      );
    }
    return this.apiService.get<PagedResult<Service>>('/api/services', {
      page: String(params.page),
      pageSize: String(params.pageSize),
      search: params.search,
    });
  }
}
