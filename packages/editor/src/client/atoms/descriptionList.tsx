import React, {ReactNode} from 'react'
import {Interface} from 'readline'
import '../global.less'

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
  style?: React.CSSProperties
}

export function DescriptionListItem({label, children, style}: DescriptionListItemProps) {
  return (
    <div
      style={{
        display: 'flex',
        marginBottom: 10,
        ...style

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
          marginLeft: 20,
          // add this for image edit panel only - or ok so ?
          lineHeight: 1
        }}>
        {children}
      </dd>
    </div>
  )
}
