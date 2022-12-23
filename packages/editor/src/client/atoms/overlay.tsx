import styled from '@emotion/styled'
import React, {forwardRef, ReactNode} from 'react'

import {BlurStrength} from './helpers'

export interface OverlayProps extends React.ComponentPropsWithRef<'div'> {
  children?: ReactNode
}

const StyledOverlay = styled.div<{position?: string}>`
  color: white;
  display: block;
  position: absolute;
  backdrop-filter: blur(${BlurStrength.Strong});
  background-color: rgba(0, 0, 0, 0.8);
`

export const Overlay = forwardRef<HTMLImageElement, OverlayProps>(function Image(
  {children, className, ...props},
  ref
) {
  return (
    <StyledOverlay className={className} {...props} ref={ref}>
      {children}
    </StyledOverlay>
  )
})
