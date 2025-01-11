import React from 'react';

interface MetadataTableProps {
  data: any;
}

export function MetadataTable({ data }: MetadataTableProps) {
  const attributes = data?.data?.attributes || {};

  // Helper function to check if a value is empty
  const hasValue = (value: any): boolean => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'string') {
      return value.trim() !== '';
    }
    return value !== null && value !== undefined;
  };

  // Format value for display
  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value?.toString() || '';
  };

  // Metadata field definitions with labels
  const metadataFields = [
    { key: 'dct_creator_sm', label: 'Creator', colSpan: 3 },
    { key: 'dct_description_sm', label: 'Description', colSpan: 3 },
    { key: 'dct_spatial_sm', label: 'Place(s)', colSpan: 3 },
    { 
      type: 'combined',
      cells: [
        { key: 'dct_temporal_sm', label: 'Temporal Coverage' },
        { key: 'dct_issued_s', label: 'Date Issued' },
        { key: 'dct_language_sm', label: 'Language' }
      ]
    },
    {
      type: 'combined',
      cells: [
        { key: 'dct_format_s', label: 'Format' },
        { key: 'schema_provider_s', label: 'Provider' },
      ]
    },
    { key: 'dct_provenance_s', label: 'Institution', colSpan: 3 },
    { key: 'dc_publisher_sm', label: 'Publisher', colSpan: 3 },
    { key: 'dc_subject_sm', label: 'Subject', colSpan: 3 },
    { key: 'dct_accessRights_s', label: 'Access Rights', colSpan: 3 },
    { key: 'dct_license_sm', label: 'License', colSpan: 3 },
    { key: 'gbl_resourceType_sm', label: 'Resource Type', colSpan: 3 },
    { key: 'gbl_resourceClass_sm', label: 'Resource Class', colSpan: 3 },
  ];

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <tbody className="divide-y divide-gray-200">
        {metadataFields.map((field, index) => {
          if (field.type === 'combined') {
            // Handle the special combined row
            const hasAnyValue = field.cells.some(cell => hasValue(attributes[cell.key]));
            if (!hasAnyValue) return null;

            return (
              <tr key={`combined-${index}`} className="hover:bg-gray-50">
                {field.cells.map(cell => (
                  <td key={cell.key} className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      {cell.label}
                    </div>
                    <div className="text-sm text-gray-900">
                      {formatValue(attributes[cell.key])}
                    </div>
                  </td>
                ))}
              </tr>
            );
          }

          // Handle regular rows
          const value = attributes[field.key];
          if (!hasValue(value)) return null;

          return (
            <tr key={field.key} className="hover:bg-gray-50">
              <td colSpan={field.colSpan} className="px-6 py-4">
                <div className="text-sm font-medium text-gray-500 mb-1">
                  {field.label}
                </div>
                <div className="text-sm text-gray-900">
                  {formatValue(value)}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}