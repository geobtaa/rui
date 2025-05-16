import {
  JsonApiResponse,
  SearchResponse,
  GeoDocumentDetails,
  SortOption,
} from '../types/api';
import { FacetFilter } from '../types/search';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const defaultHeaders = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/json',
  // Only include CSRF token if it exists
  ...(import.meta.env.VITE_CSRF_TOKEN
    ? {
        'X-CSRF-Token': import.meta.env.VITE_CSRF_TOKEN,
      }
    : {}),
};

const defaultFetchOptions: FetchOptions = {
  useJsonp: import.meta.env.VITE_USE_JSONP === 'true',
};

// Add a request cache at the top of the file
const requestCache: Record<string, Promise<any>> = {};

// Helper function to ensure HTTPS URL
function ensureHttps(url: string): string {
  // Check if the environment variable for enforcing HTTPS is set to true
  const enforceHttps = import.meta.env.VITE_ENFORCE_HTTPS === 'true';
  if (enforceHttps) {
    return url.replace(/^http:/, 'https:');
  }
  return url;
}

// Helper function to create a URL with common parameters
function createApiUrl(baseUrl: string): URL {
  const url = new URL(ensureHttps(baseUrl));
  url.searchParams.set('format', 'json');
  return url;
}

// Add this helper function to convert WKT to GeoJSON object
function wktToGeoJSON(wkt: string | null): GeoJSON.FeatureCollection | null {
  if (!wkt) return null;

  try {
    // Match the polygon coordinates
    const match = wkt.match(/POLYGON\(\((.*?)\)\)/);
    if (!match) return null;

    // Split into coordinate pairs and convert to numbers
    const coordinates = match[1]
      .split(',')
      .map((pair) => {
        try {
          const [lon, lat] = pair.trim().split(' ').map(Number);
          if (isNaN(lon) || isNaN(lat)) return null;
          return [lon, lat];
        } catch (e) {
          console.error('Error converting WKT to GeoJSON:', e);
          return null;
        }
      })
      .filter((coord): coord is [number, number] => coord !== null);

    // Ensure we have valid coordinates
    if (coordinates.length < 3) return null;

    // Create GeoJSON FeatureCollection structure
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
          },
        },
      ],
    };
  } catch (error) {
    console.error('Error converting WKT to GeoJSON:', error);
    return null;
  }
}

