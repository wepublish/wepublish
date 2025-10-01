import styled from '@emotion/styled';
import { IconButton as RIconButton, Table as RTable } from 'rsuite';

import { StateColor } from '../utility';
import { ListViewFilters } from './list-view-filters';

const { Cell } = RTable;

export const ListViewContainer = styled.div`
  display: grid;
  grid-gap: 10px;
  grid-template-columns: 2fr 1fr;
  justify-content: start;
  align-items: center;
`;

export const ListViewHeader = styled.div`
  grid-column: 1 2;
`;

export const ListViewActions = styled.div`
  grid-column: 2;
  text-align: right;
`;

export const ListFilters = styled(ListViewFilters)`
  grid-column: 1/3;
`;

export const ListViewFilterArea = styled.div`
  gap: 8px;
  display: flex;
  margin-top: 1rem;
  grid-column: 1/4;
`;

export const TableWrapper = styled.div`
  height: 100%;
  margin-top: 20px;
`;

export const PaddedCell = styled(Cell)`
  .rs-table-cell-content {
    padding: 6px 0;
  }
`;

interface StatusBadgeProps {
  states: string[];
}

export const StatusBadge = styled.div<StatusBadgeProps>`
  font-size: 0.75em;
  text-align: center;
  border-radius: 15px;
  padding: 2px 8px;
  background-color: ${props => {
    if (props.states.includes('pending')) {
      return StateColor.pending;
    } else if (props.states.includes('published')) {
      return StateColor.published;
    } else if (props.states.includes('draft')) {
      return StateColor.draft;
    } else {
      return StateColor.none;
    }
  }};
`;

export const IconButtonCell = styled(RTable.Cell)`
  padding: 6px 0;
  & > div {
    padding: 0;
  }
`;

export const IconButton = styled(RIconButton)`
  min-width: 36px;
  height: 36px;

  &:not(:first-of-type) {
    margin-left: 5px;
  }
`;

export const Table = styled(RTable)`
  height: 100% !important;
`;
