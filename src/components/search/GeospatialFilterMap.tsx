import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSearchParams } from 'react-router-dom';

interface BBox {
  topLeft: { lat: number; lon: number };
  bottomRight: { lat: number; lon: number };
}

export function GeospatialFilterMap() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const isUpdatingFromParamsRef = useRef(false);

  // Parse bbox from URL params
  const getBBoxFromParams = useCallback((): BBox | null => {
    const type = searchParams.get('include_filters[geo][type]');
    if (type !== 'bbox') return null;

    const topLeftLat = searchParams.get('include_filters[geo][top_left][lat]');
    const topLeftLon = searchParams.get('include_filters[geo][top_left][lon]');
    const bottomRightLat = searchParams.get('include_filters[geo][bottom_right][lat]');
    const bottomRightLon = searchParams.get('include_filters[geo][bottom_right][lon]');

    if (topLeftLat && topLeftLon && bottomRightLat && bottomRightLon) {
      return {
        topLeft: {
          lat: parseFloat(topLeftLat),
          lon: parseFloat(topLeftLon),
        },
        bottomRight: {
          lat: parseFloat(bottomRightLat),
          lon: parseFloat(bottomRightLon),
        },
      };
    }
    return null;
  }, [searchParams]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);

      // Set initial view to world
      mapRef.current.setView([20, 0], 2);

      // Invalidate size to ensure tiles render properly after container is ready
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (mapRef.current && mapContainerRef.current) {
            // Check if container is visible
            const rect = mapContainerRef.current.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              mapRef.current.invalidateSize();
            } else {
              // If not visible yet, try again after a delay
              setTimeout(() => {
                if (mapRef.current) {
                  mapRef.current.invalidateSize();
                }
              }, 300);
            }
          }
        }, 100);
      });

      // Handle map move/zoom events
      const handleMapMoveEnd = () => {
        if (isUpdatingFromParamsRef.current) return;
        if (!mapRef.current) return;

        const bounds = mapRef.current.getBounds();
        const newParams = new URLSearchParams(window.location.search);

        // Remove existing geo filters
        Array.from(newParams.keys())
          .filter((key) => key.startsWith('include_filters[geo]'))
          .forEach((key) => newParams.delete(key));

        // Add new bbox filter
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        // Top-left is northwest corner (north = higher lat, west = lower lon)
        // Bottom-right is southeast corner (south = lower lat, east = higher lon)
        newParams.set('include_filters[geo][type]', 'bbox');
        newParams.set('include_filters[geo][field]', 'dcat_bbox');
        newParams.set('include_filters[geo][top_left][lat]', ne.lat.toString());
        newParams.set('include_filters[geo][top_left][lon]', sw.lng.toString());
        newParams.set('include_filters[geo][bottom_right][lat]', sw.lat.toString());
        newParams.set('include_filters[geo][bottom_right][lon]', ne.lng.toString());

        // Reset to page 1 when bbox changes
        newParams.delete('page');

        setSearchParams(newParams);
      };

      mapRef.current.on('moveend', handleMapMoveEnd);
      mapRef.current.on('zoomend', handleMapMoveEnd);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [setSearchParams]);

  // Update map view from URL params
  useEffect(() => {
    if (!mapRef.current) return;

    const bbox = getBBoxFromParams();
    if (bbox) {
      isUpdatingFromParamsRef.current = true;
      try {
        // Reconstruct bounds from bbox
        // top_left is northwest (higher lat, lower lon)
        // bottom_right is southeast (lower lat, higher lon)
        const bounds = L.latLngBounds(
          [bbox.bottomRight.lat, bbox.topLeft.lon], // Southwest (south lat, west lon)
          [bbox.topLeft.lat, bbox.bottomRight.lon]  // Northeast (north lat, east lon)
        );
        mapRef.current.fitBounds(bounds);
      } catch (error) {
        console.error('Error setting map bounds from params:', error);
      }
      // Reset flag after a short delay to allow map to update
      setTimeout(() => {
        isUpdatingFromParamsRef.current = false;
      }, 100);
    } else {
      // No bbox in params, show world view
      if (mapRef.current.getZoom() < 2) {
        isUpdatingFromParamsRef.current = true;
        mapRef.current.setView([20, 0], 2);
        setTimeout(() => {
          isUpdatingFromParamsRef.current = false;
        }, 100);
      }
    }
  }, [getBBoxFromParams]);

  // Handle visibility changes (e.g., when details element opens)
  useEffect(() => {
    if (!mapRef.current || !mapContainerRef.current) return;

    // Use IntersectionObserver to detect when container becomes visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && mapRef.current) {
            // Container is visible, invalidate size to ensure tiles load
            setTimeout(() => {
              if (mapRef.current) {
                mapRef.current.invalidateSize();
              }
            }, 100);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(mapContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleClearBBox = () => {
    const newParams = new URLSearchParams(searchParams);
    Array.from(newParams.keys())
      .filter((key) => key.startsWith('include_filters[geo]'))
      .forEach((key) => newParams.delete(key));
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const hasBBox = getBBoxFromParams() !== null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Location</h3>
        {hasBBox && (
          <button
            onClick={handleClearBBox}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
            aria-label="Clear location filter"
          >
            Clear
          </button>
        )}
      </div>
      <div
        ref={mapContainerRef}
        className="h-64 w-full rounded-lg border border-gray-200"
        style={{ minHeight: '256px' }}
      />
    </div>
  );
}

