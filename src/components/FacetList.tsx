import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { FACET_LABELS, FACET_ORDER } from '../utils/facetLabels';

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
  const handleFacetClick = (facetId: string, value: string | number) => {
    const newParams = new URLSearchParams(searchParams);
    const facetKey = `fq[${facetId}][]`;
    newParams.append(facetKey, value.toString());
    setSearchParams(newParams);
  };

  if (!facets || Object.keys(facets).length === 0) {
    return <div className="text-gray-500">No facets available</div>;
  }

  // Filter and sort facets according to FACET_ORDER
  const orderedFacets = Object.entries(facets)
    .filter(([_, facet]) => facet.items && facet.items.length > 0)
    .sort(([a], [b]) => {
      const aIndex = FACET_ORDER.indexOf(a);
      const bIndex = FACET_ORDER.indexOf(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

  if (orderedFacets.length === 0) {
    return <div className="text-gray-500">No facets available for this search</div>;
  }

  return (
    <div className="space-y-6">
      {orderedFacets.map(([id, facet]) => {
        return (
          <div key={id} className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              {FACET_LABELS[id] || facet.label}
            </h3>
            <ul className="space-y-1">
              {facet.items.map((item) => (
                <li key={`${id}-${item.value}`}>
                  <button
                    onClick={() => handleFacetClick(id, item.value)}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                  >
                    <span>{item.label}</span>
                    <span className="text-gray-400">({item.hits})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
} 