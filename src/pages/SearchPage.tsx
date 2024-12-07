import React from 'react';
import { SearchResults } from '../components/SearchResults';
import { Pagination } from '../components/Pagination';
import { ErrorMessage } from '../components/ErrorMessage';
import { SearchField } from '../components/SearchField';
import { SearchConstraints } from '../components/search/SearchConstraints';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useSearch } from '../hooks/useSearch';
import type { FacetFilter } from '../types/search';

export function SearchPage() {
  const { 
    query, 
    results,
    isLoading, 
    error, 
    page, 
    perPage,
    totalResults,
    facets,
    updateSearch
  } = useSearch();

  const totalPages = Math.ceil(totalResults / perPage);
  const hasSearchCriteria = query || facets.length > 0;

  const handleSearch = (newQuery: string) => {
    updateSearch({ query: newQuery });
  };

  const handlePageChange = (newPage: number) => {
    updateSearch({ page: newPage });
  };

  const handleRemoveFacet = (facetToRemove: FacetFilter) => {
    const updatedFacets = facets.filter(
      facet => !(facet.field === facetToRemove.field && facet.value === facetToRemove.value)
    );
    updateSearch({ facets: updatedFacets });
  };

  const handleRemoveQuery = () => {
    updateSearch({ query: '' });
  };

  const handleClearAll = () => {
    updateSearch({ query: '', facets: [] });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <SearchField 
              initialQuery={query} 
              onSearch={handleSearch} 
              isLoading={isLoading}
            />
          </div>

          <SearchConstraints 
            facets={facets}
            query={query}
            onRemoveFacet={handleRemoveFacet}
            onRemoveQuery={handleRemoveQuery}
            onClearAll={handleClearAll}
          />

          {error ? (
            <ErrorMessage message={error} />
          ) : (
            <>
              {!hasSearchCriteria ? (
                <div>
                  <p className="text-gray-500">
                    Enter a search term or apply filters to see results
                  </p>
                </div>
              ) : (
                <>
                  {totalResults > 0 && (
                    <div className="mb-6">
                      <h2 className="text-lg text-gray-600">
                        Showing results {Math.min((page - 1) * perPage + 1, totalResults)}-
                        {Math.min(page * perPage, totalResults)} of {totalResults}
                      </h2>
                    </div>
                  )}

                  <SearchResults results={results} isLoading={isLoading} />
                  
                  {!isLoading && totalPages > 1 && (
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}