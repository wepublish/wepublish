import {cssRule, useStyle} from '@karma.run/react'
import React from 'react'

export const Container = cssRule(() => ({
  textAlign: 'center',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '2rem',
  padding: '0 2rem'
}))

export interface HTMLBlockProps {
  html: string
}

export function HTMLBlock({html}: HTMLBlockProps) {
  const css = useStyle()
  return <div className={css(Container)} dangerouslySetInnerHTML={{__html: html}} />
}
