import React, {useState, useRef, memo, useCallback, useEffect} from 'react'

import {Editor, Node, createEditor, Range} from 'slate'

import {
  useSlate,
  Editable,
  RenderElementProps,
  Slate,
  withReact,
  RenderLeafProps
} from 'slate-react'

import {withHistory} from 'slate-history'
import {defineSchema} from 'slate-schema'
import {jsx} from 'slate-hyperscript'

import {
  MaterialIconFormatBold,
  MaterialIconFormatItalic,
  MaterialIconFormatUnderlined,
  MaterialIconFormatStrikethrough,
  MaterialIconLooksTwoOutlined,
  MaterialIconLooks3Outlined,
  MaterialIconFormatListBulleted,
  MaterialIconFormatListNumbered,
  MaterialIconLooksOneOutlined,
  MaterialIconLink,
  MaterialIconLinkOff,
  MaterialIconClose,
  MaterialIconCheck
} from '@karma.run/icons'

import {
  Typography,
  ToolbarButtonProps,
  ToolbarButton,
  ToolbarDivider,
  Link,
  BlockProps,
  Toolbar,
  Dialog,
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  TextInput,
  Spacing,
  Box
} from '@karma.run/ui'

enum BlockFormat {
  H1 = 'heading-one',
  H2 = 'heading-two',
  H3 = 'heading-three',
  Paragraph = 'paragraph',
  UnorderedList = 'unordered-list',
  OrderedList = 'ordered-list',
  ListItem = 'list-item'
}

enum InlineFormat {
  Link = 'link'
}

enum TextFormat {
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  Strikethrough = 'strikethrough'
}

const BlockFormats: string[] = Object.values(BlockFormat)
const InlineFormats: string[] = Object.values(InlineFormat)
const TextFormats: string[] = Object.values(TextFormat)
const ListFormats: string[] = [BlockFormat.UnorderedList, BlockFormat.OrderedList]

enum CommandType {
  ToggleFormat = 'toggle_format',
  InsertData = 'insert_data',
  InsertText = 'insert_text',
  InsertLink = 'insert_link',
  RemoveLink = 'remove_link'
}

const ElementTags: any = {
  A: (el: Element) => ({type: InlineFormat.Link, url: el.getAttribute('href')}),
  H1: () => ({type: BlockFormat.H1}),
  H2: () => ({type: BlockFormat.H2}),
  H3: () => ({type: BlockFormat.H3}),
  P: () => ({type: BlockFormat.Paragraph}),
  LI: () => ({type: BlockFormat.ListItem}),
  OL: () => ({type: BlockFormat.OrderedList}),
  UL: () => ({type: BlockFormat.UnorderedList})
}

const TextTags: any = {
  S: () => ({[TextFormat.Strikethrough]: true}),
  DEL: () => ({[TextFormat.Strikethrough]: true}),
  EM: () => ({[TextFormat.Italic]: true}),
  I: () => ({[TextFormat.Italic]: true}),
  STRONG: () => ({[TextFormat.Bold]: true}),
  B: () => ({[TextFormat.Bold]: true}),
  U: () => ({[TextFormat.Underline]: true})
}

// TODO: Fix paste issues
function deserialize(el: any) {
  if (el.nodeType === 3) {
    return el.textContent
  } else if (el.nodeType !== 1) {
    return null
  } else if (el.nodeName === 'BR') {
    return '\n'
  }

  const {nodeName} = el
  let parent: any = el

  if (el.nodeNode === 'PRE' && el.childNodes[0] && el.childNodes[0].nodeName === 'CODE') {
    parent = el.childNodes[0]
  }

  const children = (Array.from(parent.childNodes) as any)
    .map((element: any) => deserialize(element))
    .flat()

  if (el.nodeName === 'BODY') {
    return jsx('fragment', {}, children)
  }

  if (ElementTags[nodeName]) {
    const attrs = ElementTags[nodeName](el)
    return jsx('element', attrs, children)
  }

  if (TextTags[nodeName]) {
    const attrs = TextTags[nodeName](el)
    return children.map((child: any) => jsx('text', attrs, child))
  }

  return children
}

