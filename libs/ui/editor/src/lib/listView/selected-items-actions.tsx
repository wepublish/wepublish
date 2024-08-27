import styled from '@emotion/styled'
import {ReactNode} from 'react'

type SelectedItemsActionsProps = {
  selectedItems: string[]
  children?: ReactNode
}

const SelectedItemsActionsStyled = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  gap: 20px;
  padding: 8px 16px;
  background: #fff4c2;
  visibility: hidden;
  margin-bottom: -20px;

  &.has-selected-items {
    visibility: visible;
  }
`

export function SelectedItemsActions({selectedItems, children}: SelectedItemsActionsProps) {
  const hasSelectedItems = selectedItems && selectedItems.length > 0
  return (
    <SelectedItemsActionsStyled className={hasSelectedItems ? 'has-selected-items' : ''}>
      <div>Selected {selectedItems.length} items</div>
      {children}
    </SelectedItemsActionsStyled>
  )
}
