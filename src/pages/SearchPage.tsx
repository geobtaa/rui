import React, { useState } from 'react';
import { SearchResults } from '../components/SearchResults';
import { Pagination } from '../components/Pagination';
import { ErrorMessage } from '../components/ErrorMessage';
import { SearchConstraints } from '../components/search/SearchConstraints';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useSearch } from '../hooks/useSearch';
import type { AdvancedClause, FacetFilter } from '../types/search';
import { FacetList } from '../components/FacetList';
import { MapView } from '../components/search/MapView';
import { MapProvider } from '../context/MapContext';
import { SortControl } from '../components/search/SortControl';
import { AdvancedSearchBuilder } from '../components/search/AdvancedSearchBuilder';

// Create a separate component for the search content
function SearchContent() {
  console.log('🔄 SearchContent rendering...');

  const [showAdvancedBuilder, setShowAdvancedBuilder] = useState(false);

  const {
    query,
    results: searchResults,
    isLoading: searchIsLoading,
    error,
    page,
    perPage,
    totalResults: searchTotalResults,
    facets: searchFacets,
    excludeFacets: searchExcludeFacets,
    advancedQuery,
    sort,
    updateSearch,
  } = useSearch();

  console.log('📊 SearchContent state:', {
    query,
    resultsCount: searchResults?.data?.length || 0,
    isLoading: searchIsLoading,
    error: !!error,
    page,
    totalResults: searchTotalResults,
    facetsCount: searchFacets.length,
    sort,
  });

  const totalPages = Math.ceil(searchTotalResults / perPage);
  const hasSearchCriteria =
    !!query || searchFacets.length > 0 || searchExcludeFacets.length > 0 || advancedQuery.length > 0;

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

  const handleRemoveExclude = (facetToRemove: FacetFilter) => {
    const updated = (searchExcludeFacets || []).filter(
      (facet) =>
        !(
          facet.field === facetToRemove.field &&
          facet.value === facetToRemove.value
        )
    );
    updateSearch({ excludeFacets: updated });
  };

  const handleRemoveQuery = () => {
    updateSearch({ query: '' });
  };

  const handleRemoveAdvancedClause = (_clause: AdvancedClause, index: number) => {
    const nextClauses = [...advancedQuery];
    nextClauses.splice(index, 1);
    updateSearch({ advancedQuery: nextClauses });
  };

  const handleClearAll = () => {
    updateSearch({
      query: '',
      facets: [],
      excludeFacets: [],
      advancedQuery: [],
    });
  };

  const handleSortChange = (newSort: string) => {
    updateSearch({ sort: newSort });
  };

  const handleAdvancedApply = (clauses: typeof advancedQuery) => {
    updateSearch({ advancedQuery: clauses });
    setShowAdvancedBuilder(false);
  };

  const handleAdvancedReset = () => {
    updateSearch({ advancedQuery: [] });
  };

  // Extract spelling suggestions from meta
  const spellingSuggestions = searchResults?.meta?.spelling_suggestions || [];

  // Type guard to check if suggestion is a SpellingSuggestion object
  const isSpellingSuggestion = (
    suggestion: unknown
  ): suggestion is { text: string; highlighted: string; score: number } => {
    return suggestion && typeof suggestion === 'object' && 'text' in suggestion;
  };

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
                {spellingSuggestions.map((suggestion, index) => {
                  const suggestionText = isSpellingSuggestion(suggestion)
                    ? suggestion.text
                    : suggestion;
                  return (
                    <React.Fragment key={suggestionText}>
                      {index > 0 && ', '}
                      <button
                        onClick={() => updateSearch({ query: suggestionText })}
                        className="font-medium underline hover:text-blue-900"
                      >
                        {suggestionText}
                      </button>
                    </React.Fragment>
                  );
                })}
                ?
              </p>
            </div>
          )}

          <SearchConstraints
            facets={searchFacets}
            excludeFacets={searchExcludeFacets}
            query={query}
          advancedClauses={advancedQuery}
            onRemoveFacet={handleRemoveFacet}
            onRemoveExclude={handleRemoveExclude}
          onRemoveAdvancedClause={handleRemoveAdvancedClause}
            onRemoveQuery={handleRemoveQuery}
            onClearAll={handleClearAll}
          />

        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowAdvancedBuilder((prev) => !prev)}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              advancedQuery.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white text-blue-700 border border-blue-300 hover:border-blue-400 hover:text-blue-900'
            }`}
          >
            Advanced Search
          </button>
        </div>

        {showAdvancedBuilder && (
          <div className="mb-8">
            <AdvancedSearchBuilder
              clauses={advancedQuery}
              onApply={handleAdvancedApply}
              onCancel={() => setShowAdvancedBuilder(false)}
              onReset={handleAdvancedReset}
            />
          </div>
        )}

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
