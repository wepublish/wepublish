import React, {ReactNode} from 'react'
import {useStyle, cssRule} from '@karma.run/react'

import {pxToRem} from '../style/helpers'

export interface CenterLayoutStyleProps {
  scale: number
}

export const CenterLayoutStyle = cssRule({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',

  minWidth: '100vw',
  minHeight: '100vh'
})

export const CenterLayoutContentStyle = cssRule(({scale}: CenterLayoutStyleProps) => ({
  padding: pxToRem(20),
  margin: pxToRem(20),
  minWidth: `${scale * 100}%`,
  border: '1px dashed rgba(0,0,0, 0.05)'
}))

export interface CenterLayoutProps {
  minWidthFactor: number
  children?: ReactNode
}

export function CenterLayout({minWidthFactor: scale, children}: CenterLayoutProps) {
  const css = useStyle({scale})

  return (
    <div className={css(CenterLayoutStyle)}>
      <div className={css(CenterLayoutContentStyle)}>{children}</div>
    </div>
  )
}

export function centerLayoutDecorator(minWidthFactor: number = 0) {
  return (story: () => ReactNode) => {
    return <CenterLayout minWidthFactor={minWidthFactor}>{story()}</CenterLayout>
  }
}

export interface FontSizeStyleProps {
  fontSize: number
}

export const FontSizeStyle = cssRule(({fontSize}: FontSizeStyleProps) => ({
  fontSize: pxToRem(fontSize)
}))

export interface FontSizeProps {
  fontSize: number
  children?: ReactNode
}

export function FontSize({fontSize, children}: FontSizeProps) {
  const css = useStyle({fontSize})

  return <div className={css(FontSizeStyle)}>{children}</div>
}

export function fontSizeDecorator(fontSize: number = 24) {
  return (story: () => ReactNode) => {
    return <FontSize fontSize={fontSize}>{story()}</FontSize>
  }
}
