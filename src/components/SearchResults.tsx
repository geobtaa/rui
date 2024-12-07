import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { GeoDocument } from '../types/api';
import { Calendar, Building2, BookOpen } from 'lucide-react';

interface SearchResultsProps {
  results: GeoDocument[];
  isLoading: boolean;
}

export function SearchResults({ results, isLoading }: SearchResultsProps) {
  const location = useLocation();

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

  // Get the current search state from the URL
  const searchState = location.search;

  return (
    <div className="space-y-6">
      {results.map((result) => (
        <article
          key={result.id}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <Link 
            to={`/items/${result.id}`}
            state={{ searchState }}
            className="block"
          >
            <h2 className="text-xl font-semibold text-blue-600 hover:text-blue-800 mb-2">
              {result.dct_title_s}
            </h2>
          </Link>
          <p className="text-gray-600 mb-4 line-clamp-2">
            {result.description?.[0]}
          </p>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {result.dct_issued_s && (
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>{result.dct_issued_s}</span>
              </div>
            )}
            {result.dct_provenance_s && (
              <div className="flex items-center gap-1">
                <Building2 size={16} />
                <span>{result.dct_provenance_s}</span>
              </div>
            )}
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