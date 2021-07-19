import React, {forwardRef, ReactNode} from 'react'

import {hexToRgba, BlurStrength} from './helpers'

export interface OverlayProps extends React.ComponentPropsWithRef<'div'> {
  styles?: React.CSSProperties
  children?: ReactNode
}

export const Overlay = forwardRef<HTMLImageElement, OverlayProps>(function Image(
  {children, styles, ...props},
  ref
) {
  return (
    <div
      style={{
        display: 'block',
        position: styles?.position ?? 'absolute',
        backgroundColor: hexToRgba('black', 0.8),
        color: 'white',

        backdropFilter: `blur(${BlurStrength.Strong})`

        // ...styles FIXME: this should not be commented
      }}
      {...props}
      ref={ref}>
      {children}
    </div>
  )
})
