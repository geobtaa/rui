import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoDocument } from '../../types/api';
import { useMap } from '../../context/MapContext';

interface MapViewProps {
  results: GeoDocument[];
}

export function MapView({ results }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const highlightLayerRef = useRef<L.GeoJSON | null>(null);
  const { hoveredGeometry } = useMap();

  useEffect(() => {
    const startTime = performance.now();
    console.log(
      '🗺️ MapView useEffect triggered with',
      results?.length || 0,
      'results'
    );

    if (!mapContainer.current) {
      console.log('⏭️ No map container, skipping');
      return;
    }

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      console.log('🏗️ Initializing new map...');
      mapRef.current = L.map(mapContainer.current).setView(
        [39.8283, -98.5795],
        3
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);
      console.log('✅ Map initialized');
    }

    // Always render if we have results
    if (results && results.length > 0) {
      console.log('🎯 Rendering map with', results.length, 'results');

      // Clear existing layers
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.GeoJSON) {
          mapRef.current?.removeLayer(layer);
        }
      });

      // Add GeoJSON features for each result
      const features = results
        .filter((result) => result.meta?.ui?.viewer?.geometry)
        .map((result) => ({
          type: 'Feature' as const,
          geometry: result.meta!.ui!.viewer!.geometry,
          properties: {
            id: result.id,
            title: result.attributes.dct_title_s,
          },
        }));

      if (features.length > 0) {
        console.log('📍 Adding', features.length, 'features to map...');
        const geoJsonLayer = L.geoJSON(
          {
            type: 'FeatureCollection' as const,
            features: features,
          } as L.GeoJSON.FeatureCollection, // Proper Leaflet GeoJSON typing
          {
            style: {
              color: '#2563eb',
              weight: 2,
              opacity: 0.6,
              fillOpacity: 0.1,
            },
            onEachFeature: (feature, layer) => {
              layer.bindPopup(feature.properties.title);
            },
          }
        ).addTo(mapRef.current);

        // Fit bounds to show all features
        mapRef.current.fitBounds(geoJsonLayer.getBounds());

        const endTime = performance.now();
        console.log(
          `✅ Map rendered in ${(endTime - startTime).toFixed(2)}ms with ${features.length} features`
        );
      }
    } else {
      console.log('⏭️ No results to render');
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [results.length, JSON.stringify(results.map((r) => r.id))]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing highlight
    if (highlightLayerRef.current) {
      mapRef.current.removeLayer(highlightLayerRef.current);
      highlightLayerRef.current = null;
    }

    // Add new highlight if there's a hovered geometry
    if (hoveredGeometry) {
      try {
        highlightLayerRef.current = L.geoJSON(hoveredGeometry, {
          style: {
            color: '#2563eb',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.3,
            fillColor: '#3b82f6',
          },
        }).addTo(mapRef.current);

        // Fit bounds to the highlighted feature
        mapRef.current.fitBounds(highlightLayerRef.current.getBounds(), {
          padding: [50, 50],
        });
      } catch (error) {
        console.error('Error highlighting geometry:', error);
      }
    }
  }, [hoveredGeometry]);

  return (
    <div className="sticky top-[88px]">
      <div
        ref={mapContainer}
        className="h-[calc(100vh-120px)] w-full rounded-lg shadow-md"
      />
    </div>
  );
}
