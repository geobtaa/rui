import { useSearchParams } from 'react-router-dom';
import { X, Search, XCircle } from 'lucide-react';
import type { AdvancedClause, FacetFilter } from '../../types/search';
import { getFacetLabel } from '../../utils/facetLabels';
import { humanizeFieldName } from '../../constants/fieldLabels';

interface SearchConstraintsProps {
  facets: FacetFilter[];
  excludeFacets?: FacetFilter[];
  advancedClauses?: AdvancedClause[];
  query?: string;
  onRemoveFacet: (facet: FacetFilter) => void;
  onRemoveExclude?: (facet: FacetFilter) => void;
  onRemoveAdvancedClause?: (clause: AdvancedClause, index: number) => void;
  onRemoveQuery: () => void;
  onClearAll: () => void;
}

export function SearchConstraints({
  facets,
  excludeFacets = [],
  query,
  advancedClauses = [],
  onRemoveFacet,
  onRemoveExclude,
  onRemoveAdvancedClause,
  onRemoveQuery,
  onClearAll,
}: SearchConstraintsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  if (
    facets.length === 0 &&
    excludeFacets.length === 0 &&
    !query &&
    advancedClauses.length === 0
  ) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-medium text-gray-500">Active Filters:</h2>
        <button
          onClick={onClearAll}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          <XCircle size={16} />
          Clear All
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {query && (
          <button
            onClick={onRemoveQuery}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Search size={14} className="text-blue-500" />
            <span className="text-sm">Search: {query}</span>
            <X size={14} className="text-blue-500" />
          </button>
        )}
        {facets.map((facet, index) => (
          <button
            key={`${facet.field}-${index}`}
            onClick={() => onRemoveFacet(facet)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <span className="text-sm">
              {getFacetLabel(facet.field)}: {facet.value}
            </span>
            <X size={14} className="text-blue-500" />
          </button>
        ))}
        {excludeFacets.map((facet, index) => (
          <button
            key={`exclude-${facet.field}-${index}`}
            onClick={() => {
              // Prefer parent handler if provided
              onRemoveExclude?.(facet);

              // Also ensure URL params update locally in case parent doesn't modify them
              const params = new URLSearchParams(searchParams);
              const key = `exclude_filters[${facet.field}][]`;
              const current = params.getAll(key);
              if (current.length > 0) {
                params.delete(key);
                current
                  .filter((v) => v !== facet.value)
                  .forEach((v) => params.append(key, v));
                setSearchParams(params);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
            title="Remove exclusion"
          >
            <span className="text-sm">
              Exclude {getFacetLabel(facet.field)}: {facet.value}
            </span>
            <X size={14} className="text-red-500" />
          </button>
        ))}
        {advancedClauses.map((clause, index) => (
          <button
            key={`advanced-${index}-${clause.field}-${clause.q}`}
            onClick={() => onRemoveAdvancedClause?.(clause, index)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors ${
              clause.op === 'NOT'
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
            title={`${clause.op} ${clause.field}`}
          >
            <span className="text-sm">
              {clause.op}{' '}
              {humanizeFieldName(clause.field)}: {clause.q}
            </span>
            <X size={14} className={clause.op === 'NOT' ? 'text-red-500' : 'text-purple-500'} />
          </button>
        ))}
      </div>
    </div>
  );
}
