import styled from '@emotion/styled'
import {Table} from 'rsuite'

import {ListViewFilters} from '../atoms/searchAndFilter/listViewFilters'
import {StateColor} from '../utility'

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

const TableWrapper = styled.div`
  display: 'flex';
  flex-flow: 'column';
  margin-top: '20px';
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

const IconButtonCell = styled(Table.Cell)`
  padding: 6px 0;
  & > div {
    padding: 0;
    button:nth-of-type(n + 1) {
      margin-left: 5px;
    }
  }
`

export {
  IconButtonCell,
  ListFilters,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  StatusBadge,
  StatusBadgeProps,
  TableWrapper
}
