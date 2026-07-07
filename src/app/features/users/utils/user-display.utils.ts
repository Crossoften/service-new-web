import {
  AdminUserAddress,
  AdminUserBillingType,
  AdminUserProfileType,
  AdminUserSocialNetwork,
  AdminUserStatus,
} from '../models/user.model';

const stateAbbreviations: Record<string, string> = {
  Acre: 'AC',
  Alagoas: 'AL',
  Amapá: 'AP',
  Amazonas: 'AM',
  Bahia: 'BA',
  Ceará: 'CE',
  'Distrito Federal': 'DF',
  'Espírito Santo': 'ES',
  Goiás: 'GO',
  Maranhão: 'MA',
  'Mato Grosso': 'MT',
  'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG',
  Pará: 'PA',
  Paraíba: 'PB',
  Paraná: 'PR',
  Pernambuco: 'PE',
  Piauí: 'PI',
  'Rio de Janeiro': 'RJ',
  'Rio Grande do Norte': 'RN',
  'Rio Grande do Sul': 'RS',
  Rondônia: 'RO',
  Roraima: 'RR',
  'Santa Catarina': 'SC',
  'São Paulo': 'SP',
  Sergipe: 'SE',
  Tocantins: 'TO',
};

export interface BillingTypeOption {
  value: Exclude<AdminUserBillingType, null>;
  label: string;
}

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

export const billingTypeOptions: BillingTypeOption[] = [
  { value: 'None', label: 'Não definido' },
  { value: 'Subscription', label: 'Assinatura' },
  { value: 'Commission', label: 'Comissão' },
];

export const statusOptions: FilterOption<AdminUserStatus>[] = [
  { value: 'Active', label: 'Ativos' },
  { value: 'Pending', label: 'Pendentes' },
  { value: 'Inactive', label: 'Inativos' },
];

export const profileTypeOptions: FilterOption<Exclude<AdminUserProfileType, 'Unknown'>>[] = [
  { value: 'Client', label: 'Clientes' },
  { value: 'Supplier', label: 'Fornecedores' },
  { value: 'Influencer', label: 'Influencers' },
  { value: 'Partner', label: 'Parceiros' },
  { value: 'Delivery', label: 'Entregadores' },
];

export const booleanFilterOptions: FilterOption<'true' | 'false'>[] = [
  { value: 'true', label: 'Sim' },
  { value: 'false', label: 'Não' },
];

export function normalizeBillingTypeFilterValue(
  value: Exclude<AdminUserBillingType, null> | '' | null | undefined
): Exclude<AdminUserBillingType, null> | undefined {
  return value || undefined;
}

export function normalizeTextFilterValue(value: string | null | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function normalizeBooleanFilterValue(
  value: 'true' | 'false' | '' | null | undefined
): boolean | undefined {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

export function normalizeNumberFilterValue(
  value: string | number | null | undefined
): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  const normalized = value
    ?.replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  if (!normalized) {
    return undefined;
  }

  const numericValue = Number(normalized);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

export function getBillingTypeLabel(billingType: AdminUserBillingType | undefined): string {
  switch (billingType) {
    case 'Subscription':
      return 'Assinatura';
    case 'Commission':
      return 'Comissão';
    case 'None':
      return 'Não definido';
    case null:
    case undefined:
      return 'Não paga';
  }
}

export function getSocialNetworkLabel(network: AdminUserSocialNetwork | string): string {
  switch (network) {
    case 'Instagram':
      return 'Instagram';
    case 'TikTok':
      return 'TikTok';
    case 'YouTube':
      return 'YouTube';
    case 'Facebook':
      return 'Facebook';
    case 'X':
      return 'X';
    default:
      return 'Outra rede';
  }
}

export function formatFollowers(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return 'Não informado';
  }

  if (value >= 1_000_000) {
    return `${formatDecimal(value / 1_000_000)} mi`;
  }

  if (value >= 1_000) {
    return `${formatDecimal(value / 1_000)} mil`;
  }

  return value.toLocaleString('pt-BR');
}

export function formatLocation(address: Partial<AdminUserAddress> | null | undefined): string {
  const city = normalizeText(address?.city);
  const state = normalizeState(address?.state);

  if (city && state) {
    return `${city}/${state}`;
  }

  return city || state || 'Não informado';
}

export function formatFullAddress(address: AdminUserAddress | null | undefined): string {
  if (!address) {
    return 'Não informado';
  }

  const streetLine = [normalizeText(address.street), normalizeText(address.number)]
    .filter(Boolean)
    .join(', ');
  const locationLine = [normalizeText(address.neighborhood), formatLocation(address)]
    .filter((part) => part && part !== 'Não informado')
    .join(', ');
  const zipCode = normalizeText(address.zipCode);
  const firstPart = [streetLine, locationLine].filter(Boolean).join(' — ');

  return [firstPart, zipCode].filter(Boolean).join(' · ') || 'Não informado';
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function normalizeState(value: string | null | undefined): string {
  const state = normalizeText(value);
  if (!state) {
    return '';
  }

  return state.length === 2 ? state.toUpperCase() : (stateAbbreviations[state] ?? state);
}

function formatDecimal(value: number): string {
  return value.toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  });
}
