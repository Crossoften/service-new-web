export interface Service {
  id: string;
  name: string;
  category: string;
  provider: string;
  price: number;
  likes: number;
  dislikes: number;
  negotiations: number;
  status: 'active' | 'inactive';
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ServiceListParams {
  page: number;
  pageSize: number;
  search: string;
}