function transformJsonApiResponse(jsonApiResponse: JsonApiResponse): SearchResponse {
  // Transform documents
  const docs = jsonApiResponse.data.map((item) => ({
    id: item.id,
    type: item.type,
    attributes: {
      id: item.id,
      dct_title_s: item.attributes.dct_title_s,
      dct_creator_sm: item.attributes.dct_creator_sm || [],
      dct_description_sm: item.attributes.dct_description_sm || [],
      dct_publisher_sm: item.attributes.dct_publisher_sm || [],
      dct_spatial_sm: item.attributes.dct_spatial_sm || [],
      gbl_resourceclass_sm: item.attributes.gbl_resourceclass_sm || [],  // Will be populated from API
      gbl_resourcetype_sm: item.attributes.gbl_resourcetype_sm || [],   // Will be populated from API
      b1g_language_sm: item.attributes.b1g_language_sm || [],       // Will be populated from API
      dct_subject_sm: item.attributes.dct_subject_sm || [],
      schema_provider_s: item.attributes.dct_provenance_s || '',
      dct_accessrights_s: item.attributes.dct_accessrights_s || '',    // Will be populated from API
      gbl_georeferenced_b: item.attributes.gbl_georeferenced_b || '',   // Will be populated from API
      b1g_georeferenced_allmaps_b: item.attributes.b1g_georeferenced_allmaps_b || '',
      dct_temporal_sm: item.attributes.dct_temporal_sm || [],
      dct_rightsholder_sm: item.attributes.dct_rightsholder_sm || [],   // Will be populated from API
      dct_license_sm: item.attributes.dct_license_sm || [],        // Will be populated from API
      dct_subject_sm: item.attributes.dc_subject_sm || [],
      dct_references_s: item.attributes.dct_references_s || '',
      locn_geometry: item.attributes.locn_geometry,
    },
    ui_thumbnail_url: item.attributes.ui_thumbnail_url || '',
    ui_citation: '',  // Will be populated from API
    ui_viewer_protocol: item.attributes.ui_viewer_protocol || '',
    ui_viewer_endpoint: item.attributes.ui_viewer_endpoint || '',
    ui_viewer_geometry: item.attributes.ui_viewer_geometry || wktToGeoJSON(item.attributes.locn_geometry),
  }));

  // Transform included facets
  const facets = jsonApiResponse.included
    ?.filter((item): item is Facet => item.type === 'facet')
    .reduce((acc, facet) => {
      acc[facet.id] = {
        label: facet.attributes.label,
        items: facet.attributes.items.map(item => ({
          label: item.attributes.label,
          value: item.attributes.value,
          hits: item.attributes.hits,
          url: item.links.self,
        })),
      };
      return acc;
    }, {} as { [key: string]: FacetGroup });

  // Transform sort options
  const sortOptions = jsonApiResponse.included
    ?.filter((item): item is SortOption => item.type === 'sort')
    .map(item => ({
      id: item.id,
      label: item.attributes.label,
      url: item.links.self,
    }));

  return {
    response: {
      docs,
      numFound: jsonApiResponse.meta.pages.total_count,
      start: ((jsonApiResponse.meta.pages.current_page || 1) - 1) * 10,
      maxScore: 1.0,
    },
    facets: facets || {},
    sortOptions: sortOptions || [],
    meta: {
      pages: {
        current_page: jsonApiResponse.meta.pages.current_page,
        next_page: null,  // Will be calculated if needed
        prev_page: null,  // Will be calculated if needed
        total_pages: jsonApiResponse.meta.pages.total_pages,
        limit_value: 10,  // Default page size
        offset_value: ((jsonApiResponse.meta.pages.current_page || 1) - 1) * 10,
        total_count: jsonApiResponse.meta.pages.total_count,
        first_page: jsonApiResponse.meta.pages.current_page === 1,
        last_page: jsonApiResponse.meta.pages.current_page === jsonApiResponse.meta.pages.total_pages,
      },
      spelling_suggestions: jsonApiResponse.meta.spelling_suggestions || [],
    },
  };
}

// Update the jsonp function to use the cache
function jsonp<T>(url: string, callbackName: string = 'rui'): Promise<T> {
  console.log('Starting JSONP request:', url);
  
  // Check if this URL is already being requested
  const cacheKey = url;
  if (requestCache[cacheKey]) {
    console.log('Using cached JSONP request for:', url);
    return requestCache[cacheKey] as Promise<T>;
  }
  
  // Create a new promise for this request
  const requestPromise = new Promise<T>((resolve, reject) => {
    const uniqueCallback = `${callbackName}_${Date.now()}`;
    console.log('Using callback name:', uniqueCallback);
    let script: HTMLScriptElement | null = document.createElement('script');
    // Set timeout to prevent hanging requests
    const timeoutId = window.setTimeout(() => {
      console.error('JSONP request timed out:', url);
      cleanup();
      reject(new Error('JSONP request timed out'));
      // Remove from cache on timeout
      delete requestCache[cacheKey];
    }, 30000); // 30 second timeout

    // Cleanup function to remove script and callback
    const cleanup = () => {
      console.log('Cleaning up JSONP request:', uniqueCallback);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any)[uniqueCallback];
      window.clearTimeout(timeoutId);
      script = null;
    };

    // Add the callback to window
    (window as any)[uniqueCallback] = (
      data: T | { detail: string; path: string; method: string }
    ) => {
      console.log('JSONP callback received data:', data);
      cleanup();

      // Check if response is an error
      if (typeof data === 'object' && data !== null && 'detail' in data) {
        console.error('JSONP error response:', data);
        reject(new ApiError(`API Error: ${data.detail}`));
        // Remove from cache on error
        delete requestCache[cacheKey];
        return;
      }

      resolve(data as T);
      // Keep successful responses in cache for 5 seconds
      setTimeout(() => {
        delete requestCache[cacheKey];
      }, 5000);
    };

    // Create script element with all properties set before appending to DOM
    const urlWithCallback = new URL(ensureHttps(url));
    urlWithCallback.searchParams.set('callback', uniqueCallback);
    if (!urlWithCallback.searchParams.has('format')) {
      urlWithCallback.searchParams.set('format', 'json');
    }

    console.log('Final JSONP URL:', urlWithCallback.toString());

    if (script) {
      script.src = urlWithCallback.toString();
      script.onerror = (error) => {
        console.error('JSONP script error:', error);
        cleanup();
        reject(new Error('JSONP request failed'));
        // Remove from cache on error
        delete requestCache[cacheKey];
      };
      script.crossOrigin = 'anonymous';
      
      // Only append the script to the document once
      document.head.appendChild(script);
      console.log('JSONP script added to document');
    }
  });
  
  // Store the promise in the cache
  requestCache[cacheKey] = requestPromise;
  return requestPromise;
}

