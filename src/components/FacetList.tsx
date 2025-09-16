import { useSearchParams } from 'react-router-dom';
import { FACET_LABELS } from '../utils/facetLabels';
import { CONFIGURED_FACETS } from '../constants/facets';

// New JSON:API facet structure
interface JsonApiFacet {
  type: 'facet';
  id: string;
  attributes: {
    label: string;
    items: Array<{
      attributes: {
        label: string;
        value: string | number;
        hits: number;
      };
      links: {
        self: string;
      };
    }>;
  };
}

interface FacetListProps {
  facets: JsonApiFacet[];
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

  if (!facets || facets.length === 0) {
    return <div className="text-gray-500">No facets available</div>;
  }

  // Filter facets to only show those with items and convert to the expected format
  const availableFacets = facets
    .filter(
      (facet) => facet.attributes.items && facet.attributes.items.length > 0
    )
    .map((facet) => ({
      id: facet.id,
      label: facet.attributes.label,
      items: facet.attributes.items.map((item) => ({
        label: item.attributes.label,
        value: item.attributes.value,
        hits: item.attributes.hits,
        url: item.links.self,
      })),
    }));

  // Order facets according to CONFIGURED_FACETS and filter to only show configured ones
  const orderedFacets = CONFIGURED_FACETS.map((facetId) => {
    const facet = availableFacets.find((f) => f.id === facetId);
    return facet;
  }).filter((facet): facet is NonNullable<typeof facet> => facet !== undefined);

  if (orderedFacets.length === 0) {
    return (
      <div className="text-gray-500">No facets available for this search</div>
    );
  }

  return (
    <div className="space-y-6">
      {orderedFacets.map((facet) => (
        <div key={facet.id} className="border-b pb-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            {FACET_LABELS[facet.id] || facet.label}
          </h3>
          <ul className="space-y-1">
            {facet.items.map((item) => {
              const isActive = isFacetActive(facet.id, item.value);
              return (
                <li key={`${facet.id}-${item.value}`}>
                  <button
                    onClick={() => handleFacetClick(facet.id, item.value)}
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
