import React from 'react';
import { leafletViewerOptions } from '../../config/leafletConfig';
import { parse } from 'terraformer-wkt-parser';
import { getWmsFeatureInfo } from '../../services/wms';

interface ItemViewerProps {
  protocol: string;
  endpoint: string;
  geometry: string;
  wxs_identifier: string;
  available: boolean;
  layerId: string;
  pageValue: string;
}

export function ItemViewer({ protocol, endpoint, geometry, wxs_identifier, available, pageValue }: ItemViewerProps) {
  // Helper function to titleize a string
  const titleize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  // Helper function to determine viewer type
  const getViewerType = (protocol: string) => {
    if (['iiif_manifest', 'iiif_image'].includes(protocol)) {
      return 'clover';
    }
    if (['cog', 'pmtiles'].includes(protocol)) {
      return 'openlayers';
    }
    if (protocol === 'oembed') {
      return 'oembed-viewer';
    }
    return 'leaflet';
  };

  const viewerType = getViewerType(protocol);

  function formatProtocol(protocol: string): string {
    if (protocol === "arcgis_dynamic_map_layer") {
      return "DynamicMapLayer";
    }
    if (protocol === "geo_json") {
      return null;
    }
    if (protocol === "tile_map_service") {
      return "Tms";
    }
    if (protocol === "arcgis_tiled_map_layer") {
      return "TiledMapLayer";
    }
    if (protocol === "arcgis_feature_layer") {
      return "FeatureLayer";
    }
    if (protocol === "arcgis_image_map_layer") {
      return "ImageMapLayer";
    }
    if (protocol === "open_index_map") {
      return "IndexMap";
    }
    if (protocol === "xyz_tiles") {
      return "Xyz";
    }
    if (protocol === "tile_json") {
      return "Tilejson";
    }
    return titleize(protocol);
  }

  const isWmsItem = protocol === 'wms';

  switch (viewerType) {
    case 'clover':
      return (
        <div
          id="clover-viewer"
          className="viewer h-[600px]"
          data-controller="clover-viewer"
          data-clover-viewer-protocol-value={protocol === "iiif_manifest" ? "IiifManifest" : "Iiif"}
          data-clover-viewer-url-value={endpoint}
        />
      );

    case 'openlayers':
      return (
        <div
          className="viewer h-[600px]"
          data-controller="openlayers-viewer"
          data-openlayers-viewer-protocol-value={titleize(protocol)}
          data-openlayers-viewer-url-value={endpoint}
          data-openlayers-viewer-map-geom-value={JSON.stringify(geometry)}
        />
      );
    case 'oembed-viewer':
      return (
        <div
          className="viewer h-[600px]"
          data-controller="oembed-viewer"
          data-oembed-viewer-url-value={endpoint}
        />
      );
    case 'leaflet':
    default:
      return (
        <div className="sticky top-[88px]">
          <div
            id="leaflet-viewer"
            className="viewer h-[calc(100vh-120px)]"
            data-controller="leaflet-viewer"
            data-leaflet-viewer-available-value={available}
            data-leaflet-viewer-map-geom-value={JSON.stringify(geometry)}
            data-leaflet-viewer-layer-id-value={wxs_identifier}
            data-leaflet-viewer-options-value={JSON.stringify(leafletViewerOptions)}
            data-leaflet-viewer-page-value={pageValue}
            data-leaflet-viewer-draw-initial-bounds-value={true}
            {...(endpoint ? { 'data-leaflet-viewer-url-value': endpoint } : {})}
            {...(protocol ? { 'data-leaflet-viewer-protocol-value': formatProtocol(protocol) } : {})}
            {...(isWmsItem ? { 'data-action': "leaflet-viewer:getFeatureInfo->application#handleWmsFeatureInfo" } : {})}
            {...(isWmsItem ? { 'data-wms-feature-info-url': `${import.meta.env.VITE_API_BASE_URL}/wms/handle` } : {})}
          />
        </div>
      );
  }
} 