interface FetchOptions {
  useJsonp?: boolean;
}

async function unifiedFetch<T>(
  url: string,
  options: FetchOptions = defaultFetchOptions
): Promise<T> {
  const finalUrl = new URL(ensureHttps(url));
  console.log('unifiedFetch called with options:', {
    url: finalUrl.toString(),
    useJsonp: options.useJsonp,
    envValue: import.meta.env.VITE_USE_JSONP,
  });

  // Ensure format parameter is set
  if (!finalUrl.searchParams.has('format')) {
    finalUrl.searchParams.set('format', 'json');
  }

  if (options.useJsonp) {
    console.log('Using JSONP for request:', finalUrl.toString());
    return jsonp<T>(finalUrl.toString());
  }

  console.log('Using regular fetch:', finalUrl.toString());

  // For document endpoints, request a specific response format
  if (url.includes('/items/')) {
    finalUrl.searchParams.set('response_format', 'json_api');
    finalUrl.searchParams.set('datetime_format', 'iso8601');
  }

  try {
    const response = await fetch(finalUrl.toString(), {
      headers: {
        ...defaultHeaders,
        Accept: 'application/javascript, application/json',
      },
      mode: 'cors',
      credentials: 'include',
      redirect: 'follow',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error response:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new ApiError(
          errorJson.detail || 'API request failed',
          response.status
        );
      } catch (e) {
        console.error('Error parsing API error response:', e);
        throw new ApiError(
          `HTTP error ${response.status}: ${errorText}`,
          response.status
        );
      }
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export async function fetchSearchResults(
  query: string,
  page: number = 1,
  perPage: number = 10,
  facets: FacetFilter[] = [],
  onApiCall?: (url: string) => void,
  sort?: string,
  options: FetchOptions = defaultFetchOptions
): Promise<SearchResponse> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/search`
    : 'https://geo.btaa.org/api/v1/search';
  const url = createApiUrl(baseUrl);

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

  if (onApiCall) {
    onApiCall(url.toString());
  }

  try {
    const response = await unifiedFetch<JsonApiResponse>(
      url.toString(),
      options
    );
    return transformJsonApiResponse(response);
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

export async function fetchItemDetails(
  id: string,
  onApiCall?: (url: string) => void,
  options: FetchOptions = defaultFetchOptions
): Promise<GeoDocumentDetails> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/items/`
    : 'https://geo.btaa.org/';
  const url = createApiUrl(`${baseUrl}${id}`);
  onApiCall?.(url.toString());

  try {
    const response = await unifiedFetch<GeoDocumentDetails>(
      url.toString(),
      options
    );
    console.log('Item details response:', response); // Add debugging
    return response;
  } catch (error) {
    console.error('Error fetching item details:', error); // Add debugging
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      `Failed to fetch item details: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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
  options: FetchOptions = defaultFetchOptions
): Promise<Suggestion[]> {
  if (!query.trim()) return [];

  const baseUrl = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/suggest`
    : 'https://geo.btaa.org/suggest';

  const url = createApiUrl(baseUrl);
  url.searchParams.set('q', query);

  try {
    const data = await unifiedFetch<SuggestResponse>(url.toString(), options);
    // Only return the text field from each suggestion
    return data.data.map((suggestion) => ({
      ...suggestion,
      attributes: {
        ...suggestion.attributes,
        // Remove the title from the display
        title: '',
      },
    }));
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
}

export async function fetchBookmarkedItems(
  ids: string[],
  onApiCall?: (url: string) => void,
  options: FetchOptions = defaultFetchOptions
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
  const url = createApiUrl(baseUrl);

  url.searchParams.set('search_field', 'all_fields');
  url.searchParams.set('q', '');

  ids.forEach((id) => {
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
