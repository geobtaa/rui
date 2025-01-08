import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { fetchItemDetails, ApiError } from '../services/api';
import { ErrorMessage } from '../components/ErrorMessage';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { MetadataTable } from '../components/item/MetadataTable';
import { useApi } from '../context/ApiContext';
import { ItemViewer } from '../components/item/ItemViewer';

interface SearchState {
  searchResults: Array<{ id: string }>;
  currentIndex: number;
  searchUrl: string;
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
  const searchState = location.state as SearchState;
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setLastApiUrl } = useApi();

  // Get prev/next IDs if we have search results
  const prevId = searchState?.searchResults[searchState.currentIndex - 1]?.id;
  const nextId = searchState?.searchResults[searchState.currentIndex + 1]?.id;

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <Link
              to={searchState?.searchUrl || '/'}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft size={20} />
              Back to Search Results
            </Link>

            {/* Pagination Controls */}
            {searchState && (
              <div className="flex items-center gap-4">
                {prevId ? (
                  <Link
                    to={`/items/${prevId}`}
                    state={{
                      ...searchState,
                      currentIndex: searchState.currentIndex - 1
                    }}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <ArrowLeft size={20} />
                    Previous Result
                  </Link>
                ) : null}

                <span className="text-gray-500">
                  {searchState.currentIndex + 1} of {searchState.searchResults.length}
                </span>

                {nextId ? (
                  <Link
                    to={`/items/${nextId}`}
                    state={{
                      ...searchState,
                      currentIndex: searchState.currentIndex + 1
                    }}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    Next Result
                    <ArrowRight size={20} />
                  </Link>
                ) : null}
              </div>
            )}

            <a
              href={`https://geo.btaa.org/catalog/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              View in BTAA Geoportal
              <ExternalLink size={16} />
            </a>
          </div>
          <div className="flex flex-col gap-4">
            {viewerProtocol && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
            )}

            {/* Conditionally render the attribute table if the protocol is 'wms' or 'arcgis_feature_layer' */}
            {(viewerProtocol === 'wms' || viewerProtocol === 'arcgis_feature_layer') && <AttributeTable />}
            {viewerProtocol === 'open_index_map' && <IndexMap />}
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h1 className="text-xl font-semibold text-gray-900">
                {data?.data?.attributes?.dct_title_s}
              </h1>
            </div>
            <MetadataTable data={data} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}