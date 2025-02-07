import React from 'react';

interface FullDetailsTableProps {
  data: any;
}

export function FullDetailsTable({ data }: FullDetailsTableProps) {
  const attributes = data?.data?.attributes || {};
  
  // Filter out empty values, ui_ prefixed fields, and sort by key
  const sortedEntries = Object.entries(attributes)
    .filter(([key, value]) => (
      value !== null && 
      value !== undefined && 
      value !== '' && 
      !key.startsWith('ui_')
    ))
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div id="full-details" className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Full Details
        </h2>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <tbody className="divide-y divide-gray-200">
          {sortedEntries.map(([key, value]) => (
            <tr key={key} className="hover:bg-gray-50">
              <td className="px-6 py-4 w-1/3">
                <div className="text-sm font-medium text-gray-500">
                  {key}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {Array.isArray(value) ? value.join(', ') : value.toString()}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 