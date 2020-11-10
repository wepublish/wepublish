import React, {forwardRef, ImgHTMLAttributes, ReactNode} from 'react'

import {
  WidthProps,
  HeightProps,
  PositionProps,
  extractStyleProps,
  PaddingProps,
  hexToRgba,
  BlurStrength
} from './helpers'

export interface OverlayProps
  extends WidthProps,
    HeightProps,
    PaddingProps,
    PositionProps,
    Omit<ImgHTMLAttributes<HTMLImageElement>, 'width' | 'height'> {
  children?: ReactNode
}

export const Overlay = forwardRef<HTMLImageElement, OverlayProps>(function Image(
  {children, ...props},
  ref
) {
  const [styleProps, elementProps] = extractStyleProps(props)

  const {position, ...otherProps} = styleProps

  return (
    <div
      style={{
        display: 'block',
        position: position ?? 'absolute',
        backgroundColor: hexToRgba('black', 0.8),
        color: 'white',

        backdropFilter: `blur(${BlurStrength.Strong})`,

        ...otherProps
      }}
      {...elementProps}
      ref={ref}>
      {children}
    </div>
  )
})
