import React from 'react';
import { useNavigate } from 'react-router-dom';
import { parseFacetUrl } from '../../utils/urlHelpers';

interface MetadataTableProps {
  data: Record<string, any>;
}

function formatValue(value: any, navigate: (path: string) => void): React.ReactNode {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  if (typeof value === 'object' && value !== null) {
    if (value.attributes) {
      if (value.attributes.value) {
        return formatValue(value.attributes.value, navigate);
      }
      if (value.attributes.html) {
        return (
          <div 
            dangerouslySetInnerHTML={{ __html: value.attributes.html }} 
            className="prose prose-sm max-w-none"
            onClick={(e) => handleHtmlClick(e, navigate)}
          />
        );
      }
    }
    return JSON.stringify(value);
  }
  
  // Check if the value contains HTML tags
  if (typeof value === 'string' && /<[^>]*>/g.test(value)) {
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: value }} 
        className="prose prose-sm max-w-none"
        onClick={(e) => handleHtmlClick(e, navigate)}
      />
    );
  }
  
  return String(value || '');
}

function handleHtmlClick(e: React.MouseEvent, navigate: (path: string) => void) {
  const target = e.target as HTMLElement;
  if (target.tagName === 'A') {
    e.preventDefault();
    const href = target.getAttribute('href');
    if (href) {
      const facet = parseFacetUrl(href);
      if (facet) {
        const searchParams = new URLSearchParams();
        searchParams.append(`f[${facet.field}][]`, facet.value);
        navigate(`/?${searchParams.toString()}`);
      }
    }
  }
}

function getFieldLabel(key: string, value: any): string {
  if (value && typeof value === 'object' && value.attributes && value.attributes.label) {
    return value.attributes.label;
  }
  
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

export function MetadataTable({ data }: MetadataTableProps) {
  const navigate = useNavigate();
  const attributes = data?.data?.attributes || {};
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Field
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Object.entries(attributes).map(([key, value]) => (
            <tr key={key} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {getFieldLabel(key, value)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {formatValue(value, navigate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}