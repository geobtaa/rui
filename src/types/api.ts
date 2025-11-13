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
    gbl_resourceClass_sm?: string[];
    gbl_resourceType_sm?: string[];
    dct_language_sm?: string[];
    dcat_keyword_sm?: string[];
    schema_provider_s?: string;
    dct_accessRights_s?: string;
    dct_format_s?: string;
    dct_temporal_sm?: string[];
    dct_issued_s?: string;
    gbl_indexyear_im?: number[];
    dct_references_s?: Record<string, string>;
    locn_geometry_original?: string;
    dcat_bbox?: string;
    dcat_centroid_original?: string;
    dct_identifier_sm?: string[];
    gbl_mdversion_s?: string;
    [key: string]: unknown;
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
      relationships?: Record<string, unknown>;
      summaries?: unknown[];
      ai_summaries?: unknown[];
      suggest?: {
        input: string[];
      };
      viewer?: {
        protocol?: string;
        endpoint?: string;
        geometry?: string;
      };
    };
  };
}

export interface GeoDocumentDetails extends GeoDocument {
  // Additional fields specific to detailed view
  [key: string]: unknown;
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

export type FacetValuesSort =
  | 'count_desc'
  | 'count_asc'
  | 'alpha_asc'
  | 'alpha_desc';

export interface FacetValue {
  type: 'facet_value' | 'facet-item';
  id: string;
  attributes: {
    label: string;
    value: string | number;
    hits: number;
  };
  links?: {
    self: string;
  };
}

export interface FacetValuesMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
  facet?: {
    id: string;
    label: string;
  };
}

export interface FacetValuesResponse {
  jsonapi?: {
    version: string;
    profile: string[];
  };
  data: FacetValue[];
  links?: {
    self: string;
    next?: string;
    prev?: string;
    first?: string;
    last?: string;
  };
  meta: FacetValuesMeta;
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
  jsonapi: {
    version: string;
    profile: string[];
  };
  links: {
    self: string;
    next?: string;
    first: string;
    last: string;
  };
  meta: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
    query: string;
    sort?: string;
    query_time?: unknown;
    spelling_suggestions?: string[];
  };
  data: Array<GeoDocument>;
  included?: Array<Facet | SortOption>;
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
