import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  ReactElement,
  ReactNode,
} from 'react';
import { Table } from 'rsuite';

const { Column } = Table;

const DEFAULT_WIDTH = 100;
const MIN_SHRINK = 0.5;
const COMPACT_WIDTH = 600;

type ColumnProps = {
  width?: number;
  flexGrow?: number;
  minWidth?: number;
  fixed?: boolean | 'left' | 'right';
};

type ColumnElement = ReactElement<ColumnProps>;

const isColumn = (node: ReactNode): node is ColumnElement =>
  isValidElement(node) && node.type === Column;

const isFragment = (
  node: ReactNode
): node is ReactElement<{ children?: ReactNode }> =>
  isValidElement(node) && node.type === Fragment;

const collectColumns = (children: ReactNode): ColumnProps[] =>
  Children.toArray(children).flatMap(child => {
    if (isColumn(child)) {
      return [child.props];
    }

    if (isFragment(child)) {
      return collectColumns(child.props.children);
    }

    return [];
  });

const mapColumns = (
  children: ReactNode,
  map: (column: ColumnElement) => ReactNode
): ReactNode =>
  Children.map(children, child => {
    if (isColumn(child)) {
      return map(child);
    }

    if (isFragment(child)) {
      return cloneElement(
        child,
        undefined,
        mapColumns(child.props.children, map)
      );
    }

    return child;
  });

const isScalable = ({ fixed, flexGrow }: ColumnProps) =>
  !fixed && flexGrow == null;

const reservedWidth = ({ flexGrow, minWidth, width }: ColumnProps) =>
  flexGrow != null ? (minWidth ?? 0) : (width ?? DEFAULT_WIDTH);

export function fitColumnWidths(
  children: ReactNode,
  availableWidth: number
): ReactNode {
  if (availableWidth <= 0) {
    return children;
  }

  const columns = collectColumns(children);
  const scalable = columns.filter(isScalable);
  const scalableWidth = scalable.reduce(
    (sum, { width }) => sum + (width ?? DEFAULT_WIDTH),
    0
  );

  if (!scalableWidth) {
    return children;
  }

  const reserved = columns
    .filter(column => !isScalable(column))
    .reduce((sum, column) => sum + reservedWidth(column), 0);
  const factor = (availableWidth - reserved) / scalableWidth;
  const hasGrowingColumn = columns.some(({ flexGrow }) => flexGrow != null);
  const compact = availableWidth < COMPACT_WIDTH;

  if (!compact && (factor === 1 || (factor > 1 && hasGrowingColumn))) {
    return children;
  }

  return mapColumns(children, column => {
    if (!isScalable(column.props)) {
      return compact && column.props.fixed ?
          cloneElement(column, { fixed: undefined })
        : column;
    }

    const width = column.props.width ?? DEFAULT_WIDTH;
    const scaled = Math.floor(width * factor);
    const floor = Math.max(
      column.props.minWidth ?? 0,
      Math.round(width * MIN_SHRINK)
    );

    return cloneElement(column, {
      width: factor < 1 ? Math.max(scaled, floor) : scaled,
    });
  });
}
