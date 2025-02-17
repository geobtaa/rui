import { JsonApiResponse, SearchResponse, GeoDocumentDetails, SortOption } from '../types/api';
import { FacetFilter } from '../types/search';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  // Only include CSRF token if it exists
  ...(import.meta.env.VITE_CSRF_TOKEN ? {
    'X-CSRF-Token': import.meta.env.VITE_CSRF_TOKEN
  } : {})
};

// Update the fetch configuration in all request functions
const fetchConfig = {
  // credentials: 'include', // Comment this out temporarily
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  mode: 'cors' as const
};

function transformJsonApiResponse(jsonApiResponse: JsonApiResponse): SearchResponse {
  // Add debug logging
  console.log('Raw API Response:', jsonApiResponse);
  
  const docs = jsonApiResponse.data.map(item => {
    const doc = {
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
      ui_viewer_geometry: item.attributes.ui_viewer_geometry || '',
      ui_thumbnail_url: item.attributes.ui_thumbnail_url,
    };
    console.log(`Transformed doc ${item.id}:`, { 
      title: doc.dct_title_s, 
      thumbnail: doc.ui_thumbnail_url 
    });
    return doc;
  });

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
      docs,
      numFound: jsonApiResponse.meta.pages.total_count,
      start: ((jsonApiResponse.meta.pages.current_page || 1) - 1) * 10
    },
    facets: facets || {},
    sortOptions
  };
}

function jsonp<T>(url: string, callbackName: string = 'rui'): Promise<T> {
  return new Promise((resolve, reject) => {
    // Create a unique callback name if needed
    const uniqueCallback = `${callbackName}_${Date.now()}`;
    
    // Add the callback to window
    (window as any)[uniqueCallback] = (data: T) => {
      // Clean up
      document.head.removeChild(script);
      delete (window as any)[uniqueCallback];
      resolve(data);
    };

    // Create script element
    const script = document.createElement('script');
    const urlWithCallback = new URL(url);
    urlWithCallback.searchParams.set('callback', uniqueCallback);
    script.src = urlWithCallback.toString();
    script.onerror = () => {
      document.head.removeChild(script);
      delete (window as any)[uniqueCallback];
      reject(new Error('JSONP request failed'));
    };

    // Add script to document
    document.head.appendChild(script);
  });
}

interface FetchOptions {
  useJsonp?: boolean;
}

async function unifiedFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
  if (options.useJsonp) {
    return jsonp<T>(url);
  }

  const response = await fetch(url, {
    headers: defaultHeaders,
    mode: 'cors',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new ApiError(`HTTP error ${response.status}`, response.status);
  }

  return response.json();
}

export async function fetchSearchResults(
  query: string, 
  page: number = 1, 
  perPage: number = 10,
  facets: FacetFilter[] = [],
  onApiCall?: (url: string) => void,
  sort?: string,
  options: FetchOptions = {}
): Promise<SearchResponse> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/search/` 
    : 'https://geo.btaa.org/';
  const url = new URL(baseUrl);
  
  url.searchParams.set('format', 'json');
  url.searchParams.set('search_field', 'all_fields');
  url.searchParams.set('q', query);
  url.searchParams.set('page', page.toString());
  url.searchParams.set('per_page', perPage.toString());
  
  if (sort && sort !== 'relevance') {
    url.searchParams.set('sort', sort);
  }
  
  facets.forEach(({ field, value }) => {
    url.searchParams.append(`fq[${field}][]`, value);
  });

  const finalUrl = url.toString();
  onApiCall?.(finalUrl);
  
  try {
    const data = await unifiedFetch<JsonApiResponse>(finalUrl, options);
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new ApiError('Invalid response format from API');
    }
    
    return transformJsonApiResponse(data);
  } catch (error) {
    console.error('Fetch error details:', error);
    throw error;
  }
}

export async function fetchItemDetails(
  id: string, 
  onApiCall?: (url: string) => void,
  options: FetchOptions = {}
): Promise<GeoDocumentDetails> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/documents/` 
    : 'https://geo.btaa.org/';
  const url = `${baseUrl}${id}`;
  onApiCall?.(url);
  
  try {
    return await unifiedFetch<GeoDocumentDetails>(url, options);
  } catch (error) {
    throw new ApiError('Failed to fetch item details');
  }
}

interface Suggestion {
  type: 'suggestion';
  id: string;
  attributes: {
    text: string;
    title: string;
    score: number;
  };
}

interface SuggestResponse {
  data: Suggestion[];
}

export async function fetchSuggestions(
  query: string,
  options: FetchOptions = {}
): Promise<Suggestion[]> {
  if (!query.trim()) return [];
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/suggest` 
    : 'https://geo.btaa.org/suggest';
  
  const url = new URL(baseUrl);
  url.searchParams.set('q', query);

  try {
    const data = await unifiedFetch<SuggestResponse>(url.toString(), options);
    return data.data;
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
}

export async function fetchBookmarkedItems(
  ids: string[],
  onApiCall?: (url: string) => void,
  options: FetchOptions = {}
): Promise<SearchResponse> {
  if (ids.length === 0) {
    return {
      response: { docs: [], numFound: 0, start: 0 },
      facets: {},
    };
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/search/` 
    : 'https://geo.btaa.org/';
  const url = new URL(baseUrl);
  
  url.searchParams.set('format', 'json');
  url.searchParams.set('search_field', 'all_fields');
  url.searchParams.set('q', '');
  
  ids.forEach(id => {
    url.searchParams.append('fq[id_agg][]', id);
  });

  const finalUrl = url.toString();
  onApiCall?.(finalUrl);
  
  try {
    const data = await unifiedFetch<JsonApiResponse>(finalUrl, options);
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new ApiError('Invalid response format from API');
    }
    
    return transformJsonApiResponse(data);
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(`Failed to fetch bookmarked items: ${error.message}`);
    }
    throw new ApiError('Failed to fetch bookmarked items');
  }
}