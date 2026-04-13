import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Influencer, PagedResult, InfluencerListParams } from '../models/influencer.model';

const MOCK_INFLUENCERS: Influencer[] = Array.from({ length: 30 }, (_, i) => ({
  id: `inf-${i + 1}`,
  name: `Influencer ${i + 1}`,
  email: `influencer${i + 1}@email.com`,
  phone: `(${10 + (i % 90)}) 9 ${1000 + i}-${2000 + i}`,
  dateOfBirth: `199${i % 10}-0${(i % 12) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
  openServices: Math.floor(Math.random() * 20),
  rating: Math.floor(Math.random() * 1000) + 100,
  comments: Math.floor(Math.random() * 500) + 50,
  totalReferrals: Math.floor(Math.random() * 150) + 10,
  totalPlatformValue: Math.random() * 50000 + 5000,
  accumulatedCommission: Math.random() * 5000 + 500,
  rankingPosition: i + 1,
  status: i % 4 === 0 ? 'inactive' : 'active',
}));

@Injectable({ providedIn: 'root' })
export class InfluencersService {
  getInfluencers(params: InfluencerListParams): Observable<PagedResult<Influencer>> {
    const filtered = MOCK_INFLUENCERS.filter((inf) =>
      inf.name.toLowerCase().includes(params.search.toLowerCase()) ||
      inf.email.toLowerCase().includes(params.search.toLowerCase())
    );
    const start = (params.page - 1) * params.pageSize;
    const data = filtered.slice(start, start + params.pageSize);
    return of({ data, total: filtered.length, page: params.page, pageSize: params.pageSize }).pipe(delay(400));
  }

  getInfluencerById(id: string): Observable<Influencer | undefined> {
    return of(MOCK_INFLUENCERS.find((i) => i.id === id)).pipe(delay(300));
  }

  updateInfluencer(id: string, changes: Partial<Influencer>): Observable<Influencer> {
    const idx = MOCK_INFLUENCERS.findIndex((i) => i.id === id);
    if (idx !== -1) Object.assign(MOCK_INFLUENCERS[idx], changes);
    return of(MOCK_INFLUENCERS[idx]).pipe(delay(500));
  }
}
