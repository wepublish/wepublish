import React, {useRef, useEffect} from 'react'

import {BlockProps, TypographicTextArea, Box, Spacing} from '@karma.run/ui'
import {QuoteBlockValue} from './types'

import {useTranslation} from 'react-i18next'

export type QuoteBlockProps = BlockProps<QuoteBlockValue>

export function QuoteBlock({value, onChange, autofocus, disabled}: QuoteBlockProps) {
  const {quote, author} = value
  const focusRef = useRef<HTMLTextAreaElement>(null)
  const {t} = useTranslation()

  useEffect(() => {
    if (autofocus) focusRef.current?.focus()
  }, [])

  return (
    <>
      <TypographicTextArea
        ref={focusRef}
        variant="h1"
        placeholder={t('Author')}
        value={quote}
        disabled={disabled}
        onChange={e => onChange({...value, quote: e.target.value})}
      />
      <Box display="flex" flexDirection="row" alignItems="center">
        <Box marginRight={Spacing.Tiny}>—</Box>
        <TypographicTextArea
          variant="body1"
          placeholder={t('Author')}
          value={author}
          disabled={disabled}
          onChange={e => onChange({...value, author: e.target.value})}
        />
      </Box>
    </>
  )
}
