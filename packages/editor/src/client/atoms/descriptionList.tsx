import React, {ReactNode} from 'react'
import {InfoMessage} from './infoMessage'

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
  type?: ReactNode
}

export function DescriptionListItem({label, children, message, type}: DescriptionListItemProps) {
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
        {message ? (
          <InfoMessage type={type} message={message}></InfoMessage>
        ) : (
          <span>{children}</span> || <span>-</span>
        )}
      </dd>
    </div>
  )
}
