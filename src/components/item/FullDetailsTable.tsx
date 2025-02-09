import React from 'react';
import { Link } from 'react-router-dom';
import { humanizeFieldName, isFieldHidden, shouldDisplayField, getFacetField } from '../../constants/fieldLabels';

interface FullDetailsTableProps {
  data: any;
}

export function FullDetailsTable({ data }: FullDetailsTableProps) {
  const attributes = data?.data?.attributes || {};
  
  // Group fields by their prefix/category
  const groupFields = () => {
    const entries = Object.entries(attributes)
      .filter(([key, value]) => (
        value !== null && 
        value !== undefined && 
        value !== '' && 
        !key.startsWith('ui_') &&
        !isFieldHidden(key) &&
        shouldDisplayField(key)
      ));

    // Define field groups in order
    const groups = [
      {
        title: 'Dublin Core Terms',
        prefix: 'dct_',
        fields: entries.filter(([key]) => key.startsWith('dct_'))
      },
      {
        title: 'Dublin Core',
        prefix: 'dc_',
        fields: entries.filter(([key]) => key.startsWith('dc_'))
      },
      {
        title: 'GeoBlacklight',
        prefix: 'gbl_',
        fields: entries.filter(([key]) => key.startsWith('gbl_'))
      },
      {
        title: 'DCAT',
        prefix: 'dcat_',
        fields: entries.filter(([key]) => key.startsWith('dcat_'))
      },
      {
        title: 'Schema.org',
        prefix: 'schema_',
        fields: entries.filter(([key]) => key.startsWith('schema_'))
      },
      {
        title: 'System Fields',
        prefix: 'layer_',
        fields: entries.filter(([key]) => key.startsWith('layer_'))
      },
      {
        title: 'Other Fields',
        prefix: '',
        fields: entries.filter(([key]) => 
          !key.startsWith('dct_') && 
          !key.startsWith('dc_') && 
          !key.startsWith('gbl_') && 
          !key.startsWith('dcat_') && 
          !key.startsWith('schema_') && 
          !key.startsWith('layer_')
        )
      }
    ];

    return groups.filter(group => group.fields.length > 0);
  };

  const renderValue = (key: string, value: any) => {
    const facetField = getFacetField(key);
    
    if (facetField) {
      if (Array.isArray(value)) {
        return value.map((v, i) => (
          <React.Fragment key={v}>
            {i > 0 && ', '}
            <Link 
              to={`/search?fq[${facetField}][]=${encodeURIComponent(v)}`}
              className="text-blue-600 hover:text-blue-800"
            >
              {v}
            </Link>
          </React.Fragment>
        ));
      }
      return (
        <Link 
          to={`/search?fq[${facetField}][]=${encodeURIComponent(value)}`}
          className="text-blue-600 hover:text-blue-800"
        >
          {value.toString()}
        </Link>
      );
    }

    return Array.isArray(value) ? value.join(', ') : value.toString();
  };

  const groups = groupFields();

  return (
    <div id="full-details" className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Full Details
        </h2>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <tbody className="divide-y divide-gray-200">
          {groups.map(group => (
            <React.Fragment key={group.title}>
              <tr className="bg-gray-50">
                <td colSpan={2} className="px-6 py-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    {group.title}
                  </h3>
                </td>
              </tr>
              {group.fields
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-6 py-4 w-1/3">
                      <div className="text-sm font-medium text-gray-500">
                        {humanizeFieldName(key)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {renderValue(key, value)}
                      </div>
                    </td>
                  </tr>
                ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
} 