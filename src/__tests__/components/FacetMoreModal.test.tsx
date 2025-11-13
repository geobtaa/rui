import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { FacetMoreModal } from '../../components/search/FacetMoreModal';

const mockSetPage = vi.fn();
const mockSetSort = vi.fn();
const mockSetFacetQuery = vi.fn();
const mockResetFacetQuery = vi.fn();

vi.mock('../../hooks/useFacetModal', () => ({
  useFacetModal: vi.fn(),
}));

import { useFacetModal } from '../../hooks/useFacetModal';

describe('FacetMoreModal', () => {
  const defaultProps = {
    facetId: 'resource_class_agg',
    facetLabel: 'Resource Type',
    isOpen: true,
    onClose: vi.fn(),
    searchParams: new URLSearchParams(),
    onToggleInclude: vi.fn(),
    onToggleExclude: vi.fn(),
    isValueIncluded: vi.fn(() => false),
    isValueExcluded: vi.fn(() => false),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetPage.mockReset();
    mockSetSort.mockReset();
    mockSetFacetQuery.mockReset();
    mockResetFacetQuery.mockReset();
    const mockUseFacetModal = vi.mocked(useFacetModal);
    mockUseFacetModal.mockReturnValue({
      items: [
        {
          type: 'facet_value' as const,
          id: 'alpha',
          attributes: {
            label: 'Alpha',
            value: 'alpha',
            hits: 42,
          },
        },
        {
          type: 'facet_value' as const,
          id: 'beta',
          attributes: {
            label: 'Beta',
            value: 'beta',
            hits: 21,
          },
        },
      ],
      meta: {
        totalCount: 2,
        totalPages: 1,
        currentPage: 1,
        perPage: 10,
      },
      isLoading: false,
      error: null,
      page: 1,
      perPage: 10,
      sort: 'count_desc' as const,
      qFacet: '',
      setPage: mockSetPage,
      setPerPage: vi.fn(),
      setSort: mockSetSort,
      setFacetQuery: mockSetFacetQuery,
      resetFacetQuery: mockResetFacetQuery,
      refetch: vi.fn(),
    });
  });

  it('does not render when closed', () => {
    render(<FacetMoreModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/More options for/)).not.toBeInTheDocument();
  });

  it('renders facet values when open', () => {
    render(<FacetMoreModal {...defaultProps} />);
    expect(
      screen.getByRole('heading', { name: /More options for Resource Type/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('invokes include and exclude callbacks', async () => {
    const user = userEvent.setup();
    render(<FacetMoreModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /Alpha/ }));
    expect(defaultProps.onToggleInclude).toHaveBeenCalledWith('alpha');

    await user.click(screen.getByRole('button', { name: /Exclude/ }));
    expect(defaultProps.onToggleExclude).toHaveBeenCalledWith('alpha');
  });

  it('changes sort order when selection changes', async () => {
    const user = userEvent.setup();
    render(<FacetMoreModal {...defaultProps} />);

    await user.selectOptions(
      screen.getByDisplayValue('Result Count (High → Low)'),
      'alpha_asc'
    );
    expect(mockSetSort).toHaveBeenCalledWith('alpha_asc');
  });

  it('submits facet search query', async () => {
    const user = userEvent.setup();
    render(<FacetMoreModal {...defaultProps} />);

    await user.type(
      screen.getByPlaceholderText('Search within facet values'),
      'roads'
    );
    await user.click(screen.getByRole('button', { name: /Filter/i }));

    expect(mockSetFacetQuery).toHaveBeenCalledWith('roads');
  });

  it('resets facet search query', async () => {
    const user = userEvent.setup();
    render(<FacetMoreModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /Reset/i }));
    expect(mockResetFacetQuery).toHaveBeenCalled();
  });

  it('navigates between pages', async () => {
    vi.mocked(useFacetModal).mockReturnValueOnce({
      items: [
        {
          type: 'facet_value' as const,
          id: 'alpha',
          attributes: {
            label: 'Alpha',
            value: 'alpha',
            hits: 42,
          },
        },
      ],
      meta: {
        totalCount: 30,
        totalPages: 3,
        currentPage: 1,
        perPage: 10,
      },
      page: 1,
      perPage: 10,
      sort: 'count_desc' as const,
      qFacet: '',
      isLoading: false,
      error: null,
      setPage: mockSetPage,
      setPerPage: vi.fn(),
      setSort: mockSetSort,
      setFacetQuery: mockSetFacetQuery,
      resetFacetQuery: mockResetFacetQuery,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    render(<FacetMoreModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /Next/i }));
    expect(mockSetPage).toHaveBeenCalledWith(2);
  });

  it('closes when Escape key is pressed', () => {
    render(<FacetMoreModal {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});


