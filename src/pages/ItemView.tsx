import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { fetchItemDetails, ApiError } from '../services/api';
import { ErrorMessage } from '../components/ErrorMessage';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { MetadataTable } from '../components/item/MetadataTable';
import { useApi } from '../context/ApiContext';
import { ItemViewer } from '../components/item/ItemViewer';

export function ItemView() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setLastApiUrl } = useApi();

  // Get the previous search state from the location state
  const searchState = location.state?.searchState || '';

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
              to={`/${searchState}`} 
              className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600"
            >
              <ArrowLeft size={20} />
              Back to Search
            </Link>
            
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
            {viewerProtocol && viewerEndpoint && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <ItemViewer 
                  protocol={viewerProtocol} 
                  endpoint={viewerEndpoint} 
                />
              </div>
            )}
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