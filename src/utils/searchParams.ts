import { FacetFilter, SearchParams } from '../types/search';

export function parseSearchParams(searchParams: URLSearchParams) {
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  // Get all facet parameters (now using fq instead of f)
  const facets = Array.from(searchParams.entries())
    .filter(([key]) => key.startsWith('fq['))
    .map(([key, value]) => {
      // Extract field name from fq[field_name][]
      const field = key.match(/fq\[(.*?)\]/)?.[1] || '';
      return { field, value };
    });

  return { query, page, facets };
}

export function buildSearchParams(params: SearchParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  
  if (params.query) {
    searchParams.set('q', params.query);
  }
  
  if (params.page > 1) {
    searchParams.set('page', params.page.toString());
  }
  
  if (params.perPage !== 10) {
    searchParams.set('per_page', params.perPage.toString());
  }
  
  // Add facet parameters using fq[] format
  params.facets.forEach(({ field, value }) => {
    searchParams.append(`fq[${field}][]`, value);
  });
  
  return searchParams;
}