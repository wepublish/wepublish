import React, {ReactNode} from 'react'
import {InfoMessage, InfoColor} from './infoMessage'
import {DescriptionListItem} from './descriptionList'

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
    <DescriptionListItem label={label}>
      {children || <InfoMessage messageType={messageType} message={message}></InfoMessage>}
    </DescriptionListItem>
  )
}
