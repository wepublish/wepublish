import React, {memo, useMemo, useEffect} from 'react'
import {createEditor, Node as SlateNode} from 'slate'
import {withHistory} from 'slate-history'
import {withReact, ReactEditor, Editable, Slate} from 'slate-react'
import {RichTextBlockValue} from '../../types'
import {renderElement, renderLeaf} from './editor/render'
import {withRichText, withTable} from './editor/plugins'
import {withNormalizeNode} from './editor/normalizing'
import {WepublishEditor} from './editor/wepublishEditor'

export interface BlockProps<V = any> {
  value: V
  onChange: React.Dispatch<React.SetStateAction<V>>
  autofocus?: boolean
  disabled?: boolean
}

export interface RichTextBlockProps extends BlockProps<RichTextBlockValue> {
  displayOnly?: boolean
}

export const RichTextBlock = memo(function RichTextBlock({
  value,
  autofocus,
  disabled,
  onChange,
  displayOnly = false
}: RichTextBlockProps) {
  const editor = useMemo(
    () => withNormalizeNode(withTable(withRichText(withHistory(withReact(createEditor()))))),
    []
  )
  // const [hasFocus, setFocus] = useState(false)
  // const [location, setLocation] = useState<Location | null>(null)

  // const {t} = useTranslation()

  useEffect(() => {
    if (autofocus) {
      ReactEditor.focus(editor)
    }
  }, [])

  /* const focusAtPreviousLocation = (location: Location) => {
    Transforms.select(editor, location)
    ReactEditor.focus(editor)
  } */

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={(newValue: SlateNode[]) => {
        // setFocus(ReactEditor.isFocused(editor))
        if (value !== newValue) {
          onChange(newValue)
        }
      }}>
      {/*
      {!displayOnly && (
        <>
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

            <SubMenuButton icon="smile-o">
              {/* Currently inactive due to issues with server-side rendering
              <EmojiPicker setEmoji={emoji => editor.insertText(emoji)} /> 
            </SubMenuButton>
          </Toolbar> 
          {WepublishEditor.isEmpty(editor) && ( // Alternative placeholder
            <div onClick={() => ReactEditor.focus(editor)} style={{color: '#cad5e4'}}>
              {t('Start writing your comment')}
            </div> 
          )} 
        </> 
      )} */}

      <Editable
        readOnly={disabled || displayOnly}
        // placeholder={t('blocks.richText.startWriting')}  # causes focusing problems on firefox !
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onBlur={() => {
          // setLocation(editor.selection)
        }}
      />
    </Slate>
  )
})

export function createDefaultValue(): RichTextBlockValue {
  return WepublishEditor.createDefaultValue()
}
