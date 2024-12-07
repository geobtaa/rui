import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useApi } from '../../context/ApiContext';

export function Footer() {
  const { lastApiUrl } = useApi();

  if (!lastApiUrl) {
    return null;
  }

  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-sm text-gray-500">
          <p className="mb-2">Last API Request:</p>
          <a
            href={lastApiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
              <code className="flex-1 overflow-x-auto text-blue-600">
                {lastApiUrl}
              </code>
              <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-500" />
            </div>
          </a>
        </div>
      </div>
    </footer>
  );
}