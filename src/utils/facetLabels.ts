export const FACET_LABELS: Record<string, string> = {
  'spatial_agg': 'Place',
  'resource_class_agg': 'Resource Class',
  'resource_type_agg': 'Resource Type',
  'provider_agg': 'Provider',
  'creator_agg': 'Creator',
  'access_agg': 'Access',
  'index_year_agg': 'Year',
  'language_agg': 'Language',
  // ... add more facets and control their order through this object
};

// We could also add an explicit order array
export const FACET_ORDER = [
  'spatial_agg',
  'resource_class_agg',
  'resource_type_agg',
  'provider_agg',
  'creator_agg',
  'access_agg',
  'index_year_agg',
  'language_agg'
  // ... etc
];

export function getFacetLabel(field: string): string {
  return FACET_LABELS[field] || field;
}