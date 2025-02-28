import React from 'react';
import { Download } from 'lucide-react';

interface DownloadItem {
  label: string;
  url: string;
  type: string;
  format: string;
}

interface DownloadsTableProps {
  downloads: DownloadItem[];
}

export function DownloadsTable({ downloads }: DownloadsTableProps) {
  if (!downloads || downloads.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Downloads</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {downloads.map((download, index) => (
          <div key={index} className="px-6 py-4 hover:bg-gray-50">
            <a
              href={download.url}
              className="flex items-center justify-between group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                    {download.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    Format: {download.format.toUpperCase()}
                  </div>
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
} 