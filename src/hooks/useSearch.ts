import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchState, SearchParams } from '../types/search';
import { parseSearchParams, buildSearchParams } from '../utils/searchParams';
import { fetchSearchResults } from '../services/api';
import { useApi } from '../context/ApiContext';
import type { GeoDocument } from '../types/api';

export function useSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { setLastApiUrl } = useApi();
  
  const [state, setState] = useState<SearchState>(() => ({
    ...parseSearchParams(searchParams),
    isLoading: false,
    error: null
  }));

  const [results, setResults] = useState<GeoDocument[]>([]);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    const loadResults = async () => {
      // Don't fetch results if there's no search criteria
      if (!state.query && state.facets.length === 0) {
        setResults([]);
        setTotalResults(0);
        return;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await fetchSearchResults(
          state.query,
          state.page,
          state.perPage,
          state.facets,
          (url) => setLastApiUrl(url)
        );
        
        setResults(data.response.docs);
        setTotalResults(data.response.numFound);
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null
        }));
      } catch (err) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'An unexpected error occurred'
        }));
        setResults([]);
        setTotalResults(0);
      }
    };

    loadResults();
  }, [state.query, state.page, state.perPage, state.facets, setLastApiUrl]);

  const updateSearch = (newParams: Partial<SearchParams>) => {
    const currentParams = parseSearchParams(searchParams);
    const updatedParams = { ...currentParams, ...newParams };
    
    // Reset page to 1 when changing search parameters
    if (newParams.query !== undefined || newParams.facets !== undefined) {
      updatedParams.page = 1;
    }
    
    setSearchParams(buildSearchParams(updatedParams));
    setState(prev => ({ ...prev, ...updatedParams }));
  };

  return {
    ...state,
    results,
    totalResults,
    updateSearch
  };
}