import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';

import { Pagination } from './pagination';

const theme = createTheme({ cssVariables: true });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const renderPagination = (overrides = {}) => {
  const setPage = vi.fn();
  const setLimit = vi.fn();
  const state = { page: 1, limit: 10, setPage, setLimit, ...overrides };

  render(
    <ThemeProvider theme={theme}>
      <Pagination
        state={state}
        totalCount={95}
      />
    </ThemeProvider>
  );

  return { setPage, setLimit };
};

describe('Pagination', () => {
  it('renders one button per page, capped by the ellipsis', () => {
    renderPagination();

    expect(
      screen.getByRole('button', {
        name: 'listView.pagination.page:{"page":10}',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'listView.pagination.last' })
    ).toBeInTheDocument();
  });

  it('names its page controls in the user language', () => {
    renderPagination({ page: 2 });

    expect(
      screen.getByRole('button', { name: 'listView.pagination.first' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'listView.pagination.previous' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'listView.pagination.next' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'listView.pagination.currentPage:{"page":2}',
      })
    ).toHaveAttribute('aria-current', 'page');
  });

  it('reports the page the user picked', () => {
    const { setPage } = renderPagination();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'listView.pagination.page:{"page":3}',
      })
    );

    expect(setPage).toHaveBeenCalledWith(3);
  });

  it('resets to the first page when the page size changes', () => {
    const { setLimit, setPage } = renderPagination({ page: 4 });

    fireEvent.change(
      screen.getByRole('combobox', { name: 'listView.pagination.pageSize' }),
      { target: { value: '20' } }
    );

    expect(setLimit).toHaveBeenCalledWith(20);
    expect(setPage).toHaveBeenCalledWith(1);
  });

  it('shows how many items there are in total', () => {
    renderPagination();

    expect(screen.getByText(/95/)).toBeInTheDocument();
  });

  it('announces the total when a filter changes it', () => {
    renderPagination();

    expect(screen.getByRole('status')).toHaveTextContent(
      'listView.pagination.total'
    );
  });

  it('names its navigation in the user language', () => {
    renderPagination();

    expect(
      screen.getByRole('navigation', { name: 'listView.pagination.label' })
    ).toBeInTheDocument();
  });

  it('takes a distinct name where a page has several', () => {
    render(
      <ThemeProvider theme={theme}>
        <Pagination
          label="Articles pages"
          state={{ page: 1, limit: 10, setPage: vi.fn(), setLimit: vi.fn() }}
          totalCount={95}
        />
      </ThemeProvider>
    );

    expect(
      screen.getByRole('navigation', { name: 'Articles pages' })
    ).toBeInTheDocument();
  });
});

describe('Pagination compact', () => {
  const renderCompact = () =>
    render(
      <ThemeProvider theme={theme}>
        <Pagination
          compact
          state={{ page: 1, limit: 10, setPage: vi.fn(), setLimit: vi.fn() }}
          totalCount={95}
        />
      </ThemeProvider>
    );

  it('leaves out the total and the page size', () => {
    renderCompact();

    expect(screen.queryByText(/listView.pagination.total/)).toBeNull();
    expect(screen.queryByLabelText('listView.pagination.pageSize')).toBeNull();
  });

  it('still pages', () => {
    renderCompact();

    expect(screen.getByRole('button', { name: /2/ })).toBeInTheDocument();
  });
});
