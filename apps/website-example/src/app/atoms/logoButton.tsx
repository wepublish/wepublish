import React from 'react'
import {cssRule, useStyle} from '@karma.run/react'

import {SmallLogo} from './logo'
import {Color} from '../style/colors'
import {pxToRem} from '../style/helpers'

export const LogoButtonStyle = cssRule({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  backgroundColor: Color.NeutralDark,
  borderRadius: '50%',

  fontSize: pxToRem(40),

  width: '1em',
  height: '1em',

  fill: Color.White,
  transition: 'background-color 200ms ease',

  ':hover': {
    backgroundColor: Color.PrimaryDark
  },

  '> svg': {
    fontSize: '0.5em'
  }
})

export function LogoButton() {
  const css = useStyle()

  return (
    <div className={css(LogoButtonStyle)}>
      <SmallLogo />
    </div>
  )
}
