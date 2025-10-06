export type ZoomLevel = 'country' | 'region' | 'county';

export interface GeoFacetItem {
  attributes: {
    label: string;
    value: string;
    hits: number;
  };
  links: {
    self: string;
  };
}

export interface GeoFacet {
  type: 'facet';
  id: string;
  attributes: {
    label: string;
    items: GeoFacetItem[];
  };
}

export interface ChoroplethData {
  country: GeoFacetItem[];
  region: GeoFacetItem[];
  county: GeoFacetItem[];
}


