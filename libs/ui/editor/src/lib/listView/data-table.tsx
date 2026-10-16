import styled from '@emotion/styled';
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
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
  ColumnSizingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose, MdFilterList } from 'react-icons/md';

import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { ColumnConfigurator, ToolbarCount } from './column-configurator';
import { useColumnConfig } from './use-column-config';

export type SortOrder = 'asc' | 'desc';

const MIN_COLUMN_WIDTH = 48;

const ROW_HEIGHT = 37;

const cellStyles = `
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &[data-pinned='true'] {
    position: sticky;
    right: var(--pin-offset, 0px);
    z-index: 2;
    overflow: visible;
  }

  &[data-pin-edge='true']::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    right: 100%;
    width: 6px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 150ms;
  }

  [data-pin-shadow='true'] &[data-pin-edge='true']::before {
    opacity: 1;
  }
`;

const BodyCell = styled(TableCell)`
  ${cellStyles}

  &[data-pinned='true'] {
    background-color: ${({ theme }) => theme.vars.palette.background.paper};
  }

  &[data-pin-edge='true'] {
    border-left: 1px solid ${({ theme }) => theme.vars.palette.divider};
  }

  &[data-pin-edge='true']::before {
    background: linear-gradient(to left, rgba(0, 0, 0, 0.18), transparent);
  }

  [data-mui-color-scheme='dark'] &[data-pin-edge='true']::before {
    background: linear-gradient(to left, rgba(0, 0, 0, 0.6), transparent);
  }
`;

const HeadCell = styled(TableCell)`
  ${cellStyles}
  font-weight: 600;

  &[data-resizable='true'] {
    position: sticky;
    top: 0;
  }

  &[data-pinned='true'] {
    background-color: ${({ theme }) => theme.vars.palette.background.paper};
    z-index: 3;
  }

  &[data-pin-edge='true'] {
    border-left: 1px solid ${({ theme }) => theme.vars.palette.divider};
  }

  &[data-pin-edge='true']::before {
    background: linear-gradient(to left, rgba(0, 0, 0, 0.18), transparent);
  }

  [data-mui-color-scheme='dark'] &[data-pin-edge='true']::before {
    background: linear-gradient(to left, rgba(0, 0, 0, 0.6), transparent);
  }
`;

const ResizeHandle = styled.span`
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 9px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: col-resize;
  user-select: none;
  touch-action: none;

  &:hover [data-resize-grip],
  &:active [data-resize-grip] {
    width: 2px;
    height: 100%;
    background-color: ${({ theme }) => theme.vars.palette.primary.main};
  }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  min-height: 32px;
  margin-bottom: ${({ theme }) => theme.spacing(0.5)};
  flex-shrink: 0;
`;

const FilterPanel = styled(Collapse)`
  flex-shrink: 0;
`;

const Filters = styled.div`
  padding: ${({ theme }) => theme.spacing(1, 0, 2)};
`;

const ResizeGrip = styled.span`
  width: 1px;
  height: 60%;
  background-color: ${({ theme }) => theme.vars.palette.divider};
`;

export type DataTableColumn<Row> = {
  id: string;
  sortKey?: string;
  label: ReactNode;
  render: (row: Row) => ReactNode;
  width?: number;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean;
  resizable?: boolean;
  alwaysVisible?: boolean;
  columnLabel?: string;
};

export type DataTableProps<Row> = {
  data: Row[];
  columns: ReadonlyArray<DataTableColumn<Row>>;
  storageKey?: string;
  hiddenColumns?: string[];
  filters?: ReactNode;
  filterCount?: number;
  onResetFilters?: () => void;
  sortable?: string[];
  sortColumn?: string | null;
  sortOrder?: SortOrder;
  onSort?: (columnId: string, order: SortOrder) => void;
  onRowClick?: (row: Row) => void;
  loading?: boolean;
  emptyMessage?: ReactNode;
  getRowId?: (row: Row, index: number) => string;
  rowClassName?: (row: Row) => string | undefined;
  virtualize?: boolean;
  maxHeight?: number | string;
};

