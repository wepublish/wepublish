import React from 'react'
import {useStyle, cssRule} from '@karma.run/react'
import {pxToRem, whenTablet, whenDesktop} from '../style/helpers'
import {usePermanentVisibility} from '../utils/hooks'

export interface QuoteBlockProps {
  readonly text: string
  readonly author?: string
}

const QuoteStyle = cssRule<{showBackground: boolean}>(({showBackground}) => ({
  margin: `0 auto ${pxToRem(50)}`,
  padding: `0 ${pxToRem(25)}`,
  opacity: showBackground ? 1 : 0,
  transform: showBackground ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100px, 0)',
  transition: 'opacity 500ms ease, transform 700ms ease',

  width: '75%',

  ...whenTablet({
    margin: `0 auto ${pxToRem(70)}`,
    maxWidth: pxToRem(1000)
  }),

  ...whenDesktop({
    margin: `0 auto ${pxToRem(70)}`,
    width: '75%',
    maxWidth: pxToRem(1000)
  }),

  '> p': {
    fontSize: pxToRem(30),
    fontStyle: 'italic',
    lineHeight: '1.3em',
    margin: `0 0 ${pxToRem(10)}`
  },

  '> cite': {
    textAlign: 'right',
    display: 'block'
  }
}))

export function QuoteBlock({text, author}: QuoteBlockProps) {
  const ref = React.createRef<HTMLParagraphElement>()
  const show = usePermanentVisibility(ref, {threshold: 0})
  const css = useStyle({showBackground: show})
  return (
    <blockquote ref={ref} className={css(QuoteStyle)}>
      <p>{text}</p>
      {author && <cite>{author}</cite>}
    </blockquote>
  )
}
