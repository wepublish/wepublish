import React, {ReactNode} from 'react'
import {InfoMessage, InfoColor} from './infoMessage'

export interface DescriptionListWithMessageItemProps {
  label?: ReactNode
  children?: ReactNode
  message?: ReactNode
  messageType?: InfoColor
}

export function DescriptionListItemWithMessage({
  label,
  children,
  message,
  messageType
}: DescriptionListWithMessageItemProps) {
  return (
    <div
      style={{
        display: 'flex',
        marginBottom: 10

        /* ':last-child': {
        marginBottom: 0
      } */
      }}>
      <dt
        style={{
          color: 'gray',
          flexGrow: 1
        }}>
        {label}
      </dt>
      <dd
        style={{
          marginLeft: 20
        }}>
        {children || <InfoMessage messageType={messageType} message={message}></InfoMessage> || '-'}
      </dd>
    </div>
  )
}
