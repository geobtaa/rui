import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Globe2 } from 'lucide-react';
import { SearchField } from '../SearchField';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
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
            {!isHomePage && (
              <SearchField 
                placeholder="Search for maps, data, imagery..."
                onSearch={handleSearch}
              />
            )}
          </div>

          {/* Navigation - matches map column width */}
          <nav className="col-span-4 flex items-center justify-end space-x-4">
            <Link 
              to="/bookmarks" 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Bookmarks
            </Link>
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