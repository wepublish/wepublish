import {Typography, css} from '@mui/material'
import {ParagraphProps} from '@wepublish/ui'
import {forwardRef} from 'react'

const maxParagraphSize = css`
  max-width: 75ch;
`

export const TsriParagraph = forwardRef<HTMLParagraphElement, ParagraphProps>(
  function TsriParagraph({children, gutterBottom = true, ...props}: ParagraphProps, ref) {
    return (
      <Typography
        {...props}
        ref={ref}
        variant="h6"
        paragraph
        gutterBottom={gutterBottom}
        css={maxParagraphSize}>
        {children}
      </Typography>
    )
  }
)
