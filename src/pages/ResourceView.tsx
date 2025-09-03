import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowLeftCircle, XCircle } from 'lucide-react';
import {
  fetchSearchResults,
  fetchItemDetails,
  ApiError,
} from '../services/api';
import { ErrorMessage } from '../components/ErrorMessage';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useApi } from '../context/ApiContext';
import { ResourceViewer } from '../components/resource/ResourceViewer';
import { ResourceBreadcrumbs } from '../components/resource/ResourceBreadcrumbs';
import { ResourceSubtitle } from '../components/resource/ResourceSubtitle';
import { CitationTable } from '../components/resource/CitationTable';
import { FullDetailsTable } from '../components/resource/FullDetailsTable';
import { LocationMap } from '../components/resource/LocationMap';
import { DownloadsTable } from '../components/resource/DownloadsTable';
import { GeoDocumentDetails } from '../types/api';

// Define types for search results
interface SearchResult {
  id: string;
  // Add other properties as needed
}

interface SearchState {
  searchResults: SearchResult[];
  currentIndex: number;
  totalResults: number;
  searchUrl: string;
  currentPage: number;
  absoluteIndex?: number;
}

interface FacetFilter {
  field: string;
  value: string;
}

// Define the ItemData type
interface ItemData {
  data: {
    id: string;
    type: string;
    attributes: {
      id: string;
      dct_title_s: string;
      dct_description_sm?: string[];
      locn_geometry?: string;
      ui_thumbnail_url?: string;
      ui_viewer_protocol?: string;
      ui_viewer_endpoint?: string;
      gbl_wxsidentifier_s?: string;
      dct_accessrights_s?: string;
      ui_viewer_geometry?: any;
      ui_downloads?: any[];
      ui_citation?: string;
      [key: string]: any;  // Allow other properties
    };
  };
}

// New component for index map
function IndexMap() {
  return <div className="viewer-information"></div>;
}

