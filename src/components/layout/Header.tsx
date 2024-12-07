import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe2 } from 'lucide-react';
import { useSearch } from '../../hooks/useSearch';

export function Header() {
  const { updateSearch } = useSearch();
  const navigate = useNavigate();

  const handleReset = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    updateSearch({ query: '', facets: [], page: 1 });
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link 
          to="/" 
          onClick={handleReset}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit"
        >
          <Globe2 className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900">
            BTAA Geoportal
          </h1>
        </Link>
      </div>
    </header>
  );
}