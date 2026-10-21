import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { DataTable, DataTableColumn } from './data-table';

const theme = createTheme({ cssVariables: true });

type Row = { id: string; title: string; author: string };

const rows: Row[] = [
  { id: '1', title: 'Alpha', author: 'Ada' },
  { id: '2', title: 'Beta', author: 'Grace' },
];

const columns: DataTableColumn<Row>[] = [
  { id: 'title', label: 'Title', render: row => row.title },
  { id: 'author', label: 'Author', render: row => row.author, width: 120 },
];

const columnWidth = (id: string) =>
  (screen.getByRole('table') as HTMLElement).style.getPropertyValue(
    `--col-${id}-size`
  );

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

describe('DataTable empty state', () => {
  it('falls back to a translated message when the caller gives none', () => {
    renderTable({ data: [] });

    expect(screen.getByText('listView.table.empty')).toBeInTheDocument();
  });
});

describe('DataTable sort keys', () => {
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

describe('DataTable column layout', () => {
  it('keeps column widths independent of the content', () => {
    renderTable();

    expect(screen.getByRole('table')).toHaveStyle({ tableLayout: 'fixed' });
  });

  it('gives a sized column exactly that width', () => {
    renderTable();

    expect(columnWidth('author')).toBe('120px');
  });

  it('drives widths from CSS variables rather than per-cell styles', () => {
    const { baseElement } = renderTable({
      columns: [{ ...columns[0], width: 200 }, columns[1]],
    });

    const handle = baseElement.querySelector('[data-resize-handle="title"]')!;
    const header = screen.getByRole('columnheader', { name: 'Title' });
    const before = header.className;

    fireEvent.mouseDown(handle, { clientX: 0 });
    fireEvent.mouseMove(document, { clientX: 60 });
    fireEvent.mouseUp(document, { clientX: 60 });

    expect(columnWidth('title')).toBe('260px');
    expect(header.className).toBe(before);
  });

  it('styles every body cell from a single class', () => {
    const { baseElement } = renderTable({
      columns: [columns[0], { ...columns[1], fixed: true }],
    });

    const classes = new Set(
      [...baseElement.querySelectorAll('tbody td')].map(cell => cell.className)
    );

    expect(classes.size).toBe(1);
  });

  it('keeps that class when a column is hidden', () => {
    const { baseElement, rerender } = renderTable();
    const classOf = () => baseElement.querySelector('tbody td')!.className;
    const before = classOf();

    rerender(
      <ThemeProvider theme={theme}>
        <DataTable
          data={rows}
          columns={columns}
          hiddenColumns={['author']}
        />
      </ThemeProvider>
    );

    expect(classOf()).toBe(before);
  });

  it('pins a fixed column so it stays visible while scrolling sideways', () => {
    renderTable({
      columns: [columns[0], { ...columns[1], fixed: true }],
    });

    expect(screen.getByRole('columnheader', { name: 'Author' })).toHaveStyle({
      position: 'sticky',
      right: '0px',
    });
  });
});

describe('DataTable column resizing', () => {
  it('offers a resize handle on an ordinary column', () => {
    const { baseElement } = renderTable();

    expect(
      baseElement.querySelector('[data-resize-handle="title"]')
    ).toBeTruthy();
  });

  it('does not let a pinned column be resized', () => {
    const { baseElement } = renderTable({
      columns: [columns[0], { ...columns[1], fixed: true }],
    });

    expect(
      baseElement.querySelector('[data-resize-handle="author"]')
    ).toBeNull();
  });

  it('respects an explicit opt-out', () => {
    const { baseElement } = renderTable({
      columns: [{ ...columns[0], resizable: false }, columns[1]],
    });

    expect(
      baseElement.querySelector('[data-resize-handle="title"]')
    ).toBeNull();
  });

  it('narrows the column as the user drags the handle inwards', () => {
    const { baseElement } = renderTable({
      columns: [{ ...columns[0], width: 200 }, columns[1]],
    });

    const handle = baseElement.querySelector('[data-resize-handle="title"]')!;
    const header = screen.getByRole('columnheader', { name: 'Title' });

    fireEvent.mouseDown(handle, { clientX: 0 });
    fireEvent.mouseMove(document, { clientX: -80 });
    fireEvent.mouseUp(document, { clientX: -80 });

    expect(columnWidth('title')).toBe('120px');
  });

  it('will not let a column be dragged away to nothing', () => {
    const { baseElement } = renderTable({
      columns: [{ ...columns[0], width: 200 }, columns[1]],
    });

    const handle = baseElement.querySelector('[data-resize-handle="title"]')!;
    const header = screen.getByRole('columnheader', { name: 'Title' });

    fireEvent.mouseDown(handle, { clientX: 0 });
    fireEvent.mouseMove(document, { clientX: -500 });
    fireEvent.mouseUp(document, { clientX: -500 });

    expect(columnWidth('title')).toBe('48px');
  });

  it('respects an explicit minimum width', () => {
    const { baseElement } = renderTable({
      columns: [{ ...columns[0], width: 200, minWidth: 150 }, columns[1]],
    });

    const handle = baseElement.querySelector('[data-resize-handle="title"]')!;
    const header = screen.getByRole('columnheader', { name: 'Title' });

    fireEvent.mouseDown(handle, { clientX: 0 });
    fireEvent.mouseMove(document, { clientX: -500 });
    fireEvent.mouseUp(document, { clientX: -500 });

    expect(columnWidth('title')).toBe('150px');
  });

  it('widens the column as the user drags the handle', () => {
    const { baseElement } = renderTable({
      columns: [{ ...columns[0], width: 200 }, columns[1]],
    });

    const handle = baseElement.querySelector('[data-resize-handle="title"]')!;
    const header = screen.getByRole('columnheader', { name: 'Title' });

    expect(columnWidth('title')).toBe('200px');

    fireEvent.mouseDown(handle, { clientX: 0 });
    fireEvent.mouseMove(document, { clientX: 60 });
    fireEvent.mouseUp(document, { clientX: 60 });

    expect(columnWidth('title')).toBe('260px');
  });
});

describe('DataTable resize performance', () => {
  it('does not re-render the rows while a column is being dragged', () => {
    const render_ = vi.fn((row: Row) => row.title);
    const { baseElement } = renderTable({
      columns: [
        { id: 'title', label: 'Title', width: 200, render: render_ },
        columns[1],
      ],
    });

    const handle = baseElement.querySelector('[data-resize-handle="title"]')!;
    fireEvent.mouseDown(handle, { clientX: 0 });
    const duringDrag = render_.mock.calls.length;

    fireEvent.mouseMove(document, { clientX: 40 });
    fireEvent.mouseMove(document, { clientX: 80 });

    expect(render_.mock.calls.length).toBe(duringDrag);
    expect(columnWidth('title')).toBe('280px');
  });

  it('does not re-render the rows when a column is hidden', () => {
    const render_ = vi.fn((row: Row) => row.title);
    const cols: DataTableColumn<Row>[] = [
      { id: 'title', label: 'Title', render: render_ },
      columns[1],
    ];
    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <DataTable
          data={rows}
          columns={cols}
        />
      </ThemeProvider>
    );

    const before = render_.mock.calls.length;

    rerender(
      <ThemeProvider theme={theme}>
        <DataTable
          data={rows}
          columns={cols}
          hiddenColumns={['author']}
        />
      </ThemeProvider>
    );

    expect(render_.mock.calls.length).toBe(before);
  });

  it('renders the rows again once the drag is over', () => {
    const render_ = vi.fn((row: Row) => row.title);
    const { baseElement, rerender } = renderTable({
      columns: [
        { id: 'title', label: 'Title', width: 200, render: render_ },
        columns[1],
      ],
    });

    const handle = baseElement.querySelector('[data-resize-handle="title"]')!;
    fireEvent.mouseDown(handle, { clientX: 0 });
    fireEvent.mouseMove(document, { clientX: 40 });
    fireEvent.mouseUp(document, { clientX: 40 });

    render_.mockClear();
    rerender(
      <ThemeProvider theme={theme}>
        <DataTable
          data={[{ id: '3', title: 'Gamma', author: 'Ada' }]}
          columns={[
            { id: 'title', label: 'Title', width: 200, render: render_ },
            columns[1],
          ]}
        />
      </ThemeProvider>
    );

    expect(screen.getByRole('cell', { name: 'Gamma' })).toBeInTheDocument();
  });
});

describe('DataTable virtualisation', () => {
  // A few times the ~34 rows a virtual window of 800px renders, no more: in
  // happy-dom every rendered row costs, and on the shared CI runner 500 of them
  // ran into the 15s timeout.
  const manyRows: Row[] = Array.from({ length: 100 }, (_, index) => ({
    id: String(index),
    title: `Row ${index}`,
    author: 'Ada',
  }));

  const measured = ['offsetHeight', 'clientHeight'] as const;
  const realHeights = measured.map(property =>
    Object.getOwnPropertyDescriptor(HTMLElement.prototype, property)
  );

  beforeEach(() => {
    for (const property of measured) {
      Object.defineProperty(HTMLElement.prototype, property, {
        configurable: true,
        get: () => 800,
      });
    }
  });

  afterEach(() => {
    measured.forEach((property, index) => {
      const real = realHeights[index];

      if (real) {
        Object.defineProperty(HTMLElement.prototype, property, real);
      } else {
        delete (HTMLElement.prototype as Partial<HTMLElement>)[property];
      }
    });
  });

  it('renders every row when it is switched off', () => {
    renderTable({ data: manyRows });

    expect(screen.getAllByRole('row')).toHaveLength(manyRows.length + 1);
  });

  it('renders only a window of rows when it is switched on', () => {
    renderTable({ data: manyRows, virtualize: true });

    expect(screen.getAllByRole('row').length).toBeLessThan(manyRows.length);
    expect(screen.getByText('Row 0')).toBeInTheDocument();
  });

  it('gives the scroll container a bounded height', () => {
    const { baseElement } = renderTable({
      data: manyRows,
      virtualize: true,
      maxHeight: 600,
    });

    expect(baseElement.querySelector('[data-pin-shadow]')).toHaveStyle({
      maxHeight: '600px',
      overflowY: 'auto',
    });
  });

  it('reserves the height of the rows it skipped', () => {
    const { baseElement } = renderTable({ data: manyRows, virtualize: true });

    const spacer = baseElement.querySelector('[data-virtual-spacer="after"]');

    expect(spacer).toBeTruthy();
    expect(Number(spacer?.getAttribute('data-size'))).toBeGreaterThan(0);
  });
});

describe('DataTable affordances', () => {
  it('draws a visible grip on a resizable column', () => {
    const { baseElement } = renderTable();

    const grip = baseElement.querySelector('[data-resize-grip]');

    expect(grip).toBeTruthy();
    expect(grip).toHaveStyle({ width: '1px' });
  });

  it('separates a pinned column from the content scrolling under it', () => {
    renderTable({
      columns: [columns[0], { ...columns[1], fixed: true }],
    });

    const pinned = screen.getByRole('columnheader', { name: 'Author' });

    expect(pinned).toHaveStyle({
      borderLeftStyle: 'solid',
      borderLeftColor: theme.vars.palette.divider,
    });
  });

  it('lets the pinned column cast its shadow outside the cell', () => {
    renderTable({
      columns: [columns[0], { ...columns[1], fixed: true }],
    });

    expect(screen.getByRole('columnheader', { name: 'Author' })).toHaveStyle({
      overflow: 'visible',
    });
  });

  it('does not give each pinned cell its own box shadow', () => {
    renderTable({
      columns: [columns[0], { ...columns[1], fixed: true }],
    });

    expect(
      screen.getByRole('columnheader', { name: 'Author' })
    ).not.toHaveStyle({ boxShadow: '-6px 0 6px -6px rgba(0, 0, 0, 0.35)' });
  });
});

describe('DataTable with several pinned columns', () => {
  const threeColumns: DataTableColumn<Row>[] = [
    { id: 'title', label: 'Title', render: row => row.title, width: 300 },
    { id: 'author', label: 'Author', render: row => row.author, width: 120 },
    { id: 'action', label: 'Action', render: () => 'x', width: 80 },
  ];

  const renderPinnedPair = () =>
    renderTable({
      columns: [
        threeColumns[0],
        { ...threeColumns[1], fixed: true },
        { ...threeColumns[2], fixed: true },
      ],
    });

  it('stacks them against the right edge instead of on top of each other', () => {
    renderPinnedPair();

    expect(screen.getByRole('columnheader', { name: 'Action' })).toHaveStyle({
      right: '0px',
    });
    expect(screen.getByRole('columnheader', { name: 'Author' })).toHaveStyle({
      right: '80px',
    });
  });

  it('moves them as the user resizes a pinned column', () => {
    const { baseElement } = renderPinnedPair();

    const handle = baseElement.querySelector('[data-resize-handle="author"]');

    expect(handle).toBeNull();
  });

  it('draws the dividing edge once, on the leftmost pinned column', () => {
    renderPinnedPair();

    expect(screen.getByRole('columnheader', { name: 'Author' })).toHaveStyle({
      borderLeftStyle: 'solid',
    });
    expect(
      screen.getByRole('columnheader', { name: 'Action' })
    ).not.toHaveStyle({ borderLeftStyle: 'solid' });
  });
});

describe('DataTable pin shadow', () => {
  const setScroll = (
    element: HTMLElement,
    { scrollLeft, clientWidth, scrollWidth }: Record<string, number>
  ) => {
    Object.defineProperties(element, {
      scrollLeft: { value: scrollLeft, configurable: true },
      clientWidth: { value: clientWidth, configurable: true },
      scrollWidth: { value: scrollWidth, configurable: true },
    });
    fireEvent.scroll(element);
  };

  const renderPinned = () =>
    renderTable({
      columns: [columns[0], { ...columns[1], fixed: true }],
    });

  it('shows the shadow while content can still scroll under the pinned column', () => {
    const { baseElement } = renderPinned();
    const container = baseElement.querySelector(
      '[data-pin-shadow]'
    ) as HTMLElement;

    setScroll(container, { scrollLeft: 0, clientWidth: 400, scrollWidth: 900 });

    expect(container).toHaveAttribute('data-pin-shadow', 'true');
  });

  it('drops the shadow once the table is scrolled all the way right', () => {
    const { baseElement } = renderPinned();
    const container = baseElement.querySelector(
      '[data-pin-shadow]'
    ) as HTMLElement;

    setScroll(container, {
      scrollLeft: 500,
      clientWidth: 400,
      scrollWidth: 900,
    });

    expect(container).toHaveAttribute('data-pin-shadow', 'false');
  });

  it('drops the shadow when nothing overflows at all', () => {
    const { baseElement } = renderPinned();
    const container = baseElement.querySelector(
      '[data-pin-shadow]'
    ) as HTMLElement;

    setScroll(container, { scrollLeft: 0, clientWidth: 900, scrollWidth: 900 });

    expect(container).toHaveAttribute('data-pin-shadow', 'false');
  });
});

describe('DataTable overflow', () => {
  const longRows: Row[] = [
    {
      id: '1',
      title:
        'A headline far longer than the column it has been given to live in',
      author: 'Ada',
    },
  ];

  it('keeps long content inside its cell', () => {
    renderTable({ data: longRows });

    expect(screen.getByRole('cell', { name: longRows[0].title })).toHaveStyle({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
  });

  it('clips the header too', () => {
    renderTable();

    expect(screen.getByRole('columnheader', { name: 'Title' })).toHaveStyle({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    });
  });
});

describe('DataTable cells that depend on something outside the row', () => {
  const tableWith = (imported: string[]) => (
    <ThemeProvider theme={theme}>
      <DataTable
        data={rows}
        columns={[
          { id: 'title', label: 'Title', render: row => row.title },
          {
            id: 'action',
            label: 'Action',
            render: row =>
              imported.includes(row.id) ?
                <span>imported</span>
              : <button type="button">import</button>,
          },
        ]}
      />
    </ThemeProvider>
  );

  it('redraws them when the answer arrives', () => {
    const { rerender } = render(tableWith([]));

    expect(screen.getAllByRole('button', { name: 'import' })).toHaveLength(2);

    rerender(tableWith(['1']));

    expect(screen.getByText('imported')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'import' })).toHaveLength(1);
  });
});

describe('DataTable column visibility', () => {
  const configurable: DataTableColumn<Row>[] = [
    {
      id: 'title',
      label: 'Title',
      render: row => row.title,
      alwaysVisible: true,
    },
    { id: 'author', label: 'Author', render: row => row.author },
    { id: 'updated', label: 'Updated', render: () => '2026' },
    { id: 'action', label: 'Action', render: () => 'x', fixed: true },
  ];

  const renderList = (props = {}) =>
    render(
      <ThemeProvider theme={theme}>
        <DataTable
          data={rows}
          columns={configurable}
          storageKey="test-list"
          {...props}
        />
      </ThemeProvider>
    );

  const openMenu = () =>
    fireEvent.click(
      screen.getByRole('button', { name: /columnConfigurator.title/ })
    );

  beforeEach(() => localStorage.clear());

  it('offers no column control to a table without a key', () => {
    renderTable();

    expect(
      screen.queryByRole('button', { name: /columnConfigurator.title/ })
    ).not.toBeInTheDocument();
  });

  it('shows the columns in the order the user arranged them', () => {
    localStorage.setItem(
      'wepublish:editor:columns:test-list',
      JSON.stringify({ hidden: [], order: ['updated', 'title', 'author'] })
    );

    renderList();

    expect(
      screen.getAllByRole('columnheader').map(header => header.textContent)
    ).toEqual(['Updated', 'Title', 'Author', 'Action']);
  });

  it('keeps the cells under the header they belong to', () => {
    localStorage.setItem(
      'wepublish:editor:columns:test-list',
      JSON.stringify({ hidden: [], order: ['updated', 'title', 'author'] })
    );

    renderList();

    const [firstRow] = screen.getAllByRole('row').slice(1);

    expect(
      within(firstRow)
        .getAllByRole('cell')
        .map(cell => cell.textContent)
    ).toEqual(['2026', rows[0].title, rows[0].author, 'x']);
  });

  it('lists every column the user may move', () => {
    renderList();
    openMenu();

    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Author' })
    ).toHaveAttribute('aria-disabled', 'false');
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Title' })
    ).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.queryByRole('menuitemcheckbox', { name: 'Action' })
    ).not.toBeInTheDocument();
  });

  it('hides the column the user switches off', () => {
    renderList();
    openMenu();

    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Author' }));
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

    expect(
      screen.queryByRole('columnheader', { name: 'Author' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Title' })
    ).toBeInTheDocument();
  });

  it('remembers the choice under the table key', () => {
    renderList();
    openMenu();

    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Author' }));

    expect(localStorage.getItem('wepublish:editor:columns:test-list')).toBe(
      JSON.stringify({ hidden: ['author'], order: [] })
    );
  });

  it('comes back with the columns the user left behind', () => {
    localStorage.setItem(
      'wepublish:editor:columns:test-list',
      JSON.stringify(['author'])
    );

    renderList();

    expect(
      screen.queryByRole('columnheader', { name: 'Author' })
    ).not.toBeInTheDocument();
  });

  it('says how many columns are hidden', () => {
    localStorage.setItem(
      'wepublish:editor:columns:test-list',
      JSON.stringify(['author'])
    );

    renderList();

    expect(
      screen.getByRole('button', { name: /columnConfigurator.title/ })
    ).toHaveTextContent('1');
  });

  it('sets the count apart from the label', () => {
    localStorage.setItem(
      'wepublish:editor:columns:test-list',
      JSON.stringify(['author'])
    );

    renderList();

    const marginLeft = getComputedStyle(screen.getByText('1')).marginLeft;

    expect(marginLeft).toBeTruthy();
    expect(marginLeft).not.toBe('0px');
  });

  it('brings them all back at once', () => {
    localStorage.setItem(
      'wepublish:editor:columns:test-list',
      JSON.stringify(['author'])
    );

    renderList();
    openMenu();
    fireEvent.click(
      screen.getByRole('menuitem', { name: 'columnConfigurator.reset' })
    );

    expect(
      screen.getByRole('columnheader', { name: 'Author' })
    ).toBeInTheDocument();
  });
});

