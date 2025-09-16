import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SearchPage } from '../../pages/SearchPage';
import { ApiProvider } from '../../context/ApiContext';

describe('Search Results Page', () => {
  const renderSearchResults = () => {
    render(
      <BrowserRouter>
        <ApiProvider>
          <SearchPage />
        </ApiProvider>
      </BrowserRouter>
    );
  };

  it('displays search results', async () => {
    renderSearchResults();
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('shows the map view toggle', () => {
    renderSearchResults();
    expect(screen.getByRole('button', { name: /map/i })).toBeInTheDocument();
  });
});
