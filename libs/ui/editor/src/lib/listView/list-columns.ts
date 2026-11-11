import { DataTableColumn } from './data-table';

export type ListColumn<Row> = DataTableColumn<Row> & {
  sortable?: boolean;
  dataKey?: string;
};
