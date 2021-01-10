import React, {memo, useMemo, useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {createEditor, Location, Node as SlateNode, Transforms} from 'slate'
import {withHistory} from 'slate-history'
import {withReact, ReactEditor, Editable, Slate} from 'slate-react'
import {BlockProps} from '../../atoms/blockList'
import {EmojiPicker} from '../../atoms/emojiPicker'
import {Toolbar, ToolbarDivider, H1Icon, H2Icon, H3Icon} from '../../atoms/toolbar'
import {RichTextBlockValue} from '../types'
import {FormatButton, FormatIconButton, EditorSubMenuButton} from './toolbar/buttons'
import {renderElement, renderLeaf} from './editor/render'
import {BlockFormat, TextFormat} from './editor/formats'
import {withRichText, withTable} from './editor/plugins'
import {withNormalizeNode} from './editor/normalizing'
import {LinkFormatButton, RemoveLinkFormatButton} from './toolbar/linkButton'
import {TableMenu} from './toolbar/tableMenu'

export type RichTextBlockProps = BlockProps<RichTextBlockValue>

export const RichTextBlock = memo(function RichTextBlock({
  value,
  autofocus,
  disabled,
  onChange
}: RichTextBlockProps) {
  const editor = useMemo(
    () => withNormalizeNode(withTable(withRichText(withHistory(withReact(createEditor()))))),
    []
  )
  const [hasFocus, setFocus] = useState(false)
  const [location, setLocation] = useState<Location | null>(null)

  const {t} = useTranslation()

  useEffect(() => {
    if (autofocus) {
      ReactEditor.focus(editor)
    }
  }, [])

  const focusAtPreviousLocation = (location: Location) => {
    Transforms.select(editor, location)
    ReactEditor.focus(editor)
  }

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={(newValue: SlateNode[]) => {
        setFocus(ReactEditor.isFocused(editor))
        if (value !== newValue) onChange(newValue)
      }}>
      <Toolbar
        fadeOut={!hasFocus}
        onMouseDown={e => {
          e.preventDefault()
          if (!hasFocus && location) focusAtPreviousLocation(location)
        }}>
        <FormatButton format={BlockFormat.H1}>
          <H1Icon />
        </FormatButton>
        <FormatButton format={BlockFormat.H2}>
          <H2Icon />
        </FormatButton>
        <FormatButton format={BlockFormat.H3}>
          <H3Icon />
        </FormatButton>

        <ToolbarDivider />

        <FormatIconButton icon="list-ul" format={BlockFormat.UnorderedList} />
        <FormatIconButton icon="list-ol" format={BlockFormat.OrderedList} />

        <ToolbarDivider />

        <EditorSubMenuButton icon="table" editorHasFocus={hasFocus}>
          <TableMenu />
        </EditorSubMenuButton>

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

        <EditorSubMenuButton icon="smile-o" editorHasFocus={hasFocus}>
          <EmojiPicker doWithEmoji={emoji => editor.insertText(emoji)} />
        </EditorSubMenuButton>
      </Toolbar>
      <Editable
        readOnly={disabled}
        placeholder={t('blocks.richText.startWriting')}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onBlur={() => {
          setLocation(editor.selection)
        }}
      />
    </Slate>
  )
})

export function createDefaultValue(): RichTextBlockValue {
  return [{type: BlockFormat.Paragraph, children: [{text: ''}]}]
}
