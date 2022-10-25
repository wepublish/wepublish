import BoldIcon from '@rsuite/icons/legacy/Bold'
import ItalicIcon from '@rsuite/icons/legacy/Italic'
import LinkIcon from '@rsuite/icons/legacy/Link'
import ListOlIcon from '@rsuite/icons/legacy/ListOl'
import ListUlIcon from '@rsuite/icons/legacy/ListUl'
import SmileOIcon from '@rsuite/icons/legacy/SmileO'
import StrikethroughIcon from '@rsuite/icons/legacy/Strikethrough'
import SubscriptIcon from '@rsuite/icons/legacy/Subscript'
import SuperscriptIcon from '@rsuite/icons/legacy/Superscript'
import TableIcon from '@rsuite/icons/legacy/Table'
import UnderlineIcon from '@rsuite/icons/legacy/Underline'
import React, {memo, useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {createEditor, Location, Node as SlateNode, Transforms} from 'slate'
import {withHistory} from 'slate-history'
import {Editable, ReactEditor, Slate, withReact} from 'slate-react'

import {BlockProps} from '../../atoms/blockList'
import {EmojiPicker} from '../../atoms/emojiPicker'
import {H1Icon, H2Icon, H3Icon, SubMenuButton, Toolbar, ToolbarDivider} from '../../atoms/toolbar'
import {RichTextBlockValue} from '../types'
import {BlockFormat, InlineFormat, TextFormat} from './editor/formats'
import {withNormalizeNode} from './editor/normalizing'
import {withRichText, withTable} from './editor/plugins'
import {renderElement, renderLeaf} from './editor/render'
import {WepublishEditor} from './editor/wepublishEditor'
import {EditorSubMenuButton, FormatButton, FormatIconButton} from './toolbar/buttons'
import {LinkMenu} from './toolbar/linkMenu'
import {TableMenu} from './toolbar/tableMenu'

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
  const editor = useMemo(
    () => withNormalizeNode(withTable(withRichText(withHistory(withReact(createEditor()))))),
    []
  )
  const [hasFocus, setFocus] = useState(false)
  const [location, setLocation] = useState<Location | null>(null)
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    setCharCount(WepublishEditor.calculateEditorCharCount(editor))
  }, [editor.children])

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

  const activateHotkey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key.toLowerCase()) {
      case 'b': {
        e.preventDefault()
        WepublishEditor.toggleFormat(editor, TextFormat.Bold)
        break
      }
      case 'i': {
        e.preventDefault()
        WepublishEditor.toggleFormat(editor, TextFormat.Italic)
        break
      }
      case 'u': {
        e.preventDefault()
        WepublishEditor.toggleFormat(editor, TextFormat.Underline)
        break
      }
      case 'x': {
        if (e.getModifierState('Shift')) {
          e.preventDefault()
          WepublishEditor.toggleFormat(editor, TextFormat.Strikethrough)
        }
        break
      }
    }
  }

  return (
    <Slate
      editor={editor}
      value={value?.length ? value : WepublishEditor.createDefaultValue()}
      onChange={(newValue: SlateNode[]) => {
        setFocus(ReactEditor.isFocused(editor))
        if (value !== newValue) {
          onChange(newValue)
        }
      }}>
      {!displayOnly && (
        <>
          <Toolbar
            fadeOut={!hasFocus}
            onMouseDown={() => {
              // e.preventDefault()
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

            <FormatIconButton icon={<ListUlIcon />} format={BlockFormat.UnorderedList} />
            <FormatIconButton icon={<ListOlIcon />} format={BlockFormat.OrderedList} />

            <ToolbarDivider />

            <EditorSubMenuButton icon={<TableIcon />} editorHasFocus={hasFocus}>
              <TableMenu />
            </EditorSubMenuButton>

            <ToolbarDivider />

            <FormatIconButton icon={<BoldIcon />} format={TextFormat.Bold} />
            <FormatIconButton icon={<ItalicIcon />} format={TextFormat.Italic} />
            <FormatIconButton icon={<UnderlineIcon />} format={TextFormat.Underline} />
            <FormatIconButton icon={<StrikethroughIcon />} format={TextFormat.Strikethrough} />
            <FormatIconButton icon={<SuperscriptIcon />} format={TextFormat.Superscript} />
            <FormatIconButton icon={<SubscriptIcon />} format={TextFormat.Subscript} />

            <ToolbarDivider />

            <SubMenuButton icon={<LinkIcon />} format={InlineFormat.Link}>
              <LinkMenu />
            </SubMenuButton>

            <ToolbarDivider />

            <SubMenuButton icon={<SmileOIcon />}>
              <EmojiPicker
                setEmoji={emoji => {
                  editor.insertText(emoji)
                }}
              />
            </SubMenuButton>
          </Toolbar>
          {WepublishEditor.isEmpty(editor) && ( // Alternative placeholder
            <div onClick={() => ReactEditor.focus(editor)} style={{color: '#cad5e4'}}>
              {t('blocks.richText.startWriting')}
            </div>
          )}
        </>
      )}
      <Editable
        style={
          displayOneLine
            ? {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }
            : undefined
        }
        readOnly={disabled || displayOnly}
        // placeholder={t('blocks.richText.startWriting')}  # causes focusing problems on firefox !
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onBlur={() => {
          setLocation(editor.selection)
        }}
        onKeyDown={e => {
          if (e.ctrlKey || e.metaKey) activateHotkey(e)
        }}
      />
      {showCharCount && (
        <p style={{textAlign: 'right'}}>{t('blocks.richText.charCount', {charCount})}</p>
      )}
    </Slate>
  )
})

export function createDefaultValue(): RichTextBlockValue {
  return WepublishEditor.createDefaultValue()
}
