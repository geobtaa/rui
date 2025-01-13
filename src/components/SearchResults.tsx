import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { GeoDocument } from '../types/api';
import { Calendar, Building2, BookOpen } from 'lucide-react';
import { useDebug } from '../context/DebugContext';
import { useMap } from '../context/MapContext';
import { BookmarkButton } from './BookmarkButton';

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
  currentPage 
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
    thumbnailUrls: results.map(r => ({ 
      id: r.id, 
      thumbnail: r.ui_thumbnail_url 
    }))
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
        // Debug individual result
        console.log(`Rendering result ${result.id}:`, {
          title: result.dct_title_s,
          thumbnail: result.ui_thumbnail_url
        });

        return (
          <article
            key={result.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow relative"
            data-geom={JSON.stringify(result.ui_viewer_geometry)}
            onMouseEnter={() => setHoveredGeometry(result.ui_viewer_geometry)}
            onMouseLeave={() => setHoveredGeometry(null)}
          >
            <div className="flex">
              {/* Thumbnail */}
              <div className="w-48 flex-shrink-0">
                {result.ui_thumbnail_url ? (
                  <>
                    {/* Add debug output */}
                    {console.log(`Rendering thumbnail for ${result.id}:`, result.ui_thumbnail_url)}
                    <img
                      src={result.ui_thumbnail_url}
                      alt={`Thumbnail for ${result.dct_title_s}`}
                      className="h-48 w-48 object-cover rounded-l-lg"
                      onError={(e) => {
                        console.error(`Error loading thumbnail for ${result.id}:`, e);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </>
                ) : (
                  <div className="h-48 w-48 bg-gray-100 flex items-center justify-center rounded-l-lg">
                    <span className="text-gray-400">No thumbnail</span>
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
                  <pre className="overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
                )}

                <Link 
                  to={`/items/${result.id}`}
                  state={{
                    searchResults: results,
                    currentIndex: getAbsoluteIndex(index) - 1,
                    totalResults: totalResults,
                    searchUrl: location.pathname + location.search,
                    currentPage: currentPage
                  }}
                  className="block"
                >
                  <h2 className="text-xl font-semibold text-blue-600 hover:text-blue-800 mb-2">
                    {result.dct_title_s}
                  </h2>
                </Link>

                {/* Description */}
                {result.dct_description_sm && result.dct_description_sm.length > 0 && (
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {result.dct_description_sm[0]}
                  </p>
                )}

                {/* Temporal information */}
                {result.dct_temporal_sm && result.dct_temporal_sm.length > 0 && (
                  <p className="text-gray-500 text-sm mb-4">
                    {result.dct_temporal_sm.join(', ')}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {result.dc_publisher_sm && result.dc_publisher_sm.length > 0 && (
                    <div className="flex items-center gap-1">
                      <BookOpen size={16} />
                      <span>{result.dc_publisher_sm.join(', ')}</span>
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