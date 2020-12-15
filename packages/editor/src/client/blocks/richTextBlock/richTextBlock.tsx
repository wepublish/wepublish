import React, {memo, useMemo, useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {createEditor, Node as SlateNode} from 'slate'
import {withHistory} from 'slate-history'
import {withReact, ReactEditor, Editable, Slate} from 'slate-react'
import {BlockProps} from '../../atoms/blockList'
import {EmojiPicker} from '../../atoms/emojiPicker'
import {Toolbar, ToolbarDivider, SubMenuButton} from '../../atoms/toolbar'
import {RichTextBlockValue} from '../types'
import {
  FormatButtonWithChildren,
  H1Icon,
  H2Icon,
  H3Icon,
  FormatIconButton,
  LinkFormatButton,
  RemoveLinkFormatButton
} from './buttons'
import {renderElement, renderLeaf, withRichText} from './editor'
import {BlockFormat, TextFormat} from './formats'
import {TableMenu} from './tableMenu'

export type RichTextBlockProps = BlockProps<RichTextBlockValue>

export const RichTextBlock = memo(function RichTextBlock({
  value,
  autofocus,
  disabled,
  onChange
}: RichTextBlockProps) {
  const editor = useMemo(() => withRichText(withHistory(withReact(createEditor()))), [])
  const [hasFocus, setFocus] = useState(false)

  const {t} = useTranslation()

  useEffect(() => {
    if (autofocus) {
      ReactEditor.focus(editor)
    }
  }, [])

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={(newValue: SlateNode[]) => {
        setFocus(ReactEditor.isFocused(editor))
        if (value !== newValue) onChange(newValue)
      }}>
      <Toolbar fadeOut={!hasFocus}>
        <FormatButtonWithChildren format={BlockFormat.H1}>
          <H1Icon />
        </FormatButtonWithChildren>
        <FormatButtonWithChildren format={BlockFormat.H2}>
          <H2Icon />
        </FormatButtonWithChildren>
        <FormatButtonWithChildren format={BlockFormat.H3}>
          <H3Icon />
        </FormatButtonWithChildren>

        <ToolbarDivider />

        <FormatIconButton icon="list-ul" format={BlockFormat.UnorderedList} />
        <FormatIconButton icon="list-ol" format={BlockFormat.OrderedList} />

        <ToolbarDivider />

        <SubMenuButton icon="table">
          <TableMenu />
        </SubMenuButton>

        <ToolbarDivider />

        <FormatIconButton icon="bold" format={TextFormat.Bold} />
        <FormatIconButton icon="italic" format={TextFormat.Italic} />
        <FormatIconButton icon="underline" format={TextFormat.Underline} />
        <FormatIconButton icon="strikethrough" format={TextFormat.Strikethrough} />
        <FormatIconButton icon="superscript" format={TextFormat.Superscript} />
        <FormatIconButton icon="subscript" format={TextFormat.Subscript} />

        <ToolbarDivider />

        <LinkFormatButton />
        <RemoveLinkFormatButton />

        <ToolbarDivider />

        <SubMenuButton icon="smile-o">
          <EmojiPicker doWithEmoji={emoji => editor.insertText(emoji)} />
        </SubMenuButton>
      </Toolbar>
      <Editable
        readOnly={disabled}
        placeholder={t('blocks.richText.startWriting')}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
      />
    </Slate>
  )
})

export function createDefaultValue(): RichTextBlockValue {
  return [{type: BlockFormat.Paragraph, children: [{text: ''}]}]
}
