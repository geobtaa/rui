import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { GeoDocument } from '../types/api';
import { Calendar, Building2, BookOpen } from 'lucide-react';

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
  const [showDetails, setShowDetails] = useState(false);

  console.log('Search Results:', results);
  console.log('Search Results (detailed):', JSON.stringify(results, null, 2));

  const location = useLocation();

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
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>
      {results.map((result, index) => (
        <article
          key={result.id}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
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
          <p className="text-gray-600 mb-4 line-clamp-2">
            {result.dct_temporal_sm?.join(', ')}
          </p>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {result.dc_publisher_sm && result.dc_publisher_sm.length > 0 && (
              <div className="flex items-center gap-1">
                <BookOpen size={16} />
                <span>{result.dc_publisher_sm.join(', ')}</span>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}