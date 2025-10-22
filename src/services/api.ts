import { JsonApiResponse, GeoDocumentDetails } from '../types/api';
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
  Accept: 'application/vnd.api+json, application/json',
  // Note: Content-Type and CSRF token removed to avoid CORS preflight issues
  // Re-add if the API requires authentication
};

const defaultFetchOptions: FetchOptions = {
  useJsonp: false, // Disable JSONP for modern JSON:API endpoints
};

// Add a request cache at the top of the file
const requestCache: Record<string, Promise<unknown> | undefined> = {};

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

// Update the jsonp function to use the cache
function jsonp<T>(url: string, callbackName: string = 'rui'): Promise<T> {
  console.log('Starting JSONP request:', url);

  // Check if this URL is already being requested
  const cacheKey = url;
  const cached = requestCache[cacheKey] as Promise<T> | undefined;
  if (cached) {
    console.log('Using cached JSONP request for:', url);
    return cached;
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
      delete (window as unknown as Record<string, unknown>)[uniqueCallback];
      window.clearTimeout(timeoutId);
      script = null;
    };

    // Add the callback to window
    (window as unknown as Record<string, unknown>)[uniqueCallback] = (
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

  // For modern JSON:API endpoints, ensure proper Accept header
  if (url.includes('/resources/')) {
    // Remove any legacy parameters that might interfere with JSON:API
    finalUrl.searchParams.delete('response_format');
    finalUrl.searchParams.delete('datetime_format');
  }

  try {
    const response = await fetch(finalUrl.toString(), {
      headers: defaultHeaders,
      mode: 'cors',
      credentials: 'omit',
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
  excludeFacets: FacetFilter[] = [],
  options: FetchOptions = defaultFetchOptions
): Promise<JsonApiResponse> {
  const startTime = performance.now();
  console.log('🌐 fetchSearchResults called with:', {
    query,
    page,
    perPage,
    facets: facets.length,
    sort,
  });

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

  // Normalize legacy *_agg facet IDs to field-named IDs for the API
  const FACET_ID_MAP: Record<string, string> = {
    spatial_agg: 'dct_spatial_sm',
    resource_class_agg: 'gbl_resourceClass_sm',
    resource_type_agg: 'gbl_resourceType_sm',
    provider_agg: 'schema_provider_s',
    creator_agg: 'dct_creator_sm',
    access_rights_agg: 'dct_accessRights_s',
    access_agg: 'dct_accessRights_s',
    index_year_agg: 'gbl_indexyear_im',
    language_agg: 'dct_language_sm',
    subject_agg: 'dct_subject_sm',
    institution_agg: 'dct_provenance_s',
    format_agg: 'dct_format_s',
    georeferenced_agg: 'gbl_georeferenced_b',
    id_agg: 'id',
  };

  facets.forEach(({ field, value }) => {
    const normalized = FACET_ID_MAP[field] || field;
    url.searchParams.append(`include_filters[${normalized}][]`, value);
  });

  // Apply exclude filters
  excludeFacets.forEach(({ field, value }) => {
    const normalized = FACET_ID_MAP[field] || field;
    url.searchParams.append(`exclude_filters[${normalized}][]`, value);
  });

  console.log('🔗 API URL:', url.toString());

  if (onApiCall) {
    onApiCall(url.toString());
  }

  try {
    const apiStartTime = performance.now();
    console.log('📡 Making API request...');

    const response = await unifiedFetch<JsonApiResponse>(
      url.toString(),
      options
    );

    const apiEndTime = performance.now();
    const totalTime = performance.now() - startTime;

    console.log(
      `⚡ API response received in ${(apiEndTime - apiStartTime).toFixed(2)}ms`
    );
    console.log(`⏱️ Total fetchSearchResults time: ${totalTime.toFixed(2)}ms`);
    console.log(`📦 Response data: ${response?.data?.length || 0} items`);

    return response; // Return the JSON:API response directly
  } catch (error) {
    const totalTime = performance.now() - startTime;
    console.error(
      `💥 API request failed after ${totalTime.toFixed(2)}ms:`,
      error
    );
    throw error;
  }
}

export async function fetchResourceDetails(
  id: string,
  onApiCall?: (url: string) => void,
  options: FetchOptions = { useJsonp: false } // Always use regular fetch for modern JSON:API
): Promise<GeoDocumentDetails> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/resources/`
    : 'https://geo.btaa.org/';
  const url = createApiUrl(`${baseUrl}${id}`);
  onApiCall?.(url.toString());

  try {
    const response = await unifiedFetch<{ data: GeoDocumentDetails }>(
      url.toString(),
      options
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching resource details:', error); // Add debugging
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      `Failed to fetch resource details: ${error instanceof Error ? error.message : 'Unknown error'}`
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

export async function fetchBookmarkedResources(
  ids: string[],
  onApiCall?: (url: string) => void,
  options: FetchOptions = defaultFetchOptions
): Promise<JsonApiResponse> {
  if (ids.length === 0) {
    return {
      jsonapi: { version: '1.0', profile: [] },
      links: { self: '', first: '', last: '' },
      meta: {
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        perPage: 10,
        query: '',
      },
      data: [],
      included: [],
    };
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/search/`
    : 'https://geo.btaa.org/';
  const url = createApiUrl(baseUrl);

  url.searchParams.set('search_field', 'all_fields');
  url.searchParams.set('q', '');

  ids.forEach((id) => {
    url.searchParams.append('fq[id][]', id);
  });

  const finalUrl = url.toString();
  onApiCall?.(finalUrl);

  try {
    const data = await unifiedFetch<JsonApiResponse>(finalUrl, options);

    if (!data.data || !Array.isArray(data.data)) {
      throw new ApiError('Invalid response format from API');
    }

    return data; // Return the JSON:API response directly
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(
        `Failed to fetch bookmarked resources: ${error.message}`
      );
    }
    throw new ApiError('Failed to fetch bookmarked resources');
  }
}
