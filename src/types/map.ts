export type ZoomLevel = 'country' | 'region' | 'county';

export interface ChoroplethFacetItem {
  label: string;
  value: string;
  hits: number;
  url?: string;
}

export interface ChoroplethData {
  country: ChoroplethFacetItem[];
  region: ChoroplethFacetItem[];
  county: ChoroplethFacetItem[];
}

// GeoJSON feature types for map components
export interface GeoJsonFeature {
  type: 'Feature';
  properties: {
    name?: string;
    NAME?: string;
    ADMIN?: string;
    state?: string;
    county?: string;
    STATE?: string;
    STATEFP?: string;
    [key: string]: unknown;
  };
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

export interface GeoJsonData {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export interface MapFeatureClickPayload {
  properties: {
    name: string;
    hits: number;
  };
}
