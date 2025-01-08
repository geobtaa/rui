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
}

export function useSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setLastApiUrl } = useApi();

  // Parse search parameters
  const { query, page, facets } = parseSearchParams(searchParams);

  useEffect(() => {
    // Only fetch if we have a query or facets
    if (!query && (!facets || facets.length === 0)) {
      setResults(null);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const searchResults = await fetchSearchResults(
          query || '',
          page,
          10,
          facets,
          setLastApiUrl
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
  }, [query, page, facets?.length, setLastApiUrl]); // Note the facets?.length dependency

  const updateSearch = ({ query: newQuery, page: newPage, facets: newFacets }: SearchState) => {
    const updatedParams = new URLSearchParams(searchParams);

    if (newQuery !== undefined) {
      if (newQuery) {
        updatedParams.set('q', newQuery);
      } else {
        updatedParams.delete('q');
      }
      // Reset to page 1 when query changes
      updatedParams.delete('page');
    }

    if (newPage !== undefined) {
      if (newPage > 1) {
        updatedParams.set('page', newPage.toString());
      } else {
        updatedParams.delete('page');
      }
    }

    if (newFacets !== undefined) {
      // Clear existing facets
      Array.from(updatedParams.keys())
        .filter(key => key.startsWith('fq['))
        .forEach(key => updatedParams.delete(key));

      // Add new facets using fq[] format
      newFacets.forEach(({ field, value }) => {
        updatedParams.append(`fq[${field}][]`, value);
      });
    }

    setSearchParams(updatedParams);
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
  };
}