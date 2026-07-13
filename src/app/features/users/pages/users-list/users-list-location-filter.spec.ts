import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { InfluencersService } from '../../services/influencers.service';
import { UsersService } from '../../services/users.service';
import { UsersListComponent } from './users-list.component';

describe('UsersListComponent location filters', () => {
  const getUsers = jest.fn();

  beforeEach(() => {
    getUsers.mockReset();
    getUsers.mockReturnValue(
      of({
        users: [],
        pages: 1,
        count: 0,
      })
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: UsersService, useValue: { getUsers } },
        { provide: InfluencersService, useValue: { getInfluencers: jest.fn() } },
      ],
    });
  });

  it('sends the full state name to the users API while keeping the selected UF', () => {
    const component = TestBed.runInInjectionContext(() => new UsersListComponent());
    component.stateControl.setValue('RJ');
    component.cityControl.setValue('Rio de Janeiro');

    component.loadUsers();

    expect(getUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        state: 'Rio de Janeiro',
        city: 'Rio de Janeiro',
      })
    );
    expect(component.stateControl.value).toBe('RJ');
  });
});