function renderElement({attributes, children, element}: RenderElementProps) {
  switch (element.type) {
    case BlockFormat.H1:
      return (
        <Typography variant="h1" spacing="small" {...attributes}>
          {children}
        </Typography>
      )

    case BlockFormat.H2:
      return (
        <Typography variant="h2" spacing="small" {...attributes}>
          {children}
        </Typography>
      )

    case BlockFormat.H3:
      return (
        <Typography variant="h3" spacing="small" {...attributes}>
          {children}
        </Typography>
      )

    case BlockFormat.UnorderedList:
      return <ul {...attributes}>{children}</ul>

    case BlockFormat.OrderedList:
      return <ol {...attributes}>{children}</ol>

    case BlockFormat.ListItem:
      return <li {...attributes}>{children}</li>

    case InlineFormat.Link:
      const title = element.title ? `${element.title}:\n${element.url}` : element.url

      return (
        <Link title={title} {...attributes}>
          {children}
        </Link>
      )

    default:
      return (
        <Typography variant="body1" spacing="large" {...attributes}>
          {children}
        </Typography>
      )
  }
}

function renderLeaf({attributes, children, leaf}: RenderLeafProps) {
  if (leaf[TextFormat.Bold]) {
    children = <strong {...attributes}>{children}</strong>
  }

  if (leaf[TextFormat.Italic]) {
    children = <em {...attributes}>{children}</em>
  }

  if (leaf[TextFormat.Underline]) {
    children = <u {...attributes}>{children}</u>
  }

  if (leaf[TextFormat.Strikethrough]) {
    children = <del {...attributes}>{children}</del>
  }

  return <span {...attributes}>{children}</span>
}

const withSchema = defineSchema([
  {
    for: 'node',
    match: 'editor',
    validate: {
      children: [
        {
          match: [
            ([node]) =>
              node.type === BlockFormat.H1 ||
              node.type === BlockFormat.H2 ||
              node.type === BlockFormat.H3 ||
              node.type === BlockFormat.UnorderedList ||
              node.type === BlockFormat.OrderedList ||
              node.type === BlockFormat.Paragraph ||
              node.type === InlineFormat.Link
          ]
        }
      ]
    },
    normalize: (editor, error) => {
      const {code, path} = error

      switch (code) {
        case 'child_invalid':
          Editor.setNodes(editor, {type: BlockFormat.Paragraph}, {at: path})
          break
      }
    }
  },

  {
    for: 'node',
    match: ([node]) =>
      node.type === BlockFormat.UnorderedList || node.type === BlockFormat.OrderedList,
    validate: {
      children: [{match: [([node]) => node.type === BlockFormat.ListItem]}]
    },
    normalize: (editor, error) => {
      const {code, path} = error

      switch (code) {
        case 'child_invalid':
          Editor.setNodes(editor, {type: BlockFormat.ListItem}, {at: path})
          break
      }
    }
  }
])

export interface RichTextValue {
  readonly value: Node[]
  readonly selection: Range | null
}

export interface RichTextBlockProps extends BlockProps<RichTextValue> {}

