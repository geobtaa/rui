import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowLeftCircle, XCircle } from 'lucide-react';
import { fetchSearchResults, fetchItemDetails, ApiError } from '../services/api';
import { ErrorMessage } from '../components/ErrorMessage';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { MetadataTable } from '../components/item/MetadataTable';
import { useApi } from '../context/ApiContext';
import { ItemViewer } from '../components/item/ItemViewer';
import { ItemBreadcrumbs } from '../components/item/ItemBreadcrumbs';
import { ItemSubtitle } from '../components/item/ItemSubtitle';
import { CitationTable } from '../components/item/CitationTable';
import { FullDetailsTable } from '../components/item/FullDetailsTable';

interface SearchState {
  searchResults: Array<{ id: string }>;
  currentIndex: number;
  totalResults: number;
  searchUrl: string;
  currentPage: number;
}

// First, let's define an interface for our item data
interface ItemData {
  data: {
    attributes: {
      ui_viewer_protocol?: string;
      ui_viewer_endpoint?: string;
      ui_viewer_geometry?: string;
      gbl_wxsidentifier_s?: string;
      dct_accessrights_s?: string;
      id?: string;
      dct_title_s: string;
      attributes?: {
        ui_citation?: string;
      };
    };
  };
}

// New component for index map
function IndexMap() {
  return (
    <div className="viewer-information"></div>
  );
}

