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
      screen.getByRole('button', { name: /go to page 10/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /go to last page/i })
    ).toBeInTheDocument();
  });

  it('reports the page the user picked', () => {
    const { setPage } = renderPagination();

    fireEvent.click(screen.getByRole('button', { name: /go to page 3/i }));

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
