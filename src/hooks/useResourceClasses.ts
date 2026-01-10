import { useEffect, useState } from 'react';
import { fetchSearchResults } from '../services/api';
import { normalizeFacetId } from '../utils/facetLabels';
import { normalizeFacetItems } from '../utils/normalizeFacetItems';
import { useTheme } from './useTheme';

export interface ResourceClassItem {
  value: string;
  label: string;
  hits: number;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function cacheKey(themeId: string) {
  return `resource_classes_cache:${themeId}`;
}

function cacheTimestampKey(themeId: string) {
  return `resource_classes_cache_timestamp:${themeId}`;
}

function getCachedResourceClasses(themeId: string): ResourceClassItem[] | null {
  try {
    const cached = localStorage.getItem(cacheKey(themeId));
    const timestamp = localStorage.getItem(cacheTimestampKey(themeId));

    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.error('Error reading cached resource classes:', error);
  }
  return null;
}

function setCachedResourceClasses(themeId: string, items: ResourceClassItem[]): void {
  try {
    localStorage.setItem(cacheKey(themeId), JSON.stringify(items));
    localStorage.setItem(cacheTimestampKey(themeId), Date.now().toString());
  } catch (error) {
    console.error('Error caching resource classes:', error);
  }
}

function sortResourceClasses(items: ResourceClassItem[]): ResourceClassItem[] {
  // Sort by hits (descending), but always place "Other" at the end.
  const otherItem = items.find(
    (item) =>
      item.value.toLowerCase() === 'other' || item.label.toLowerCase() === 'other'
  );
  const regularItems = items.filter(
    (item) =>
      item.value.toLowerCase() !== 'other' && item.label.toLowerCase() !== 'other'
  );

  regularItems.sort((a, b) => b.hits - a.hits);
  return otherItem ? [...regularItems, otherItem] : regularItems;
}

export function useResourceClasses() {
  const { themeId } = useTheme();
  const [resourceClasses, setResourceClasses] = useState<ResourceClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResourceClasses = async () => {
      setIsLoading(true);

      const cached = getCachedResourceClasses(themeId);
      if (cached) {
        setResourceClasses(cached);
        setIsLoading(false);
        return;
      }

      try {
        const results = await fetchSearchResults('', 1, 1);
        const resourceClassFacet = results.included?.find(
          (item) =>
            item.type === 'facet' &&
            (normalizeFacetId(item.id) === 'gbl_resourceClass_sm' ||
              item.id === 'resource_class_agg')
        );

        if (resourceClassFacet?.attributes && 'items' in resourceClassFacet.attributes) {
          const items: ResourceClassItem[] = normalizeFacetItems(
            resourceClassFacet.attributes.items || [],
            resourceClassFacet.links
          ).map((item) => ({
            value: String(item.value),
            label: item.label || String(item.value),
            hits: item.hits,
          }));

          const sorted = sortResourceClasses(items);
          setResourceClasses(sorted);
          setCachedResourceClasses(themeId, sorted);
        } else {
          setResourceClasses([]);
        }
      } catch (error) {
        console.error('Error fetching resource classes:', error);
        setResourceClasses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResourceClasses();
  }, [themeId]);

  return { resourceClasses, isLoading };
}

