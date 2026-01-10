/**
 * Format large *count* values with thousands separators.
 * Use this ONLY for count contexts (total results, facet hits, etc),
 * not for years/dates.
 */
export function formatCount(value: number | string | null | undefined): string {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : NaN;

  if (!Number.isFinite(n)) return String(value ?? '');

  // Requirement: use commas (e.g., 143,691). Force en-US formatting.
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

