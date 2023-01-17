import {ReactElement} from 'react'
import {Tooltip, Whisper} from 'rsuite'

interface IconButtonTooltipProps {
  children: ReactElement
  caption: string
}

export function IconButtonTooltip({children, caption}: IconButtonTooltipProps) {
  return (
    <Whisper
      placement="top"
      trigger="hover"
      delayOpen={400}
      delayClose={0}
      speaker={<Tooltip>{caption}</Tooltip>}>
      {children}
    </Whisper>
  )
}
