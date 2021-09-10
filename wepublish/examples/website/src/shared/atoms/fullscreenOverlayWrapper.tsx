import React, {ReactNode} from 'react'
import {useStyle, cssRule} from '@karma.run/react'
import {ZIndex, whenTablet, pxToRem, whenDesktop} from '../style/helpers'
import {Color} from '../style/colors'

export const FullscreenOverlayWrapperStyle = cssRule(() => ({
  overflow: 'hidden',

  position: 'fixed',

  top: pxToRem(60),
  left: 0,
  right: 0,
  bottom: 0,

  zIndex: ZIndex.FullscreenOverlay,
  backgroundColor: Color.White,

  ...whenTablet({
    top: 0,
    left: pxToRem(60)
  }),

  ...whenDesktop({
    top: 0,
    left: pxToRem(60)
  })
}))

export interface FullscreenOverlayWrapperProps {
  isFullscreen: boolean
  children?: ReactNode
}

export function FullscreenOverlayWrapper({children, isFullscreen}: FullscreenOverlayWrapperProps) {
  const css = useStyle()

  return isFullscreen ? (
    <div className={css(FullscreenOverlayWrapperStyle)}>{children}</div>
  ) : (
    <>{children}</>
  )
}
