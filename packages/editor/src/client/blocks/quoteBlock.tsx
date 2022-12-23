import styled from '@emotion/styled'
import React, {useEffect, useRef} from 'react'
import {useTranslation} from 'react-i18next'

import {BlockProps} from '../atoms/blockList'
import {TypographicTextArea} from '../atoms/typographicTextArea'
import {QuoteBlockValue} from './types'

const Dash = styled.div`
  margin-right: 5;
`

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

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
      <StyledWrapper>
        <Dash>—</Dash>
        <TypographicTextArea
          variant="body1"
          placeholder={t('blocks.quote.author')}
          value={author}
          disabled={disabled}
          onChange={e => onChange({...value, author: e.target.value})}
        />
      </StyledWrapper>
    </>
  )
}
