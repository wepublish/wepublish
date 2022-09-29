import {cssRule, useStyle} from '@karma.run/react'
import React from 'react'
import {pxToRem} from '../style/helpers'
import InnerHTML from 'dangerously-set-html-content'

const Container = cssRule(() => ({
  paddingTop: pxToRem(30),
  maxWidth: pxToRem(800),
  margin: '0 auto',
  paddingBottom: pxToRem(40),
  marginBottom: pxToRem(70)
}))

export interface HTMLBlockProps {
  html: string
}

export function HTMLBlock({html}: HTMLBlockProps) {
  const css = useStyle()
  return (
    <div className={css(Container)}>
      <InnerHTML html={html} />
    </div>
  )
}
