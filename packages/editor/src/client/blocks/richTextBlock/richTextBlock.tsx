import React, {memo} from 'react'
import {Element as SlateElement, Node as SlateNode} from 'slate'
import {BlockProps} from '../../atoms/blockList'
import {RichTextBlockValue} from '../types'

import {DreifussWysiwygEditor} from '@dreifuss-wysiwyg-editor/core'
import {EditorValue} from '@dreifuss-wysiwyg-editor/core/dist/types'

export interface RichTextBlockProps extends BlockProps<RichTextBlockValue> {
  displayOnly?: boolean
  showCharCount?: boolean
  displayOneLine?: boolean
}

export const RichTextBlock = memo(function RichTextBlock({
  value,
  autofocus,
  disabled,
  onChange,
  displayOnly = false,
  showCharCount = false,
  displayOneLine = false
}: RichTextBlockProps) {
  return (
    <DreifussWysiwygEditor
      displayOnly={displayOnly}
      showCharCount={showCharCount}
      displayOneLine={displayOneLine}
      disabled={disabled}
      value={(value as unknown) as EditorValue}
      onChange={(newValue: SlateNode[]) => {
        // setFocus(ReactEditor.isFocused(editor))
        if (value !== newValue) {
          onChange(newValue)
        }
      }}
    />
  )
})

// export formats.ts
export function createDefaultValue(): RichTextBlockValue {
  return [{type: 'paragraph', children: [{text: ''}]} as SlateElement]
}
