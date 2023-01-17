import React from 'react'
import {cssRule, useStyle} from '@karma.run/react'
import {Color} from '../style/colors'
import {pxToRem} from '../style/helpers'

const PageHeaderStyle = cssRule({
  backgroundColor: Color.SecondaryLight,
  height: pxToRem(110),
  textTransform: 'uppercase',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center'
})

export interface PageHeaderProps {
  title: string
}

export function PageHeader({title}: PageHeaderProps) {
  const css = useStyle()
  return (
    <div className={css(PageHeaderStyle)}>
      <div>{title}</div>
    </div>
  )
}