export function DataTable<Row>({
  data,
  columns,
  storageKey,
  hiddenColumns,
  filters,
  filterCount = 0,
  onResetFilters,
  sortable,
  sortColumn,
  sortOrder = 'asc',
  onSort,
  onRowClick,
  loading,
  emptyMessage,
  getRowId,
  rowClassName,
  virtualize,
  maxHeight,
}: DataTableProps<Row>) {
  const { t } = useTranslation();

  const [openedByUser, setOpenedByUser] = useState<boolean | null>(null);
  const filtersOpen = openedByUser ?? false;

  const columnConfig = useColumnConfig(storageKey, columns);
  const hidden = storageKey ? columnConfig.hiddenColumns : hiddenColumns;
  const orderColumns = columnConfig.orderColumns;

  const orderedColumns = useMemo(
    () => (storageKey ? orderColumns(columns) : columns),
    [columns, orderColumns, storageKey]
  );

  const columnDefs = useMemo<ColumnDef<Row>[]>(
    () =>
      orderedColumns.map(column => ({
        id: column.id,
        header: () => column.label,
        cell: ({ row }) => column.render(row.original),
        size: column.width,
        minSize: column.minWidth ?? MIN_COLUMN_WIDTH,
        enableResizing: column.resizable ?? !column.fixed,
        meta: {
          align: column.align ?? 'left',
          fixed: column.fixed,
          sortKey: column.sortKey ?? column.id,
          label: column.label,
        },
      })),
    [orderedColumns]
  );

  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const table = useReactTable({
    data: data as Row[],
    columns: columnDefs,
    state: { columnSizing },
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    manualSorting: true,
    manualPagination: true,
    getRowId,
  });

  const allColumns = table.getAllLeafColumns();
  const columnCount = allColumns.length;
  const hiddenSet = useMemo(() => new Set(hidden ?? []), [hidden]);
  const hiddenRules = useMemo(
    () =>
      Object.fromEntries(
        [...hiddenSet].map(id => [`& [data-col="${id}"]`, { display: 'none' }])
      ),
    [hiddenSet]
  );

  const visibleColumns = allColumns.filter(column => !hiddenSet.has(column.id));
  const visibleColumnCount = visibleColumns.length;
  const sortableIds = new Set(sortable ?? []);

  const totalWidth = visibleColumns.reduce(
    (sum, column) => sum + column.getSize(),
    0
  );

  const columnSizeVars = useMemo(() => {
    const vars: Record<string, string> = {};
    for (const column of visibleColumns) {
      vars[`--col-${column.id}-size`] = `${column.getSize()}px`;
    }
    return vars;
  }, [visibleColumns]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [showPinShadow, setShowPinShadow] = useState(false);

  const syncPinShadow = useCallback(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    const remaining =
      element.scrollWidth - element.clientWidth - element.scrollLeft;
    setShowPinShadow(remaining > 1);
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    syncPinShadow();
    element.addEventListener('scroll', syncPinShadow, { passive: true });

    const observer =
      typeof ResizeObserver === 'undefined' ? undefined : (
        new ResizeObserver(syncPinShadow)
      );
    observer?.observe(element);

    return () => {
      element.removeEventListener('scroll', syncPinShadow);
      observer?.disconnect();
    };
  }, [syncPinShadow, totalWidth, visibleColumnCount]);

  const pinnedSignature = useMemo(() => {
    const parts: string[] = [];
    for (const column of [...visibleColumns].reverse()) {
      if (!(column.columnDef.meta as { fixed?: boolean } | undefined)?.fixed) {
        break;
      }
      parts.push(`${column.id}:${column.getSize()}`);
    }
    return parts.join('|');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleColumns, columnSizing, table.getState().columnSizingInfo]);

  const pinnedOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let offset = 0;
    for (const part of pinnedSignature ? pinnedSignature.split('|') : []) {
      const [id, size] = part.split(':');
      offsets[id] = offset;
      offset += Number(size);
    }
    return offsets;
  }, [pinnedSignature]);

  const outermostPinnedId = Object.keys(pinnedOffsets).at(-1);

  const pinProps = useCallback(
    (columnId: string, fixed?: boolean) =>
      fixed ?
        {
          'data-pinned': 'true',
          'data-pin-edge': columnId === outermostPinnedId ? 'true' : undefined,
          style: {
            '--pin-offset': `${pinnedOffsets[columnId] ?? 0}px`,
          } as CSSProperties,
        }
      : undefined,
    [pinnedOffsets, outermostPinnedId]
  );

  const rows = table.getRowModel().rows;

  const virtualHeight = typeof maxHeight === 'number' ? maxHeight : 800;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    initialRect: { width: 0, height: virtualHeight },
  });

  const virtualRows = virtualize ? virtualizer.getVirtualItems() : undefined;
  const paddingTop = virtualRows?.length ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows?.length ?
      virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
    : 0;
  const renderedRows =
    virtualRows ? virtualRows.map(item => rows[item.index]) : rows;
  const emptyText = emptyMessage ?? t('listView.table.empty');

  const tableBody = useMemo(
    () => (
      <TableBody>
        {loading && (
          <TableRow>
            <TableCell
              colSpan={columnCount}
              align="center"
              sx={{ py: 4, border: 0 }}
            >
              <CircularProgress />
            </TableCell>
          </TableRow>
        )}

        {!loading && !rows.length && (
          <TableRow>
            <TableCell
              colSpan={columnCount}
              align="center"
              sx={{ py: 4, border: 0 }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {emptyText}
              </Typography>
            </TableCell>
          </TableRow>
        )}

        {!loading && paddingTop > 0 && (
          <TableRow
            data-virtual-spacer="before"
            data-size={paddingTop}
            style={{ height: paddingTop }}
          />
        )}

        {!loading &&
          renderedRows.map(row => (
            <TableRow
              key={row.id}
              className={rowClassName?.(row.original)}
              hover={Boolean(onRowClick)}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              sx={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {row.getVisibleCells().map(cell => {
                const meta = cell.column.columnDef.meta as
                  | { align?: 'left' | 'center' | 'right'; fixed?: boolean }
                  | undefined;

                const pin = pinProps(cell.column.id, meta?.fixed);

                return (
                  <BodyCell
                    key={cell.id}
                    data-col={cell.column.id}
                    align={meta?.align ?? 'left'}
                    {...pin}
                    style={{
                      width: `var(--col-${cell.column.id}-size)`,
                      ...pin?.style,
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </BodyCell>
                );
              })}
            </TableRow>
          ))}

        {!loading && paddingBottom > 0 && (
          <TableRow
            data-virtual-spacer="after"
            data-size={paddingBottom}
            style={{ height: paddingBottom }}
          />
        )}
      </TableBody>
    ),
    [
      rows,
      renderedRows,
      paddingTop,
      paddingBottom,
      loading,
      onRowClick,
      rowClassName,
      emptyText,
      columnCount,
      pinProps,
      columnDefs,
    ]
  );

  const table_ = (
    <TableContainer
      ref={containerRef}
      data-pin-shadow={showPinShadow ? 'true' : 'false'}
      sx={
        virtualize || maxHeight ?
          {
            maxHeight: maxHeight ?? virtualHeight,
            overflowY: 'auto',
            flexShrink: 0,
          }
        : undefined
      }
    >
      <Table
        size="small"
        stickyHeader
        style={{ ...columnSizeVars, minWidth: totalWidth }}
        sx={{ tableLayout: 'fixed', ...hiddenRules }}
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

                const pin = pinProps(header.column.id, meta?.fixed);

                return (
                  <HeadCell
                    key={header.id}
                    data-col={header.column.id}
                    align={meta?.align ?? 'left'}
                    sortDirection={isSorted ? sortOrder : false}
                    data-resizable={
                      header.column.getCanResize() ? 'true' : undefined
                    }
                    {...pin}
                    style={{
                      width: `var(--col-${header.column.id}-size)`,
                      ...pin?.style,
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
                    {header.column.getCanResize() && (
                      <ResizeHandle
                        aria-hidden
                        data-resize-handle={header.column.id}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                      >
                        <ResizeGrip data-resize-grip />
                      </ResizeHandle>
                    )}
                  </HeadCell>
                );
              })}
            </TableRow>
          ))}
        </TableHead>

        {tableBody}
      </Table>

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

  if (!storageKey && !filters) {
    return table_;
  }

  return (
    <>
      <Toolbar>
        {filters && (
          <>
            <Button
              size="small"
              color="inherit"
              startIcon={<MdFilterList />}
              aria-expanded={filtersOpen}
              onClick={() => setOpenedByUser(!filtersOpen)}
              sx={{
                color: filtersOpen ? 'text.primary' : 'text.secondary',
                backgroundColor: filtersOpen ? 'action.selected' : undefined,
              }}
            >
              {t('filterableList.filter.label')}
              {filterCount > 0 && <ToolbarCount>{filterCount}</ToolbarCount>}
            </Button>

            {onResetFilters && filterCount > 0 && (
              <IconButtonTooltip caption={t('filterableList.filter.reset')}>
                <IconButton
                  size="small"
                  aria-label={t('filterableList.filter.reset')}
                  onClick={() => onResetFilters()}
                >
                  <MdClose />
                </IconButton>
              </IconButtonTooltip>
            )}
          </>
        )}

        {storageKey && (
          <ColumnConfigurator
            columns={columnConfig.menuColumns}
            isVisible={columnConfig.isVisible}
            onToggle={columnConfig.toggle}
            onMove={columnConfig.move}
            onReset={columnConfig.reset}
            canReset={columnConfig.isCustomised}
          />
        )}
      </Toolbar>

      {filters && (
        <FilterPanel in={filtersOpen}>
          <Filters>{filters}</Filters>
        </FilterPanel>
      )}

      {table_}
    </>
  );
}
