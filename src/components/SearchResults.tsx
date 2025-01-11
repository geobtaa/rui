import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { GeoDocument } from '../types/api';
import { Calendar, Building2, BookOpen } from 'lucide-react';
import { useDebug } from '../context/DebugContext';
import { useMap } from '../context/MapContext';

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
    return (currentPage - 1) * 10 + relativeIndex;
  };

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
        console.log('ui_viewer_geometry:', result.ui_viewer_geometry);
        let geomData;
        try {
          geomData = JSON.stringify(result.ui_viewer_geometry);
        } catch (error) {
          console.error('Invalid JSON:', error);
          geomData = null; // or handle it in another way, e.g., set to an empty string
        }
        return (
          <article
            key={result.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            data-geom={geomData}
            onMouseEnter={() => setHoveredGeometry(result.ui_viewer_geometry)}
            onMouseLeave={() => setHoveredGeometry(null)}
          >
            {showDetails && (
              <pre className="overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
            )}
            <Link 
              to={`/items/${result.id}`}
              state={{
                searchResults: results,
                currentIndex: getAbsoluteIndex(index),
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
          </article>
        );
      })}
    </div>
  );
}