import React, {ReactNode} from 'react'

export interface InfoMessageProps {
  messageType: InfoColor
  message: ReactNode
}

export enum InfoColor {
  warning = '#fffaf2',
  error = '#fff2f2',
  white = '#ffffff'
}

export function InfoMessage({messageType = InfoColor.white, message}: InfoMessageProps) {
  return (
    <div
      style={{
        borderRadius: '8px',
        padding: '0px 6px',
        backgroundColor: `${messageType}`
      }}>
      {message}
    </div>
  )
}
