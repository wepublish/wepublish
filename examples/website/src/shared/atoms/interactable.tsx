import React, {ButtonHTMLAttributes} from 'react'
import {useStyle, cssRule} from '@karma.run/react'

export const ButtonResetStyle = cssRule({
  paddingLeft: 0,
  paddingBottom: 0,
  paddingRight: 0,
  paddingTop: 0,

  borderWidth: 0,
  borderStyle: 'none',
  borderColor: 'transparent',

  backgroundColor: 'transparent',

  color: 'inherit',
  font: 'inherit',

  lineHeight: 'normal',
  appearance: 'none'
})

/**
 * @deprecated Use `BaseButton` instead.
 */
export function Interactable(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const css = useStyle()
  return <button className={css(ButtonResetStyle)} {...props} />
}
