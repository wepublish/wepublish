import React, {ReactNode} from 'react'

export interface InfoMessageProps {
  type?: InfoColor
  message: ReactNode
}

export enum InfoColor {
  warning = '#fffaf2',
  error = '#fff2f2',
  white = '#ffffff'
}

export function InfoMessage({type, message}: InfoMessageProps) {
  return (
    <div
      style={{
        borderRadius: '8px',
        padding: '6px',
        backgroundColor: `${type}`
      }}>
      {' '}
      {message}
    </div>
  )
}
