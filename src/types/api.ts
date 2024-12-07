export interface GeoDocument {
  id: string;
  dct_title_s: string;
  description: string[];
  dct_provenance_s: string;
  dc_publisher_sm: string[];
  dct_issued_s: string;
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

export interface JsonApiResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: {
      dct_title_s: string;
      description?: string[];
      dct_provenance_s?: string;
      dc_publisher_sm?: string[];
      dct_issued_s?: string;
      creator_sm?: string[];
      dct_spatial_sm?: string[];
      dc_subject_sm?: string[];
    };
  }>;
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
}