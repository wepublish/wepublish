import React, {ReactNode} from 'react'
import {FlexboxGrid} from 'rsuite'

interface SingleViewContentProps {
  children: ReactNode
}
export function SingleViewContent({children}: SingleViewContentProps) {
  return (
    <FlexboxGrid>
      <FlexboxGrid.Item colspan={24}>{children}</FlexboxGrid.Item>
    </FlexboxGrid>
  )
}
