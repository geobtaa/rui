import { JsonApiResponse, SearchResponse, GeoDocumentDetails, SortOption } from '../types/api';
import { FacetFilter } from '../types/search';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

function transformJsonApiResponse(jsonApiResponse: JsonApiResponse): SearchResponse {
  // Transform included facets into the expected format
  const facets = jsonApiResponse.included?.reduce((acc, item) => {
    if (item.type === 'facet' && item.attributes.items.length > 0) {
      acc[item.id] = {
        label: item.attributes.label,
        items: item.attributes.items.map(item => ({
          label: item.attributes.label,
          value: item.attributes.value,
          hits: item.attributes.hits,
          url: item.links.self
        }))
      };
    }
    return acc;
  }, {} as SearchResponse['facets']);

  // Transform sort options
  const sortOptions = jsonApiResponse.included
    ?.filter((item): item is SortOption => item.type === 'sort')
    .map(item => ({
      id: item.id,
      label: item.attributes.label,
      url: item.links.self
    }));

  return {
    response: {
      docs: jsonApiResponse.data.map(item => ({
        id: item.id,
        dct_title_s: item.attributes.dct_title_s,
        dct_creator_sm: item.attributes.dct_creator_sm || [],
        dct_description_sm: item.attributes.dct_description_sm || [],
        dc_publisher_sm: item.attributes.dc_publisher_sm || [],
        dct_spatial_sm: item.attributes.dct_spatial_sm || [],
        gbl_resourceclass_sm: item.attributes.gbl_resourceclass_sm || [],
        gbl_resourcetype_sm: item.attributes.gbl_resourcetype_sm || [],
        b1g_language_sm: item.attributes.b1g_language_sm || [],
        dc_subject_sm: item.attributes.dc_subject_sm || [],
        schema_provider_s: item.attributes.schema_provider_s || '',
        dct_accessrights_s: item.attributes.dct_accessrights_s || '',
        gbl_georeferenced_b: item.attributes.gbl_georeferenced_b || '',
        b1g_georeferenced_allmaps_b: item.attributes.b1g_georeferenced_allmaps_b || '',
        dct_temporal_sm: item.attributes.dct_temporal_sm || [],
        dct_rightsholder_sm: item.attributes.dct_rightsholder_sm || [],
        dct_license_sm: item.attributes.dct_license_sm || [],
        dct_subject_sm: item.attributes.dct_subject_sm || [],
        dct_references_s: item.attributes.dct_references_s || '',
        locn_geometry: item.attributes.locn_geometry,
        ui_viewer_geometry: item.attributes.ui_viewer_geometry || ''
      })),
      numFound: jsonApiResponse.meta.pages.total_count,
      start: ((jsonApiResponse.meta.pages.current_page || 1) - 1) * 10
    },
    facets: facets || {},
    sortOptions
  };
}

export async function fetchSearchResults(
  query: string, 
  page: number = 1, 
  perPage: number = 10,
  facets: FacetFilter[] = [],
  onApiCall?: (url: string) => void,
  sort?: string
): Promise<SearchResponse> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/search/` 
    : 'https://geo.btaa.org/';
  const url = new URL(baseUrl);
  
  url.searchParams.set('format', 'json');
  url.searchParams.set('search_field', 'all_fields');
  if (query.trim()) {
    url.searchParams.set('q', query);
  } else {
    url.searchParams.set('q', ' ');
  }
  url.searchParams.set('page', page.toString());
  url.searchParams.set('per_page', perPage.toString());
  
  if (sort && sort !== 'relevance') {
    url.searchParams.set('sort', sort);
  }
  
  // Add facet filters using fq[] format
  facets.forEach(({ field, value }) => {
    url.searchParams.append(`fq[${field}][]`, value);
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
    throw new ApiError(`Failed to fetch search results: ${error.message}`);
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