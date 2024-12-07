const FACET_LABELS: Record<string, string> = {
  'schema_provider_s': 'Provider',
  'dct_provenance_s': 'Institution',
  'dc_rights_s': 'Access',
  'dc_subject_sm': 'Subject',
  'dct_spatial_sm': 'Place',
  'dc_creator_sm': 'Creator',
  'dc_publisher_sm': 'Publisher',
  'layer_geom_type_s': 'Data Type',
  'solr_year_i': 'Year'
};

export function getFacetLabel(field: string): string {
  return FACET_LABELS[field] || field;
}