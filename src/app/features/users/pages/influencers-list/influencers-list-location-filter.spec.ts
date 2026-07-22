import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AdminInfluencer } from '../../models/influencer.model';
import { InfluencersService } from '../../services/influencers.service';
import { InfluencersListComponent } from './influencers-list.component';

describe('InfluencersListComponent location filters', () => {
  const getInfluencers = jest.fn();

  beforeEach(() => {
    getInfluencers.mockReset();
    getInfluencers.mockReturnValue(of({ influencers: [], pages: 1, count: 0 }));

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: InfluencersService, useValue: { getInfluencers } },
      ],
    });
  });

  it('reloads the list from the existing regional filter using the state abbreviation', () => {
    const component = TestBed.runInInjectionContext(() => new InfluencersListComponent());
    component.ngOnInit();
    getInfluencers.mockClear();

    component.onLocationFilterChange({ state: 'SP' });

    expect(getInfluencers).toHaveBeenCalledTimes(1);
    expect(getInfluencers).toHaveBeenLastCalledWith(
      expect.objectContaining({ state: 'SP', city: undefined })
    );

    getInfluencers.mockClear();
    component.onLocationFilterChange({ state: 'SP', city: 'Campinas' });

    expect(getInfluencers).toHaveBeenCalledTimes(1);
    expect(getInfluencers).toHaveBeenLastCalledWith(
      expect.objectContaining({ state: 'SP', city: 'Campinas' })
    );

    component.ngOnDestroy();
  });

  it('builds a podium with the three best ranked influencers from the filtered list', () => {
    const influencer = (id: number, name: string, rankingPosition: number): AdminInfluencer =>
      ({
        id,
        name,
        stats: { rankingPosition },
      }) as AdminInfluencer;
    const component = TestBed.runInInjectionContext(() => new InfluencersListComponent());
    component.ngOnInit();
    getInfluencers.mockReturnValue(
      of({
        influencers: [
          influencer(4, 'Quarto lugar', 4),
          influencer(2, 'Segundo lugar', 2),
          influencer(1, 'Primeiro lugar', 1),
          influencer(3, 'Terceiro lugar', 3),
        ],
        pages: 1,
        count: 4,
      })
    );

    component.onLocationFilterChange({ state: 'SP' });

    expect(component.podiumInfluencers().map((item) => item.name)).toEqual([
      'Primeiro lugar',
      'Segundo lugar',
      'Terceiro lugar',
    ]);

    component.ngOnDestroy();
  });
});
