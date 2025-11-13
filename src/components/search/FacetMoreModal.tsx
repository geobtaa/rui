import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MinusCircle,
  PlusCircle,
  Search,
  X,
} from 'lucide-react';
import { useFacetModal } from '../../hooks/useFacetModal';
import type { FacetValuesSort } from '../../types/api';

interface FacetMoreModalProps {
  facetId: string;
  facetLabel: string;
  isOpen: boolean;
  onClose: () => void;
  searchParams: URLSearchParams;
  onToggleInclude: (value: string | number) => void;
  onToggleExclude: (value: string | number) => void;
  isValueIncluded: (value: string | number) => boolean;
  isValueExcluded: (value: string | number) => boolean;
}

const SORT_OPTIONS: Array<{ value: FacetValuesSort; label: string }> = [
  { value: 'count_desc', label: 'Result Count (High → Low)' },
  { value: 'count_asc', label: 'Result Count (Low → High)' },
  { value: 'alpha_asc', label: 'Facet Value (A → Z)' },
  { value: 'alpha_desc', label: 'Facet Value (Z → A)' },
];

export function FacetMoreModal({
  facetId,
  facetLabel,
  isOpen,
  onClose,
  searchParams,
  onToggleInclude,
  onToggleExclude,
  isValueIncluded,
  isValueExcluded,
}: FacetMoreModalProps) {
  const {
    items,
    meta,
    isLoading,
    error,
    page,
    sort,
    qFacet,
    setPage,
    setSort,
    setFacetQuery,
    resetFacetQuery,
  } = useFacetModal({
    facetId,
    isOpen,
    searchParams,
  });

  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    setSearchInput(qFacet);
  }, [qFacet]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const totalPages = meta?.totalPages ?? 1;
  const totalCount = meta?.totalCount ?? items.length;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFacetQuery(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    resetFacetQuery();
  };

  const emptyStateMessage = useMemo(() => {
    if (isLoading) return 'Loading facet values...';
    if (qFacet) return 'No facet values match your filter.';
    return 'No facet values available.';
  }, [isLoading, qFacet]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              More options for {facetLabel}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Explore additional facet values to refine your search.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close facet modal"
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 w-full md:max-w-sm"
          >
            <div className="relative flex-1">
              <Search className="absolute inset-y-0 left-3 h-4 w-4 text-gray-400 my-auto" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search within facet values"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
          </form>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Sort by</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as FacetValuesSort)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading facet values...
            </div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-red-600">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              {emptyStateMessage}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {items.map((item) => {
                const included = isValueIncluded(item.attributes.value);
                const excluded = isValueExcluded(item.attributes.value);
                return (
                  <li
                    key={`${facetId}-${item.id || item.attributes.value}`}
                    className="flex items-center justify-between px-6 py-3 gap-4"
                  >
                    <button
                      onClick={() => onToggleInclude(item.attributes.value)}
                      className={`flex-1 text-left text-sm rounded-md px-3 py-2 transition-colors ${
                        included
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <span className="font-medium">{item.attributes.label}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({item.attributes.hits})
                      </span>
                    </button>
                    <button
                      onClick={() => onToggleExclude(item.attributes.value)}
                      className={`flex items-center gap-2 text-sm rounded-md px-3 py-2 border transition-colors ${
                        excluded
                          ? 'text-red-600 border-red-200 bg-red-50'
                          : 'text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                      aria-label={
                        excluded ? 'Remove exclusion filter' : 'Exclude this value'
                      }
                    >
                      <MinusCircle className="h-4 w-4" />
                      {excluded ? 'Excluded' : 'Exclude'}
                    </button>
                    <div className="flex items-center gap-2">
                      {included ? (
                        <span className="text-xs text-blue-600 font-medium">
                          Included
                        </span>
                      ) : (
                        <PlusCircle className="h-4 w-4 text-gray-300" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-600">
            Showing page {page} of {totalPages} • {totalCount} total values
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || isLoading}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages || isLoading}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}


