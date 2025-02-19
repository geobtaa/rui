import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ItemView } from '../../pages/ItemView';
import { ApiProvider } from '../../context/ApiContext';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: 'test-id' }),
}));

describe('Item View Page', () => {
  const renderItemView = () => {
    render(
      <BrowserRouter>
        <ApiProvider>
          <ItemView />
        </ApiProvider>
      </BrowserRouter>
    );
  };

  it('displays item details', async () => {
    renderItemView();
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('shows the location map when geometry is available', async () => {
    renderItemView();
    await waitFor(() => {
      expect(screen.getByText(/location/i)).toBeInTheDocument();
    });
  });
});
