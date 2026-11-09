import styled from '@emotion/styled';
import { IconButton as MuiIconButton } from '@mui/material';

import { StateColor } from '../utility';
import { ListViewFilters } from './list-view-filters';

export const ListViewContainer = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  align-items: center;
  row-gap: ${({ theme }) => theme.spacing(1)};
  margin-bottom: ${({ theme }) => theme.spacing(3)};
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

export const TableWrapper = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
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
  border-radius: 999px;
  padding: 2px 8px;
  white-space: normal;
  background-color: ${props => StateColor[statusOf(props.states)]};
  color: ${props => `var(--wep-state-${statusOf(props.states)}-text, inherit)`};
`;

export const IconButton = styled(MuiIconButton)`
  &&:not([data-with-text]) {
    width: 36px;
    height: 36px;
  }

  &:not(:first-of-type) {
    margin-left: 4px;
  }
` as typeof MuiIconButton;
