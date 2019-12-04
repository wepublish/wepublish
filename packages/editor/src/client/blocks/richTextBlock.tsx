import React, {useState, useMemo, useCallback, useRef, memo} from 'react'

import {Editor, Node, createEditor} from 'slate'

import {
  RenderMarkProps,
  useSlate,
  Editable,
  RenderElementProps,
  Slate,
  withReact
} from 'slate-react'

import {withHistory} from 'slate-history'
import {SchemaRule, withSchema} from 'slate-schema'
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
  MaterialIconLink
} from '@karma.run/icons'

import {
  Typography,
  ToolbarButtonProps,
  ToolbarButton,
  ToolbarDivider,
  Link,
  BlockProps,
  Toolbar
} from '@karma.run/ui'

enum RichtextNodeType {
  H1 = 'heading-one',
  H2 = 'heading-two',
  H3 = 'heading-three',
  Paragraph = 'paragraph',
  UnorderedList = 'unordered-list',
  OrderedList = 'ordered-list',
  ListItem = 'list-item',
  Link = 'link'
}

enum RichtextMarkType {
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  Strikethrough = 'strikethrough'
}

const elementTags = {
  A: (el: Element) => ({type: 'link', url: el.getAttribute('href')}),
  H1: () => ({type: 'heading-one'}),
  H2: () => ({type: 'heading-two'}),
  H3: () => ({type: 'heading-three'}),
  LI: () => ({type: 'list-item'}),
  OL: () => ({type: 'numbered-list'}),
  P: () => ({type: 'paragraph'}),
  PRE: () => ({type: 'code'}),
  UL: () => ({type: 'bulleted-list'})
}

const markTags = {
  DEL: () => ({type: 'strikethrough'}),
  EM: () => ({type: 'italic'}),
  I: () => ({type: 'italic'}),
  S: () => ({type: 'strikethrough'}),
  STRONG: () => ({type: 'bold'}),
  U: () => ({type: 'underline'})
}

function deserialize(el: Element) {
  if (el.nodeType === 3) {
    return el.textContent
  } else if (el.nodeType !== 1) {
    return null
  } else if (el.nodeName === 'BR') {
    return '\n'
  }

  let parent: any = el

  if (el.nodeName === 'PRE' && el.childNodes[0] && el.childNodes[0].nodeName === 'CODE') {
    parent = el.childNodes[0]
  }

  const children: any = Array.from(parent.childNodes).map(deserialize as any)

  if (el.nodeName === 'BODY') {
    return jsx('fragment', {}, children)
  }

  const elementFn = elementTags[el.nodeName as keyof typeof elementTags]
  const markFn = markTags[el.nodeName as keyof typeof markTags]

  if (elementFn) {
    const attrs = elementFn(el)
    return jsx('element', attrs, children)
  }

  if (markFn) {
    const attrs = markFn()
    return jsx('mark', attrs, children)
  }

  return children
}

function renderElement({attributes, children, element}: RenderElementProps) {
  switch (element.type) {
    case RichtextNodeType.H1:
      return (
        <Typography variant="h1" spacing="small" {...attributes}>
          {children}
        </Typography>
      )

    case RichtextNodeType.H2:
      return (
        <Typography variant="h2" spacing="small" {...attributes}>
          {children}
        </Typography>
      )

    case RichtextNodeType.H3:
      return (
        <Typography variant="h3" spacing="small" {...attributes}>
          {children}
        </Typography>
      )

    case RichtextNodeType.UnorderedList:
      return <ul {...attributes}>{children}</ul>

    case RichtextNodeType.OrderedList:
      return <ol {...attributes}>{children}</ol>

    case RichtextNodeType.ListItem:
      return <li {...attributes}>{children}</li>

    case RichtextNodeType.Link:
      return <Link {...attributes}>{children}</Link>
  }

  return (
    <Typography variant="body1" spacing="large" {...attributes}>
      {children}
    </Typography>
  )
}

function renderMark({attributes, children, mark}: RenderMarkProps) {
  switch (mark.type) {
    case RichtextMarkType.Bold:
      return <strong {...attributes}>{children}</strong>

    case RichtextMarkType.Italic:
      return <em {...attributes}>{children}</em>

    case RichtextMarkType.Underline:
      return <u {...attributes}>{children}</u>

    case RichtextMarkType.Strikethrough:
      return <del {...attributes}>{children}</del>
  }

  return <span {...attributes}>{children}</span>
}

