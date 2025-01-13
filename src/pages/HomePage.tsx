import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { SearchField } from '../components/SearchField';
import { Database, Map, Globe, Library, Image, Folder, Globe2, Search } from 'lucide-react';
import { fetchSearchResults } from '../services/api';

interface ResourceClass {
  id: string;
  label: string;
  count: number;
  icon: React.ReactNode;
  aggValue: string;
}

export function HomePage() {
  const navigate = useNavigate();
  const [resourceCounts, setResourceCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const results = await fetchSearchResults('', 1, 0);
        const facetCounts = results.facets?.['resource_class_agg']?.items.reduce((acc, item) => {
          acc[item.value as string] = item.hits;
          return acc;
        }, {} as Record<string, number>) || {};
        setResourceCounts(facetCounts);
      } catch (error) {
        console.error('Error fetching resource counts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const resourceClasses: ResourceClass[] = [
    { 
      id: 'Dataset', 
      label: 'Datasets', 
      count: resourceCounts['Datasets'] || 0,
      icon: <Database className="w-6 h-6" />, 
      aggValue: 'Datasets' 
    },
    { 
      id: 'Map', 
      label: 'Maps', 
      count: resourceCounts['Maps'] || 0,
      icon: <Map className="w-6 h-6" />, 
      aggValue: 'Maps' 
    },
    { id: 'Web service', label: 'Web Services', count: 5, icon: <Globe className="w-6 h-6" />, aggValue: 'Web services' },
    { id: 'Collection', label: 'Collections', count: 2, icon: <Library className="w-6 h-6" />, aggValue: 'Collections' },
    { id: 'Imagery', label: 'Imagery', count: 2, icon: <Image className="w-6 h-6" />, aggValue: 'Imagery' },
    { id: 'Other', label: 'Other', count: 2, icon: <Folder className="w-6 h-6" />, aggValue: 'Other' },
    { id: 'Website', label: 'Websites', count: 1, icon: <Globe2 className="w-6 h-6" />, aggValue: 'Websites' },
  ];

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleResourceClassClick = (aggValue: string) => {
    navigate(`/search?fq[resource_class_agg][]=${encodeURIComponent(aggValue)}`);
  };

  const handleBrowseAll = () => {
    navigate('/search?q=');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50 grid grid-cols-12">
        <div className="col-span-8 px-12 py-12 flex flex-col justify-center">
          <div className="space-y-8 max-w-3xl">
            <h1 className="text-4xl font-bold text-gray-900">
              BTAA Geoportal
            </h1>
            
            <p className="text-xl text-gray-600">
              Search geospatial resources from Big Ten Academic Alliance institutions
            </p>

            <div>
              <SearchField 
                onSearch={handleSearch}
                placeholder="Search for maps, data, imagery..."
                autoFocus
              />
            </div>

            <div className="text-sm text-gray-500">
              <p>
                Browse and download GIS data, maps, and other geospatial resources from Big Ten universities and other partners.
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-4 bg-gray-100 px-12 py-12 flex flex-col justify-center border-l border-gray-200">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Browse by Resource Class
            </h2>
            <div className="space-y-3">
              <button
                onClick={handleBrowseAll}
                className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-gray-400 group-hover:text-blue-500">
                    <Search className="w-6 h-6" />
                  </div>
                  <span className="text-gray-700 group-hover:text-gray-900">
                    Browse All Resources
                  </span>
                </div>
              </button>

              {resourceClasses.map((resource) => (
                <button
                  key={resource.id}
                  onClick={() => handleResourceClassClick(resource.aggValue)}
                  className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400 group-hover:text-blue-500">
                      {resource.icon}
                    </div>
                    <span className="text-gray-700 group-hover:text-gray-900">
                      {resource.label}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 group-hover:text-gray-700">
                    {resource.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 