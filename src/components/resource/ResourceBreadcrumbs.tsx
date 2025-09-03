import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { GeoDocument } from '../../types/api';

interface ResourceBreadcrumbsProps {
  item: GeoDocument;
}

export function ResourceBreadcrumbs({ item }: ResourceBreadcrumbsProps) {
  // Helper to build search URL with accumulated facets
  const buildSearchUrl = (facets: Array<{ field: string; value: string }>) => {
    const params = new URLSearchParams();
    facets.forEach(({ field, value }) => {
      params.append(`fq[${field}][]`, value);
    });
    return `/search?${params.toString()}`;
  };

  // Build breadcrumb items with accumulated facets
  const breadcrumbs = [];
  let accumulatedFacets: Array<{ field: string; value: string }> = [];

  // Resource Class
  if (item.gbl_resourceclass_sm?.[0]) {
    accumulatedFacets = [
      {
        field: 'resource_class_agg',
        value: item.gbl_resourceclass_sm[0],
      },
    ];
    breadcrumbs.push({
      label: item.gbl_resourceclass_sm[0],
      facets: [...accumulatedFacets],
    });
  }

  // Resource Type
  if (item.gbl_resourcetype_sm?.[0]) {
    accumulatedFacets = [
      ...accumulatedFacets,
      {
        field: 'resource_type_agg',
        value: item.gbl_resourcetype_sm[0],
      },
    ];
    breadcrumbs.push({
      label: item.gbl_resourcetype_sm[0],
      facets: [...accumulatedFacets],
    });
  }

  // Place (first entry only)
  if (item.dct_spatial_sm?.[0]) {
    accumulatedFacets = [
      ...accumulatedFacets,
      {
        field: 'spatial_agg',
        value: item.dct_spatial_sm[0],
      },
    ];
    breadcrumbs.push({
      label: item.dct_spatial_sm[0],
      facets: [...accumulatedFacets],
    });
  }

  // Index Year
  if (item.dct_temporal_sm?.[0]) {
    accumulatedFacets = [
      ...accumulatedFacets,
      {
        field: 'index_year_agg',
        value: item.dct_temporal_sm[0],
      },
    ];
    breadcrumbs.push({
      label: item.dct_temporal_sm[0],
      facets: [...accumulatedFacets],
    });
  }

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.label} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
            )}
            <Link
              to={buildSearchUrl(crumb.facets)}
              className="text-sm font-medium text-gray-500 hover:text-blue-600"
            >
              {crumb.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
