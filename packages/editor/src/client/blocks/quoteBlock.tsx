import React, {useRef, useEffect} from 'react'

import {BlockProps, TypographicTextArea, Box, Spacing} from '@karma.run/ui'

export interface QuoteBlockValue {
  readonly quote: string
  readonly author: string
}

export interface QuoteBlockProps extends BlockProps<QuoteBlockValue> {}

export function QuoteBlock({value, onChange, autofocus, disabled}: QuoteBlockProps) {
  const {quote, author} = value
  const focusRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => focusRef.current?.focus(), [])

  return (
    <>
      <TypographicTextArea
        ref={focusRef}
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
