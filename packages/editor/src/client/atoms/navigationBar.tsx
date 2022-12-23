import styled from '@emotion/styled'
import React, {ReactNode} from 'react'

const StyledRightChildren = styled.div`
  display: flex;
  flex-grow: 1;
  flex-basis: 0;
  align-items: flex-start;
  justify-content: flex-end;
`

const StyledCenterChildren = styled.div`
  display: flex;
  margin: 0 10;
`

const StyledLeftChildren = styled.div`
  display: flex;
  flex-grow: 1;
  flex-basis: 0;
  align-items: flex-start;
`

const StyledNavigationBar = styled.div`
  display: flex;
  overflow: hidden;
  width: 100%;
  background-color: white;
`

export interface NavigationBarProps {
  leftChildren?: ReactNode
  rightChildren?: ReactNode
  centerChildren?: ReactNode
}

export function NavigationBar({leftChildren, rightChildren, centerChildren}: NavigationBarProps) {
  return (
    <StyledNavigationBar>
      <StyledLeftChildren>{leftChildren}</StyledLeftChildren>
      <StyledCenterChildren>{centerChildren}</StyledCenterChildren>
      <StyledRightChildren>{rightChildren}</StyledRightChildren>
    </StyledNavigationBar>
  )
}
