import React from 'react'
import {IconType, BlockIcon} from './icon'
import {cssRule, useStyle} from '@karma.run/react'
import {Color} from '../style/colors'

export const RoundIconButtonStyle = cssRule(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: Color.White,
  border: `1px solid ${Color.SecondaryDark}`,
  fontSize: '1em',
  width: '1em',
  height: '1em',
  borderRadius: '1em',
  transition: 'background-color 200ms ease',

  '& > div': {
    fontSize: '0.45em',

    '& > svg': {
      fill: Color.NeutralDark,
      transition: 'fill 200ms ease'
    }
  },

  '&:hover': {
    backgroundColor: Color.PrimaryDark,

    '& > div > svg': {
      fill: Color.White
    }
  }
}))

export interface RoundIconButtonProps {
  icon: IconType
}

export function RoundIconButton({icon}: RoundIconButtonProps) {
  const css = useStyle()

  return (
    <div className={css(RoundIconButtonStyle)}>
      <BlockIcon type={icon} />
    </div>
  )
}
