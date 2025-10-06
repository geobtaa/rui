import { Routes, Route, Navigate } from 'react-router-dom';
import { Application } from '@hotwired/stimulus';
import { SearchPage } from './pages/SearchPage';
import { ResourceView } from './pages/ResourceView';
import { DebugProvider } from './context/DebugContext';
import { HomePage } from './pages/HomePage';
import { useSearchParams } from 'react-router-dom';
import { BookmarkProvider } from './context/BookmarkContext';
import { BookmarksPage } from './pages/BookmarksPage';
import { FixturesTestPage } from './pages/FixturesTestPage';
import { MapPage } from './pages/MapPage';
import { TestPage } from './pages/TestPage';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Ensure Stimulus is available globally
const application = Application.start();
(window as any).Stimulus = application;
console.log('Stimulus initialized:', (window as any).Stimulus);

// Import Geoblacklight after Stimulus is initialized
import('@geoblacklight/frontend').then((Geoblacklight) => {
  (window as any).Geoblacklight = Geoblacklight;
  console.log('Geoblacklight initialized:', (window as any).Geoblacklight);
});

function App() {
  console.log('Environment variables:', {
    VITE_USE_JSONP: import.meta.env.VITE_USE_JSONP,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  });
  const [searchParams] = useSearchParams();
  const hasSearchParams = Array.from(searchParams.entries()).length > 0;

  return (
    <BookmarkProvider>
      <DebugProvider>
        <Routes>
          <Route
            path="/"
            element={
              hasSearchParams ? (
                <Navigate to={`/search${window.location.search}`} />
              ) : (
                <HomePage />
              )
            }
          />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/resources/:id" element={<ResourceView />} />
          <Route path="/test/fixtures" element={<FixturesTestPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </DebugProvider>
    </BookmarkProvider>
  );
}

export default App;
