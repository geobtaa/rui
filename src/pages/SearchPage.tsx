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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 pb-8 mb-8">
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
          <SearchConstraints
            facets={searchFacets}
            query={query}
            onRemoveFacet={handleRemoveFacet}
            onRemoveQuery={handleRemoveQuery}
            onClearAll={handleClearAll}
          />

          <div className="mt-8 grid grid-cols-12 gap-8">
            {/* Facets Sidebar */}
            <div className="col-span-2">
              {searchResults?.facets ? (
                <FacetList facets={searchResults.facets} />
              ) : (
                <div className="text-gray-500">Loading facets...</div>
              )}
            </div>

            {/* Search Results */}
            <div className="col-span-6">
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
                          options={searchResults?.sortOptions || []}
                          currentSort={sort || 'relevance'}
                          onSortChange={handleSortChange}
                        />
                      </div>

                      <SearchResults
                        results={searchResults?.response?.docs || []}
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

            {/* Map View */}
            <div className="col-span-4">
              <MapView results={searchResults?.response?.docs || []} />
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
