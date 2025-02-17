import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationMapProps {
  geometry: GeoJSON.Polygon | null;
}

export const LocationMap: React.FC<LocationMapProps> = ({ geometry }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current || !geometry) return;

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainer.current).setView([0, 0], 2);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    // Clear existing layers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.GeoJSON) {
        mapRef.current?.removeLayer(layer);
      }
    });

    try {
      // Create a feature from the geometry
      const feature = {
        type: 'Feature',
        geometry: geometry,
        properties: {}
      };

      // Add the GeoJSON layer
      const geoJsonLayer = L.geoJSON(feature, {
        style: {
          color: '#2563eb',
          weight: 2,
          opacity: 0.6,
          fillOpacity: 0.1
        }
      }).addTo(mapRef.current);

      // Fit bounds to show the feature
      mapRef.current.fitBounds(geoJsonLayer.getBounds(), {
        padding: [20, 20]
      });
    } catch (error) {
      console.error('Error rendering geometry:', error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [geometry]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <h2 className="text-lg font-semibold text-gray-900 px-6 py-4">
        Location
      </h2>
      <div 
        ref={mapContainer} 
        className="h-[300px] w-full"
      />
    </div>
  );
};

// Error boundary component that shows geometry data on error
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; geometry: GeoJSON.FeatureCollection },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Error rendering GeoJSON:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute bottom-0 left-0 right-0 bg-red-50 p-2 text-xs font-mono overflow-auto max-h-32">
          Failed to render geometry:
          <pre>{JSON.stringify(this.props.geometry, null, 2)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
} 