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
import { visuallyHidden } from '@mui/utils';
import {
  ColumnDef,
  ColumnSizingState,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose, MdFilterList } from 'react-icons/md';

import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { ColumnConfigurator, ToolbarCount } from './column-configurator';
import {
  downloadTable,
  getExportColumns,
  TableExportFormat,
  TableExportScope,
  TableExportValue,
} from './table-export';
import { TableExportMenu } from './table-export-menu';
import { useColumnConfig } from './use-column-config';

export type SortOrder = 'asc' | 'desc';

const MIN_COLUMN_WIDTH = 48;

const MAX_COLUMN_WIDTH = 1200;

const KEYBOARD_RESIZE_STEP = 10;

const PIN_WIDTH_RATIO = 2;

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

  & .MuiTableSortLabel-root.Mui-focusVisible {
    outline: 2px solid ${({ theme }) => theme.vars.palette.primary.main};
    outline-offset: 2px;
    border-radius: 4px;
    color: ${({ theme }) => theme.vars.palette.text.primary};
  }

  & .MuiTableSortLabel-root.Mui-focusVisible .MuiTableSortLabel-icon {
    opacity: 0.5;
  }

  &
    .MuiTableSortLabel-root.Mui-active.Mui-focusVisible
    .MuiTableSortLabel-icon {
    opacity: 1;
  }

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
  &:active [data-resize-grip],
  &:focus-visible [data-resize-grip] {
    width: 2px;
    height: 100%;
    background-color: ${({ theme }) => theme.vars.palette.primary.main};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.vars.palette.primary.main};
    outline-offset: -2px;
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

const ScrollContainer = styled(TableContainer)`
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.vars.palette.primary.main};
    outline-offset: 2px;
  }
`;

