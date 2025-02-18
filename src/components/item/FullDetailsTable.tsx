import React from 'react';
import { Link } from 'react-router-dom';
import { humanizeFieldName, isFieldHidden, shouldDisplayField, getFacetField } from '../../constants/fieldLabels';

// Define a type for the attributes
interface Attributes {
  [key: string]: string | string[] | null | undefined;
}

interface FullDetailsTableProps {
  data: {
    data: {
      attributes: Attributes;
    };
  };
}

export function FullDetailsTable({ data }: FullDetailsTableProps) {
  const attributes = data?.data?.attributes || {};
  
  // Define the fields for the Document Metadata table
  const documentMetadataFields = [
    'dct_title_s', 'dct_alternative_sm', 'dct_description_sm', 'dct_creator_sm', 'dct_publisher_sm', 'dct_subject_sm', 'dcat_theme_sm', 'dcat_keyword_sm', 
    'dct_temporal_sm', 'dct_issued_s', 'gbl_indexyear_im', 'gbl_daterange_drsim', 'dct_rights_sm', 'dc_rightsholder_sm', 
    'dct_license_sm', 'dc_accessrights_s', 'dct_format_s', 'gbl_filesize_s', 'gbl_wxsidentifier_s', 'dct_references_s', 'dct_identifier_sm', 'dct_language_sm', 
    'dct_date_added_s', 'locn_geometry', 'dcat_bbox', 'dcat_centroid', 'gbl_mdversion_s'
  ];

  // Define the fields for the Metadata Facets table
  const metadataFacetsFields = [
    'gbl_resourceclass_sm', 'gbl_resourcetype_sm', 'dct_spatial_sm', 'gbl_provider_sm'
  ];

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

    // Separate fields into Document Metadata and Metadata Facets
    const documentMetadata = entries.filter(([key]) => documentMetadataFields.includes(key));
    const metadataFacets = entries.filter(([key]) => metadataFacetsFields.includes(key));

    return { documentMetadata, metadataFacets };
  };

  const renderValue = (key: string, value: string | string[] | null | undefined) => {
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

  const { documentMetadata, metadataFacets } = groupFields();

  return (
    <div id="full-details" className="bg-white rounded-lg shadow-md overflow-hidden">
      <h2 className="text-lg font-semibold text-gray-900 px-6 py-4">
        Full Details
      </h2>
      <div className="flex">
        <div className="w-2/3">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-200">
              {documentMetadata.map(([key, value]) => (
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
            </tbody>
          </table>
        </div>
        <div className="w-1/3">
          <div className="sr-only px-6 py-4 bg-gray-100 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Metadata Facets
            </h2>
          </div>
          <div className="px-6 py-4 bg-gray-100">
            {metadataFacets.map(([key, value]) => (
              <div key={key} className="mb-4">
                <h5 className="text-sm font-medium text-gray-500">
                  {humanizeFieldName(key)}
                </h5>
                <ul className="list-none">
                  <li className="text-sm text-gray-900">
                    {renderValue(key, value)}
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 