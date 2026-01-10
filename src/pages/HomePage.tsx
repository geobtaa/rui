import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { SearchField } from '../components/SearchField';
import { ResourceClassFilterTabs } from '../components/search/ResourceClassFilterTabs';
import {
  Database,
  Map,
  Globe,
  Library,
  Image,
  Folder,
  Globe2,
  Search,
} from 'lucide-react';
import { fetchSearchResults } from '../services/api';
import { SimilarItemsCarousel } from '../components/resource/SimilarItemsCarousel';
import type { GeoDocument } from '../types/api';
import { useTheme } from '../hooks/useTheme';
import { formatCount } from '../utils/formatCount';
import { useResourceClasses } from '../hooks/useResourceClasses';

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, themeId } = useTheme();
  const { resourceClasses, isLoading: isLoadingResourceClasses } =
    useResourceClasses();
  const [featuredCollections, setFeaturedCollections] = useState<GeoDocument[]>([]);
  const [featuredMaps, setFeaturedMaps] = useState<GeoDocument[]>([]);

  useEffect(() => {
    // Reset state immediately on theme change so we don't show stale counts/content.
    setFeaturedCollections([]);
    setFeaturedMaps([]);

    const fetchFeatured = async () => {
      try {
        const featuredItems = theme.homepage?.featured || [];
        const results = await Promise.all(
          featuredItems.map(async (item) => {
            const data = await fetchSearchResults(
              '',
              1,
              item.limit,
              [{ field: item.field, value: item.value }],
              undefined,
              item.sort
            );
            return { title: item.title, data: data?.data || [] };
          })
        );

        // Map results back to specific state for backward compatibility/simplicity in this refactor
        // Ideally we would map over these results in the JSX
        const collections = results.find((r) => r.title === "Featured Collections");
        const maps = results.find((r) => r.title === "Featured Maps");

        if (collections?.data) setFeaturedCollections(collections.data);
        if (maps?.data) setFeaturedMaps(maps.data);

      } catch (error) {
        console.error('Error fetching featured items:', error);
      }
    };

    fetchFeatured();
  }, [themeId]);

  const getResourceClassIcon = (label: string) => {
    const v = label.toLowerCase();
    if (v.includes('dataset')) return <Database className="w-6 h-6" />;
    if (v.includes('map')) return <Map className="w-6 h-6" />;
    if (v.includes('web service') || v.includes('service'))
      return <Globe className="w-6 h-6" />;
    if (v.includes('collection')) return <Library className="w-6 h-6" />;
    if (v.includes('imagery') || v.includes('raster'))
      return <Image className="w-6 h-6" />;
    if (v.includes('website')) return <Globe2 className="w-6 h-6" />;
    return <Folder className="w-6 h-6" />;
  };

  /* ... handlers (handleSearch, handleAdvancedSearchClick, handleResourceClassClick, handleBrowseAll) ... */
  const handleSearch = (query: string) => {
    if (query.trim()) {
      const newParams = new URLSearchParams();
      newParams.set('q', query);

      // Preserve geo filters from current URL
      const geoType = searchParams.get('include_filters[geo][type]');
      if (geoType === 'bbox') {
        const topLeftLat = searchParams.get(
          'include_filters[geo][top_left][lat]'
        );
        const topLeftLon = searchParams.get(
          'include_filters[geo][top_left][lon]'
        );
        const bottomRightLat = searchParams.get(
          'include_filters[geo][bottom_right][lat]'
        );
        const bottomRightLon = searchParams.get(
          'include_filters[geo][bottom_right][lon]'
        );

        if (topLeftLat && topLeftLon && bottomRightLat && bottomRightLon) {
          newParams.set('include_filters[geo][type]', 'bbox');
          newParams.set('include_filters[geo][field]', 'dcat_bbox');
          newParams.set('include_filters[geo][top_left][lat]', topLeftLat);
          newParams.set('include_filters[geo][top_left][lon]', topLeftLon);
          newParams.set(
            'include_filters[geo][bottom_right][lat]',
            bottomRightLat
          );
          newParams.set(
            'include_filters[geo][bottom_right][lon]',
            bottomRightLon
          );
        }
      }

      // Preserve category filters from current URL (if any)
      const categoryFilters = searchParams.getAll(
        'include_filters[gbl_resourceClass_sm][]'
      );
      const legacyCategoryFilters = searchParams.getAll(
        'fq[gbl_resourceClass_sm][]'
      );

      // Use include_filters format (preferred)
      if (categoryFilters.length > 0) {
        categoryFilters.forEach((value) => {
          newParams.append('include_filters[gbl_resourceClass_sm][]', value);
        });
      } else if (legacyCategoryFilters.length > 0) {
        // Fall back to legacy format if present
        legacyCategoryFilters.forEach((value) => {
          newParams.append('include_filters[gbl_resourceClass_sm][]', value);
        });
      }

      navigate(`/search?${newParams.toString()}`);
    }
  };

  const handleAdvancedSearchClick = () => {
    // Always open advanced search when coming from home page
    navigate('/search?showAdvanced=true');
  };

  const handleResourceClassClick = (aggValue: string) => {
    navigate(
      `/search?include_filters[gbl_resourceClass_sm][]=${encodeURIComponent(
        aggValue
      )}`
    );
  };

  const handleBrowseAll = () => {
    navigate('/search?q=');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-4rem)]">
          <div className="col-span-1 lg:col-span-8 px-4 md:px-8 lg:px-12 py-4 lg:py-4 flex flex-col">
            <div className="space-y-6 lg:space-y-8 max-w-4xl w-full">
              <h1 className="sr-only">{theme.institution.name}</h1>

              <p className="text-lg lg:text-xl text-gray-600">
                {theme.institution.hero_text}
              </p>

              <div className="w-full">
                <SearchField
                  onSearch={handleSearch}
                  placeholder="Search for maps, data, imagery..."
                  autoFocus
                  showAdvancedButton={true}
                  onAdvancedSearchClick={handleAdvancedSearchClick}
                />
                <div className="mt-1">
                  <ResourceClassFilterTabs variant="content" />
                </div>
              </div>

              <div className="text-sm text-gray-500">
                <p>
                  Browse and download GIS data, maps, and other geospatial
                  resources.
                </p>
              </div>

              {/* Featured Sections */}
              <div className="space-y-8 pt-4">
                {featuredCollections.length > 0 && (
                  <SimilarItemsCarousel
                    similarItems={featuredCollections}
                    title="Featured Collections"
                  />
                )}

                {featuredMaps.length > 0 && (
                  <SimilarItemsCarousel
                    similarItems={featuredMaps}
                    title="Featured Maps"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-4 bg-gray-100 px-4 md:px-8 lg:px-12 py-8 lg:py-12 border-t lg:border-l lg:border-t-0 border-gray-200">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Browse by Resource Class
              </h2>
              <div className="space-y-3">
                <button
                  onClick={handleBrowseAll}
                  className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400 group-hover:text-blue-500">
                      <Search className="w-6 h-6" />
                    </div>
                    <span className="text-gray-700 group-hover:text-gray-900">
                      Browse All Resources
                    </span>
                  </div>
                </button>

                {resourceClasses
                  .filter((rc) => rc.hits > 0)
                  .slice(0, 12)
                  .map((rc) => (
                  <button
                    key={rc.value}
                    onClick={() => handleResourceClassClick(rc.value)}
                    className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-gray-400 group-hover:text-blue-500">
                        {getResourceClassIcon(rc.label)}
                      </div>
                      <span className="text-gray-700 group-hover:text-gray-900">
                        {rc.label}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 group-hover:text-gray-700">
                      {!isLoadingResourceClasses ? formatCount(rc.hits) : ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
