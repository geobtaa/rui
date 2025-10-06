import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { SearchField } from '../components/SearchField';
import { fetchSearchResults } from '../services/api';
import type { JsonApiResponse } from '../types/api';
import { useApi } from '../context/ApiContext';

// Fix for default markers in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GeoFacetItem {
  attributes: {
    label: string;
    value: string;
    hits: number;
  };
  links: {
    self: string;
  };
}

interface GeoFacet {
  type: 'facet';
  id: string;
  attributes: {
    label: string;
    items: GeoFacetItem[];
  };
}


interface ChoroplethData {
  country: GeoFacetItem[];
  region: GeoFacetItem[];
  county: GeoFacetItem[];
}

// Component to handle map updates for different zoom levels
function MapUpdater({ 
  data, 
  zoomLevel,
  onFeatureClick,
  searchQuery
}: { 
  data: ChoroplethData; 
  zoomLevel: ZoomLevel;
  onFeatureClick: (feature: any) => void;
  searchQuery: string;
}) {
  const map = useMap();
  const [localGeoJsonData, setLocalGeoJsonData] = useState<any>(null);

  // Minimal State FIPS -> USPS abbreviation mapping to disambiguate county names
  // Source: https://www2.census.gov/geo/docs/reference/state.txt (trimmed here)
  const stateFipsToAbbr: Record<string, string> = {
    '01': 'AL','02': 'AK','04': 'AZ','05': 'AR','06': 'CA','08': 'CO','09': 'CT','10': 'DE','11': 'DC','12': 'FL','13': 'GA','15': 'HI','16': 'ID','17': 'IL','18': 'IN','19': 'IA','20': 'KS','21': 'KY','22': 'LA','23': 'ME','24': 'MD','25': 'MA','26': 'MI','27': 'MN','28': 'MS','29': 'MO','30': 'MT','31': 'NE','32': 'NV','33': 'NH','34': 'NJ','35': 'NM','36': 'NY','37': 'NC','38': 'ND','39': 'OH','40': 'OK','41': 'OR','42': 'PA','44': 'RI','45': 'SC','46': 'SD','47': 'TN','48': 'TX','49': 'UT','50': 'VT','51': 'VA','53': 'WA','54': 'WV','55': 'WI','56': 'WY'
  };

  // Build reverse mapping: USPS -> FIPS (string, zero-padded)
  const stateAbbrToFips: Record<string, string> = Object.entries(stateFipsToAbbr).reduce(
    (acc, [fips, abbr]) => {
      acc[abbr] = fips;
      return acc;
    },
    {} as Record<string, string>
  );

  function normalizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  }

  // Parse a county facet item value: "<county_wof_id>|<region_wof_id>|<STATE_ABBR>|<County Name>"
  function parseCountyFacetValue(value: string) {
    const parts = value.split('|');
    return {
      countyWofId: parts[0] || '',
      regionWofId: parts[1] || '',
      stateAbbr: parts[2] || '',
      countyName: parts.slice(3).join('|') || '' // in case name contains '|'
    };
  }
  
  // Fetch GeoJSON data specific to this zoom level
  useEffect(() => {
    const fetchGeoJsonForLevel = async () => {
      try {
        console.log(`[${zoomLevel}] Fetching GeoJSON for MapUpdater...`);
        
        let geoJsonUrl: string;
        
        switch (zoomLevel) {
          case 'country':
            // Use Natural Earth countries GeoJSON for global country boundaries
            geoJsonUrl = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';
            break;
          case 'region':
            geoJsonUrl = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';
            break;
          case 'county':
            geoJsonUrl = 'https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json';
            break;
          default:
            geoJsonUrl = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';
        }
        
        console.log(`[${zoomLevel}] Fetching from URL: ${geoJsonUrl}`);
        const response = await fetch(geoJsonUrl);
        console.log(`[${zoomLevel}] Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const geoJson = await response.json();
          console.log(`[${zoomLevel}] GeoJSON loaded successfully:`, geoJson);
          console.log(`[${zoomLevel}] Features count:`, geoJson.features?.length || 0);
          setLocalGeoJsonData(geoJson);
        } else {
          console.error(`[${zoomLevel}] Failed to fetch GeoJSON: ${response.status} ${response.statusText}`);
        }
      } catch (err) {
        console.error(`[${zoomLevel}] Error fetching GeoJSON for MapUpdater:`, err);
      }
    };
    
    fetchGeoJsonForLevel();
  }, [zoomLevel]);

  // When on county level, pan/zoom to the state with the most county hits (only if there's a search query)
  useEffect(() => {
    if (zoomLevel !== 'county' || !localGeoJsonData || !localGeoJsonData.features || !Array.isArray(data?.county)) {
      return;
    }

    // If no search query, use default view like other maps
    if (!searchQuery || searchQuery.trim() === '') {
      map.setView([39.8283, -98.5795], 3); // US-focused view
      return;
    }

    // Aggregate hits by state abbreviation from facet values
    const hitsByState: Record<string, number> = {};
    for (const item of data.county) {
      const parsed = parseCountyFacetValue(item.attributes.value);
      if (!parsed.stateAbbr) continue;
      hitsByState[parsed.stateAbbr] = (hitsByState[parsed.stateAbbr] || 0) + (item.attributes.hits || 0);
    }

    const topStateAbbr = Object.entries(hitsByState).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!topStateAbbr) return;

    const topStateFips = stateAbbrToFips[topStateAbbr];
    if (!topStateFips) return;

    try {
      // Create a temporary layer filtered to the chosen state to compute bounds
      const layer = L.geoJSON(localGeoJsonData, {
        filter: (feature: any) => {
          const featureStateFips = (feature?.properties?.STATE || feature?.properties?.STATEFP || '').toString().padStart(2, '0');
          return featureStateFips === topStateFips;
        },
      });

      const bounds = layer.getBounds();
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }

      // Cleanup the temporary layer
      layer.remove();
    } catch (e) {
      console.warn('Could not compute bounds for top state:', topStateAbbr, e);
    }
  }, [zoomLevel, localGeoJsonData, data, searchQuery]);
  
  // Set appropriate view for each zoom level
  useEffect(() => {
    // All maps now use the same US-focused view since 90% of collection is from the US
    map.setView([39.8283, -98.5795], 3); // US-focused view for all levels
  }, [map, zoomLevel]);

  // Create a mapping function to match facet data to GeoJSON features (country/region by name)
  const getFeatureData = (featureName: string) => {
    const currentData = data[zoomLevel];
    
    // Only log for country level to focus debugging
    if (zoomLevel === 'country') {
      console.log(`[${zoomLevel}] Looking for feature: "${featureName}"`);
      console.log(`[${zoomLevel}] Available data:`, currentData.map(d => d.attributes.label));
    }
    
    // For country level, we might have "United States" or similar
    // For region level, we have state names
    // For county level, we have county names
    const item = currentData.find(dataItem => {
      const dataLabel = dataItem.attributes.label.toLowerCase();
      const geoName = featureName.toLowerCase();
      
      // Exact match first
      if (dataLabel === geoName) {
        console.log(`[${zoomLevel}] Exact match found: "${dataLabel}" = "${geoName}"`);
        return true;
      }
      
      // For countries, do strict matching to avoid false positives
      if (zoomLevel === 'country') {
        // Normalize names for comparison
        const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
        const normalizedDataLabel = normalizeName(dataLabel);
        const normalizedGeoName = normalizeName(geoName);
        
        // Only match if names are very similar (exact or one contains the other)
        const isMatch = normalizedDataLabel === normalizedGeoName ||
               (normalizedDataLabel.includes('united states') && (normalizedGeoName.includes('united states') || normalizedGeoName === 'us' || normalizedGeoName === 'usa')) ||
               (normalizedDataLabel.includes('usa') && (normalizedGeoName.includes('usa') || normalizedGeoName === 'us' || normalizedGeoName.includes('united states'))) ||
               (normalizedDataLabel === 'us' && (normalizedGeoName === 'us' || normalizedGeoName.includes('united states') || normalizedGeoName.includes('usa'))) ||
               (normalizedDataLabel.includes('canada') && normalizedGeoName.includes('canada')) ||
               (normalizedDataLabel.includes('mexico') && normalizedGeoName.includes('mexico'));
               
        if (isMatch) {
          console.log(`[${zoomLevel}] Country match found: "${dataLabel}" matches "${geoName}"`);
        } else {
          console.log(`[${zoomLevel}] No country match: "${dataLabel}" vs "${geoName}"`);
        }
        return isMatch;
      }
      
      // For regions/states, try partial matching
      if (zoomLevel === 'region') {
        return dataLabel.includes(geoName) || geoName.includes(dataLabel);
      }
      
      // For counties, try partial matching
      if (zoomLevel === 'county') {
        return dataLabel.includes(geoName) || geoName.includes(dataLabel);
      }
      
      return false;
    });
    
    const hits = item ? item.attributes.hits : 0;
    // Only log for country level to focus debugging
    if (zoomLevel === 'country') {
      console.log(`[${zoomLevel}] Feature "${featureName}" -> ${hits} hits`);
    }
    return hits;
  };

  // County-specific matching using state + county name derived from facet value
  const getCountyHitsFromFeature = (feature: any) => {
    const currentData = data['county'];
    const featureCountyNameRaw = feature?.properties?.NAME || feature?.properties?.name || feature?.properties?.county || 'Unknown County';
    const featureStateFips: string = (feature?.properties?.STATE || feature?.properties?.STATEFP || '').toString().padStart(2, '0');
    const featureStateAbbr = stateFipsToAbbr[featureStateFips] || '';

    const featureCountyName = normalizeName(featureCountyNameRaw);

    const item = currentData.find((dataItem) => {
      const { stateAbbr, countyName } = parseCountyFacetValue(dataItem.attributes.value);
      if (!stateAbbr || !countyName) return false;
      const normCounty = normalizeName(countyName);
      return featureStateAbbr === stateAbbr && normCounty === featureCountyName;
    });

    return item ? item.attributes.hits : 0;
  };

  // Get the maximum hits for color scaling based on current zoom level
  const currentData = data[zoomLevel];
  const maxHits = Math.max(...currentData.map(d => d.attributes.hits), 1);

  console.log(`[${zoomLevel}] MapUpdater rendering - localGeoJsonData:`, !!localGeoJsonData, 'features:', localGeoJsonData?.features?.length || 0);

  if (!localGeoJsonData || !localGeoJsonData.features) {
    console.log(`[${zoomLevel}] Showing loading state - no GeoJSON data yet`);
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading {zoomLevel} boundaries...</p>
        </div>
      </div>
    );
  }

  return (
    <GeoJSON
      data={localGeoJsonData}
      style={(feature) => {
        // Extract feature name based on zoom level and GeoJSON structure
        let featureName = 'Unknown';
        
        if (zoomLevel === 'country') {
          featureName = feature?.properties?.name || feature?.properties?.NAME || feature?.properties?.ADMIN || 'Unknown Country';
          console.log(`[${zoomLevel}] Country feature properties:`, feature?.properties);
          console.log(`[${zoomLevel}] Extracted country name: "${featureName}"`);
        } else if (zoomLevel === 'region') {
          featureName = feature?.properties?.name || feature?.properties?.NAME || feature?.properties?.state || 'Unknown State';
        } else if (zoomLevel === 'county') {
          featureName = feature?.properties?.NAME || feature?.properties?.name || feature?.properties?.county || 'Unknown County';
        }
        
        const hits = zoomLevel === 'county' ? getCountyHitsFromFeature(feature) : getFeatureData(featureName);
        const intensity = hits / maxHits;
        
        // Only log for country level to focus debugging
        if (zoomLevel === 'country') {
          console.log(`[${zoomLevel}] Styling feature "${featureName}": ${hits} hits, intensity: ${intensity}`);
        }
        
        return {
          fillColor: getColor(intensity),
          weight: 2,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.7
        };
      }}
      onEachFeature={(feature, layer) => {
        // Extract feature name based on zoom level and GeoJSON structure
        let featureName = 'Unknown';
        
        if (zoomLevel === 'country') {
          featureName = feature?.properties?.name || feature?.properties?.NAME || 'United States';
        } else if (zoomLevel === 'region') {
          featureName = feature?.properties?.name || feature?.properties?.NAME || feature?.properties?.state || 'Unknown State';
        } else if (zoomLevel === 'county') {
          featureName = feature?.properties?.NAME || feature?.properties?.name || feature?.properties?.county || 'Unknown County';
        }
        
        const hits = zoomLevel === 'county' ? getCountyHitsFromFeature(feature) : getFeatureData(featureName);
        
        layer.bindPopup(`
          <div>
            <h3>${featureName}</h3>
            <p><strong>Resources:</strong> ${hits}</p>
            <p><strong>Level:</strong> ${zoomLevel}</p>
          </div>
        `);
        
        layer.on('click', () => {
          onFeatureClick({
            properties: {
              name: featureName,
              hits: hits
            }
          });
        });
      }}
    />
  );
}

// Color function for choropleth
function getColor(intensity: number): string {
  return intensity > 0.8 ? '#800026' :
         intensity > 0.6 ? '#BD0026' :
         intensity > 0.4 ? '#E31A1C' :
         intensity > 0.2 ? '#FC4E2A' :
         intensity > 0.1 ? '#FD8D3C' :
         intensity > 0   ? '#FEB24C' :
                           '#FED976';
}

type ZoomLevel = 'country' | 'region' | 'county';

export function MapPage() {
  const [data, setData] = useState<ChoroplethData>({
    country: [],
    region: [],
    county: []
  });
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('region');
  const { setLastApiUrl } = useApi();

  useEffect(() => {
    fetchGeoFacetData();
    fetchGeoJsonData();
  }, []);

  useEffect(() => {
    fetchGeoJsonData();
  }, [zoomLevel]);

  useEffect(() => {
    if (searchQuery) {
      fetchGeoFacetData();
    }
  }, [searchQuery]);

  const fetchGeoJsonData = async () => {
    try {
      console.log(`Fetching ${zoomLevel} GeoJSON...`);
      
      let geoJsonUrl: string;
      
      switch (zoomLevel) {
        case 'country':
          // US country boundary - using a simple US outline
          geoJsonUrl = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/us_country.geojson';
          break;
        case 'region':
          // US states - using standard state boundaries
          geoJsonUrl = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';
          break;
        case 'county':
          // US counties - using a comprehensive county dataset
          geoJsonUrl = 'https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json';
          break;
        default:
          geoJsonUrl = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';
      }
      
      const response = await fetch(geoJsonUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch GeoJSON: ${response.status}`);
      }
      
      const geoJson = await response.json();
      console.log(`${zoomLevel} GeoJSON loaded:`, geoJson);
      setGeoJsonData(geoJson);
    } catch (err) {
      console.error(`Error fetching ${zoomLevel} GeoJSON:`, err);
      // Fallback to states if other levels fail
      try {
        console.log('Trying fallback to US states...');
        const fallbackResponse = await fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json');
        const fallbackGeoJson = await fallbackResponse.json();
        setGeoJsonData(fallbackGeoJson);
      } catch (fallbackErr) {
        console.error('Fallback GeoJSON also failed:', fallbackErr);
        setError('Failed to load map boundaries');
      }
    }
  };

  const fetchGeoFacetData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Starting API call...');
      
      // Add timeout to the API call
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API call timeout')), 10000)
      );
      
      // Fetch search results to get geo facets - use the current search query (empty string for all results)
      const apiPromise = fetchSearchResults(
        searchQuery || '',
        1,
        10,
        [],
        setLastApiUrl
      );
      
      const response: JsonApiResponse = await Promise.race([apiPromise, timeoutPromise]) as JsonApiResponse;
      
      console.log('API response received:', response);
      
      if (response.included) {
        const geoFacets = response.included.filter(
          (item): item is GeoFacet => 
            item.type === 'facet' && 
            ['geo_country_agg', 'geo_region_agg', 'geo_county_agg'].includes(item.id)
        );

        console.log('Found geo facets:', geoFacets);

        const newData: ChoroplethData = {
          country: [],
          region: [],
          county: []
        };

        geoFacets.forEach(facet => {
          if (facet.id === 'geo_country_agg') {
            newData.country = facet.attributes.items;
          } else if (facet.id === 'geo_region_agg') {
            newData.region = facet.attributes.items;
          } else if (facet.id === 'geo_county_agg') {
            newData.county = facet.attributes.items;
          }
        });

        console.log('Processed data:', newData);
        setData(newData);
      } else {
        console.log('No included data in response');
        setError('No geographic data found in API response');
      }
    } catch (err) {
      console.error('Error fetching geo facet data:', err);
      setError(`Failed to load geographic data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureClick = (feature: any) => {
    setSelectedFeature(feature);
    // For now, just show the selected region details
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedFeature(null); // Clear selection when searching
  };

  const handleZoomLevelChange = (level: ZoomLevel) => {
    setZoomLevel(level);
    setSelectedFeature(null); // Clear selection when changing zoom level
  };


  const getCurrentData = () => {
    return data[zoomLevel] || [];
  };

  const getTotalResources = () => {
    return data[zoomLevel].reduce((sum, item) => sum + item.attributes.hits, 0);
  };

  if (loading || !geoJsonData) {
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
                    onClick={fetchGeoFacetData}
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

        {/* Zoom Level Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Geographic Level</h3>
              <div className="flex space-x-2">
                {(['country', 'region', 'county'] as ZoomLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => handleZoomLevelChange(level)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      zoomLevel === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level === 'country' && 'Country'}
                    {level === 'region' && 'Region (State)'}
                    {level === 'county' && 'County'}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <div>Current Level: <span className="font-semibold capitalize">{zoomLevel}</span></div>
              <div>Features: <span className="font-semibold">{getCurrentData().length}</span></div>
            </div>
          </div>
        </div>

        {/* Test: All Three Maps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Country Map */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Country Level</h3>
              <p className="text-sm text-gray-600">Features: {data.country.length}</p>
            </div>
            <div className="h-64">
              <MapContainer
                center={[20, 0]}
                zoom={2}
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
            </div>
          </div>

          {/* Region Map */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Region (State) Level</h3>
              <p className="text-sm text-gray-600">Features: {data.region.length}</p>
            </div>
            <div className="h-64">
              <MapContainer
                center={[39.8283, -98.5795]}
                zoom={3}
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
            </div>
          </div>

          {/* County Map */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">County Level</h3>
              <p className="text-sm text-gray-600">Features: {data.county.length}</p>
            </div>
            <div className="h-64">
              <MapContainer
                center={[39.8283, -98.5795]}
                zoom={3}
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
            </div>
          </div>
        </div>

        {/* Original Single Map (commented out for testing) */}
        {/*
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="h-96">
            <MapContainer
              center={[39.8283, -98.5795]}
              zoom={4}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater 
                data={data} 
                geoJsonData={geoJsonData}
                zoomLevel={zoomLevel}
                onFeatureClick={handleFeatureClick}
              />
            </MapContainer>
          </div>
        </div>
        */}

        {/* Search and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Regional Resource Distribution
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Search for resources and see their geographic distribution
            </p>
            
            {/* Search Field */}
            <div className="max-w-md">
              <SearchField
                placeholder="Search for maps, data, imagery..."
                onSearch={handleSearch}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-sm text-gray-600">
              <div>Current Query: <span className="font-semibold">"{searchQuery || 'All Resources'}"</span></div>
              <div>Total Resources: <span className="font-semibold">{getTotalResources()}</span></div>
              <div>{zoomLevel === 'country' ? 'Countries' : zoomLevel === 'region' ? 'Regions' : 'Counties'}: <span className="font-semibold">{getCurrentData().length}</span></div>
            </div>

            <div className="ml-auto text-right">
              <p className="text-xs text-gray-500">
                Click on any region to view details
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Resource Density</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">Low</span>
            <div className="flex space-x-1">
              {[0, 0.1, 0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
                <div
                  key={intensity}
                  className="w-4 h-4"
                  style={{ backgroundColor: getColor(intensity) }}
                  title={`${Math.round(intensity * 100)}%`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">High</span>
          </div>
        </div>

        {/* Selected Feature Details */}
        {selectedFeature && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedFeature.properties?.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Resources</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {selectedFeature.properties?.hits}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Geographic Level</dt>
                <dd className="text-lg font-semibold text-gray-900 capitalize">
                  {zoomLevel === 'country' ? 'Country' : zoomLevel === 'region' ? 'Region (State)' : 'County'}
                </dd>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
