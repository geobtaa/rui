import React from 'react';
import { Link } from 'react-router-dom';
import { Globe2 } from 'lucide-react';
import { SearchField } from '../SearchField';
import { useSearch } from '../../hooks/useSearch';

export function Header() {
  const { query, isLoading, updateSearch } = useSearch();

  const handleSearch = (newQuery: string) => {
    updateSearch({ query: newQuery });
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="h-16 grid grid-cols-12 items-center gap-8">
          {/* Branding - matches facets column width */}
          <div className="col-span-2 flex items-center gap-3">
            <Globe2 className="h-8 w-8 text-blue-500" />
            <Link to="/" className="text-xl font-bold text-gray-900">
              BTAA Geoportal
            </Link>
          </div>
          
          {/* Search Field - matches results column width */}
          <div className="col-span-6">
            <SearchField 
              initialQuery={query} 
              onSearch={handleSearch} 
              isLoading={isLoading}
            />
          </div>

          {/* Navigation - matches map column width */}
          <nav className="col-span-4 flex items-center justify-end space-x-4">
            <Link 
              to="/" 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Search
            </Link>
            <a 
              href="https://geo.btaa.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              BTAA Geoportal
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}