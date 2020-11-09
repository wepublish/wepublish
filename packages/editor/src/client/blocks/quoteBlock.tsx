import React, {useRef, useEffect} from 'react'

import {BlockProps} from '../atoms/blockList'
import {TypographicTextArea} from '../atoms/typographicTextArea'

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
        placeholder={t('blocks.quote.quote')}
        value={quote}
        disabled={disabled}
        onChange={e => onChange({...value, quote: e.target.value})}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center'
        }}>
        <div
          style={{
            marginRight: 5
          }}>
          —
        </div>
        <TypographicTextArea
          variant="body1"
          placeholder={t('blocks.quote.author')}
          value={author}
          disabled={disabled}
          onChange={e => onChange({...value, author: e.target.value})}
        />
      </div>
    </>
  )
}
