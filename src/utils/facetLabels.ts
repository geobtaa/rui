// Labels keyed by field-named facet IDs (new API)
export const FACET_LABELS: Record<string, string> = {
  dct_spatial_sm: 'Place',
  gbl_resourceClass_sm: 'Resource Class',
  gbl_resourceType_sm: 'Resource Type',
  schema_provider_s: 'Provider',
  dct_creator_sm: 'Creator',
  dct_accessRights_s: 'Access',
  gbl_indexyear_im: 'Year',
  dct_language_sm: 'Language',
};

// Backward-compat mapping for legacy *_agg IDs to new field IDs
export const FACET_ID_MAP: Record<string, string> = {
  spatial_agg: 'dct_spatial_sm',
  resource_class_agg: 'gbl_resourceClass_sm',
  resource_type_agg: 'gbl_resourceType_sm',
  provider_agg: 'schema_provider_s',
  creator_agg: 'dct_creator_sm',
  access_rights_agg: 'dct_accessRights_s',
  access_agg: 'dct_accessRights_s',
  index_year_agg: 'gbl_indexyear_im',
  language_agg: 'dct_language_sm',
  subject_agg: 'dct_subject_sm',
  institution_agg: 'dct_provenance_s',
  format_agg: 'dct_format_s',
  georeferenced_agg: 'gbl_georeferenced_b',
};

export function normalizeFacetId(id: string): string {
  return FACET_ID_MAP[id] || id;
}

export function getFacetLabel(field: string): string {
  const normalized = normalizeFacetId(field);
  return FACET_LABELS[normalized] || normalized;
}
