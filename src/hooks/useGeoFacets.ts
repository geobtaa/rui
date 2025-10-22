import { useEffect, useState } from 'react';
import { fetchSearchResults } from '../services/api';
import type { JsonApiResponse } from '../types/api';
import type { ChoroplethData, GeoFacet } from '../types/map';

// Fetches search facet aggregations (country/region/county) for a given query.
// Returns normalized choropleth data structure + loading/error states.
export function useGeoFacets(query: string, onApiCall?: (url: string) => void) {
  const [data, setData] = useState<ChoroplethData>({ country: [], region: [], county: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        // Delegate to unified API service; record URL via onApiCall (Footer shows last request)
        const response: JsonApiResponse = await fetchSearchResults(query || '', 1, 10, [], onApiCall);
        if (!isMounted) return;
        if (response.included) {
          // Extract only the three geo facets we're interested in
          const geoFacets = response.included.filter(
            (item): item is GeoFacet =>
              item.type === 'facet' && [
                'b1g_geoCountry_sm', 'geo_country_agg',
                'b1g_geoRegion_sm', 'geo_region_agg',
                'b1g_geoCounty_sm', 'geo_county_agg',
              ].includes(item.id)
          );
          // Normalize into ChoroplethData shape used by map updaters
          const newData: ChoroplethData = { country: [], region: [], county: [] };
          geoFacets.forEach((facet) => {
            if (facet.id === 'b1g_geoCountry_sm' || facet.id === 'geo_country_agg') newData.country = facet.attributes.items;
            if (facet.id === 'b1g_geoRegion_sm' || facet.id === 'geo_region_agg') newData.region = facet.attributes.items;
            if (facet.id === 'b1g_geoCounty_sm' || facet.id === 'geo_county_agg') newData.county = facet.attributes.items;
          });
          setData(newData);
        } else {
          setError('No geographic data found in API response');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [query, onApiCall]);

  return { data, loading, error };
}


