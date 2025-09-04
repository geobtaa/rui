import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { normalizeGeometry } from '../../utils/geometryUtils';

interface LocationMapProps {
  geometry: string | GeoJSON.Polygon | { wkt: string } | null; // Accept any format, we'll normalize it
}

export const LocationMap: React.FC<LocationMapProps> = ({ geometry }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current || !geometry) return;

    // Normalize the geometry to GeoJSON format
    const normalizedGeometry = normalizeGeometry(geometry);
    if (!normalizedGeometry) {
      console.warn('Could not normalize geometry:', geometry);
      return;
    }

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainer.current).setView([0, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }

    // Clear existing layers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.GeoJSON) {
        mapRef.current?.removeLayer(layer);
      }
    });

    try {
      // Create a feature from the normalized geometry
      const feature = {
        type: 'Feature' as const,
        geometry: normalizedGeometry,
        properties: {},
      };

      // Add the GeoJSON layer
      const geoJsonLayer = L.geoJSON(feature, {
        style: {
          color: '#2563eb',
          weight: 2,
          opacity: 0.6,
          fillOpacity: 0.1,
        },
      }).addTo(mapRef.current);

      // Fit bounds to show the feature
      mapRef.current.fitBounds(geoJsonLayer.getBounds(), {
        padding: [20, 20],
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
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Location</h2>
      </div>
      <div ref={mapContainer} className="h-[300px] w-full" />
    </div>
  );
};
