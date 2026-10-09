import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type SortOrder = 'asc' | 'desc';

export type DataTableColumn<Row> = {
  /** Stable key, also used for column visibility. */
  id: string;
  /**
   * Field the server sorts by, when it differs from the column id — the
   * `publicationDate` column sorts by `publishedAt`. Defaults to `id`.
   */
  sortKey?: string;
  label: ReactNode;
  render: (row: Row) => ReactNode;
  /**
   * Preferred width. Treated as a minimum unless `fixed` is set, so the
   * columns share the spare space instead of leaving a gap on the right the
   * way a table of purely fixed widths would.
   */
  width?: number;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  /** Pins the column to exactly `width`. */
  fixed?: boolean;
};

export type DataTableProps<Row> = {
  data: readonly Row[];
  columns: ReadonlyArray<DataTableColumn<Row>>;
  /** Column ids the user has switched off. */
  hiddenColumns?: readonly string[];
  /** Column ids that can be sorted. */
  sortable?: readonly string[];
  sortColumn?: string | null;
  sortOrder?: SortOrder;
  onSort?: (columnId: string, order: SortOrder) => void;
  onRowClick?: (row: Row) => void;
  loading?: boolean;
  emptyMessage?: ReactNode;
  /** Pulled out of the row for React's key; defaults to the index. */
  getRowId?: (row: Row, index: number) => string;
  /** Class for a row, e.g. to highlight the one the user just came back to. */
  rowClassName?: (row: Row) => string | undefined;
};

/**
 * The list views' table.
 *
 * TanStack Table owns the column model and visibility; MUI owns the markup, so
 * rows inherit the editor theme and dark mode. Sorting and paging stay with
 * the caller (the lists sort and page on the server), which is why the table
 * only reports what the user clicked.
 */
export function DataTable<Row>({
  data,
  columns,
  hiddenColumns,
  sortable,
  sortColumn,
  sortOrder = 'asc',
  onSort,
  onRowClick,
  loading,
  emptyMessage,
  getRowId,
  rowClassName,
}: DataTableProps<Row>) {
  const { t } = useTranslation();
  const columnDefs = useMemo<ColumnDef<Row>[]>(
    () =>
      columns.map(column => ({
        id: column.id,
        header: () => column.label,
        cell: ({ row }) => column.render(row.original),
        size: column.width,
        minSize: column.minWidth ?? column.width,
        meta: {
          align: column.align ?? 'left',
          fixed: column.fixed,
          sortKey: column.sortKey ?? column.id,
        },
      })),
    [columns]
  );

  const columnVisibility = useMemo<VisibilityState>(
    () =>
      Object.fromEntries((hiddenColumns ?? []).map(id => [id, false] as const)),
    [hiddenColumns]
  );

  const table = useReactTable({
    data: data as Row[],
    columns: columnDefs,
    state: { columnVisibility },
    getCoreRowModel: getCoreRowModel(),
    // The server does the sorting and paging.
    manualSorting: true,
    manualPagination: true,
    getRowId,
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const sortableIds = new Set(sortable ?? []);

  return (
    <TableContainer>
      <Table
        size="small"
        stickyHeader
      >
        <TableHead>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                const meta = header.column.columnDef.meta as
                  | {
                      align?: 'left' | 'center' | 'right';
                      fixed?: boolean;
                      sortKey?: string;
                    }
                  | undefined;
                const sortKey = meta?.sortKey ?? header.column.id;
                const canSort = sortableIds.has(sortKey);
                const isSorted = sortColumn === sortKey;

                return (
                  <TableCell
                    key={header.id}
                    align={meta?.align ?? 'left'}
                    sortDirection={isSorted ? sortOrder : false}
                    sx={{
                      width:
                        meta?.fixed ? header.column.columnDef.size : 'auto',
                      minWidth: header.column.columnDef.minSize,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {canSort ?
                      <TableSortLabel
                        active={isSorted}
                        direction={isSorted ? sortOrder : 'asc'}
                        onClick={() =>
                          onSort?.(
                            sortKey,
                            isSorted && sortOrder === 'asc' ? 'desc' : 'asc'
                          )
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </TableSortLabel>
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    }
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableHead>

        <TableBody>
          {loading && (
            <TableRow>
              <TableCell
                colSpan={visibleColumnCount}
                align="center"
                sx={{ py: 4, border: 0 }}
              >
                <CircularProgress />
              </TableCell>
            </TableRow>
          )}

          {!loading && !table.getRowModel().rows.length && (
            <TableRow>
              <TableCell
                colSpan={visibleColumnCount}
                align="center"
                sx={{ py: 4, border: 0 }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {emptyMessage ?? t('listView.table.empty')}
                </Typography>
              </TableCell>
            </TableRow>
          )}

          {!loading &&
            table.getRowModel().rows.map(row => (
              <TableRow
                key={row.id}
                className={rowClassName?.(row.original)}
                hover={Boolean(onRowClick)}
                onClick={
                  onRowClick ? () => onRowClick(row.original) : undefined
                }
                sx={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {row.getVisibleCells().map(cell => {
                  const meta = cell.column.columnDef.meta as
                    | { align?: 'left' | 'center' | 'right' }
                    | undefined;

                  return (
                    <TableCell
                      key={cell.id}
                      align={meta?.align ?? 'left'}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {/* Keeps the empty state readable when there are no columns at all. */}
      {!visibleColumnCount && (
        <Box sx={{ p: 2 }}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {emptyMessage}
          </Typography>
        </Box>
      )}
    </TableContainer>
  );
}
