import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ApiProvider } from './context/ApiContext';
import { ThemeProvider } from './context/ThemeContext';
import App from './App.tsx';
import './index.css';
import './styles/leaflet.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.VITE_BASE_URL || '/'}>
      <ThemeProvider>
        <ApiProvider>
          <App />
        </ApiProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
