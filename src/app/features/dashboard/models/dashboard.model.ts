export interface DashboardCards {
  totalUsers: number;
  totalServices: number;
  totalCashValue: number;
}

export interface DashboardChartMonth {
  month: string;
  users: number;
  services: number;
}

export interface DashboardChart {
  months: DashboardChartMonth[];
}

// API response interfaces — not consumed by components directly
export interface DashboardCardsApiResponse {
  totalUsers: number;
  totalServices: number;
  totalCashValue: number;
}

export interface DashboardChartApiDataItem {
  month: number;
  users: number;
  services: number;
}

export interface DashboardChartApiResponse {
  year: number;
  data: DashboardChartApiDataItem[];
}
