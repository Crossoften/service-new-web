import {
  billingTypeOptions,
  booleanFilterOptions,
  formatFullAddress,
  formatFollowers,
  formatLocation,
  getBillingTypeLabel,
  getCityDisplay,
  getSocialNetworkLabel,
  getStateDisplay,
  normalizeBillingTypeFilterValue,
  normalizeBooleanFilterValue,
  normalizeNumberFilterValue,
  normalizeTextFilterValue,
  profileTypeOptions,
  statusOptions,
} from './user-display.utils';

describe('user display utilities', () => {
  it('formats a complete address with number and location', () => {
    expect(
      formatFullAddress({
        id: 1,
        street: 'Rua das Palmeiras',
        number: '458',
        neighborhood: 'Centro',
        city: 'Uberlândia',
        state: 'Minas Gerais',
      })
    ).toBe('Rua das Palmeiras, 458 — Centro, Uberlândia/MG');
  });

  it('formats location without showing empty separators', () => {
    expect(formatLocation({ id: 1, city: 'Uberlândia', state: 'Minas Gerais' })).toBe(
      'Uberlândia/MG'
    );
    expect(formatLocation(null)).toBe('Não informado');
  });

  it('formats city and state columns independently without converting full state names', () => {
    expect(getCityDisplay('  Rio de Janeiro  ')).toBe('Rio de Janeiro');
    expect(getCityDisplay('')).toBe('Não informada');
    expect(getCityDisplay(null)).toBe('Não informada');
    expect(getStateDisplay('São Paulo')).toBe('São Paulo');
    expect(getStateDisplay('')).toBe('Não informado');
    expect(getStateDisplay(undefined)).toBe('Não informado');
  });

  it('formats social follower counts in friendly Portuguese abbreviations', () => {
    expect(formatFollowers(999)).toBe('999');
    expect(formatFollowers(15400)).toBe('15,4 mil');
    expect(formatFollowers(1250000)).toBe('1,3 mi');
    expect(formatFollowers(null)).toBe('Não informado');
  });

  it('translates billing and social network labels', () => {
    expect(getBillingTypeLabel('Subscription')).toBe('Assinatura');
    expect(getBillingTypeLabel('Commission')).toBe('Comissão');
    expect(getBillingTypeLabel(null)).toBe('Não paga');
    expect(getSocialNetworkLabel('YouTube')).toBe('YouTube');
  });

  it('exposes friendly select options for administrative filters', () => {
    expect(billingTypeOptions).toEqual([
      { value: 'None', label: 'Não definido' },
      { value: 'Subscription', label: 'Assinatura' },
      { value: 'Commission', label: 'Comissão' },
    ]);
    expect(statusOptions).toEqual([
      { value: 'Active', label: 'Ativos' },
      { value: 'Pending', label: 'Pendentes' },
      { value: 'Inactive', label: 'Inativos' },
    ]);
    expect(profileTypeOptions).toEqual([
      { value: 'Client', label: 'Clientes' },
      { value: 'Supplier', label: 'Fornecedores' },
      { value: 'Influencer', label: 'Influencers' },
      { value: 'Partner', label: 'Parceiros' },
      { value: 'Delivery', label: 'Entregadores' },
    ]);
    expect(booleanFilterOptions).toEqual([
      { value: 'true', label: 'Sim' },
      { value: 'false', label: 'Não' },
    ]);
  });

  it('normalizes blank and masked administrative filter values before querying the API', () => {
    expect(normalizeBillingTypeFilterValue('')).toBeUndefined();
    expect(normalizeBillingTypeFilterValue('Subscription')).toBe('Subscription');
    expect(normalizeTextFilterValue('  Uberlândia  ')).toBe('Uberlândia');
    expect(normalizeTextFilterValue('   ')).toBeUndefined();
    expect(normalizeBooleanFilterValue('')).toBeUndefined();
    expect(normalizeBooleanFilterValue('true')).toBe(true);
    expect(normalizeBooleanFilterValue('false')).toBe(false);
    expect(normalizeNumberFilterValue(' R$ 1.250,50 ')).toBe(1250.5);
    expect(normalizeNumberFilterValue('abc')).toBeUndefined();
  });
});
