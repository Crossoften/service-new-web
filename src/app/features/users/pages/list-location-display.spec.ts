import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { InfluencersListComponent } from './influencers-list/influencers-list.component';
import { UsersListComponent } from './users-list/users-list.component';
import { InfluencersService } from '../services/influencers.service';
import { UsersService } from '../services/users.service';

describe('user list location presentation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: UsersService, useValue: {} },
        { provide: InfluencersService, useValue: {} },
      ],
    });
  });

  it('uses the same city and state fallbacks in users and influencers lists', () => {
    const usersComponent = TestBed.runInInjectionContext(() => new UsersListComponent());
    const influencersComponent = TestBed.runInInjectionContext(
      () => new InfluencersListComponent()
    );

    expect(usersComponent.getCityDisplay('Campinas')).toBe('Campinas');
    expect(usersComponent.getCityDisplay(' ')).toBe('Não informada');
    expect(usersComponent.getStateDisplay('São Paulo')).toBe('São Paulo');
    expect(usersComponent.getStateDisplay(null)).toBe('Não informado');

    expect(influencersComponent.getCityDisplay(null)).toBe('Não informada');
    expect(influencersComponent.getStateDisplay('Minas Gerais')).toBe('Minas Gerais');
  });
});
