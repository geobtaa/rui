import { useEffect } from 'react';
import L from 'leaflet';
import { getTopStateAbbrByCountyHits, stateAbbrToFips } from '../utils/geoCounty';

interface Params {
  map: L.Map;
  geoJson: any;
  countyItems: Array<{ attributes: { value: string; hits: number } }>;
  searchQuery: string;
}

export function useCountyAutoFit({ map, geoJson, countyItems, searchQuery }: Params) {
  useEffect(() => {
    if (!geoJson || !geoJson.features || !Array.isArray(countyItems)) return;

    // If no search query, keep default US-focused view
    if (!searchQuery || searchQuery.trim() === '') {
      map.setView([39.8283, -98.5795], 3);
      return;
    }

    const topStateAbbr = getTopStateAbbrByCountyHits(countyItems);
    if (!topStateAbbr) return;

    const topStateFips = stateAbbrToFips[topStateAbbr];
    if (!topStateFips) return;

    try {
      const layer = L.geoJSON(geoJson, {
        filter: (feature: any) => {
          const featureStateFips = (feature?.properties?.STATE || feature?.properties?.STATEFP || '').toString().padStart(2, '0');
          return featureStateFips === topStateFips;
        },
      });

      const bounds = layer.getBounds();
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }

      layer.remove();
    } catch (_) {
      // no-op
    }
  }, [map, geoJson, countyItems, searchQuery]);
}


