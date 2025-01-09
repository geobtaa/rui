import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoDocument } from '../../types/api';

interface MapViewProps {
  results: GeoDocument[];
}

export function MapView({ results }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainer.current).setView([39.8283, -98.5795], 3);
      
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

    // Add GeoJSON features for each result
    const features = results
      .filter(result => result.ui_viewer_geometry)
      .map(result => ({
        type: 'Feature',
        geometry: JSON.parse(result.ui_viewer_geometry),
        properties: {
          id: result.id,
          title: result.dct_title_s
        }
      }));

    if (features.length > 0) {
      const geoJsonLayer = L.geoJSON({
        type: 'FeatureCollection',
        features: features
      }, {
        style: {
          color: '#2563eb',
          weight: 2,
          opacity: 0.6,
          fillOpacity: 0.1
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(feature.properties.title);
        }
      }).addTo(mapRef.current);

      // Fit bounds to show all features
      mapRef.current.fitBounds(geoJsonLayer.getBounds());
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [results]);

  return (
    <div 
      ref={mapContainer} 
      className="h-[calc(100vh-12rem)] w-full rounded-lg shadow-md"
    />
  );
} 