import {css} from '@mui/material'
import {ParagraphProps, Paragraph as WepParagraph} from '@wepublish/ui'
import {forwardRef} from 'react'

const maxParagraphSize = css`
  max-width: 75ch;
  font-size: 1.125em;
`

export const Paragraph = forwardRef<HTMLParagraphElement, ParagraphProps>(function Paragraph(
  props: ParagraphProps,
  ref
) {
  return <WepParagraph {...props} css={maxParagraphSize} ref={ref} />
})
