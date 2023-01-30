import {memo, useMemo} from 'react'
import {createEditor, Node as SlateNode} from 'slate'
import {withHistory} from 'slate-history'
import {withReact, Editable, Slate} from 'slate-react'
import {renderElement, renderLeaf} from './editor/render'
import {withRichText, withTable} from './editor/plugins'
import {withNormalizeNode} from './editor/normalizing'
import {WepublishEditor} from './editor/wepublishEditor'

export interface BlockProps<V = any> {
  value: V
  disabled?: boolean
}

export interface RichTextBlockProps extends BlockProps<SlateNode[]> {
  displayOnly?: boolean
}

export const RichTextBlock = memo(function RichTextBlock({
  value,
  disabled,
  displayOnly = false
}: RichTextBlockProps) {
  const editor = useMemo(
    () => withNormalizeNode(withTable(withRichText(withHistory(withReact(createEditor()))))),
    []
  )

  return (
    <Slate editor={editor} value={value} onChange={(newValue: SlateNode[]) => {}}>
      <Editable
        readOnly={disabled || displayOnly}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
      />
    </Slate>
  )
})

export function createDefaultValue(): SlateNode[] {
  return WepublishEditor.createDefaultValue()
}
