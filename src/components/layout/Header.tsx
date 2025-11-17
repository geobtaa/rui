import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Globe2 } from 'lucide-react';
import { SearchField } from '../SearchField';
import { ResourceClassFilterTabs } from '../search/ResourceClassFilterTabs';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isHomePage = location.pathname === '/';

  const handleSearch = (query: string) => {
    const newParams = new URLSearchParams();
    newParams.set('q', query);
    
    // Preserve category filters from current URL
    const categoryFilters = searchParams.getAll('include_filters[gbl_resourceClass_sm][]');
    const legacyCategoryFilters = searchParams.getAll('fq[gbl_resourceClass_sm][]');
    
    // Use include_filters format (preferred)
    if (categoryFilters.length > 0) {
      categoryFilters.forEach(value => {
        newParams.append('include_filters[gbl_resourceClass_sm][]', value);
      });
    } else if (legacyCategoryFilters.length > 0) {
      // Fall back to legacy format if present
      legacyCategoryFilters.forEach(value => {
        newParams.append('include_filters[gbl_resourceClass_sm][]', value);
      });
    }
    
    navigate(`/search?${newParams.toString()}`);
  };

  const handleAdvancedSearchClick = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('showAdvanced', 'true');
    navigate(`/search?${newParams.toString()}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="min-h-16 py-2 grid grid-cols-12 items-center gap-8">
          {/* Branding - matches facets column width */}
          <div className="col-span-2 flex items-center gap-3">
            <Globe2 className="h-8 w-8 text-blue-500" />
            <Link to="/" className="text-xl font-bold text-gray-900">
              BTAA Geoportal
            </Link>
          </div>

          {/* Search Field - matches results column width */}
          <div className="col-span-6">
            {!isHomePage && (
              <>
                <SearchField
                  placeholder="Search for maps, data, imagery..."
                  onSearch={handleSearch}
                  showAdvancedButton={true}
                  onAdvancedSearchClick={handleAdvancedSearchClick}
                />
                <div className="mt-1">
                  <ResourceClassFilterTabs />
                </div>
              </>
            )}
          </div>

          {/* Navigation - matches map column width */}
          <nav className="col-span-4 flex items-center justify-end space-x-4">
                <Link
                  to="/map"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Map
                </Link>
            <Link
              to="/bookmarks"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Bookmarks
            </Link>
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Search
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
