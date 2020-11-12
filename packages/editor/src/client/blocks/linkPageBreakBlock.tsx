import React, {useRef, useEffect} from 'react'

import {TypographicTextArea} from '../atoms/typographicTextArea'
import {BlockProps} from '../atoms/blockList'
import {LinkPageBreakBlockValue} from './types'

import {useTranslation} from 'react-i18next'

export type LinkPageBreakBlockProps = BlockProps<LinkPageBreakBlockValue>

export function LinkPageBreakBlock({
  value,
  onChange,
  autofocus,
  disabled
}: LinkPageBreakBlockProps) {
  const {text, linkText, linkURL} = value
  const focusRef = useRef<HTMLTextAreaElement>(null)

  const {t} = useTranslation()

  useEffect(() => {
    if (autofocus) focusRef.current?.focus()
  }, [])

  return (
    <>
      <div style={{flexGrow: 1}}>
        <TypographicTextArea
          ref={focusRef}
          variant="h2"
          placeholder={t('blocks.linkPageBreak.text')}
          align="center"
          value={text}
          disabled={disabled}
          onChange={e => onChange({...value, text: e.target.value})}
        />
      </div>
      <TypographicTextArea
        ref={focusRef}
        variant="body1"
        placeholder={t('blocks.linkPageBreak.linkText')}
        align="center"
        value={linkText}
        disabled={disabled}
        onChange={e => onChange({...value, linkText: e.target.value})}
      />
      <TypographicTextArea
        ref={focusRef}
        variant="subtitle2"
        placeholder={t('blocks.linkPageBreak.linkURL')}
        align="center"
        value={linkURL}
        disabled={disabled}
        onChange={e => onChange({...value, linkURL: e.target.value})}
      />
    </>
  )
}
