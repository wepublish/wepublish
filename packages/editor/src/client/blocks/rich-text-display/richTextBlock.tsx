import React, {memo, useMemo, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {createEditor} from 'slate'
import {withHistory} from 'slate-history'
import {withReact, ReactEditor, Editable, Slate} from 'slate-react'
import {BlockProps} from '../../atoms/blockList'
import {RichTextBlockValue} from '../types'
import {renderElement, renderLeaf} from './editor/render'
import {withRichText, withTable} from './editor/plugins'
import {withNormalizeNode} from './editor/normalizing'
import {WepublishEditor} from './editor/wepublishEditor'

export type RichTextBlockProps = BlockProps<RichTextBlockValue>

export const RichTextBlock = memo(function RichTextBlock({value, autofocus}: RichTextBlockProps) {
  const editor = useMemo(
    () => withNormalizeNode(withTable(withRichText(withHistory(withReact(createEditor()))))),
    []
  )

  const {t} = useTranslation()

  useEffect(() => {
    if (autofocus) {
      ReactEditor.focus(editor)
    }
  }, [])

  return (
    <Slate editor={editor} value={value} onChange={console.log}>
      {WepublishEditor.isEmpty(editor) && ( // Alternative placeholder
        <div onClick={() => ReactEditor.focus(editor)} style={{color: '#cad5e4'}}>
          {t('blocks.richText.startWriting')}
        </div>
      )}
      <Editable readOnly renderElement={renderElement} renderLeaf={renderLeaf} />
    </Slate>
  )
})

export function createDefaultValue(): RichTextBlockValue {
  return WepublishEditor.createDefaultValue()
}
