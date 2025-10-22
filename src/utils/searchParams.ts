import { SearchParams } from '../types/search';

export function parseSearchParams(searchParams: URLSearchParams) {
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Get all facet parameters (now using fq instead of f)
  const facets = Array.from(searchParams.entries())
    .filter(([key]) => key.startsWith('fq[') || key.startsWith('include_filters['))
    .map(([key, value]) => {
      const field = key.match(/(?:fq|include_filters)\[(.*?)\]/)?.[1] || '';
      return { field, value };
    });

  // Get excluded facet parameters
  const excludeFacets = Array.from(searchParams.entries())
    .filter(([key]) => key.startsWith('exclude_filters['))
    .map(([key, value]) => {
      const field = key.match(/exclude_filters\[(.*?)\]/)?.[1] || '';
      return { field, value };
    });

  console.log('🔗 parseSearchParams called with:', {
    rawParams: Object.fromEntries(searchParams.entries()),
    parsed: { query, page, facets: facets.length, excludeFacets: excludeFacets.length },
  });

  return { query, page, facets, excludeFacets };
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

  // Add facet parameters using include_filters[] format for new API while keeping fq for backward links
  params.facets.forEach(({ field, value }) => {
    searchParams.append(`include_filters[${field}][]`, value);
  });

  // Add exclude filters if provided
  if (params.excludeFacets) {
    params.excludeFacets.forEach(({ field, value }) => {
      searchParams.append(`exclude_filters[${field}][]`, value);
    });
  }

  return searchParams;
}
