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
        // borderBottom: `solid 1px gray`
      }}>
      <div
        style={{
          display: 'flex',
          flexGrow: 1,
          flexBasis: 0
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
          justifyContent: 'flex-end'
        }}>
        {rightChildren}
      </div>
    </div>
  )
}
