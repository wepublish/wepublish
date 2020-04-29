import React, {ReactNode} from 'react'
import {cssRule, useStyle} from '@karma.run/react'

const RatioContainerStyle = cssRule(paddingTop => ({
  height: 0,
  position: 'relative',
  width: '100%',
  paddingTop: `${paddingTop}%`
}))

const ContentContainerStyle = cssRule(paddingTop => ({
  height: '100%',
  left: 0,
  position: 'absolute',
  top: 0,
  width: '100%',

  '& img': {
    height: '100%'
  }
}))

export interface RatioContainerProps {
  readonly aspectRatio: number
  children: ReactNode
}

export function RatioContainer({aspectRatio, children}: RatioContainerProps) {
  const paddingTop = aspectRatio === 0 ? 100 : 100 / aspectRatio
  const css = useStyle(paddingTop)

  return (
    <div className={css(RatioContainerStyle)}>
      <div className={css(ContentContainerStyle)}>{children}</div>
    </div>
  )
}
