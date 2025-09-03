import React from 'react';
import { Link } from 'react-router-dom';
import {
  humanizeFieldName,
  isFieldHidden,
  shouldDisplayField,
  getFacetField,
} from '../../constants/fieldLabels';

// Define a type for the attributes
interface Attributes {
  [key: string]: string | string[] | null | undefined;
}

interface FullDetailsTableProps {
  data: {
    attributes: Attributes;
  };
}

// Function to fetch document title by ID
const fetchDocumentTitle = async (id: string): Promise<string> => {
  // Replace with actual API call to fetch document details
      const response = await fetch(`/api/resources/${id}`);
  const data = await response.json();
  return data.dct_title_s || 'Unknown Title';
};

const relationshipLabels: { [key: string]: string } = {
  memberOf: 'Belongs to collection...',
  hasMember: 'Collection records...',
  isPartOf: 'Is part of...',
  hasPart: 'Has part...',
  relation: 'Related records...',
  replaces: 'Replaces...',
  isReplacedBy: 'Is replaced by...',
  isSourceOf: 'Source records...',
  source: 'Derived records...',
  isVersionOf: 'Is version of...',
  hasVersion: 'Has version...',
  browse_all_no_count: 'Browse all records...',
  browse_all: 'Browse all %{count} records...',
};