// New component for the attribute table
function AttributeTable() {
  return (
    <div id="table-container" className="w-full">
      <table id="attribute-table" className="w-full table-auto border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Attribute
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Value
            </th>
          </tr>
        </thead>
        <tbody className="attribute-table-body bg-white divide-y divide-gray-200">
          <tr className="hover:bg-gray-50">
            <td className="border px-4 py-2" colSpan={2}>
              <em>Click on map to inspect values</em>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function ResourceView() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const searchState = location.state as SearchState;
  const [data, setData] = useState<ItemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setLastApiUrl } = useApi();

  // Calculate pagination state
  const isLastInCurrentSet =
    searchState?.currentIndex === searchState?.searchResults.length - 1;
  const isFirstInCurrentSet = searchState?.currentIndex === 0;
  
  // Update these calculations to use absoluteIndex when available
  const absoluteCurrentIndex = searchState?.absoluteIndex !== undefined
    ? searchState.absoluteIndex
    : searchState
      ? (searchState.currentPage - 1) * 10 + searchState.currentIndex
      : 0;
  
  // Fix the hasMoreResults and hasPreviousResults calculations
  const hasMoreResults = searchState 
    ? absoluteCurrentIndex < searchState.totalResults - 1
    : false;
  
  const hasPreviousResults = absoluteCurrentIndex > 0;

  // Get prev/next IDs from current result set
  const prevId = !isFirstInCurrentSet
    ? searchState?.searchResults[searchState?.currentIndex - 1]?.id
    : null;
  const nextId = !isLastInCurrentSet
    ? searchState?.searchResults[searchState?.currentIndex + 1]?.id
    : null;

  // Function to fetch next page of results
  const fetchNextPage = async () => {
    if (!searchState) return null;
    const nextPage = searchState.currentPage + 1;
    
    try {
      // Extract search parameters from the URL
      const urlParams = new URLSearchParams(searchState.searchUrl.split('?')[1] || '');
      const query = urlParams.get('q') || '';
      
      // Extract facets from the URL if they exist
      const facets: FacetFilter[] = [];
      for (const [key, value] of urlParams.entries()) {
        if (key.startsWith('fq[') && key.endsWith('][]')) {
          const field = key.slice(3, -3); // Extract field name from fq[field][]
          facets.push({ field, value });
        }
      }
      
      // Get current sort value if it exists
      const sort = urlParams.get('sort') || undefined;
      
      const results = await fetchSearchResults(
        query,
        nextPage,
        10,
        facets,
        setLastApiUrl,
        sort
      );
      
      return results.response.docs;
    } catch (error) {
      console.error('Error fetching next page:', error);
      return null;
    }
  };

  // Function to fetch previous page of results
  const fetchPrevPage = async () => {
    if (!searchState) return null;
    const prevPage = searchState.currentPage - 1;
    
    try {
      // Extract search parameters from the URL
      const urlParams = new URLSearchParams(searchState.searchUrl.split('?')[1] || '');
      const query = urlParams.get('q') || '';
      
      // Extract facets from the URL if they exist
      const facets: FacetFilter[] = [];
      for (const [key, value] of urlParams.entries()) {
        if (key.startsWith('fq[') && key.endsWith('][]')) {
          const field = key.slice(3, -3); // Extract field name from fq[field][]
          facets.push({ field, value });
        }
      }
      
      // Get current sort value if it exists
      const sort = urlParams.get('sort') || undefined;
      
      const results = await fetchSearchResults(
        query,
        prevPage,
        10,
        facets,
        setLastApiUrl,
        sort
      );
      
      return results.response.docs;
    } catch (error) {
      console.error('Error fetching previous page:', error);
      return null;
    }
  };

  // Handle next result click
  const handleNextClick = async () => {
    if (!searchState) return;

    if (isLastInCurrentSet && hasMoreResults) {
      // Need to fetch next page
      try {
        const nextResults = await fetchNextPage();
        if (nextResults && nextResults.length > 0) {
          // The new relative index in the next page should be 0 (first item)
          navigate(`/resources/${nextResults[0].id}`, {
            state: {
              ...searchState,
              searchResults: nextResults,
              currentIndex: 0, // Start at the beginning of the new page
              currentPage: searchState.currentPage + 1,
              // Update absolute index to be one more than current
              absoluteIndex: absoluteCurrentIndex + 1,
            },
          });
        }
      } catch (error) {
        console.error('Error navigating to next page:', error);
      }
    } else if (!isLastInCurrentSet && nextId) {
      // Just move to next item in current results
              navigate(`/resources/${nextId}`, {
        state: {
          ...searchState,
          currentIndex: searchState.currentIndex + 1,
          // Update absolute index to be one more than current
          absoluteIndex: absoluteCurrentIndex + 1,
        },
      });
    }
  };

  // Handle previous result click
  const handlePrevClick = async () => {
    if (!searchState) return;

    if (isFirstInCurrentSet && hasPreviousResults) {
      // Need to fetch previous page
      try {
        const prevResults = await fetchPrevPage();
        if (prevResults && prevResults.length > 0) {
          // The new relative index in the previous page should be the last item
          navigate(`/resources/${prevResults[prevResults.length - 1].id}`, {
            state: {
              ...searchState,
              searchResults: prevResults,
              currentIndex: prevResults.length - 1, // Point to the last item on the previous page
              currentPage: searchState.currentPage - 1,
              // Update absolute index to be one less than current
              absoluteIndex: absoluteCurrentIndex - 1,
            },
          });
        }
      } catch (error) {
        console.error('Error navigating to previous page:', error);
      }
    } else if (!isFirstInCurrentSet && prevId) {
      // Just move to previous item in current results
              navigate(`/resources/${prevId}`, {
        state: {
          ...searchState,
          currentIndex: searchState.currentIndex - 1,
          // Update absolute index to be one less than current
          absoluteIndex: absoluteCurrentIndex - 1,
        },
      });
    }
  };

  // Update display to use the absoluteCurrentIndex directly
  const displayIndex = absoluteCurrentIndex + 1;

  useEffect(() => {
    let isMounted = true;
    
    const loadItem = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);
      try {
        // Use a local function to avoid dependency on setLastApiUrl
        const jsonData = await fetchItemDetails(id, (url) => {
          if (isMounted) {
            setLastApiUrl(url);
          }
        });
        
        if (isMounted) {
          // Cast the response to ItemData type
          setData(jsonData as unknown as ItemData);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof ApiError
              ? err.message
              : 'An unexpected error occurred while fetching item details';
          setError(message);
          setIsLoading(false);
        }
      }
    };

    loadItem();
    
    return () => {
      isMounted = false;
    };
  }, [id]); // Remove setLastApiUrl from dependencies

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const viewerProtocol = data?.data?.attributes?.ui_viewer_protocol;
  const viewerEndpoint = data?.data?.attributes?.ui_viewer_endpoint;
  const wxsIdentifier = data?.data?.attributes?.gbl_wxsidentifier_s;
  const accessRights = data?.data?.attributes?.dct_accessrights_s;
  const layerId = data?.data?.attributes?.id;
  const geometry = data?.data?.attributes?.ui_viewer_geometry;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50 pt-4 pb-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {data?.data?.attributes && (
            <>
              {/* Navigation bar - Stack elements on mobile */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-2">
                <div className="lg:col-span-8 text-sm">
                  <ResourceBreadcrumbs item={data.data.attributes} />
                </div>

                <div className="lg:col-span-4 flex flex-wrap items-center gap-2 lg:gap-4 justify-between text-sm">
                  <Link
                    to={searchState?.searchUrl || '/'}
                    className="flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors px-2 py-1"
                    title="Back to Search Results"
                  >
                    <ArrowLeftCircle size={20} />
                    <span className="ml-1">Back</span>
                  </Link>

                  {hasPreviousResults && (
                    <button
                      onClick={handlePrevClick}
                      className="flex items-center gap-1 text-gray-500 hover:text-blue-600"
                      title="Previous"
                    >
                      <ArrowLeft size={20} />
                      Prev
                    </button>
                  )}

                  {searchState && (
                    <span className="text-gray-500 px-2">
                      {displayIndex} of {searchState.totalResults}
                    </span>
                  )}

                  {hasMoreResults && (
                    <button
                      onClick={handleNextClick}
                      className="flex items-center gap-1 text-gray-500 hover:text-blue-600"
                      title="Next"
                    >
                      Next
                      <ArrowRight size={20} />
                    </button>
                  )}

                  <Link
                    to="/"
                    className="flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ml-2 px-2 py-1"
                    title="Clear Search"
                  >
                    <span className="mr-1">Clear</span>
                    <XCircle size={20} />
                  </Link>
                </div>
              </div>

              {/* Main content - Stack on mobile */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Title section */}
                <div className="lg:col-span-8">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {data.data.attributes.dct_title_s}
                  </h1>
                  <ResourceSubtitle item={data.data.attributes} />
                </div>

                {/* Viewer section */}
                <div className="lg:col-span-8 space-y-6">
                  {viewerProtocol && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="">
                        <ResourceViewer
                          protocol={viewerProtocol || ''}
                          endpoint={viewerEndpoint || ''}
                          geometry={geometry}
                          wxs_identifier={wxsIdentifier || ''}
                          available={accessRights === 'Public'}
                          layerId={layerId || ''}
                          data={data.data}
                          pageValue="SHOW"
                        />
                      </div>
                    </div>
                  )}

                  {/* Conditionally render the attribute table if the protocol is 'wms' or 'arcgis_feature_layer' */}
                  {(viewerProtocol === 'wms' ||
                    viewerProtocol === 'arcgis_feature_layer') && (
                    <AttributeTable />
                  )}
                  {viewerProtocol === 'open_index_map' && <IndexMap />}

                  {/* Add Full Details table */}
                  <FullDetailsTable data={data} />
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4">
                  <div className="lg:sticky lg:top-[88px] space-y-6">
                    {/* Location Map - using locn_geometry if ui_viewer_geometry is null */}
                    {(data.data.attributes.ui_viewer_geometry ||
                      data.data.attributes.locn_geometry) && (
                      <LocationMap
                        geometry={
                          data.data.attributes.ui_viewer_geometry ||
                          data.data.attributes.locn_geometry
                        }
                      />
                    )}

                    {/* Downloads section */}
                    {data.data.attributes.ui_downloads && (
                      <DownloadsTable
                        downloads={data.data.attributes.ui_downloads}
                      />
                    )}

                    {/* Citation - fixed path to ui_citation */}
                    {data.data.attributes.ui_citation && (
                      <div className="mt-6">
                        <CitationTable
                          citation={data.data.attributes.ui_citation}
                          permalink={window.location.href}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
