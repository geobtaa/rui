import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchSearchResults } from '../services/api';
import { parseSearchParams } from '../utils/searchParams';
import { useApi } from '../context/ApiContext';
import type { SearchResponse } from '../types/api';
import type { FacetFilter } from '../types/search';

interface SearchState {
  query?: string;
  page?: number;
  facets?: FacetFilter[];
  sort?: string;
}

export function useSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setLastApiUrl } = useApi();
  const sort = searchParams.get('sort') || 'relevance';

  // Parse search parameters
  const { query, page, facets } = parseSearchParams(searchParams);

  useEffect(() => {
    // Only fetch if we have a query parameter (even if empty) or facets
    if (query === undefined && (!facets || facets.length === 0)) {
      setResults(null);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const searchResults = await fetchSearchResults(
          query || '', // Pass empty string if query is undefined
          page,
          10,
          facets,
          setLastApiUrl,
          sort
        );
        setResults(searchResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, page, facets?.length, sort, setLastApiUrl]);

  const updateSearch = ({ 
    query, 
    page, 
    facets,
    sort: newSort 
  }: {
    query?: string;
    page?: number;
    facets?: FacetFilter[];
    sort?: string;
  }) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (query !== undefined) {
      if (query) {
        newParams.set('q', query);
      } else {
        newParams.delete('q');
      }
      newParams.delete('page'); // Reset page when query changes
    }

    if (page !== undefined) {
      if (page > 1) {
        newParams.set('page', page.toString());
      } else {
        newParams.delete('page');
      }
    }

    if (newSort !== undefined) {
      if (newSort !== 'relevance') {
        newParams.set('sort', newSort);
      } else {
        newParams.delete('sort');
      }
    }

    if (facets !== undefined) {
      // Clear existing facets
      Array.from(newParams.keys())
        .filter(key => key.startsWith('fq['))
        .forEach(key => newParams.delete(key));

      // Add new facets using fq[] format
      facets.forEach(({ field, value }) => {
        newParams.append(`fq[${field}][]`, value);
      });
    }

    setSearchParams(newParams);
  };

  return {
    query,
    results,
    isLoading,
    error,
    page: page || 1,
    perPage: 10,
    totalResults: results?.response.numFound || 0,
    facets: facets || [],
    updateSearch,
    sort,
  };
}