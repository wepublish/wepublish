import styled from '@emotion/styled';
import { IconButton as RIconButton, Table as RTable } from 'rsuite';

import { StateColor } from '../utility';
import { ListViewFilters } from './list-view-filters';

const { Cell } = RTable;

export const ListViewContainer = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  align-items: center;
`;

export const ListViewHeader = styled.div``;
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
  margin-top: 1rem;
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
