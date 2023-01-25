import React, {ReactNode} from 'react'
import {FlexboxGrid} from 'rsuite'

interface SingleViewProps {
  children: ReactNode
}
export function SingleView({children}: SingleViewProps) {
  return (
    <FlexboxGrid>
      <FlexboxGrid.Item colspan={24}>{children}</FlexboxGrid.Item>
    </FlexboxGrid>
  )
}
