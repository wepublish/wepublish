import React, {ReactNode} from 'react'
import {Tooltip, Whisper} from 'rsuite'

interface IconButtonTooltipProps {
  children?: ReactNode
  caption: string
}

export function IconButtonTooltip({children, caption}: IconButtonTooltipProps) {
  return (
    <Whisper
      placement="top"
      trigger="hover"
      delayShow={400}
      delayHide={0}
      speaker={<Tooltip>{caption}</Tooltip>}>
      {children}
    </Whisper>
  )
}
