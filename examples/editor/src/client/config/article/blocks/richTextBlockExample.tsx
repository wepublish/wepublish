import React from 'react'

import {BlockProps} from '../atoms/blockList'
import {RichTextBlockExampleValue} from './types'
import {RichTextBlock} from '@wepublish/editor'

export type RichTextBlockProps = BlockProps<RichTextBlockExampleValue>

export function RichTextBlockExampleBlock({
  value,
  onChange,
  autofocus,
  disabled
}: RichTextBlockProps) {
  const {richText} = value
  return (
    <RichTextBlock
      value={richText}
      onChange={val => {
        onChange({richText: val as any})
      }}
      autofocus={autofocus}
      disabled={disabled}
    />
  )
}
