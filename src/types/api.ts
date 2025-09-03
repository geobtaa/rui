export interface GeoDocument {
  id: string;
  type: string;
  attributes: {
    id: string;
    dct_title_s: string;
    dct_creator_sm?: string[];
    dct_description_sm?: string[];
    dct_publisher_sm?: string[];
    dct_spatial_sm?: string[];
    gbl_resourceclass_sm?: string[];
    gbl_resourcetype_sm?: string[];
    dct_language_sm?: string[];
    dcat_keyword_sm?: string[];
    schema_provider_s?: string;
    dct_accessrights_s?: string;
    dct_format_s?: string;
    dct_temporal_sm?: string[];
    dct_issued_s?: string;
    gbl_indexyear_im?: number[];
    dct_references_s?: Record<string, string>;
    locn_geometry_original?: string;
    dcat_bbox?: any;
    dcat_centroid_original?: string;
    dct_identifier_sm?: string[];
    gbl_mdversion_s?: string;
    [key: string]: any;
  };
  meta?: {
    ui?: {
      thumbnail_url?: string;
      citation?: string;
      downloads?: Array<{
        label: string;
        url: string;
        type: string;
      }>;
      relationships?: Record<string, any>;
      summaries?: any[];
      ai_summaries?: any[];
      suggest?: {
        input: string[];
      };
      viewer?: {
        protocol?: string;
        endpoint?: string;
        geometry?: any;
      };
    };
  };
}

export interface GeoDocumentDetails extends GeoDocument {
  // Additional fields specific to detailed view
  [key: string]: any;
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

export interface SortOption {
  type: 'sort';
  id: string;
  attributes: {
    label: string;
  };
  links: {
    self: string;
  };
}

export interface JsonApiResponse {
  data: Array<GeoDocument>;
  included?: Array<Facet | SortOption>;
  meta: {
    pages: {
      total_count: number;
      current_page: number;
      total_pages: number;
    };
  };
}

interface SpellingSuggestion {
  text: string;
  highlighted: string;
  score: number;
}

interface SearchResponseMeta {
  pages: {
    current_page: number;
    next_page: number | null;
    prev_page: number | null;
    total_pages: number;
    limit_value: number;
    offset_value: number;
    total_count: number;
    first_page?: boolean;
    last_page?: boolean;
  };
  spelling_suggestions: SpellingSuggestion[];
}

export interface SearchResponse {
  response: {
    numFound: number;
    start: number;
    maxScore: number;
    docs: GeoDocument[];
  };
  facets: {
    [key: string]: FacetGroup;
  };
  sortOptions: SortOption[];
  meta: SearchResponseMeta;
}

export interface FacetGroup {
  label: string;
  items: Array<{
    label: string;
    value: string | number;
    hits: number;
    url: string;
  }>;
}
