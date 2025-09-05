import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { GeoDocument } from '../types/api';
import { BookOpen } from 'lucide-react';
import { useDebug } from '../context/DebugContext';
import { useMap } from '../context/MapContext';
import { BookmarkButton } from './BookmarkButton';
import { getResourceIcon } from '../utils/resourceIcons';

interface SearchResultsProps {
  results: GeoDocument[];
  isLoading: boolean;
  totalResults: number;
  currentPage: number;
}

export function SearchResults({
  results,
  isLoading,
  totalResults,
  currentPage,
}: SearchResultsProps) {
  const { showDetails } = useDebug();
  const location = useLocation();
  const { setHoveredGeometry } = useMap();

  // Calculate absolute index in full result set
  const getAbsoluteIndex = (relativeIndex: number) => {
    return (currentPage - 1) * 10 + relativeIndex + 1;
  };

  // Add debug logging
  console.log('SearchResults props:', {
    resultCount: results.length,
    firstResult: results[0],
    thumbnailUrls: results.map((r) => ({
      id: r.id,
      thumbnail: r.meta?.ui?.thumbnail_url,
    })),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div>
        <p className="text-gray-500">No results found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {results.map((result, index) => {
        // Add detailed debugging
        console.log('Raw result object:', {
          id: result.id,
          type: result.type,
          attributes: result.attributes,
          thumbnail: result.meta?.ui?.thumbnail_url,
          // Log the full object to see its structure
          fullResult: result,
        });

        // Add detailed debug logging for thumbnails
        console.log('Full result object:', result);
        console.log('Result thumbnail debug:', {
          id: result.id,
          title: result.attributes.dct_title_s,
          thumbnailUrl: result.meta?.ui?.thumbnail_url,
          resourceClass: result.attributes.gbl_resourceClass_sm?.[0],
        });

        // Debug individual result
        console.log(`Rendering result ${result.id}:`, {
          title: result.attributes.dct_title_s,
          thumbnail: result.meta?.ui?.thumbnail_url,
        });

        return (
          <article
            key={result.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow relative"
            data-geom={result.meta?.ui?.viewer?.geometry ? JSON.stringify(result.meta.ui.viewer.geometry) : ''}
            onMouseEnter={() =>
              setHoveredGeometry(result.meta?.ui?.viewer?.geometry || null)
            }
            onMouseLeave={() => setHoveredGeometry(null)}
          >
            <div className="flex">
              {/* Thumbnail */}
              <div className="w-48 flex-shrink-0">
                {result.meta?.ui?.thumbnail_url ? (
                  <div className="h-48 w-48 rounded-l-lg">
                    <img
                      src={result.meta.ui.thumbnail_url}
                      alt={`Thumbnail for ${result.attributes.dct_title_s}`}
                      className="h-48 w-48 object-cover rounded-l-lg"
                      onError={(e) => {
                        console.error(
                          `Error loading thumbnail for ${result.id}:`,
                          e
                        );
                        // Instead of hiding, replace with fallback icon
                        e.currentTarget.parentElement!.innerHTML = `
                          <div class="h-48 w-48 flex items-center justify-center bg-gray-50 rounded-l-lg">
                            ${getResourceIcon(result.attributes.gbl_resourceClass_sm?.[0])}
                          </div>
                        `;
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-48 w-48 flex items-center justify-center bg-gray-50 rounded-l-lg">
                    {getResourceIcon(
                      result.attributes.gbl_resourceClass_sm?.[0]
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 p-6">
                <div className="absolute -left-4 top-6 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center text-sm text-gray-500 font-medium">
                  {getAbsoluteIndex(index)}
                </div>

                <div className="absolute right-4 top-4">
                  <BookmarkButton itemId={result.id} />
                </div>

                {showDetails && (
                  <pre className="overflow-auto text-xs">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}

                <Link
                  to={`/resources/${result.id}`}
                  state={{
                    searchResults: results,
                    currentIndex: getAbsoluteIndex(index) - 1,
                    totalResults: totalResults,
                    searchUrl: location.pathname + location.search,
                    currentPage: currentPage,
                  }}
                  className="block"
                >
                  <h2 className="text-xl font-semibold text-blue-600 hover:text-blue-800 mb-2">
                    {typeof result.attributes.dct_title_s === 'string' 
                      ? result.attributes.dct_title_s 
                      : String(result.attributes.dct_title_s)}
                  </h2>
                </Link>

                {/* Description */}
                {result.attributes.dct_description_sm &&
                  Array.isArray(result.attributes.dct_description_sm) &&
                  result.attributes.dct_description_sm.length > 0 && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {typeof result.attributes.dct_description_sm[0] === 'string'
                        ? result.attributes.dct_description_sm[0]
                        : String(result.attributes.dct_description_sm[0])}
                    </p>
                  )}

                {/* Temporal information */}
                {result.attributes.dct_temporal_sm &&
                  Array.isArray(result.attributes.dct_temporal_sm) &&
                  result.attributes.dct_temporal_sm.length > 0 && (
                    <p className="text-gray-500 text-sm mb-4">
                      {result.attributes.dct_temporal_sm
                        .map(item => typeof item === 'string' ? item : String(item))
                        .join(', ')}
                    </p>
                  )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {result.attributes.dc_publisher_sm &&
                    Array.isArray(result.attributes.dc_publisher_sm) &&
                    result.attributes.dc_publisher_sm.length > 0 && (
                      <div className="flex items-center gap-1">
                        <BookOpen size={16} />
                        <span>
                          {result.attributes.dc_publisher_sm
                            .map(item => typeof item === 'string' ? item : String(item))
                            .join(', ')}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
