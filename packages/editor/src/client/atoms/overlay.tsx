import React, {forwardRef, ReactNode} from 'react'

import {hexToRgba, BlurStrength} from './helpers'

export interface OverlayProps extends React.ComponentPropsWithRef<'div'> {
  children?: ReactNode
}

export const Overlay = forwardRef<HTMLImageElement, OverlayProps>(function Image(
  {children, style, ...props},
  ref
) {
  return (
    <div
      style={{
        display: 'block',
        position: style?.position ?? 'absolute',
        backgroundColor: hexToRgba('black', 0.8),
        color: 'white',

        backdropFilter: `blur(${BlurStrength.Strong})`,

        ...style
      }}
      {...props}
      ref={ref}>
      {children}
    </div>
  )
})
