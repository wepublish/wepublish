import styled from '@emotion/styled'
import {IconButton as RIconButton, Table as RTable} from 'rsuite'

import {ListViewFilters} from './list-view-filters'
import {StateColor} from '../utility'

const {Cell} = RTable

const ListViewContainer = styled.div`
  display: grid;
  grid-gap: 10px;
  grid-template-columns: 2fr 1fr;
  justify-content: start;
  align-items: center;
`

const ListViewHeader = styled.div`
  grid-column: 1 2;
`

const ListViewActions = styled.div`
  grid-column: 2;
  text-align: right;
`

const ListFilters = styled(ListViewFilters)`
  grid-column: 1/3;
`

const ListViewFilterArea = styled.div`
  gap: 8px;
  display: flex;
  margin-top: 1rem;
  grid-column: 1/4;
`

const TableWrapper = styled.div`
  display: flex;
  flex-flow: column;
  margin-top: 20px;
  flex-grow: 1;
  height: 100%;
`

const PaddedCell = styled(Cell)`
  .rs-table-cell-content {
    padding: 6px 0;
  }
`

interface StatusBadgeProps {
  states: string[]
}

const StatusBadge = styled.div<StatusBadgeProps>`
  text-align: center;
  border-radius: 15px;
  background-color: ${props => {
    if (props.states.includes('pending')) {
      return StateColor.pending
    } else if (props.states.includes('published')) {
      return StateColor.published
    } else if (props.states.includes('draft')) {
      return StateColor.draft
    } else {
      return StateColor.none
    }
  }};
`

const IconButtonCell = styled(RTable.Cell)`
  padding: 6px 0;
  & > div {
    padding: 0;
    button:nth-of-type(n + 1) {
      margin-left: 5px;
    }
  }
`

const IconButton = styled(RIconButton)`
  margin-left: 5px;
`

const Table = styled(RTable)`
  height: 100% !important;
`

export {
  IconButton,
  IconButtonCell,
  ListFilters,
  ListViewActions,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader,
  PaddedCell,
  StatusBadge,
  StatusBadgeProps,
  Table,
  TableWrapper
}
