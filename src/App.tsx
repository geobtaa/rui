import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Application } from "@hotwired/stimulus";
import { SearchPage } from './pages/SearchPage';
import { ItemView } from './pages/ItemView';
import { DebugProvider } from './context/DebugContext';
import { HomePage } from './pages/HomePage';
import { useSearchParams } from 'react-router-dom';
import { BookmarkProvider } from './context/BookmarkContext';
import { BookmarksPage } from './pages/BookmarksPage';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Ensure Stimulus is available globally
const application = Application.start();
window.Stimulus = application;
console.log('Stimulus initialized:', window.Stimulus);

// Import Geoblacklight after Stimulus is initialized
import('@geoblacklight/frontend').then((Geoblacklight) => {
  window.Geoblacklight = Geoblacklight;
  console.log('Geoblacklight initialized:', window.Geoblacklight);
});

function App() {
  const [searchParams] = useSearchParams();
  const hasSearchParams = Array.from(searchParams.entries()).length > 0;

  return (
    <BookmarkProvider>
      <DebugProvider>
        <Routes>
          <Route 
            path="/" 
            element={hasSearchParams ? <Navigate to={`/search${window.location.search}`} /> : <HomePage />} 
          />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/items/:id" element={<ItemView />} />
        </Routes>
      </DebugProvider>
    </BookmarkProvider>
  );
}

export default App;