const schema: SchemaRule[] = [
  {
    for: 'node',
    match: 'editor',
    validate: {
      children: [
        {
          match: [
            ([node]) =>
              node.type === RichtextNodeType.H1 ||
              node.type === RichtextNodeType.H2 ||
              node.type === RichtextNodeType.H3 ||
              node.type === RichtextNodeType.UnorderedList ||
              node.type === RichtextNodeType.OrderedList ||
              node.type === RichtextNodeType.Paragraph
          ]
        }
      ]
    },
    normalize: (editor, error) => {
      const {code, path} = error

      switch (code) {
        case 'child_invalid':
          Editor.setNodes(editor, {type: RichtextNodeType.Paragraph}, {at: path})
          break
      }
    }
  },

  {
    for: 'node',
    match: ([node]) =>
      node.type === RichtextNodeType.UnorderedList || node.type === RichtextNodeType.OrderedList,
    validate: {
      children: [{match: [([node]) => node.type === RichtextNodeType.ListItem]}]
    },
    normalize: (editor, error) => {
      const {code, path} = error

      switch (code) {
        case 'child_invalid':
          Editor.setNodes(editor, {type: RichtextNodeType.ListItem}, {at: path})
          break
      }
    }
  }
]

export interface RichTextBlockProps extends BlockProps<Node[]> {}

export function RichTextBlock({value, onChange}: RichTextBlockProps) {
  const onChangeRef = useRef<((nodes: Node[]) => void) | null>(null)

  onChangeRef.current = onChange

  const initalValue = useMemo(() => value, [])
  const memoOnChange = useCallback((nodes: Node[]) => {
    onChangeRef.current?.(nodes)
  }, [])

  return <SlateMemoWorkaround initalValue={initalValue} onChange={memoOnChange} />
}

interface SlateMemoWorkaroundProps {
  readonly initalValue: Node[]
  onChange(nodes: Node[]): void
}

// TODO: Hacky workaround remove once Slate allows being a controlled component.
// See: https://github.com/ianstormtaylor/slate/pull/3216
const SlateMemoWorkaround = memo(function SlateMemoWorkaround({
  initalValue,
  onChange
}: SlateMemoWorkaroundProps) {
  const [hasFocus, setFocus] = useState(false)

  const editorRef = useRef<Editor | null>(null)

  if (!editorRef.current) {
    editorRef.current = withSchema(withRichText(withHistory(withReact(createEditor()))), schema)
  }

  return (
    <Slate editor={editorRef.current} defaultValue={initalValue} onChange={onChange}>
      <>
        <Toolbar fadeOut={!hasFocus}>
          <SlateBlockButton icon={MaterialIconLooksOneOutlined} blockType={RichtextNodeType.H1} />
          <SlateBlockButton icon={MaterialIconLooksTwoOutlined} blockType={RichtextNodeType.H2} />
          <SlateBlockButton icon={MaterialIconLooks3Outlined} blockType={RichtextNodeType.H3} />
          <ToolbarDivider />
          <SlateBlockButton
            icon={MaterialIconFormatListBulleted}
            blockType={RichtextNodeType.UnorderedList}
          />
          <SlateBlockButton
            icon={MaterialIconFormatListNumbered}
            blockType={RichtextNodeType.OrderedList}
          />
          <ToolbarDivider />
          <SlateMarkButton icon={MaterialIconFormatBold} markType={RichtextMarkType.Bold} />
          <SlateMarkButton icon={MaterialIconFormatItalic} markType={RichtextMarkType.Italic} />
          <SlateMarkButton
            icon={MaterialIconFormatStrikethrough}
            markType={RichtextMarkType.Strikethrough}
          />
          <SlateMarkButton
            icon={MaterialIconFormatUnderlined}
            markType={RichtextMarkType.Underline}
          />
          <ToolbarDivider />
          <SlateLinkButton />
        </Toolbar>
        <Editable
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder="Start writing..."
          renderElement={renderElement}
          renderMark={renderMark}
        />
      </>
    </Slate>
  )
})

