import { createElement } from 'react';

import {
  fetchAllPages,
  getExportColumns,
  toCsv,
  toXlsxRows,
} from './table-export';

type Row = { id: string; title: string; views: number; createdAt: string };

const rows: Row[] = [
  { id: '1', title: 'Alpha', views: 3, createdAt: '2026-01-02T10:00:00.000Z' },
  {
    id: '2',
    title: 'Be "ta"',
    views: 0,
    createdAt: '2026-02-03T11:30:00.000Z',
  },
];

describe('getExportColumns', () => {
  it('keeps the columns whose cells render plain values', () => {
    const columns = getExportColumns(
      [
        { id: 'title', label: 'Title', render: (row: Row) => row.title },
        { id: 'views', label: 'Views', render: (row: Row) => row.views },
      ],
      rows
    );

    expect(columns.map(column => column.header)).toEqual(['Title', 'Views']);
  });

  it('drops columns that only render elements, like the actions', () => {
    const columns = getExportColumns(
      [
        { id: 'title', label: 'Title', render: (row: Row) => row.title },
        {
          id: 'action',
          label: 'Action',
          render: () => createElement('button', null, 'Delete'),
        },
      ],
      rows
    );

    expect(columns.map(column => column.header)).toEqual(['Title']);
  });

  it('uses the export value over the rendered cell', () => {
    const columns = getExportColumns(
      [
        {
          id: 'title',
          label: 'Title',
          render: (row: Row) => createElement('a', null, row.title),
          exportValue: (row: Row) => row.title,
        },
      ],
      rows
    );

    expect(columns[0].value(rows[0])).toBe('Alpha');
  });

  it('leaves out a column whose export value is opted out', () => {
    const columns = getExportColumns(
      [
        { id: 'title', label: 'Title', render: (row: Row) => row.title },
        {
          id: 'secret',
          label: 'Secret',
          render: (row: Row) => row.id,
          exportValue: false,
        },
      ],
      rows
    );

    expect(columns.map(column => column.header)).toEqual(['Title']);
  });

  it('names a column by its column label when the label is not text', () => {
    const columns = getExportColumns(
      [
        {
          id: 'title',
          label: createElement('span', null, 'Title'),
          columnLabel: 'Headline',
          render: (row: Row) => row.title,
        },
      ],
      rows
    );

    expect(columns[0].header).toBe('Headline');
  });

  it('blanks out a cell that renders an element in an otherwise plain column', () => {
    const columns = getExportColumns(
      [
        {
          id: 'title',
          label: 'Title',
          render: (row: Row) =>
            row.views ? row.title : createElement('em', null, 'none'),
        },
      ],
      rows
    );

    expect(rows.map(columns[0].value)).toEqual(['Alpha', null]);
  });
});

describe('toCsv', () => {
  const columns = [
    { header: 'Title', value: (row: Row) => row.title },
    { header: 'Views', value: (row: Row) => row.views },
    { header: 'Created', value: (row: Row) => new Date(row.createdAt) },
  ];

  it('writes a header line and one line per row, quoting text', () => {
    expect(toCsv(columns, rows)).toBe(
      [
        '"Title","Views","Created"',
        '"Alpha",3,2026-01-02T10:00:00.000Z',
        '"Be ""ta""",0,2026-02-03T11:30:00.000Z',
      ].join('\r\n')
    );
  });

  it('defuses values a spreadsheet would run as a formula', () => {
    expect(
      toCsv(
        [{ header: 'Name', value: () => '=HYPERLINK("http://evil")' }],
        [rows[0]]
      ).split('\r\n')[1]
    ).toBe(`"'=HYPERLINK(""http://evil"")"`);
  });

  it('writes empty cells for missing values', () => {
    expect(
      toCsv([{ header: 'Name', value: () => null }], [rows[0]]).split('\r\n')[1]
    ).toBe('');
  });

  it('writes booleans as words', () => {
    expect(
      toCsv([{ header: 'Active', value: () => true }], [rows[0]]).split(
        '\r\n'
      )[1]
    ).toBe('"true"');
  });
});

describe('toXlsxRows', () => {
  it('bolds the header and keeps dates as dates', () => {
    const created = new Date(rows[0].createdAt);
    const [header, first] = toXlsxRows(
      [
        { header: 'Title', value: (row: Row) => row.title },
        { header: 'Created', value: () => created },
        { header: 'Empty', value: () => undefined },
      ],
      [rows[0]]
    );

    expect(header).toEqual([
      { value: 'Title', fontWeight: 'bold' },
      { value: 'Created', fontWeight: 'bold' },
      { value: 'Empty', fontWeight: 'bold' },
    ]);
    expect(first).toEqual([
      { value: 'Alpha' },
      { value: created, type: Date, format: 'yyyy-mm-dd hh:mm' },
      null,
    ]);
  });
});

describe('fetchAllPages', () => {
  it('pages through every result with the largest page the api allows', async () => {
    const all = Array.from({ length: 230 }, (_, index) => index);
    const fetchPage = vi.fn(async (skip: number, take: number) => ({
      nodes: all.slice(skip, skip + take),
      totalCount: all.length,
    }));

    await expect(fetchAllPages(fetchPage)).resolves.toEqual(all);
    expect(fetchPage.mock.calls).toEqual([
      [0, 100],
      [100, 100],
      [200, 100],
    ]);
  });

  it('stops when a page comes back short even if the count says otherwise', async () => {
    const fetchPage = vi.fn(async () => ({ nodes: [1, 2], totalCount: 500 }));

    await expect(fetchAllPages(fetchPage)).resolves.toEqual([1, 2]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
