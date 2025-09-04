import React from 'react';
import { SearchResults } from '../components/SearchResults';
import { Pagination } from '../components/Pagination';
import { ErrorMessage } from '../components/ErrorMessage';
import { SearchConstraints } from '../components/search/SearchConstraints';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useSearch } from '../hooks/useSearch';
import type { FacetFilter } from '../types/search';
import { FacetList } from '../components/FacetList';
import { MapView } from '../components/search/MapView';
import { MapProvider } from '../context/MapContext';
import { SortControl } from '../components/search/SortControl';


// Create a separate component for the search content
function SearchContent() {
  const {
    query,
    results: searchResults,
    isLoading: searchIsLoading,
    error,
    page,
    perPage,
    totalResults: searchTotalResults,
    facets: searchFacets,
    sort,
    updateSearch,
  } = useSearch();

  const totalPages = Math.ceil(searchTotalResults / perPage);
  const hasSearchCriteria = query !== undefined || searchFacets.length > 0;

  const handlePageChange = (newPage: number) => {
    updateSearch({ page: newPage });
  };

  const handleRemoveFacet = (facetToRemove: FacetFilter) => {
    const updatedFacets = searchFacets.filter(
      (facet) =>
        !(
          facet.field === facetToRemove.field &&
          facet.value === facetToRemove.value
        )
    );
    updateSearch({ facets: updatedFacets });
  };

  const handleRemoveQuery = () => {
    updateSearch({ query: '' });
  };

  const handleClearAll = () => {
    updateSearch({ query: '', facets: [] });
  };

  const handleSortChange = (newSort: string) => {
    updateSearch({ sort: newSort });
  };

  // Extract spelling suggestions from meta
  const spellingSuggestions = searchResults?.meta?.spelling_suggestions || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 pb-8">
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
          {/* Spelling Suggestions */}
          {spellingSuggestions.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Did you mean:{' '}
                {spellingSuggestions.map(
                  (suggestion: string, index: number) => (
                    <React.Fragment key={suggestion}>
                      {index > 0 && ', '}
                      <button
                        onClick={() => updateSearch({ query: suggestion })}
                        className="font-medium underline hover:text-blue-900"
                      >
                        {suggestion}
                      </button>
                    </React.Fragment>
                  )
                )}
                ?
              </p>
            </div>
          )}

          <SearchConstraints
            facets={searchFacets}
            query={query}
            onRemoveFacet={handleRemoveFacet}
            onRemoveQuery={handleRemoveQuery}
            onClearAll={handleClearAll}
          />

          {/* Responsive grid layout */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Facets - Collapsible on mobile */}
            <div className="lg:col-span-2">
              <details className="lg:hidden mb-4">
                <summary className="text-lg font-semibold cursor-pointer py-2">
                  Filter Results
                </summary>
                {searchResults?.included ? (
                  <FacetList
                    facets={searchResults.included.filter(
                      (item) => item.type === 'facet'
                    )}
                  />
                ) : (
                  <div className="text-gray-500">Loading facets...</div>
                )}
              </details>
              <div className="hidden lg:block">
                {searchResults?.included ? (
                  <FacetList
                    facets={searchResults.included.filter(
                      (item) => item.type === 'facet'
                    )}
                  />
                ) : (
                  <div className="text-gray-500">Loading facets...</div>
                )}
              </div>
            </div>

            {/* Results - Full width on mobile */}
            <div className="lg:col-span-6">
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
                      <div className="mb-6 flex justify-between items-center">
                        <h2 className="text-lg text-gray-600">
                          Showing results{' '}
                          {Math.min(
                            (page - 1) * perPage + 1,
                            searchTotalResults
                          )}
                          -{Math.min(page * perPage, searchTotalResults)} of{' '}
                          {searchTotalResults}
                        </h2>
                        <SortControl
                          options={
                            searchResults?.included
                              ?.filter((item) => item.type === 'sort')
                              .map((sortOption) => ({
                                id: sortOption.id,
                                label: sortOption.attributes.label,
                                url: sortOption.links?.self || '',
                              })) || []
                          }
                          currentSort={sort || 'relevance'}
                          onSortChange={handleSortChange}
                        />
                      </div>

                      <SearchResults
                        results={searchResults?.data || []}
                        isLoading={searchIsLoading}
                        totalResults={searchTotalResults}
                        currentPage={page}
                      />

                      {!searchIsLoading && totalPages > 1 && (
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

            {/* Map - Hidden by default on mobile, toggleable */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-[88px]">
                <MapView results={searchResults?.data || []} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function SearchPage() {
  return (
    <MapProvider>
      <SearchContent />
    </MapProvider>
  );
}
