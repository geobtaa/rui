interface FieldConfig {
  label: string;
  description?: string;
  hidden?: boolean;
  display?: boolean;
  facet?: string;  // The facet field name to link to (e.g., 'resource_class_agg')
}

export const FIELD_LABELS: Record<string, FieldConfig> = {
  // Dublin Core Terms
  'dct_title_s': { label: 'Title', display: true },
  'dct_alternative_sm': { label: 'Alternative Title', display: true },
  'dct_description_sm': { label: 'Description', display: true },
  'dct_language_sm': { label: 'Language', display: true },
  'dct_creator_sm': { label: 'Creator', display: true },
  'dct_publisher_sm': { label: 'Publisher', display: true },
  'dct_temporal_sm': { label: 'Temporal Coverage', display: true, facet: 'index_year_agg' },
  'dct_issued_s': { label: 'Date Issued', display: true },
  'dct_spatial_sm': { label: 'Place', display: true, facet: 'spatial_agg' },
  'dct_provenance_s': { label: 'Institution', display: true, facet: 'institution_agg' },
  'dct_accessRights_s': { label: 'Access Rights', display: true },
  'dct_format_s': { label: 'Format', display: true, facet: 'format_agg' },
  'dct_license_sm': { label: 'License', display: true },
  'dct_identifier_sm': { label: 'Identifier', display: true },
  'dct_ispartof_sm': { label: 'Is Part Of', display: true },
  'dct_references_s': { label: 'References', display: false },
  'dct_rights_sm': { label: 'Rights', display: true },
  'dct_source_sm': { label: 'Source', display: true },
  'dct_subject_sm': { label: 'Subject', display: true, facet: 'subject_agg' },
  'dct_type_sm': { label: 'Type', display: true },
  'dct_accessrights_s': { label: 'Access Rights', display: true },

  // DCAT
  'dcat_theme_sm': { label: 'Theme', display: true },
  'dcat_centroid': { label: 'Centroid', display: true },
  'dcat_bbox': { label: 'Bounding Box', display: true },
  'dcat_keyword_sm': { label: 'Keyword', display: true },
  'dcat_spatial_sm': { label: 'Spatial', display: true },
  
  // Dublin Core
  'dc_publisher_sm': { label: 'Publisher', display: true },
  'dc_subject_sm': { label: 'Subject', display: true },
  'dc_type_sm': { label: 'Type', display: true },

  // GeoBlacklight
  'gbl_daterange_drsim': { label: 'Date Range', display: true },
  'gbl_indexyear_im': { label: 'Index Year', display: true },
  'gbl_mdversion_s': { label: 'Metadata Version', display: true },
  'gbl_resourceclass_sm': { label: 'Resource Class', display: true, facet: 'resource_class_agg' },
  'gbl_resourcetype_sm': { label: 'Resource Type', display: true, facet: 'resource_type_agg' },
  'gbl_wxsidentifier_s': { label: 'WXS Identifier', display: true },
  
  // Schema.org
  'schema_provider_s': { label: 'Provider', display: true },

  // System Fields
  'layer_slug_s': { label: 'Layer ID', hidden: true, display: true },
  'layer_modified_dt': { label: 'Last Modified', display: true },
  'layer_id_s': { label: 'Layer Identifier', hidden: true, display: true },

  // Geospatial
  'locn_geometry': { label: 'Geometry', display: true },
  'solr_geom': { label: 'Geometry', hidden: true, display: true },
  'solr_year_i': { label: 'Year', hidden: true, display: true },
  
  // PCDM
  'pcdm_memberof_sm': { label: 'Member Of', display: true },
};

export function humanizeFieldName(key: string): string {
  return FIELD_LABELS[key]?.label || key;
}

export function isFieldHidden(key: string): boolean {
  return FIELD_LABELS[key]?.hidden || false;
}

export function shouldDisplayField(key: string): boolean {
  return FIELD_LABELS[key]?.display !== false;
}

export function getFacetField(key: string): string | undefined {
  return FIELD_LABELS[key]?.facet;
} 