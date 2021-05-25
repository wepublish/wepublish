import React, {ReactNode} from 'react'
import './popover.css'

interface PopoverProps {
  setEmoji?: (emoji: string) => void
  children?: ReactNode
  Icon: ReactNode
  isOpen: boolean
}

export function Popover({children, Icon}: PopoverProps) {
  return (
    <>
      <div className="popover__wrapper">
        <div className="popover__content">{children}</div>
      </div>
    </>
  )
}
