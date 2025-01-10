import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useApi } from '../../context/ApiContext';
import { useDebug } from '../../context/DebugContext';

export function Footer() {
  const { lastApiUrl } = useApi();
  const { showDetails, toggleDetails } = useDebug();

  if (!lastApiUrl) {
    return null;
  }

  return (
    <footer className="bg-white shadow-sm mt-auto">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col space-y-4">
          {/* Links Row */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Big Ten Academic Alliance. All rights reserved.
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDetails}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
              <a 
                href="https://www.btaa.org/library/geoportal/geoportal" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                About
              </a>
              <a 
                href="https://geo.btaa.org/docs" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Documentation
              </a>
            </div>
          </div>

          {/* API URL Row */}
          <div className="text-sm text-gray-500">
            <p className="mb-2">Last API Request:</p>
            <a 
              href={lastApiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                <code className="flex-1 overflow-x-auto text-blue-600">
                  {lastApiUrl}
                </code>
                <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-500" />
              </div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}