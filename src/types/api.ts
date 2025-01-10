export interface GeoDocument {
  id: string;
  dct_title_s: string;
  dct_description_sm?: string[];
  dc_publisher_sm: string[];
  dct_spatial_sm: string[];
  gbl_resourceclass_sm: string[];
  gbl_resourcetype_sm: string[];
  b1g_language_sm: string[];
  dc_subject_sm: string[];
  schema_provider_s: string;
  dct_accessrights_s: string;
  gbl_georeferenced_b: string;
  b1g_georeferenced_allmaps_b: string;
  dct_temporal_sm: string[];
  dct_rightsholder_sm: string[];
  dct_license_sm: string[];
  dct_subject_sm: string[];
  dct_references_s: string;
  ui_viewer_geometry?: string;
  locn_geometry?: string;
}

export interface GeoDocumentDetails extends GeoDocument {
  creator_sm: string[];
  dct_spatial_sm: string[];
  dc_subject_sm: string[];
}

export interface ParsedFacet {
  field: string;
  value: string;
}

interface FacetItem {
  attributes: {
    label: string;
    value: string | number;
    hits: number;
  };
  links: {
    self: string;
  };
}

interface Facet {
  type: 'facet';
  id: string;
  attributes: {
    label: string;
    items: FacetItem[];
  };
}

export interface JsonApiResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: {
      dct_title_s: string;
      dct_temporal_sm?: string[];
      description?: string[];
      dct_provenance_s?: string;
      dc_publisher_sm?: string[];
      dct_issued_s?: string;
      creator_sm?: string[];
      dct_spatial_sm?: string[];
      dc_subject_sm?: string[];
      dct_references_s?: string;
      ui_viewer_protocol?: string;
      ui_viewer_endpoint?: string;
      locn_geometry?: string;
    };
  }>;
  included?: Facet[];
  meta: {
    pages: {
      total_count: number;
      current_page: number;
      total_pages: number;
    };
  };
}

export interface SearchResponse {
  response: {
    docs: GeoDocument[];
    numFound: number;
    start: number;
  };
  facets?: {
    [key: string]: {
      label: string;
      items: {
        label: string;
        value: string | number;
        hits: number;
        url: string;
      }[];
    };
  };
}