// New component for the attribute table
function AttributeTable() {
  return (
    <div id="table-container" className="w-full">
      <table id="attribute-table" className="w-full table-auto border-collapse">
        <thead className="bg-gray-50">
          <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Attribute
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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

export function ItemView() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const searchState = location.state as SearchState;
  // Replace any with ItemData
  const [data, setData] = useState<ItemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setLastApiUrl } = useApi();

  // Calculate pagination state
  const isLastInCurrentSet = searchState?.currentIndex === searchState?.searchResults.length - 1;
  const isFirstInCurrentSet = searchState?.currentIndex === 0;
  const hasMoreResults = searchState?.currentIndex < searchState?.totalResults - 1;
  const hasPreviousResults = searchState?.currentIndex > 0;

  // Get prev/next IDs from current result set
  const prevId = !isFirstInCurrentSet ? searchState?.searchResults[searchState?.currentIndex - 1]?.id : null;
  const nextId = !isLastInCurrentSet ? searchState?.searchResults[searchState?.currentIndex + 1]?.id : null;

  // Function to fetch next page of results
  const fetchNextPage = async () => {
    if (!searchState) return null;
    const nextPage = searchState.currentPage + 1;
    const results = await fetchSearchResults(
      new URLSearchParams(searchState.searchUrl).get('q') || '',
      nextPage,
      10,
      [], // You'll need to pass the current facets here
      setLastApiUrl
    );
    return results.response.docs;
  };

  // Function to fetch previous page of results
  const fetchPrevPage = async () => {
    if (!searchState) return null;
    const prevPage = searchState.currentPage - 1;
    const results = await fetchSearchResults(
      new URLSearchParams(searchState.searchUrl).get('q') || '',
      prevPage,
      10,
      [], // You'll need to pass the current facets here
      setLastApiUrl
    );
    return results.response.docs;
  };

  // Handle next result click
  const handleNextClick = async () => {
    if (!searchState) return;

    if (isLastInCurrentSet && hasMoreResults) {
      // Need to fetch next page
      const nextResults = await fetchNextPage();
      if (nextResults && nextResults.length > 0) {
        navigate(`/items/${nextResults[0].id}`, {
          state: {
            ...searchState,
            searchResults: nextResults,
            currentIndex: searchState.currentIndex + 1,
            currentPage: searchState.currentPage + 1
          }
        });
      }
    } else if (!isLastInCurrentSet && nextId) {
      // Just move to next item in current results
      navigate(`/items/${nextId}`, {
        state: {
          ...searchState,
          currentIndex: searchState.currentIndex + 1
        }
      });
    }
  };

  // Handle previous result click
  const handlePrevClick = async () => {
    if (!searchState) return;

    if (isFirstInCurrentSet && hasPreviousResults) {
      // Need to fetch previous page
      const prevResults = await fetchPrevPage();
      if (prevResults && prevResults.length > 0) {
        navigate(`/items/${prevResults[prevResults.length - 1].id}`, {
          state: {
            ...searchState,
            searchResults: prevResults,
            currentIndex: searchState.currentIndex - 1,
            currentPage: searchState.currentPage - 1
          }
        });
      }
    } else if (!isFirstInCurrentSet && prevId) {
      // Just move to previous item in current results
      navigate(`/items/${prevId}`, {
        state: {
          ...searchState,
          currentIndex: searchState.currentIndex - 1
        }
      });
    }
  };

  useEffect(() => {
    const loadItem = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const jsonData = await fetchItemDetails(id, (url) => setLastApiUrl(url));
        setData(jsonData);
      } catch (err) {
        const message = err instanceof ApiError 
          ? err.message 
          : 'An unexpected error occurred while fetching item details';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadItem();
  }, [id, setLastApiUrl]);

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50 pt-4 pb-8 mb-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {data?.data?.attributes && (
            <>
              {/* Navigation bar with breadcrumbs and pagination */}
              <div className="flex justify-between items-center mb-2">
                <ItemBreadcrumbs item={data.data.attributes} />
                
                <div className="flex items-center gap-4">
                  <Link
                    to={searchState?.searchUrl || '/'}
                    className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Back to Search Results"
                  >
                    <ArrowLeftCircle size={20} />
                  </Link>

                  {hasPreviousResults && (
                    <button
                      onClick={handlePrevClick}
                      className="flex items-center gap-1 text-gray-500 hover:text-blue-600"
                      title="Previous"
                    >
                      <ArrowLeft size={20} />
                      Previous
                    </button>
                  )}

                  {searchState && (
                    <span className="text-gray-500 px-2">
                      {searchState?.currentIndex + 1} of {searchState?.totalResults}
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
                    className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ml-2"
                    title="Clear Search"
                  >
                    <XCircle size={20} />
                  </Link>
                </div>
              </div>

              {/* Title section */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                  {data.data.attributes.dct_title_s}
                </h1>
                <ItemSubtitle item={data.data.attributes} />
              </div>

              {/* Rest of the content */}
              <div className="grid grid-cols-12 gap-8">
                {/* Viewer - spans first two columns */}
                <div className="col-span-8 space-y-6">
                  {viewerProtocol && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="">
                        <ItemViewer 
                          protocol={viewerProtocol} 
                          endpoint={viewerEndpoint} 
                          geometry={data?.data?.attributes?.ui_viewer_geometry}
                          wxs_identifier={data?.data?.attributes?.gbl_wxsidentifier_s}
                          available={data?.data?.attributes?.dct_accessrights_s === 'Public'}
                          layerId={data?.data?.attributes?.id}
                          pageValue="SHOW"
                        />
                      </div>
                    </div>
                  )}

                  {/* Conditionally render the attribute table if the protocol is 'wms' or 'arcgis_feature_layer' */}
                  {(viewerProtocol === 'wms' || viewerProtocol === 'arcgis_feature_layer') && <AttributeTable />}
                  {viewerProtocol === 'open_index_map' && <IndexMap />}

                  {/* Add Full Details table */}
                  <FullDetailsTable data={data} />
                </div>

                {/* Metadata */}
                <div className="col-span-4">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <MetadataTable data={data} />
                  </div>
                  
                  {/* Update to use the correct nested path */}
                  {data?.data?.attributes?.attributes?.ui_citation && (
                    <div className="mt-6">
                      <CitationTable 
                        citation={data.data.attributes.attributes.ui_citation}
                        permalink={window.location.href}
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer id={id} />
    </div>
  );
}