import { FacetFilter, SearchParams } from '../types/search';

export function parseSearchParams(searchParams: URLSearchParams): SearchParams {
  const facets: FacetFilter[] = [];
  
  // Extract facet parameters
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('f[') && key.endsWith('][]')) {
      const field = key.slice(2, -3); // Remove 'f[' and '][]'
      facets.push({
        field: decodeURIComponent(field),
        value: decodeURIComponent(value)
      });
    }
  }

  return {
    query: searchParams.get('q') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
    perPage: parseInt(searchParams.get('per_page') || '10', 10),
    facets
  };
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
  
  // Add facet parameters
  params.facets.forEach(({ field, value }) => {
    searchParams.append(`f[${field}][]`, value);
  });
  
  return searchParams;
}