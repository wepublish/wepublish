import React from 'react'

import {BlockProps, TypographicTextArea, Box, Spacing} from '@karma.run/ui'

export interface QuoteBlockValue {
  readonly quote: string
  readonly author: string
}

export interface QuoteBlockProps extends BlockProps<QuoteBlockValue> {}

export function QuoteBlock({value, onChange}: QuoteBlockProps) {
  const {quote, author} = value

  return (
    <>
      <TypographicTextArea
        variant="h1"
        placeholder="Quote"
        value={quote}
        onChange={e => onChange({...value, quote: e.target.value})}
      />
      <Box display="flex" flexDirection="row" alignItems="center">
        <Box marginRight={Spacing.Tiny}>—</Box>
        <TypographicTextArea
          variant="body1"
          placeholder="Author"
          value={author}
          onChange={e => onChange({...value, author: e.target.value})}
        />
      </Box>
    </>
  )
}
