import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface IbgeStateOption {
  id: number;
  abbreviation: string;
  name: string;
}

interface IbgeStateResponse {
  id: number;
  sigla: string;
  nome: string;
}

interface IbgeCityResponse {
  nome: string;
}

@Injectable({ providedIn: 'root' })
export class IbgeLocationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://servicodados.ibge.gov.br/api/v1/localidades';

  getStates(): Observable<IbgeStateOption[]> {
    return this.http.get<IbgeStateResponse[]>(`${this.apiUrl}/estados?orderBy=nome`).pipe(
      map((states) =>
        states.map((state) => ({
          id: state.id,
          abbreviation: state.sigla,
          name: state.nome,
        }))
      )
    );
  }

  getCities(stateAbbreviation: string): Observable<string[]> {
    const state = encodeURIComponent(stateAbbreviation.trim().toUpperCase());

    return this.http
      .get<IbgeCityResponse[]>(`${this.apiUrl}/estados/${state}/municipios?orderBy=nome`)
      .pipe(map((cities) => cities.map((city) => city.nome).filter(Boolean)));
  }
}
