import React from 'react';
import { leafletViewerOptions } from '../../config/leafletConfig';

interface ItemViewerProps {
  protocol: string;
  endpoint: string;
}

export function ItemViewer({ protocol, endpoint }: ItemViewerProps) {
  // Helper function to determine viewer type
  const getViewerType = (protocol: string) => {
    if (protocol === 'iiif_manifest') {
      return 'clover';
    }
    if (['cog', 'pmtiles'].includes(protocol)) {
      return 'openlayers';
    }
    return 'leaflet';
  };

  const viewerType = getViewerType(protocol);

  switch (viewerType) {
    case 'clover':
      return (
        <div
          id="clover-viewer"
          className="viewer h-[600px]"
          data-controller="clover-viewer"
          data-clover-viewer-protocol-value="IiifManifest"
          data-clover-viewer-url-value={endpoint}
        />
      );

    case 'openlayers':
      return (
        <div
          className="viewer h-[600px]"
          data-controller="openlayers-viewer"
          data-openlayers-viewer-protocol-value={protocol}
          data-openlayers-viewer-url-value={endpoint}
        />
      );

    case 'leaflet':
    default:
      return (
        <div
          className="viewer h-[600px]"
          data-controller="leaflet-viewer"
          data-leaflet-viewer-protocol-value={protocol}
          data-leaflet-viewer-url-value={endpoint}
          data-leaflet-viewer-options-value={JSON.stringify(leafletViewerOptions)}
        />
      );
  }
} 