import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Home } from '../../pages/Home';
import { ApiProvider } from '../../context/ApiContext';

describe('Home Page', () => {
  const renderHome = () => {
    render(
      <BrowserRouter>
        <ApiProvider>
          <Home />
        </ApiProvider>
      </BrowserRouter>
    );
  };

  it('renders the search input', () => {
    renderHome();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('shows suggestions when typing', async () => {
    renderHome();
    const searchInput = screen.getByPlaceholderText(/search/i);
    await userEvent.type(searchInput, 'minnesota');

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });
}); 