export const RichTextBlock = memo(function RichTextBlock({
  value: {value, selection},
  disabled,
  onChange
}: RichTextBlockProps) {
  const [hasFocus, setFocus] = useState(false)

  const focusRef = useRef<HTMLElement>(null)
  const editorRef = useRef<Editor | null>(null)

  if (!editorRef.current) {
    editorRef.current = withSchema(withRichText(withHistory(withReact(createEditor()))))
  }

  useEffect(() => {
    // NOTE: Slate's `Editable` doesn't expose a ref so we have to get it manually.
    focusRef.current?.querySelector?.<HTMLElement>('div[contenteditable="true"]')?.focus()
  }, [])

  const handleChange = useCallback(
    (newValue: Node[], newSelection: Range | null) => {
      onChange(richTextValue => {
        const {value, selection} = richTextValue

        if (value === newValue && selection === newSelection) return richTextValue
        return {value: newValue, selection: newSelection}
      })
    },
    [onChange]
  )

  return (
    <Box ref={focusRef} width="100%">
      <Slate
        editor={editorRef.current!}
        value={value}
        selection={selection}
        onChange={handleChange}>
        <Toolbar fadeOut={!hasFocus}>
          <FormatButton icon={MaterialIconLooksOneOutlined} format={BlockFormat.H1} />
          <FormatButton icon={MaterialIconLooksTwoOutlined} format={BlockFormat.H2} />
          <FormatButton icon={MaterialIconLooks3Outlined} format={BlockFormat.H3} />

          <ToolbarDivider />

          <FormatButton icon={MaterialIconFormatListBulleted} format={BlockFormat.UnorderedList} />
          <FormatButton icon={MaterialIconFormatListNumbered} format={BlockFormat.OrderedList} />

          <ToolbarDivider />

          <FormatButton icon={MaterialIconFormatBold} format={TextFormat.Bold} />
          <FormatButton icon={MaterialIconFormatItalic} format={TextFormat.Italic} />
          <FormatButton icon={MaterialIconFormatUnderlined} format={TextFormat.Underline} />
          <FormatButton icon={MaterialIconFormatStrikethrough} format={TextFormat.Strikethrough} />

          <ToolbarDivider />

          <LinkFormatButton />
          <RemoveLinkFormatButton />
        </Toolbar>
        <Editable
          readOnly={disabled}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder="Start writing..."
          renderElement={renderElement}
          renderLeaf={renderLeaf}
        />
      </Slate>
    </Box>
  )
})

interface SlateBlockButtonProps extends ToolbarButtonProps {
  readonly format: BlockFormat | InlineFormat | TextFormat
}

function FormatButton({icon, format}: SlateBlockButtonProps) {
  const editor = useSlate()
  const [, forceRender] = useState({})

  return (
    <ToolbarButton
      icon={icon}
      active={isFormatActive(editor, format)}
      onMouseDown={e => {
        e.preventDefault()
        editor.exec({type: CommandType.ToggleFormat, format})

        // NOTE: ToggleFormat doesn't fire an onChange when pendingFormats gets updated
        forceRender({})
      }}
    />
  )
}

function LinkFormatButton() {
  const editor = useSlate()
  const [isLinkDialogOpen, setLinkDialogOpen] = useState(false)

  const [title, setTitle] = useState('')
  const [url, setURL] = useState('')

  const validatedURL = validateURL(url)
  const isDisabled = !validatedURL

  return (
    <>
      <ToolbarButton
        icon={MaterialIconLink}
        active={isFormatActive(editor, InlineFormat.Link)}
        onMouseDown={e => {
          e.preventDefault()

          setTitle('')
          setURL('')

          setLinkDialogOpen(true)
        }}
      />
      <Dialog open={isLinkDialogOpen}>
        {() => (
          <Panel>
            <PanelHeader
              leftChildren={
                <NavigationButton
                  icon={MaterialIconClose}
                  label="Cancel"
                  onClick={() => setLinkDialogOpen(false)}
                />
              }
              rightChildren={
                <NavigationButton
                  icon={MaterialIconCheck}
                  disabled={isDisabled}
                  label="Apply"
                  onClick={() => {
                    editor.exec({
                      type: CommandType.InsertLink,
                      url: validatedURL,
                      title: title || undefined
                    })
                    setLinkDialogOpen(false)
                  }}
                />
              }
            />
            <PanelSection>
              <Box width={300}>
                <TextInput
                  label="Link"
                  errorMessage={url && !validatedURL ? 'Invalid Link' : undefined}
                  value={url}
                  onChange={e => setURL(e.target.value)}
                  marginBottom={Spacing.ExtraSmall}
                />
                <TextInput
                  label="Title"
                  description="Optional description for the link"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </Box>
            </PanelSection>
          </Panel>
        )}
      </Dialog>
    </>
  )
}

