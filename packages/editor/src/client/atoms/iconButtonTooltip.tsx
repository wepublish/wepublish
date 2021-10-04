import React, {ReactNode} from 'react'
import {Tooltip, Whisper} from 'rsuite'

interface IconButtonTooltipProps {
  children?: ReactNode
  caption: string
}

export function IconButtonTooltip({children, caption}: IconButtonTooltipProps) {
  return (
    <Whisper placement="top" trigger="hover" delayShow={600} speaker={<Tooltip>{caption}</Tooltip>}>
      {children}
    </Whisper>
  )
}