interface SlateBlockButtonProps extends ToolbarButtonProps {
  readonly blockType: RichtextNodeType
}

function SlateBlockButton({icon, blockType}: SlateBlockButtonProps) {
  const editor = useSlate()

  return (
    <ToolbarButton
      icon={icon}
      active={isBlockActive(editor, blockType)}
      onMouseDown={e => {
        e.preventDefault()
        editor.exec({type: 'toggle_block', block: blockType})
      }}
    />
  )
}

function SlateLinkButton() {
  const editor = useSlate()

  return (
    <ToolbarButton
      icon={MaterialIconLink}
      active={isBlockActive(editor, RichtextNodeType.Link)}
      onMouseDown={e => {
        e.preventDefault()

        if (isBlockActive(editor, RichtextNodeType.Link)) {
          editor.exec({type: 'remove_link'})
        } else {
          const url = window.prompt('Enter the URL of the link:')
          if (!url) return
          editor.exec({type: 'insert_link', url})
        }
      }}
    />
  )
}

interface SlateMarkButtonProps extends ToolbarButtonProps {
  readonly markType: RichtextMarkType
}

function SlateMarkButton({icon, markType}: SlateMarkButtonProps) {
  const editor = useSlate()

  return (
    <ToolbarButton
      icon={icon}
      active={isMarkActive(editor, markType)}
      onMouseDown={e => {
        e.preventDefault()
        editor.exec({type: 'toggle_mark', mark: markType})
      }}
    />
  )
}

function isBlockActive(editor: Editor, type: RichtextNodeType) {
  const {selection} = editor
  if (!selection) return false
  const match = Editor.match(editor, selection, {type})
  return !!match
}

function isMarkActive(editor: Editor, type: RichtextMarkType) {
  const marks = Array.from(Editor.marks(editor))
  const isActive = marks.some(([mark]) => mark.type === type)
  return isActive
}

function unwrapLink(editor: Editor) {
  Editor.unwrapNodes(editor, {match: {type: RichtextNodeType.Link}})
}

function wrapLink(editor: Editor, url: string) {
  if (isBlockActive(editor, RichtextNodeType.Link)) {
    unwrapLink(editor)
  }

  const link = {type: 'link', url, children: []}
  Editor.wrapNodes(editor, link, {split: true})
  Editor.collapse(editor, {edge: 'end'})
}

function withRichText(editor: Editor): Editor {
  const {exec, isInline} = editor

  editor.isInline = node => (node.type === RichtextNodeType.Link ? true : isInline(node))

  editor.exec = command => {
    if (command.type === 'insert_link') {
      const {url} = command

      if (editor.selection) {
        wrapLink(editor, url)
      }

      return
    }

    if (command.type === 'remove_link') {
      unwrapLink(editor)
    }

    if (command.type === 'toggle_block') {
      const {block: type} = command
      const isActive = isBlockActive(editor, type)

      const isListType =
        type === RichtextNodeType.UnorderedList || type === RichtextNodeType.OrderedList

      Editor.unwrapNodes(editor, {match: {type: RichtextNodeType.UnorderedList}})
      Editor.unwrapNodes(editor, {match: {type: RichtextNodeType.OrderedList}})

      const newType = isActive
        ? RichtextNodeType.Paragraph
        : isListType
        ? RichtextNodeType.ListItem
        : type

      Editor.setNodes(editor, {type: newType})

      if (!isActive && isListType) {
        Editor.wrapNodes(editor, {type, children: []})
      }

      return
    }

    if (command.type === 'toggle_mark') {
      const {mark: type} = command
      const isActive = isMarkActive(editor, type)
      const cmd = isActive ? 'remove_mark' : 'add_mark'
      editor.exec({type: cmd, mark: {type}})
      return
    }

    if (command.type === 'insert_data') {
      const {data} = command
      const html = data.getData('text/html')

      if (html) {
        const parsed = new DOMParser().parseFromString(html, 'text/html')
        const fragment = deserialize(parsed.body)
        Editor.insertFragment(editor, fragment)
        return
      }
    }

    exec(command)
  }

  return editor
}
