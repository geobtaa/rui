import React from 'react';
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
  activeFacets?: string[];
}

export function FacetList({ facets, activeFacets = [] }: FacetListProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const handleFacetClick = (facetId: string, value: string | number) => {
    const newParams = new URLSearchParams(searchParams);
    const facetKey = `fq[${facetId}][]`;
    newParams.append(facetKey, value.toString());
    setSearchParams(newParams);
  };

  if (!facets || Object.keys(facets).length === 0) {
    return <div className="text-gray-500">No facets available</div>;
  }

  // Create ordered facets array based on CONFIGURED_FACETS
  const orderedFacets = CONFIGURED_FACETS
    .map(facetId => {
      const facet = facets[facetId];
      return facet && facet.items.length > 0 ? [facetId, facet] : null;
    })
    .filter((item): item is [string, typeof facets[keyof typeof facets]] => item !== null);

  if (orderedFacets.length === 0) {
    return <div className="text-gray-500">No facets available for this search</div>;
  }

  return (
    <div className="space-y-6">
      {orderedFacets.map(([key, facet]) => (
        <div key={key} className="border-b pb-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            {FACET_LABELS[key] || facet.label}
          </h3>
          <ul className="space-y-1">
            {facet.items.map((item) => (
              <li key={`${key}-${item.value}`}>
                <button
                  onClick={() => handleFacetClick(key, item.value)}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <span>{item.label}</span>
                  <span className="text-gray-400">({item.hits})</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
} 