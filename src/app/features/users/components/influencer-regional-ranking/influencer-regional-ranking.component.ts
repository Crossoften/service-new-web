import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith, takeUntil } from 'rxjs/operators';

import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import {
  InfluencerListLocationFilter,
  InfluencerRegionalRankingItem,
} from '../../models/influencer.model';
import { IbgeLocationsService, IbgeStateOption } from '../../services/ibge-locations.service';
import { InfluencersService } from '../../services/influencers.service';

@Component({
  selector: 'app-influencer-regional-ranking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSkeletonComponent],
  templateUrl: './influencer-regional-ranking.component.html',
  styleUrls: ['./influencer-regional-ranking.component.scss'],
})
export class InfluencerRegionalRankingComponent implements OnInit, OnDestroy {
  @Output() readonly locationFilterChange = new EventEmitter<InfluencerListLocationFilter>();

  private readonly influencersService = inject(InfluencersService);
  private readonly ibgeLocationsService = inject(IbgeLocationsService);
  private readonly destroy$ = new Subject<void>();
  private cityRequestId = 0;

  readonly stateControl = new FormControl({ value: '', disabled: true }, { nonNullable: true });
  readonly cityControl = new FormControl({ value: '', disabled: true }, { nonNullable: true });
  readonly stateOptions = signal<IbgeStateOption[]>([]);
  readonly cityOptions = signal<string[]>([]);
  readonly rankingRows = signal<InfluencerRegionalRankingItem[]>([]);
  readonly isLoadingStates = signal(false);
  readonly isLoadingCities = signal(false);
  readonly isLoading = signal(false);
  readonly locationError = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly hasLoaded = signal(false);

  canLoadRanking(): boolean {
    return this.normalizedState().length === 2 && this.normalizedCity().length > 1;
  }

  ngOnInit(): void {
    this.registerRankingFilterChanges();
    this.registerStateChanges();
    this.loadStateOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRanking(): void {
    const stateAbbreviation = this.normalizedState();
    const state = this.selectedStateName();
    const city = this.normalizedCity();

    if (stateAbbreviation.length !== 2 || city.length < 2) {
      this.errorMessage.set('Selecione um estado e uma cidade para consultar o desempenho.');
      this.rankingRows.set([]);
      this.hasLoaded.set(true);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.rankingRows.set([]);

    this.influencersService
      .getRegionalRanking({ state, city })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.rankingRows.set(rows);
          this.hasLoaded.set(true);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Não foi possível carregar o desempenho por cidade.');
          this.rankingRows.set([]);
          this.hasLoaded.set(true);
          this.isLoading.set(false);
        },
      });
  }

  formatNumber(value: number | null): string {
    return value == null ? 'Não informado' : value.toLocaleString('pt-BR');
  }

  formatPosition(value: number | null): string {
    return value == null ? 'Não informado' : `#${value}`;
  }

  private registerRankingFilterChanges(): void {
    combineLatest([
      this.stateControl.valueChanges.pipe(
        startWith(this.stateControl.value),
        distinctUntilChanged()
      ),
      this.cityControl.valueChanges.pipe(startWith(this.cityControl.value), distinctUntilChanged()),
    ])
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.canLoadRanking()) {
          this.loadRanking();
          return;
        }

        this.rankingRows.set([]);
        this.errorMessage.set(null);
        this.hasLoaded.set(false);
        this.isLoading.set(false);
      });
  }

  private registerStateChanges(): void {
    this.stateControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((state) => {
        this.loadCityOptions(state);
        this.emitLocationFilter();
      });

    this.cityControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.emitLocationFilter());
  }

  private emitLocationFilter(): void {
    this.locationFilterChange.emit({
      state: this.normalizedState() || undefined,
      city: this.normalizedCity() || undefined,
    });
  }

  private loadStateOptions(): void {
    this.stateControl.disable({ emitEvent: false });
    this.isLoadingStates.set(true);
    this.locationError.set(null);

    this.ibgeLocationsService
      .getStates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (states) => {
          this.stateOptions.set(states);
          this.stateControl.enable({ emitEvent: false });
          this.isLoadingStates.set(false);
        },
        error: () => {
          this.stateOptions.set([]);
          this.locationError.set('Não foi possível carregar os estados. Tente novamente.');
          this.isLoadingStates.set(false);
        },
      });
  }

  private loadCityOptions(state: string): void {
    const requestId = ++this.cityRequestId;
    const stateAbbreviation = state.trim().toUpperCase();

    this.cityControl.setValue('', { emitEvent: false });
    this.cityControl.disable({ emitEvent: false });
    this.cityOptions.set([]);
    this.isLoadingCities.set(false);
    this.locationError.set(null);

    if (!stateAbbreviation) {
      return;
    }

    this.isLoadingCities.set(true);

    this.ibgeLocationsService
      .getCities(stateAbbreviation)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cities) => {
          if (requestId !== this.cityRequestId) {
            return;
          }

          this.cityOptions.set(cities);
          this.cityControl.enable({ emitEvent: false });
          this.isLoadingCities.set(false);
        },
        error: () => {
          if (requestId !== this.cityRequestId) {
            return;
          }

          this.locationError.set('Não foi possível carregar as cidades deste estado.');
          this.isLoadingCities.set(false);
        },
      });
  }

  private normalizedState(): string {
    return this.stateControl.value.trim().toUpperCase();
  }

  private normalizedCity(): string {
    return this.cityControl.value.trim();
  }

  private selectedStateName(): string {
    const stateAbbreviation = this.normalizedState();
    return (
      this.stateOptions().find((state) => state.abbreviation === stateAbbreviation)?.name ??
      stateAbbreviation
    );
  }
}
