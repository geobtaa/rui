import React from 'react';
import { Link } from 'react-router-dom';
import { Globe2 } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white shadow">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe2 className="h-8 w-8 text-blue-500" />
            <Link to="/" className="text-xl font-bold text-gray-900">
              Big Ten Academic Alliance
            </Link>
          </div>
          
          <nav className="flex items-center space-x-4">
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