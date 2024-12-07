export interface FacetFilter {
  field: string;
  value: string;
}

export interface SearchParams {
  query: string;
  page: number;
  perPage: number;
  facets: FacetFilter[];
}

export interface SearchState extends SearchParams {
  isLoading: boolean;
  error: string | null;
}