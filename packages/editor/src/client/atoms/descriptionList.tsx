import React, {ReactNode} from 'react'
import {InfoMessage, InfoColor} from './infoMessage'

export interface DescriptionItemProps {
  children?: ReactNode
}

export function DescriptionList({children}: DescriptionListItemProps) {
  return (
    <dl
      style={{
        fontSize: 12,
        marginTop: 0,
        marginBottom: 0
      }}>
      {children}
    </dl>
  )
}

export interface DescriptionListItemProps {
  label?: ReactNode
  children?: ReactNode
  message?: ReactNode
  messageType?: InfoColor
}

export function DescriptionListItem({
  label,
  children,
  message,
  messageType
}: DescriptionListItemProps) {
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
        {children
          ? children
          : <InfoMessage messageType={messageType} message={message}></InfoMessage> || '-'}
      </dd>
    </div>
  )
}
