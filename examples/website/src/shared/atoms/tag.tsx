import React from 'react'
import {cssRule, useStyle} from '@karma.run/react'
import {Color} from '../style/colors'
import {pxToRem} from '../style/helpers'

const TagStyle = cssRule({
  display: 'flex',
  alignItems: 'center',

  overflow: 'hidden',

  fontSize: pxToRem(11),
  height: '3em',

  borderRadius: '3em',
  border: '1px solid black',

  backgroundColor: Color.White,
  transition: 'background-color 200ms ease',
  margin: `0 ${pxToRem(10)} ${pxToRem(10)} 0`,

  ':hover': {
    backgroundColor: Color.Black,
    color: Color.White
  },

  ':active': {
    backgroundColor: 'gray',
    color: Color.White
  }
})

const TagImageStyle = cssRule({
  border: '1px solid black',

  width: '3em',
  height: '3em',

  borderRadius: '3em'
})

const TagTitleStyle = cssRule({
  lineHeight: 1,
  flexGrow: 1,

  paddingLeft: '1rem',
  paddingRight: '1rem',

  textAlign: 'center'
})

export interface TagProps {
  title: string
  iconURL?: string
}

export function Tag({title, iconURL}: TagProps) {
  const css = useStyle()

  return (
    <div className={css(TagStyle)}>
      {iconURL && <img className={css(TagImageStyle)} src={iconURL} />}
      <div className={css(TagTitleStyle)}>{title}</div>
    </div>
  )
}
