import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { InfluencersService } from '../../services/influencers.service';
import { IbgeLocationsService } from '../../services/ibge-locations.service';
import { InfluencerRegionalRankingComponent } from './influencer-regional-ranking.component';

describe('InfluencerRegionalRankingComponent IBGE filters', () => {
  const getRegionalRanking = jest.fn();
  const getStates = jest.fn();
  const getCities = jest.fn();

  beforeEach(() => {
    getRegionalRanking.mockReset();
    getRegionalRanking.mockReturnValue(of([]));
    getStates.mockReset();
    getStates.mockReturnValue(
      of([
        { id: 33, abbreviation: 'RJ', name: 'Rio de Janeiro' },
        { id: 35, abbreviation: 'SP', name: 'São Paulo' },
      ])
    );
    getCities.mockReset();

    TestBed.configureTestingModule({
      providers: [
        { provide: InfluencersService, useValue: { getRegionalRanking } },
        { provide: IbgeLocationsService, useValue: { getStates, getCities } },
      ],
    });
  });

  it('loads IBGE states and enables cities only after the selected state cities arrive', () => {
    const citiesResponse = new Subject<string[]>();
    getCities.mockReturnValue(citiesResponse.asObservable());
    const component = TestBed.runInInjectionContext(() => new InfluencerRegionalRankingComponent());

    component.ngOnInit();

    expect(getStates).toHaveBeenCalledTimes(1);
    expect(component.stateOptions()).toEqual([
      { id: 33, abbreviation: 'RJ', name: 'Rio de Janeiro' },
      { id: 35, abbreviation: 'SP', name: 'São Paulo' },
    ]);
    expect(component.cityControl.disabled).toBe(true);

    component.stateControl.setValue('RJ');

    expect(getCities).toHaveBeenCalledWith('RJ');
    expect(component.cityControl.disabled).toBe(true);
    expect(component.isLoadingCities()).toBe(true);

    citiesResponse.next(['Niterói', 'Rio de Janeiro']);
    citiesResponse.complete();

    expect(component.cityOptions()).toEqual(['Niterói', 'Rio de Janeiro']);
    expect(component.cityControl.enabled).toBe(true);
    expect(component.isLoadingCities()).toBe(false);

    component.ngOnDestroy();
  });

  it('loads the ranking with the selected IBGE state abbreviation and municipality', fakeAsync(() => {
    getCities.mockReturnValue(of(['Rio de Janeiro']));
    const component = TestBed.runInInjectionContext(() => new InfluencerRegionalRankingComponent());
    component.ngOnInit();

    component.stateControl.setValue('RJ');
    component.cityControl.setValue('Rio de Janeiro');
    tick(300);

    expect(getRegionalRanking).toHaveBeenCalledWith({
      state: 'RJ',
      city: 'Rio de Janeiro',
    });

    component.ngOnDestroy();
  }));
});
