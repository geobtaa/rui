import { JsonApiResponse, SearchResponse, GeoDocumentDetails } from '../types/api';
import { FacetFilter } from '../types/search';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

function transformJsonApiResponse(jsonApiResponse: JsonApiResponse): SearchResponse {
  return {
    response: {
      docs: jsonApiResponse.data.map(item => ({
        id: item.id,
        dct_title_s: item.attributes.dct_title_s,
        description: item.attributes.description || [],
        dct_provenance_s: item.attributes.dct_provenance_s || '',
        dc_publisher_sm: item.attributes.dc_publisher_sm || [],
        dct_issued_s: item.attributes.dct_issued_s || ''
      })),
      numFound: jsonApiResponse.meta.pages.total_count,
      start: (jsonApiResponse.meta.pages.current_page - 1) * 10
    }
  };
}

export async function fetchSearchResults(
  query: string, 
  page: number = 1, 
  perPage: number = 10,
  facets: FacetFilter[] = [],
  onApiCall?: (url: string) => void
): Promise<SearchResponse> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/documents/` 
    : 'https://geo.btaa.org/';
  const url = new URL(baseUrl);
  url.searchParams.set('format', 'json');
  url.searchParams.set('search_field', 'all_fields');
  url.searchParams.set('q', query);
  url.searchParams.set('page', page.toString());
  url.searchParams.set('per_page', perPage.toString());
  
  // Add facet filters
  facets.forEach(({ field, value }) => {
    url.searchParams.append(`f[${field}][]`, value);
  });

  const finalUrl = url.toString();
  onApiCall?.(finalUrl);
  
  try {
    const response = await fetch(finalUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new ApiError(`HTTP error ${response.status}`, response.status);
    }
    
    const data: JsonApiResponse = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new ApiError('Invalid response format from API');
    }
    
    return transformJsonApiResponse(data);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch search results');
  }
}

export async function fetchItemDetails(id: string, onApiCall?: (url: string) => void): Promise<GeoDocumentDetails> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/documents/` 
    : 'https://geo.btaa.org/';
  const url = `${baseUrl}${id}`;
  onApiCall?.(url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new ApiError(`HTTP error ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch item details');
  }
}