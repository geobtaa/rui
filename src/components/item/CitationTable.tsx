import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CitationTableProps {
  citation: string;
  permalink: string;
}

export function CitationTable({ citation, permalink }: CitationTableProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(permalink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Citation & Permalink
        </h2>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <tbody className="divide-y divide-gray-200">
          {citation && (
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-500 mb-1">
                  Citation
                </div>
                <div className="text-sm text-gray-900">
                  {citation}
                </div>
              </td>
            </tr>
          )}
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Permalink
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={permalink}
                  className="flex-1 text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-1.5"
                />
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title="Copy permalink"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
} 