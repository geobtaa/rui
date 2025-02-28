import { useSearchParams } from 'react-router-dom';
import { FACET_LABELS } from '../utils/facetLabels';
import { CONFIGURED_FACETS } from '../constants/facets';

interface FacetItem {
  label: string;
  value: string | number;
  hits: number;
  url: string;
}

interface FacetGroup {
  label: string;
  items: FacetItem[];
}

interface FacetListProps {
  facets: {
    [key: string]: FacetGroup;
  };
}

export function FacetList({ facets }: FacetListProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Helper function to check if a facet is active
  const isFacetActive = (field: string, value: string | number) => {
    const facetParams = searchParams.getAll(`fq[${field}][]`);
    return facetParams.includes(value.toString());
  };

  // Helper function to toggle a facet
  const handleFacetClick = (field: string, value: string | number) => {
    const newParams = new URLSearchParams(searchParams);
    const facetKey = `fq[${field}][]`;

    if (isFacetActive(field, value)) {
      // Remove the facet if it's active
      const currentValues = newParams.getAll(facetKey);
      newParams.delete(facetKey);
      currentValues
        .filter((v) => v !== value.toString())
        .forEach((v) => newParams.append(facetKey, v));
    } else {
      // Add the facet if it's not active
      newParams.append(facetKey, value.toString());
    }

    setSearchParams(newParams);
  };

  if (!facets || Object.keys(facets).length === 0) {
    return <div className="text-gray-500">No facets available</div>;
  }

  // Ensure orderedFacets is correctly typed and filtered
  const orderedFacets: [string, FacetGroup][] = CONFIGURED_FACETS.map(
    (facetId) => {
      const facet = facets[facetId];
      return facet && facet.items.length > 0 ? [facetId, facet] : null;
    }
  ).filter((item): item is [string, FacetGroup] => item !== null);

  if (orderedFacets.length === 0) {
    return (
      <div className="text-gray-500">No facets available for this search</div>
    );
  }

  return (
    <div className="space-y-6">
      {orderedFacets.map(([key, facet]) => (
        <div key={key} className="border-b pb-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            {FACET_LABELS[key] || facet.label}
          </h3>
          <ul className="space-y-1">
            {facet.items.map((item) => {
              const isActive = isFacetActive(key, item.value);
              return (
                <li key={`${key}-${item.value}`}>
                  <button
                    onClick={() => handleFacetClick(key, item.value)}
                    className={`text-sm flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${
                      isActive
                        ? 'text-blue-600 font-medium bg-blue-50 hover:bg-blue-100'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`${isActive ? 'text-blue-400' : 'text-gray-400'}`}
                    >
                      ({item.hits})
                    </span>
                    {isActive && (
                      <span className="text-blue-400 ml-auto">×</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
