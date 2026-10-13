import { ReactNode } from 'react';
import { Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';

import { ColumnConfigColumn } from './use-column-config';

const { Column, HeaderCell, Cell } = RTable;

export type ListColumn<Row> = ColumnConfigColumn & {
  width?: number;
  flexGrow?: number;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  resizable?: boolean;
  sortable?: boolean;
  dataKey?: string;
  render: (row: Row) => ReactNode;
};

export const renderListColumns = <Row,>(
  columns: ReadonlyArray<ListColumn<Row>>,
  isVisible: (id: string) => boolean
) =>
  columns
    .filter(column => isVisible(column.id))
    .map(column => (
      <Column
        key={column.id}
        width={column.width}
        flexGrow={column.flexGrow}
        minWidth={column.minWidth}
        align={column.align ?? 'left'}
        resizable={column.resizable ?? true}
        sortable={column.sortable}
      >
        <HeaderCell>{column.label}</HeaderCell>
        <Cell dataKey={column.dataKey}>
          {(rowData: RowDataType<Row>) => column.render(rowData as Row)}
        </Cell>
      </Column>
    ));
