import React from 'react'
import {cssRule, useStyle} from '@karma.run/react'

import {Color} from '../style/colors'

const PrimaryButtonStyle = cssRule({
  display: 'inline-block',
  textAlign: 'center',

  color: Color.White,
  backgroundColor: Color.NeutralDark,

  border: `1px solid ${Color.NeutralDark}`,

  fontSize: '1em',

  padding: '1.25em 2em',
  transition: 'background-color 200ms ease, color 200ms ease',

  '&:hover': {
    backgroundColor: Color.PrimaryDark,
    border: `1px solid ${Color.PrimaryDark}`
  }
})

export interface PrimaryButtonProps {
  text: string
}

export function PrimaryButton({text}: PrimaryButtonProps) {
  const css = useStyle()
  return <div className={css(PrimaryButtonStyle)}>{text}</div>
}