function validateURL(url: string): string | null {
  try {
    url = url.match(/^https?:\/\//) ? url : `http://${url}`
    return new URL(url).toString()
  } catch (err) {
    return null
  }
}

function RemoveLinkFormatButton() {
  const editor = useSlate()

  return (
    <ToolbarButton
      icon={MaterialIconLinkOff}
      active={isFormatActive(editor, InlineFormat.Link)}
      disabled={!isFormatActive(editor, InlineFormat.Link)}
      onMouseDown={e => {
        e.preventDefault()
        editor.exec({type: CommandType.RemoveLink})
      }}
    />
  )
}

function isFormatActive(editor: Editor, format: BlockFormat | InlineFormat | TextFormat) {
  if (TextFormats.includes(format)) {
    if (editor.pendingFormats && editor.pendingFormats.hasOwnProperty(format)) {
      return editor.pendingFormats[format] ? true : false
    } else if (editor.selection) {
      const matches = Array.from(
        Editor.nodes(editor, {
          at: editor.selection!,
          match: 'text',
          mode: 'all'
        })
      )

      return matches.every(([match]) => match[format] === true)
    }
  }

  if (BlockFormats.includes(format) || InlineFormats.includes(format)) {
    const [match] = Editor.nodes(editor, {
      match: {type: format},
      mode: 'all'
    })

    return !!match
  }

  return false
}

function withRichText(editor: Editor): Editor {
  const {exec, isInline} = editor

  // See: https://github.com/ianstormtaylor/slate/issues/3144#issuecomment-562395538
  editor.pendingFormats = null
  editor.isInline = node => (InlineFormats.includes(node.type) ? true : isInline(node))

  editor.exec = command => {
    switch (command.type) {
      case CommandType.InsertText: {
        if (editor.pendingFormats) {
          Editor.insertNodes(editor, {
            ...editor.pendingFormats,
            text: command.text
          })

          editor.pendingFormats = null
        } else {
          exec(command)
        }
        break
      }

      case CommandType.ToggleFormat: {
        const {format} = command

        const isActive = isFormatActive(editor, format)
        const isList = ListFormats.includes(format)

        if (TextFormats.includes(format)) {
          if (editor.selection && Range.isExpanded(editor.selection)) {
            Editor.setNodes(
              editor,
              {[format]: isActive ? null : true},
              {match: 'text', split: true}
            )
          } else if (editor.selection) {
            const [[active]] = Editor.nodes(editor, {
              match: 'text',
              mode: 'all'
            })

            const activeFormats = TextFormats.reduce(
              (acc, key) => ({...acc, [key]: active[key]}),
              {} as Record<string, boolean | undefined>
            )

            editor.pendingFormats = {
              ...activeFormats,
              ...(editor.pendingFormats || {}),
              [format]: isActive ? undefined : true
            }
          }
        }

        if (BlockFormats.includes(format)) {
          for (const format of ListFormats) {
            Editor.unwrapNodes(editor, {match: {type: format}, split: true})
          }

          Editor.setNodes(editor, {
            type: isActive ? BlockFormat.Paragraph : isList ? BlockFormat.ListItem : format
          })

          if (!isActive && isList) {
            Editor.wrapNodes(editor, {type: format, children: []})
          }
        }

        break
      }

      case CommandType.InsertData: {
        const {data} = command
        const html = data.getData('text/html')

        if (html) {
          const parsed = new DOMParser().parseFromString(html, 'text/html')
          const fragment = deserialize(parsed.body)
          Editor.insertFragment(editor, fragment)
        }

        break
      }

      case CommandType.InsertLink: {
        const {url, title} = command

        Editor.unwrapNodes(editor, {match: {type: InlineFormat.Link}})
        Editor.wrapNodes(editor, {type: InlineFormat.Link, url, title, children: []}, {split: true})
        Editor.collapse(editor, {edge: 'end'})
        break
      }

      case CommandType.RemoveLink: {
        Editor.unwrapNodes(editor, {match: {type: InlineFormat.Link}})
        break
      }

      default: {
        exec(command)
        break
      }
    }
  }

  return editor
}

export function createDefaultValue(): RichTextValue {
  return {value: [{type: BlockFormat.Paragraph, children: [{text: ''}]}], selection: null}
}
