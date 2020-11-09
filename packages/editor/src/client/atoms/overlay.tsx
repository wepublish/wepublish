import React, {forwardRef, ImgHTMLAttributes, ReactNode} from 'react'

import {styled} from '@karma.run/react'

import {
  WidthProps,
  HeightProps,
  PositionProps,
  extractStyleProps,
  PaddingProps,
  hexToRgba,
  BlurStrength
} from './helpers'

interface OverlayWrapperProps extends WidthProps, HeightProps, PaddingProps, PositionProps {}

const OverlayElement = styled('div', ({position, ...props}: OverlayWrapperProps) => ({
  display: 'block',
  position: position ?? 'absolute',
  backgroundColor: hexToRgba('black', 0.8),
  color: 'white',

  backdropFilter: `blur(${BlurStrength.Strong})`,

  ...props
}))

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

  return (
    <OverlayElement {...elementProps} ref={ref} styleProps={styleProps}>
      {children}
    </OverlayElement>
  )
})
