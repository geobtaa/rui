import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SearchPage } from './pages/SearchPage';
import { ItemView } from './pages/ItemView';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/items/:id" element={<ItemView />} />
    </Routes>
  );
}

export default App;