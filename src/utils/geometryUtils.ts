/**
 * Utility functions for handling geometry data formats
 */

/**
 * Converts WKT (Well-Known Text) to GeoJSON format
 * @param wkt - WKT string (e.g., "POLYGON((-96.796 48.756, -90.379 48.756, -90.379 43.429, -96.796 43.429, -96.796 48.756))")
 * @returns GeoJSON object or null if parsing fails
 */
export function wktToGeoJSON(wkt: string): GeoJSON.Polygon | null {
  try {
    // Remove extra whitespace and normalize
    const cleanWkt = wkt.trim().replace(/\s+/g, ' ');
    
    // Check if it's a POLYGON
    if (!cleanWkt.toUpperCase().startsWith('POLYGON')) {
      console.warn('WKT is not a POLYGON:', wkt);
      return null;
    }
    
    // Extract coordinates from POLYGON((...))
    const match = cleanWkt.match(/POLYGON\s*\(\s*\(\s*(.+?)\s*\)\s*\)/i);
    if (!match) {
      console.warn('Could not parse WKT coordinates:', wkt);
      return null;
    }
    
    // Parse coordinate pairs
    const coordString = match[1];
    const coordPairs = coordString.split(',').map(pair => {
      const [lon, lat] = pair.trim().split(/\s+/).map(Number);
      return [lon, lat];
    });
    
    // Validate coordinates
    if (coordPairs.length < 3) {
      console.warn('Invalid polygon: need at least 3 points');
      return null;
    }
    
    // Ensure first and last points are the same (closed polygon)
    const firstPoint = coordPairs[0];
    const lastPoint = coordPairs[coordPairs.length - 1];
    if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
      coordPairs.push([...firstPoint]); // Close the polygon
    }
    
    return {
      type: 'Polygon',
      coordinates: [coordPairs]
    };
  } catch (error) {
    console.error('Error parsing WKT to GeoJSON:', error);
    return null;
  }
}

/**
 * Converts various geometry formats to GeoJSON
 * @param geometry - Geometry data in various formats
 * @returns GeoJSON object or null if conversion fails
 */
export function normalizeGeometry(geometry: any): GeoJSON.Polygon | null {
  if (!geometry) return null;
  
  // If it's already GeoJSON
  if (geometry.type && geometry.coordinates) {
    return geometry;
  }
  
  // If it's a WKT string
  if (typeof geometry === 'string') {
    return wktToGeoJSON(geometry);
  }
  
  // If it's a parsed object with WKT-like structure
  if (geometry.wkt) {
    return wktToGeoJSON(geometry.wkt);
  }
  
  console.warn('Unknown geometry format:', geometry);
  return null;
}
