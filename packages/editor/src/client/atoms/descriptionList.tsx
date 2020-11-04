import React, {ReactNode} from 'react'

import {styled} from '@karma.run/react'

const DescriptionListWrapper = styled('dl', () => ({
  _className: process.env.NODE_ENV !== 'production' ? 'DescriptionList' : undefined,

  fontSize: 12,
  marginTop: 0,
  marginBottom: 0
}))

export interface DescriptionItemProps {
  children?: ReactNode
}

export function DescriptionList({children}: DescriptionListItemProps) {
  return <DescriptionListWrapper>{children}</DescriptionListWrapper>
}

const DescriptionListItemWrapper = styled('div', () => ({
  _className: process.env.NODE_ENV !== 'production' ? 'DescriptionListItem' : undefined,

  display: 'flex',
  marginBottom: 10,

  ':last-child': {
    marginBottom: 0
  }
}))

const DescriptionListItemTerm = styled('dt', () => ({
  _className: process.env.NODE_ENV !== 'production' ? 'DescriptionListItemTerm' : undefined,

  color: 'gray',
  flexGrow: 1
}))

const DescriptionListItemDetail = styled('dd', () => ({
  _className: process.env.NODE_ENV !== 'production' ? 'DescriptionListItemDetail' : undefined,
  marginLeft: 20
}))

export interface DescriptionListItemProps {
  label?: ReactNode
  children?: ReactNode
}

export function DescriptionListItem({label, children}: DescriptionListItemProps) {
  return (
    <DescriptionListItemWrapper>
      <DescriptionListItemTerm>{label}</DescriptionListItemTerm>
      <DescriptionListItemDetail>{children}</DescriptionListItemDetail>
    </DescriptionListItemWrapper>
  )
}