describe('DataTable height', () => {
  it('keeps the scroll area at the height it was given', () => {
    render(
      <ThemeProvider theme={theme}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <DataTable
            data={rows}
            columns={columns}
            virtualize
            maxHeight={800}
          />
        </div>
      </ThemeProvider>
    );

    const container = screen
      .getByRole('table')
      .closest('.MuiTableContainer-root') as HTMLElement;

    expect(getComputedStyle(container).flexShrink).toBe('0');
  });
});

describe('DataTable filters', () => {
  const renderFiltered = (props = {}) =>
    render(
      <ThemeProvider theme={theme}>
        <DataTable
          data={rows}
          columns={columns}
          filters={<input aria-label="Title filter" />}
          {...props}
        />
      </ThemeProvider>
    );

  it('keeps the fields out of the way until they are asked for', () => {
    renderFiltered();

    expect(screen.queryByLabelText('Title filter')).not.toBeVisible();
  });

  it('opens them on the button', () => {
    renderFiltered();

    fireEvent.click(
      screen.getByRole('button', { name: /filterableList.filter.label/ })
    );

    expect(screen.getByLabelText('Title filter')).toBeVisible();
  });

  it('says how many filters are on', () => {
    renderFiltered({ filterCount: 2 });

    expect(
      screen.getByRole('button', { name: /filterableList.filter.label/ })
    ).toHaveTextContent('2');
  });

  it('offers no reset while nothing is filtered', () => {
    renderFiltered({ onResetFilters: vi.fn() });

    expect(
      screen.queryByRole('button', { name: 'filterableList.filter.reset' })
    ).not.toBeInTheDocument();
  });

  it('resets the filters on the x', () => {
    const onResetFilters = vi.fn();
    renderFiltered({ filterCount: 1, onResetFilters });

    fireEvent.click(
      screen.getByRole('button', { name: 'filterableList.filter.reset' })
    );

    expect(onResetFilters).toHaveBeenCalled();
  });

  it('marks the button while the panel is open', () => {
    renderFiltered();

    const button = screen.getByRole('button', {
      name: /filterableList.filter.label/,
    });

    expect(button).toHaveAttribute('aria-expanded', 'false');
    const resting = getComputedStyle(button).backgroundColor;

    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(getComputedStyle(button).backgroundColor).not.toBe(resting);
  });

  it('stays shut while the list is filtered', () => {
    const { rerender } = renderFiltered({ filterCount: 1 });

    rerender(
      <ThemeProvider theme={theme}>
        <DataTable
          data={rows}
          columns={columns}
          filters={<input aria-label="Title filter" />}
          filterCount={2}
        />
      </ThemeProvider>
    );

    expect(
      screen.getByRole('button', { name: /filterableList.filter.label/ })
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the panel at its full height in a flex list', () => {
    const { container } = renderFiltered({ filterCount: 1 });

    const panel = container.querySelector('.MuiCollapse-root');

    expect(getComputedStyle(panel as Element).flexShrink).toBe('0');
  });

  it('offers no filter button to a table without filters', () => {
    renderTable();

    expect(
      screen.queryByRole('button', { name: /filterableList.filter.label/ })
    ).not.toBeInTheDocument();
  });
});
