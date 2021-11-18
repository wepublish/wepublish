import React, {ReactNode} from 'react'

export interface InfoMessageProps {
  type?: ReactNode
  message: ReactNode
}

export function InfoMessage({type, message}: InfoMessageProps) {
  if (type === 'warning') {
    type = '#fffaf2'
  } else if (type === 'error') {
    type = '#fff2f2'
  } else {
    type = '#ffffff'
  }

  return (
    <div>
      <div
        style={{
          borderRadius: '8px',
          padding: '6px',
          backgroundColor: `${type}`
        }}>
        {' '}
        {message}
      </div>
    </div>
  )
}
