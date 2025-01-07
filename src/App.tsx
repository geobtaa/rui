import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Application } from "@hotwired/stimulus";
import { SearchPage } from './pages/SearchPage';
import { ItemView } from './pages/ItemView';

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

  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/items/:id" element={<ItemView />} />
    </Routes>
  );
}

export default App;