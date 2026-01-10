/**
 * Facet value display labels can be inconsistent across APIs:
 * - Some responses include `attributes.label`
 * - Others only include `attributes.value`
 * - Some buggy/optimized backends may accidentally send numeric labels
 *
 * This helper ensures we always render the *term/value* (not the count).
 */
export function facetValueLabel(attrs: {
  label?: unknown;
  value?: unknown;
}): string {
  const rawLabel = attrs.label;
  if (typeof rawLabel === 'string') {
    const trimmed = rawLabel.trim();
    // If label is present and not purely numeric, trust it.
    if (trimmed && !/^\d+$/.test(trimmed)) return trimmed;
  }

  // Fall back to value.
  const v = attrs.value;
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (v === null || v === undefined) return '';
  return String(v);
}

