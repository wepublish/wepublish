import React, {useRef, useEffect} from 'react'

import {TypographicTextArea} from '../atoms/typographicTextArea'
import {BlockProps} from '../atoms/blockList'

import {useTranslation} from 'react-i18next'

import {TitleBlockValue} from './types'

export type TitleBlockProps = BlockProps<TitleBlockValue>

export function TitleBlock({value, onChange, autofocus, disabled}: TitleBlockProps) {
  const {title, lead} = value
  const focusRef = useRef<HTMLTextAreaElement>(null)

  const {t} = useTranslation()

  useEffect(() => {
    if (autofocus) focusRef.current?.focus()
  }, [])

  return (
    <>
      {/* TODO: Meta sync */}
      {/* <Layer right={0} top={0}>
          <IconButton
            icon={MaterialIconSyncAlt}
            title="Use as Meta Title &amp; Lead"
            onClick={() => {}}
          />
        </Layer> */}
      <TypographicTextArea
        ref={focusRef}
        variant="title"
        align="center"
        placeholder={t('blocks.title.title')}
        value={title}
        disabled={disabled}
        onChange={e => onChange({...value, title: e.target.value})}
      />
      <TypographicTextArea
        variant="body1"
        align="center"
        placeholder={t('blocks.title.leadText')}
        value={lead}
        disabled={disabled}
        onChange={e => onChange({...value, lead: e.target.value})}
      />
    </>
  )
}
