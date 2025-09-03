import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ResourceView } from '../../pages/ResourceView';
import { ApiProvider } from '../../context/ApiContext';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: 'test-id' }),
}));

describe('Resource View Page', () => {
  const renderResourceView = () => {
    render(
      <BrowserRouter>
        <ApiProvider>
          <ResourceView />
        </ApiProvider>
      </BrowserRouter>
    );
  };

  it('displays resource details', async () => {
    renderResourceView();
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('shows the location map when geometry is available', async () => {
    renderResourceView();
    await waitFor(() => {
      expect(screen.getByText(/location/i)).toBeInTheDocument();
    });
  });
});
