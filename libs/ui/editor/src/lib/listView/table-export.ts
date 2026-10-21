import { ReactNode } from 'react';
import writeXlsxFile from 'write-excel-file/browser';

export type TableExportFormat = 'csv' | 'xlsx';

export type TableExportScope = 'page' | 'all';

export type TableExportValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export type ExportableColumn<Row> = {
  id: string;
  label: ReactNode;
  columnLabel?: string;
  render: (row: Row) => ReactNode;
  exportValue?: ((row: Row) => TableExportValue) | false;
};

export type TableExportColumn<Row> = {
  header: string;
  value: (row: Row) => TableExportValue;
};

const MAX_PAGE_SIZE = 100;

const COLUMN_WIDTH = 22;

const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

const isPlainValue = (value: unknown): value is TableExportValue =>
  value === null ||
  value === undefined ||
  value instanceof Date ||
  ['string', 'number', 'boolean'].includes(typeof value);

const renderedValue =
  <Row>(render: (row: Row) => ReactNode) =>
  (row: Row): TableExportValue => {
    try {
      const value = render(row);

      return isPlainValue(value) ? value : null;
    } catch {
      return null;
    }
  };

const hasValue = (value: TableExportValue) =>
  value !== null && value !== undefined && value !== '';

const headerOf = <Row>(column: ExportableColumn<Row>) =>
  column.columnLabel ??
  (typeof column.label === 'string' ? column.label : column.id);

export function getExportColumns<Row>(
  columns: ReadonlyArray<ExportableColumn<Row>>,
  rows: Row[]
): TableExportColumn<Row>[] {
  return columns.flatMap(column => {
    if (column.exportValue === false) {
      return [];
    }

    if (column.exportValue) {
      return [{ header: headerOf(column), value: column.exportValue }];
    }

    const value = renderedValue(column.render);

    if (!rows.some(row => hasValue(value(row)))) {
      return [];
    }

    return [{ header: headerOf(column), value }];
  });
}

function toCsvCell(value: TableExportValue): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'number') {
    return `${value}`;
  }

  const text = `${value}`;
  const safe = FORMULA_TRIGGER.test(text) ? `'${text}` : text;

  return `"${safe.replace(/"/g, '""')}"`;
}

export function toCsv<Row>(
  columns: TableExportColumn<Row>[],
  rows: Row[]
): string {
  return [
    columns.map(column => toCsvCell(column.header)),
    ...rows.map(row => columns.map(column => toCsvCell(column.value(row)))),
  ]
    .map(line => line.join(','))
    .join('\r\n');
}

export function toXlsxRows<Row>(
  columns: TableExportColumn<Row>[],
  rows: Row[]
) {
  return [
    columns.map(column => ({
      value: column.header,
      fontWeight: 'bold' as const,
    })),
    ...rows.map(row =>
      columns.map(column => {
        const value = column.value(row);

        if (value === null || value === undefined) {
          return null;
        }

        if (value instanceof Date) {
          return { value, type: Date, format: 'yyyy-mm-dd hh:mm' };
        }

        return { value };
      })
    ),
  ];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadTable<Row>({
  format,
  columns,
  rows,
  filename,
}: {
  format: TableExportFormat;
  columns: TableExportColumn<Row>[];
  rows: Row[];
  filename: string;
}) {
  if (format === 'xlsx') {
    await writeXlsxFile(toXlsxRows(columns, rows), {
      columns: columns.map(() => ({ width: COLUMN_WIDTH })),
    }).toFile(`${filename}.xlsx`);

    return;
  }

  downloadBlob(
    new Blob([`\uFEFF${toCsv(columns, rows)}`], {
      type: 'text/csv;charset=utf-8;',
    }),
    `${filename}.csv`
  );
}

export async function fetchAllPages<Node>(
  fetchPage: (
    skip: number,
    take: number
  ) => Promise<{ nodes: Node[]; totalCount: number }>
): Promise<Node[]> {
  const all: Node[] = [];

  for (;;) {
    const { nodes, totalCount } = await fetchPage(all.length, MAX_PAGE_SIZE);
    all.push(...nodes);

    if (nodes.length < MAX_PAGE_SIZE || all.length >= totalCount) {
      return all;
    }
  }
}
