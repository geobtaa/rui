export type FacetValue = string | number;

// New backend facet structure: attributes.items is a list of [value, count] tuples
export type FacetTupleItem = [FacetValue, number];

// Older/alternate facet structure used in some endpoints/components
export interface FacetObjectItem {
  attributes: {
    label?: string;
    value: FacetValue;
    hits: number;
  };
  links?: {
    self?: string;
  };
}

export type FacetItem = FacetTupleItem | FacetObjectItem;

export interface FacetLinks {
  applyTemplate?: string;
  // Some JSON:API resources use `links.self`; allow it so callers can pass through
  // unioned link shapes without extra narrowing.
  self?: string;
}

export interface NormalizedFacetItem {
  label: string;
  value: FacetValue;
  hits: number;
  url?: string;
}

function isTupleItem(item: unknown): item is FacetTupleItem {
  return (
    Array.isArray(item) &&
    item.length === 2 &&
    (typeof item[0] === 'string' || typeof item[0] === 'number') &&
    typeof item[1] === 'number'
  );
}

function isObjectItem(item: unknown): item is FacetObjectItem {
  if (!item || typeof item !== 'object') return false;
  const maybe = item as Partial<FacetObjectItem>;
  return !!(
    maybe.attributes &&
    (typeof maybe.attributes.value === 'string' ||
      typeof maybe.attributes.value === 'number') &&
    typeof maybe.attributes.hits === 'number'
  );
}

function applyTemplateUrl(template: string | undefined, value: FacetValue) {
  if (!template) return undefined;
  // Backend sends `{value}` placeholder; keep it robust for numeric values too.
  return template.replace('{value}', encodeURIComponent(String(value)));
}

/**
 * Normalize facet items to a consistent `{label,value,hits,url?}` structure.
 *
 * Accepts:
 * - New API: `[value, count]`
 * - Old API: `{ attributes: { label, value, hits }, links: { self } }`
 */
export function normalizeFacetItems(
  items: unknown[] | undefined,
  links?: FacetLinks
): NormalizedFacetItem[] {
  if (!items || items.length === 0) return [];

  return items
    .map((item) => {
      if (isTupleItem(item)) {
        const [value, hits] = item;
        return {
          label: String(value),
          value,
          hits: typeof hits === 'number' ? hits : Number(hits) || 0,
          url: applyTemplateUrl(links?.applyTemplate, value),
        } satisfies NormalizedFacetItem;
      }

      if (!isObjectItem(item)) return null;

      const value = item.attributes.value;
      return {
        label: item.attributes.label || String(value),
        value,
        hits: item.attributes.hits,
        url: item.links?.self,
      } satisfies NormalizedFacetItem;
    })
    .filter((x): x is NormalizedFacetItem => !!x && x.label !== '');
}