export function FullDetailsTable({ data }: FullDetailsTableProps) {
  const attributes = data?.attributes || {};
  const uiRelationships = attributes.ui_relationships || {};

  // Define the fields for the Document Metadata table - comprehensive Aardvark schema support
  const documentMetadataFields = [
    // Descriptive fields (Mandatory: Title, Description, Language)
    'dct_title_s',
    'dct_alternative_sm',
    'dct_description_sm',
    'dct_language_sm',
    'gbl_displayNote_sm',
    
    // Credits fields (Mandatory: Creator, Provider)
    'dct_creator_sm',
    'dct_publisher_sm',
    'schema_provider_s',
    
    // Temporal fields (Mandatory: Date Issued, Index Year)
    'dct_temporal_sm',
    'dct_issued_s',
    'gbl_indexyear_im',
    'gbl_daterange_drsim',
    'gbl_mdModified_dt',
    
    // Spatial fields (Mandatory: Bounding Box, Geometry, Spatial Coverage)
    'dct_spatial_sm',
    'dcat_bbox',
    'dcat_centroid',
    'locn_geometry',
    'gbl_georeferenced_b',
    
    // Categories fields (Mandatory: Resource Class, Resource Type, Theme)
    'gbl_resourceclass_sm',
    'gbl_resourcetype_sm',
    'dcat_theme_sm',
    'dct_subject_sm',
    'dcat_keyword_sm',
    
    // Rights fields (Mandatory: Access Rights)
    'dct_rights_s',
    'dct_rightsHolder_sm',
    'dct_license_sm',
    'dct_accessrights_s',
    
    // Object fields (Mandatory: Format)
    'dct_format_s',
    'gbl_fileSize_s',
    
    // Identifiers fields (Mandatory: ID)
    'id',
    'dct_identifier_sm',
    'gbl_wxsIdentifier_s',
    
    // Links fields (Mandatory: References)
    'dct_references_s',
    
    // Relations fields
    'dct_relation_sm',
    'pcdm_memberof_sm',
    'dct_ispartof_sm',
    'dct_source_sm',
    'dct_isversionof_sm',
    'dct_replaces_sm',
    'dct_isreplacedby_sm',
    
    // Admin fields (Mandatory: Metadata Version)
    'gbl_mdversion_s',
    'gbl_suppressed_b',
    
    // Additional fields that might be present
    'dct_date_added_s',
    'dct_date_modified_s',
    'dct_created_s',
    'dct_valid_s',
    'dct_available_s',
    'dct_audience_sm',
    'dct_contributor_sm',
    'dct_coverage_sm',
    'dct_educationLevel_sm',
    'dct_extent_sm',
    'dct_instructionalMethod_sm',
    'dct_medium_sm',
    'dct_provenance_sm',
    'dct_type_sm',
    'dcat_contactPoint_sm',
    'dcat_distributor_sm',
    'dcat_landingPage_s',
    'dcat_themeCategory_sm',
    'gbl_dateRange_drsim',
    'gbl_indexYear_im',
    'gbl_resourceClass_sm',
    'gbl_resourceType_sm',
    'gbl_suppressed_b',
    'locn_geometry_original',
    'dcat_bbox_original',
    'dcat_centroid_original',
  ];

  // Define the fields for the Metadata Facets table - comprehensive Aardvark schema
  const metadataFacetsFields = [
    'gbl_resourceclass_sm',
    'gbl_resourcetype_sm',
    'dct_spatial_sm',
    'schema_provider_s',
    'dcat_theme_sm',
    'dct_subject_sm',
    'dcat_keyword_sm',
    'dct_language_sm',
    'dct_format_s',
    'dct_temporal_sm',
    'dct_issued_s',
    'gbl_indexyear_im',
    'gbl_georeferenced_b',
    'dct_rights_s',
    'dct_accessrights_s',
  ];

  // Define the relationship fields for the Metadata Facets table - comprehensive Aardvark schema
  const relationshipFields = [
    'dct_relation_sm',
    'pcdm_memberof_sm',
    'dct_ispartof_sm',
    'dct_source_sm',
    'dct_isversionof_sm',
    'dct_replaces_sm',
    'dct_isreplacedby_sm',
    'dct_identifier_sm',
    'gbl_wxsIdentifier_s',
    'dct_references_s',
    'dct_license_sm',
    'dct_rightsHolder_sm',
    'dcat_contactPoint_sm',
    'dcat_distributor_sm',
    'dcat_landingPage_s',
  ];

  // Custom field labels for better display - comprehensive Aardvark schema
  const customFieldLabels: { [key: string]: string } = {
    // Descriptive fields
    'dct_title_s': 'Title',
    'dct_alternative_sm': 'Alternative Title',
    'dct_description_sm': 'Description',
    'dct_language_sm': 'Language',
    'gbl_displayNote_sm': 'Display Note',
    
    // Credits fields
    'dct_creator_sm': 'Creator',
    'dct_publisher_sm': 'Publisher',
    'schema_provider_s': 'Provider',
    
    // Temporal fields
    'dct_temporal_sm': 'Temporal Coverage',
    'dct_issued_s': 'Date Issued',
    'gbl_indexyear_im': 'Index Year',
    'gbl_daterange_drsim': 'Date Range',
    'gbl_mdModified_dt': 'Metadata Modified',
    
    // Spatial fields
    'dct_spatial_sm': 'Spatial Coverage',
    'dcat_bbox': 'Bounding Box',
    'dcat_centroid': 'Centroid',
    'locn_geometry': 'Geometry',
    'gbl_georeferenced_b': 'Georeferenced',
    
    // Categories fields
    'gbl_resourceclass_sm': 'Resource Class',
    'gbl_resourcetype_sm': 'Resource Type',
    'dcat_theme_sm': 'Theme',
    'dct_subject_sm': 'Subject',
    'dcat_keyword_sm': 'Keywords',
    
    // Rights fields
    'dct_rights_s': 'Rights',
    'dct_rightsHolder_sm': 'Rights Holder',
    'dct_license_sm': 'License',
    'dct_accessrights_s': 'Access Rights',
    
    // Object fields
    'dct_format_s': 'Format',
    'gbl_fileSize_s': 'File Size',
    
    // Identifiers fields
    'id': 'ID',
    'dct_identifier_sm': 'Identifier',
    'gbl_wxsIdentifier_s': 'WxS Identifier',
    
    // Links fields
    'dct_references_s': 'References',
    
    // Relations fields
    'dct_relation_sm': 'Relation',
    'pcdm_memberof_sm': 'Member Of',
    'dct_ispartof_sm': 'Is Part Of',
    'dct_source_sm': 'Source',
    'dct_isversionof_sm': 'Is Version Of',
    'dct_replaces_sm': 'Replaces',
    'dct_isreplacedby_sm': 'Is Replaced By',
    
    // Admin fields
    'gbl_mdversion_s': 'Metadata Version',
    'gbl_suppressed_b': 'Suppressed',
    
    // Additional fields
    'dct_date_added_s': 'Date Added',
    'dct_date_modified_s': 'Date Modified',
    'dct_created_s': 'Date Created',
    'dct_valid_s': 'Valid Date',
    'dct_available_s': 'Available Date',
    'dct_audience_sm': 'Audience',
    'dct_contributor_sm': 'Contributor',
    'dct_coverage_sm': 'Coverage',
    'dct_educationLevel_sm': 'Education Level',
    'dct_extent_sm': 'Extent',
    'dct_instructionalMethod_sm': 'Instructional Method',
    'dct_medium_sm': 'Medium',
    'dct_provenance_sm': 'Provenance',
    'dct_type_sm': 'Type',
    'dcat_contactPoint_sm': 'Contact Point',
    'dcat_distributor_sm': 'Distributor',
    'dcat_landingPage_s': 'Landing Page',
    'dcat_themeCategory_sm': 'Theme Category',
    'gbl_dateRange_drsim': 'Date Range',
    'gbl_indexYear_im': 'Index Year',
    'gbl_resourceClass_sm': 'Resource Class',
    'gbl_resourceType_sm': 'Resource Type',
    'locn_geometry_original': 'Original Geometry',
    'dcat_bbox_original': 'Original Bounding Box',
    'dcat_centroid_original': 'Original Centroid',
  };

  // Group fields by their prefix/category
  const groupFields = () => {
    const entries = Object.entries(attributes).filter(
      ([key, value]) =>
        value !== null &&
        value !== undefined &&
        value !== '' &&
        !key.startsWith('ui_') &&
        !isFieldHidden(key) &&
        shouldDisplayField(key)
    );

    // Separate fields into:
    // Document Metadata, Metadata Facets, and Relationship Facets
    const documentMetadata = entries.filter(([key]) =>
      documentMetadataFields.includes(key)
    );
    const metadataFacets = entries.filter(([key]) =>
      metadataFacetsFields.includes(key)
    );
    const relationshipFacets = entries.filter(([key]) =>
      relationshipFields.includes(key)
    );
    return { documentMetadata, metadataFacets, relationshipFacets };
  };

  const renderValue = (
    key: string,
    value: string | string[] | null | undefined
  ) => {
    // Return empty string for null or undefined values
    if (value === null || value === undefined) {
      return '';
    }

    // Special formatting for specific fields
    if (key === 'dct_language_sm') {
      const languageMap: { [key: string]: string } = {
        'eng': 'English',
        'English': 'English',
        'spa': 'Spanish',
        'Spanish': 'Spanish',
        'fra': 'French',
        'French': 'French',
        'deu': 'German',
        'German': 'German',
        'ita': 'Italian',
        'Italian': 'Italian',
        'por': 'Portuguese',
        'Portuguese': 'Portuguese',
        'rus': 'Russian',
        'Russian': 'Russian',
        'jpn': 'Japanese',
        'Japanese': 'Japanese',
        'kor': 'Korean',
        'Korean': 'Korean',
        'zho': 'Chinese',
        'Chinese': 'Chinese',
        'ara': 'Arabic',
        'Arabic': 'Arabic',
      };
      if (Array.isArray(value)) {
        return value.map(v => languageMap[v] || v).join(', ');
      }
      return languageMap[value.toString()] || value.toString();
    }

    // Format boolean fields
    if ((key === 'gbl_georeferenced_b' || key === 'gbl_suppressed_b') && value !== null && value !== undefined) {
      return value.toString() === 'true' ? 'Yes' : 'No';
    }

        // Format date fields to be more readable
    if ((key === 'dct_date_added_s' || key === 'dct_date_modified_s' || key === 'dct_created_s' || 
         key === 'dct_valid_s' || key === 'dct_available_s' || key === 'gbl_mdModified_dt' || 
         key === 'dct_issued_s') && value) {
      try {
        const date = new Date(value.toString());
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      } catch (e) {
        // Fall back to original value if date parsing fails
      }
    }

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

  const renderRelationships = (relationships: any) => {
    // Check if relationships exists and has properties
    if (!relationships || Object.keys(relationships).length === 0) {
      return null;
    }
    
    return Object.entries(relationships).map(([relationshipType, items]) => {
      if (!Array.isArray(items) || items.length === 0) return null;
      
      // Get the total count of items
      const totalCount = items.length;
      
      // Only display the first 5 items
      const displayItems = items.slice(0, 5);
      
      // Determine if we need to show the "Browse all" link
      const showBrowseAll = totalCount > 5;
      
      // Map relationship type to its corresponding facet field if it exists
      // This would depend on how your search system handles relationship facets
      // For example: memberOf -> member_of_agg, source -> source_agg, etc.
      const relationshipFacetField = `${relationshipType}_agg`;
      
      // Get the ID of the current item to use as a filter
      // Ensure it's a string value for encodeURIComponent
      const currentItemId = String(attributes.id || '');
      
      return (
        <div key={relationshipType} className="mb-4">
          <h5 className="text-sm font-medium text-gray-500">
            {relationshipLabels[relationshipType] || humanizeFieldName(relationshipType)}
          </h5>
          <ul className="list-none">
            {/* Display the first 5 items */}
            {displayItems.map((doc: { item_id: string; item_title: string; link: string }) => (
              <li key={doc.item_id} className="text-sm text-gray-900">
                <Link
                  to={`/resources/${doc.item_id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {doc.item_title}
                </Link>
              </li>
            ))}
            
            {/* Show "Browse all" link if there are more than 5 items */}
            {showBrowseAll && (
              <li className="text-sm text-gray-900 mt-2 pt-2 border-t border-gray-200">
                <Link
                  to={`/search?fq[${relationshipFacetField}][]=${encodeURIComponent(currentItemId)}`}
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  {relationshipLabels.browse_all
                    ? relationshipLabels.browse_all.replace('%{count}', totalCount.toString())
                    : `Browse all ${totalCount} records...`}
                </Link>
              </li>
            )}
          </ul>
        </div>
      );
    }).filter(Boolean);
  };

  const { documentMetadata, metadataFacets, relationshipFacets } = groupFields();

  return (
    <div
      id="full-details"
      className="bg-white rounded-lg shadow-md overflow-hidden"
    >
      <h2 className="text-lg font-semibold text-gray-900 px-6 py-4">
        Full Details
      </h2>
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-2/3">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-200">
              {documentMetadata.map(([key, value]) => (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="px-6 py-4 w-1/3">
                    <div className="text-sm font-medium text-gray-500">
                      {customFieldLabels[key] || humanizeFieldName(key)}
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
        <div className="w-full sm:w-1/3">
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

            {renderRelationships(uiRelationships)}
          </div>
        </div>
      </div>
    </div>
  );
}
