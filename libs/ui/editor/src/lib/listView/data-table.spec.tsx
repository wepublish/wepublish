import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { DataTable, DataTableColumn } from './data-table';

const theme = createTheme();

type Row = { id: string; title: string; author: string };

const rows: Row[] = [
  { id: '1', title: 'Alpha', author: 'Ada' },
  { id: '2', title: 'Beta', author: 'Grace' },
];

const columns: DataTableColumn<Row>[] = [
  { id: 'title', label: 'Title', render: row => row.title },
  { id: 'author', label: 'Author', render: row => row.author, width: 120 },
];

const renderTable = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <DataTable
        data={rows}
        columns={columns}
        {...props}
      />
    </ThemeProvider>
  );

describe('DataTable', () => {
  it('renders a header per column and a row per record', () => {
    renderTable();

    expect(
      screen.getByRole('columnheader', { name: 'Title' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Author' })
    ).toBeInTheDocument();

    // one header row plus one row per record
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('cell', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Grace' })).toBeInTheDocument();
  });

  it('hides the columns the caller says are hidden', () => {
    renderTable({ hiddenColumns: ['author'] });

    expect(
      screen.getByRole('columnheader', { name: 'Title' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Author' })
    ).not.toBeInTheDocument();
  });

  it('sorts by the column id when it has no separate sort key', () => {
    const onSort = vi.fn();
    renderTable({ sortable: ['title'], onSort });

    fireEvent.click(screen.getByRole('button', { name: /title/i }));

    expect(onSort).toHaveBeenCalledWith('title', 'asc');
  });

  it('marks the sorted column for assistive technology', () => {
    renderTable({
      sortable: ['title'],
      sortColumn: 'title',
      sortOrder: 'desc',
    });

    expect(
      screen.getByRole('columnheader', { name: /title/i })
    ).toHaveAttribute('aria-sort', 'descending');
  });

  it('shows a loading indicator instead of rows while loading', () => {
    renderTable({ loading: true, data: [] });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('tells the user when there is nothing to show', () => {
    renderTable({ data: [], emptyMessage: 'No articles yet' });

    expect(screen.getByText('No articles yet')).toBeInTheDocument();
  });

  it('lets a row be clicked', () => {
    const onRowClick = vi.fn();
    renderTable({ onRowClick });

    fireEvent.click(
      within(screen.getByRole('cell', { name: 'Alpha' })).getByText('Alpha')
    );

    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });
});

describe('DataTable column widths', () => {
  it('lets an unpinned column grow past its preferred width', () => {
    renderTable();

    expect(screen.getByRole('columnheader', { name: 'Author' })).toHaveStyle({
      width: 'auto',
      minWidth: '120px',
    });
  });

  it('pins a column that asks to be fixed', () => {
    renderTable({
      columns: [{ ...columns[1], fixed: true }],
    });

    expect(screen.getByRole('columnheader', { name: 'Author' })).toHaveStyle({
      width: '120px',
    });
  });
});

describe('DataTable empty state', () => {
  it('falls back to a translated message when the caller gives none', () => {
    renderTable({ data: [] });

    expect(screen.getByText('listView.table.empty')).toBeInTheDocument();
  });
});

describe('DataTable sort keys', () => {
  // The list views sort on the server, and the field the API expects is not
  // always the column id — `publicationDate` sorts by `publishedAt`.
  const keyed: DataTableColumn<Row>[] = [
    { id: 'title', label: 'Title', render: row => row.title },
    {
      id: 'publicationDate',
      label: 'Published',
      sortKey: 'publishedAt',
      render: row => row.author,
    },
  ];

  it('reports the sort key rather than the column id', () => {
    const onSort = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <DataTable
          data={rows}
          columns={keyed}
          sortable={['publishedAt']}
          onSort={onSort}
        />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /published/i }));

    expect(onSort).toHaveBeenCalledWith('publishedAt', 'asc');
  });

  it('marks the column active by its sort key', () => {
    render(
      <ThemeProvider theme={theme}>
        <DataTable
          data={rows}
          columns={keyed}
          sortable={['publishedAt']}
          sortColumn="publishedAt"
          sortOrder="desc"
        />
      </ThemeProvider>
    );

    expect(
      screen.getByRole('columnheader', { name: /published/i })
    ).toHaveAttribute('aria-sort', 'descending');
  });
});
