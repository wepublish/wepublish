import React, {ReactNode} from 'react'

export interface NavigationBarProps {
  leftChildren?: ReactNode
  rightChildren?: ReactNode
  centerChildren?: ReactNode
}

export function NavigationBar({leftChildren, rightChildren, centerChildren}: NavigationBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        overflow: 'hidden',
        width: '100%',
        backgroundColor: 'white'
      }}>
      <div
        style={{
          display: 'flex',
          flexGrow: 1,
          flexBasis: 0,
          alignItems: 'flex-start'
        }}>
        {leftChildren}
      </div>
      <div
        style={{
          display: 'flex',
          margin: `0 10`
        }}>
        {centerChildren}
      </div>
      <div
        style={{
          display: 'flex',
          flexGrow: 1,
          flexBasis: 0,
          alignItems: 'flex-start',
          justifyContent: 'flex-end'
        }}>
        {rightChildren}
      </div>
    </div>
  )
}
