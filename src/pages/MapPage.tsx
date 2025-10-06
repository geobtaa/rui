import { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { SearchField } from '../components/SearchField';
import { useApi } from '../context/ApiContext';
import { useGeoFacets } from '../hooks/useGeoFacets';
import { MapUpdater } from '../components/map/MapUpdater';
import { MapCard } from '../components/map/MapCard';
import { Legend } from '../components/map/Legend';
import { ZoomLevelControls } from '../components/map/ZoomLevelControls';
import { SelectedFeaturePanel } from '../components/map/SelectedFeaturePanel';
import { StatsBar } from '../components/map/StatsBar';
import { DEFAULT_US_CENTER, DEFAULT_US_ZOOM } from '../config/mapView';
import type { ZoomLevel } from '../types/map';

// Fix for default markers in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});



export function MapPage() {
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('region');
  const { setLastApiUrl } = useApi();
  const { data, loading, error } = useGeoFacets(searchQuery, setLastApiUrl);


  const handleFeatureClick = (feature: any) => {
    setSelectedFeature(feature);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedFeature(null);
  };

  const handleZoomLevelChange = (level: ZoomLevel) => {
    setZoomLevel(level);
    setSelectedFeature(null);
  };

  const getCurrentData = () => {
    return data[zoomLevel] || [];
  };

  const getTotalResources = () => {
    return data[zoomLevel].reduce((sum, item) => sum + item.attributes.hits, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map data...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Geographic Resource Distribution
          </h1>
          <p className="text-gray-600">
            Explore the distribution of geospatial resources across different geographic levels.
          </p>
        </div>

        <ZoomLevelControls zoomLevel={zoomLevel} onChange={handleZoomLevelChange} />

        {/* All Three Maps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <MapCard title="Country Level" subtitle={`Features: ${data.country.length}`}>
            <MapContainer
              center={DEFAULT_US_CENTER}
              zoom={DEFAULT_US_ZOOM}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater 
                data={data} 
                zoomLevel="country"
                onFeatureClick={handleFeatureClick}
                searchQuery={searchQuery}
              />
            </MapContainer>
          </MapCard>

          <MapCard title="Region (State) Level" subtitle={`Features: ${data.region.length}`}>
            <MapContainer
              center={DEFAULT_US_CENTER}
              zoom={DEFAULT_US_ZOOM}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater 
                data={data} 
                zoomLevel="region"
                onFeatureClick={handleFeatureClick}
                searchQuery={searchQuery}
              />
            </MapContainer>
          </MapCard>

          <MapCard title="County Level" subtitle={`Features: ${data.county.length}`}>
            <MapContainer
              center={DEFAULT_US_CENTER}
              zoom={DEFAULT_US_ZOOM}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater 
                data={data} 
                zoomLevel="county"
                onFeatureClick={handleFeatureClick}
                searchQuery={searchQuery}
              />
            </MapContainer>
          </MapCard>
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Regional Resource Distribution
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Search for resources and see their geographic distribution
            </p>
            
            <div className="max-w-md">
              <SearchField
                placeholder="Search for maps, data, imagery..."
                onSearch={handleSearch}
              />
            </div>
          </div>

          <StatsBar
            zoomLevel={zoomLevel}
            dataForLevel={getCurrentData()}
            totalResources={getTotalResources()}
            query={searchQuery}
          />
        </div>

        <Legend />

        {selectedFeature && (
          <SelectedFeaturePanel
            name={selectedFeature.properties?.name}
            hits={selectedFeature.properties?.hits}
            level={zoomLevel}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}