const TableState = styled.div`
  position: sticky;
  left: 0;
  display: flex;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(4, 0)};
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
  exportValue?: ((row: Row) => TableExportValue) | false;
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
  exportRows?: () => Row[] | Promise<Row[]>;
  exportTotalCount?: number;
  exportFilename?: string;
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
  exportRows,
  exportTotalCount,
  exportFilename,
}: DataTableProps<Row>) {
  const { t } = useTranslation();
  const headerIdPrefix = useId();

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
  const [containerWidth, setContainerWidth] = useState(0);
  const [overflows, setOverflows] = useState(false);

  const syncPinShadow = useCallback(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    const remaining =
      element.scrollWidth - element.clientWidth - element.scrollLeft;
    setShowPinShadow(remaining > 1);
    setContainerWidth(element.clientWidth);
    setOverflows(element.scrollWidth - element.clientWidth > 1);
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

  const pinnedWidth = useMemo(
    () =>
      (pinnedSignature ? pinnedSignature.split('|') : []).reduce(
        (sum, part) => sum + Number(part.split(':')[1]),
        0
      ),
    [pinnedSignature]
  );

  const pinning =
    !containerWidth || containerWidth >= pinnedWidth * PIN_WIDTH_RATIO;

  const outermostPinnedId = Object.keys(pinnedOffsets).at(-1);

  const pinProps = useCallback(
    (columnId: string, fixed?: boolean) =>
      fixed && pinning ?
        {
          'data-pinned': 'true',
          'data-pin-edge': columnId === outermostPinnedId ? 'true' : undefined,
          style: {
            '--pin-offset': `${pinnedOffsets[columnId] ?? 0}px`,
          } as CSSProperties,
        }
      : undefined,
    [pinnedOffsets, outermostPinnedId, pinning]
  );

  const resizeWithKeyboard = (
    columnId: string,
    size: number,
    minSize: number,
    key: string
  ) => {
    const delta =
      key === 'ArrowRight' ? KEYBOARD_RESIZE_STEP
      : key === 'ArrowLeft' ? -KEYBOARD_RESIZE_STEP
      : null;

    if (delta === null) {
      return false;
    }

    const next = Math.min(MAX_COLUMN_WIDTH, Math.max(minSize, size + delta));
    table.setColumnSizing(old => ({ ...old, [columnId]: next }));

    return true;
  };

  const rows = table.getRowModel().rows;

  const exportTable = async (
    format: TableExportFormat,
    scope: TableExportScope
  ) => {
    if (!exportRows) {
      return;
    }

    const exported = scope === 'page' ? data : await exportRows();
    const day = new Date().toISOString().slice(0, 10);

    await downloadTable({
      format,
      rows: exported,
      columns: getExportColumns(
        orderedColumns.filter(column => !hiddenSet.has(column.id)),
        exported
      ),
      filename: `${exportFilename ?? storageKey ?? 'export'}-${day}`,
    });
  };

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

  const orderedColumnsById = useMemo(
    () =>
      Object.fromEntries(
        orderedColumns.map(column => [column.id, column])
      ) as Record<string, DataTableColumn<Row>>,
    [orderedColumns]
  );

  const tableBody = useMemo(
    () => (
      <TableBody>
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
                    {orderedColumnsById[cell.column.id]?.render(row.original)}
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
      pinProps,
      columnDefs,
      orderedColumnsById,
    ]
  );

  const table_ = (
    <ScrollContainer
      ref={containerRef}
      data-pin-shadow={showPinShadow ? 'true' : 'false'}
      {...(overflows ?
        {
          tabIndex: 0,
          role: 'region',
          'aria-label': t('listView.table.label'),
        }
      : {})}
      style={
        pinning && pinnedWidth ?
          { scrollPaddingInlineEnd: pinnedWidth }
        : undefined
      }
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
                const column = orderedColumnsById[header.column.id];
                const label = column?.label;
                const columnName =
                  column?.columnLabel ??
                  (typeof label === 'string' ? label : header.column.id);
                const minSize =
                  header.column.columnDef.minSize ?? MIN_COLUMN_WIDTH;
                const labelId = `${headerIdPrefix}-${header.column.id}`;
                const labelElement =
                  label || !column?.columnLabel ?
                    <span id={labelId}>{label}</span>
                  : <Box
                      component="span"
                      id={labelId}
                      sx={visuallyHidden}
                    >
                      {column.columnLabel}
                    </Box>;
                const canSort = sortableIds.has(sortKey);
                const isSorted = sortColumn === sortKey;

                const pin = pinProps(header.column.id, meta?.fixed);

                return (
                  <HeadCell
                    key={header.id}
                    data-col={header.column.id}
                    align={meta?.align ?? 'left'}
                    sortDirection={isSorted ? sortOrder : false}
                    aria-labelledby={labelId}
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
                        {labelElement}
                      </TableSortLabel>
                    : labelElement}
                    {header.column.getCanResize() && (
                      <ResizeHandle
                        role="separator"
                        tabIndex={0}
                        aria-orientation="vertical"
                        aria-label={t('listView.table.resizeColumn', {
                          column: columnName,
                        })}
                        aria-valuenow={header.column.getSize()}
                        aria-valuemin={minSize}
                        aria-valuemax={MAX_COLUMN_WIDTH}
                        data-resize-handle={header.column.id}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onKeyDown={event => {
                          if (
                            resizeWithKeyboard(
                              header.column.id,
                              header.column.getSize(),
                              minSize,
                              event.key
                            )
                          ) {
                            event.preventDefault();
                          }
                        }}
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

      {(loading || !rows.length) && (
        <TableState
          data-table-state
          role="status"
        >
          {loading ?
            <CircularProgress aria-label={t('listView.table.loading')} />
          : <Typography
              variant="body2"
              color="text.secondary"
            >
              {emptyText}
            </Typography>
          }
        </TableState>
      )}

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
    </ScrollContainer>
  );

  if (!storageKey && !filters && !exportRows) {
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

        {exportRows && (
          <TableExportMenu
            onExport={exportTable}
            pageCount={data.length}
            totalCount={exportTotalCount}
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
