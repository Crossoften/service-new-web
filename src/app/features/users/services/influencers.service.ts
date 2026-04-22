import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Influencer, PagedResult, InfluencerListParams } from '../models/influencer.model';

@Injectable({ providedIn: 'root' })
export class InfluencersService {
  getInfluencers(_params: InfluencerListParams): Observable<PagedResult<Influencer>> {
    return throwError(
      () =>
        new Error(
          'O contrato atual do backend nao documenta endpoints para o modulo de influencers.'
        )
    );
  }

  getInfluencerById(_id: string): Observable<Influencer | undefined> {
    return throwError(
      () =>
        new Error(
          'O contrato atual do backend nao documenta endpoints para o modulo de influencers.'
        )
    );
  }

  updateInfluencer(_id: string, _changes: Partial<Influencer>): Observable<Influencer> {
    return throwError(
      () =>
        new Error(
          'O contrato atual do backend nao documenta endpoints para o modulo de influencers.'
        )
    );
  }
}
