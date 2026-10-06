import styled from '@emotion/styled';
import { ComponentProps, useCallback, useRef, useState } from 'react';
import { IconButton as RIconButton, Table as RTable } from 'rsuite';

import { StateColor } from '../utility';
import { fitColumnWidths } from './fit-column-widths';
import { ListViewFilters } from './list-view-filters';

const { Cell } = RTable;

export const ListViewContainer = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  align-items: center;
`;

export const ListViewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const ListViewActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: end;
`;

export const ListFilters = styled(ListViewFilters)``;

export const ListViewFilterArea = styled.div`
  width: 100%;
  gap: 8px;
  display: flex;
  margin-bottom: 1rem;
`;

export const TableWrapper = styled.div`
  height: 100%;
`;

export const PaddedCell = styled(Cell)`
  .rs-table-cell-content {
    padding: 6px 0;
  }
`;

interface StatusBadgeProps {
  states: string[];
}

const statusOf = (states: string[]) =>
  states.includes('pending') ? 'pending'
  : states.includes('published') ? 'published'
  : states.includes('draft') ? 'draft'
  : 'none';

export const StatusBadge = styled.div<StatusBadgeProps>`
  font-size: 0.75em;
  font-weight: 600;
  text-align: center;
  border-radius: 15px;
  padding: 2px 8px;
  background-color: ${props => StateColor[statusOf(props.states)]};
  color: ${props => `var(--wep-state-${statusOf(props.states)}-text, inherit)`};
`;

export const IconButtonCell = styled(RTable.Cell)`
  padding: 6px 0;
  & > div {
    padding: 0;
  }
`;

export const IconButton = styled(RIconButton)`
  &&:not([data-with-text]) {
    width: 36px;
    height: 36px;
  }

  &:not(:first-of-type) {
    margin-left: 4px;
  }
`;

const StyledTable = styled(RTable)`
  height: 100% !important;
`;

export function Table({
  children,
  ...props
}: ComponentProps<typeof StyledTable>) {
  const [width, setWidth] = useState(0);
  const observer = useRef<ResizeObserver | null>(null);

  const measure = useCallback((table: { root?: HTMLDivElement } | null) => {
    observer.current?.disconnect();
    observer.current = null;

    const root = table?.root;

    if (!root || typeof ResizeObserver === 'undefined') {
      return;
    }

    observer.current = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width))
    );
    observer.current.observe(root);
  }, []);

  return (
    <StyledTable
      {...props}
      ref={measure}
    >
      {typeof children === 'function' ?
        children
      : fitColumnWidths(children, width)}
    </StyledTable>
  );
}
