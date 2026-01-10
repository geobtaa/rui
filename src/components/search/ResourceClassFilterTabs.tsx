import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResourceClasses } from '../../hooks/useResourceClasses';

export function ResourceClassFilterTabs({
  variant = 'header',
}: {
  variant?: 'header' | 'content';
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resourceClasses, isLoading } = useResourceClasses();

  const styles =
    variant === 'content'
      ? {
          active: 'text-brand border-brand',
          inactive:
            'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300',
        }
      : {
          active: 'text-white border-white',
          inactive: 'text-white border-transparent hover:border-white/70',
        };

  // Get current query and Resource Class filter from URL
  const currentQuery = searchParams.get('q') || '';
  const currentResourceClass =
    searchParams.getAll('include_filters[gbl_resourceClass_sm][]')[0] ||
    searchParams.getAll('fq[gbl_resourceClass_sm][]')[0] ||
    null;

  const handleTabClick = (resourceClassValue: string | null) => {
    const newParams = new URLSearchParams(searchParams);

    // Remove all Resource Class filters (both new and legacy format)
    const keysToRemove: string[] = [];
    newParams.forEach((_, key) => {
      if (
        key.startsWith('include_filters[gbl_resourceClass_sm]') ||
        key.startsWith('fq[gbl_resourceClass_sm]')
      ) {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach((key) => newParams.delete(key));

    // If a specific Resource Class is selected, add it
    if (resourceClassValue) {
      newParams.append(
        'include_filters[gbl_resourceClass_sm][]',
        resourceClassValue
      );
    }

    // Ensure we have a query parameter (even if empty) to trigger search
    if (!newParams.has('q')) {
      newParams.set('q', currentQuery || '');
    }

    // Reset to page 1 when changing filters
    newParams.delete('page');

    navigate(`/search?${newParams.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
        Loading categories...
      </div>
    );
  }

  if (resourceClasses.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full items-center justify-center gap-1 overflow-x-auto scrollbar-hide">
      <button
        onClick={() => handleTabClick(null)}
        className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
          !currentResourceClass
            ? styles.active
            : styles.inactive
        }`}
        aria-label="Show all resources"
        aria-current={!currentResourceClass ? 'page' : undefined}
      >
        All
      </button>
      {resourceClasses.map((resourceClass) => {
        const isActive = currentResourceClass === resourceClass.value;
        return (
          <button
            key={resourceClass.value}
            onClick={() => handleTabClick(resourceClass.value)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              isActive ? styles.active : styles.inactive
            }`}
            aria-label={`Filter by ${resourceClass.label}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {resourceClass.label}
          </button>
        );
      })}
    </div>
  );
}
