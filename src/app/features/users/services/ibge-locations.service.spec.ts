import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { IbgeLocationsService } from './ibge-locations.service';

describe('IbgeLocationsService', () => {
  let service: IbgeLocationsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IbgeLocationsService],
    });

    service = TestBed.inject(IbgeLocationsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('loads state names and abbreviations from IBGE', async () => {
    const resultPromise = firstValueFrom(service.getStates());
    const request = httpTestingController.expectOne(
      'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome'
    );

    request.flush([
      { id: 33, sigla: 'RJ', nome: 'Rio de Janeiro' },
      { id: 35, sigla: 'SP', nome: 'São Paulo' },
    ]);

    await expect(resultPromise).resolves.toEqual([
      { id: 33, abbreviation: 'RJ', name: 'Rio de Janeiro' },
      { id: 35, abbreviation: 'SP', name: 'São Paulo' },
    ]);
  });

  it('loads municipality names for the selected state abbreviation', async () => {
    const resultPromise = firstValueFrom(service.getCities('RJ'));
    const request = httpTestingController.expectOne(
      'https://servicodados.ibge.gov.br/api/v1/localidades/estados/RJ/municipios?orderBy=nome'
    );

    request.flush([{ nome: 'Niterói' }, { nome: 'Rio de Janeiro' }]);

    await expect(resultPromise).resolves.toEqual(['Niterói', 'Rio de Janeiro']);
  });
});
