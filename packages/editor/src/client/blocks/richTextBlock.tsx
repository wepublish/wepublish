import React, {useState, memo, useEffect, useMemo} from 'react'
import {Editor, Node as SlateNode, createEditor, Range, Transforms, Point} from 'slate'

import {
  useSlate,
  Editable,
  RenderElementProps,
  Slate,
  withReact,
  RenderLeafProps,
  ReactEditor
} from 'slate-react'

import {withHistory} from 'slate-history'
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
  MaterialIconCheck,
  MaterialIconGridOn
} from '@karma.run/icons'

import {
  Typography,
  ToolbarButtonProps,
  ToolbarButton,
  Button,
  BaseButtonProps,
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
import {RichTextBlockValue} from './types'

import {useTranslation} from 'react-i18next'

enum BlockFormat {
  H1 = 'heading-one',
  H2 = 'heading-two',
  H3 = 'heading-three',
  Paragraph = 'paragraph',
  UnorderedList = 'unordered-list',
  OrderedList = 'ordered-list',
  ListItem = 'list-item',
  HorizontalLine = 'horizontal-line', // TODO
  Table = 'table',
  TableRow = 'table-row',
  TableCell = 'table-cell'
}

enum InlineFormat {
  Link = 'link'
}

enum TextFormat {
  // TODO add hrizontalline <hr>
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  Strikethrough = 'strikethrough',
  Superscript = 'superscript',
  Subscript = 'subscript'
}

type Format = BlockFormat | InlineFormat | TextFormat

const BlockFormats: string[] = Object.values(BlockFormat)
const InlineFormats: string[] = Object.values(InlineFormat)
const TextFormats: string[] = Object.values(TextFormat)
const ListFormats: string[] = [BlockFormat.UnorderedList, BlockFormat.OrderedList]

const ElementTags: any = {
  A: (el: Element) => ({
    type: InlineFormat.Link,
    url: el.getAttribute('data-href') || el.getAttribute('href'),
    title: el.getAttribute('data-title') || el.getAttribute('title')
  }),
  H1: () => ({type: BlockFormat.H1}),
  H2: () => ({type: BlockFormat.H2}),
  H3: () => ({type: BlockFormat.H3}),
  P: () => ({type: BlockFormat.Paragraph}),
  LI: () => ({type: BlockFormat.ListItem}),
  OL: () => ({type: BlockFormat.OrderedList}),
  UL: () => ({type: BlockFormat.UnorderedList}),
  HR: () => ({type: BlockFormat.HorizontalLine}),
  TB: () => ({type: BlockFormat.Table}),
  TR: () => ({type: BlockFormat.TableRow}),
  TD: () => ({type: BlockFormat.TableCell})
}

const TextTags: any = {
  S: () => ({[TextFormat.Strikethrough]: true}),
  DEL: () => ({[TextFormat.Strikethrough]: true}),
  EM: () => ({[TextFormat.Italic]: true}),
  I: () => ({[TextFormat.Italic]: true}),
  STRONG: () => ({[TextFormat.Bold]: true}),
  B: () => ({[TextFormat.Bold]: true}),
  U: () => ({[TextFormat.Underline]: true}),
  SUP: () => ({[TextFormat.Superscript]: true}),
  SUB: () => ({[TextFormat.Subscript]: true})
}

function deserialize(element: Element): any {
  const {nodeName, nodeType} = element

  if (nodeType === Node.TEXT_NODE) {
    return element.textContent
  } else if (nodeType !== Node.ELEMENT_NODE) {
    return null
  } else if (nodeName === 'BR') {
    return '\n'
  }

  let parent: Element = element

  if (nodeName === 'PRE' && element.childNodes[0] && element.childNodes[0].nodeName === 'CODE') {
    parent = element.childNodes[0] as Element
  }

  const children = Array.from(parent.childNodes)
    .map(element => deserialize(element as Element))
    .flat()

  if (nodeName === 'BODY') {
    return jsx('fragment', {}, children)
  }

  if (ElementTags[nodeName]) {
    const attrs = ElementTags[nodeName](element)
    return jsx('element', attrs, children)
  }

  if (TextTags[nodeName]) {
    const attrs = TextTags[nodeName](element)

    if (!children.some(child => child.children !== undefined)) {
      return children.map(child => {
        return jsx('text', attrs, child)
      })
    }
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

    case BlockFormat.Table:
      return (
        <table>
          <tbody {...attributes}>{children}</tbody>
        </table>
      )

    case BlockFormat.TableRow:
      return <tr {...attributes}>{children}</tr>

    case BlockFormat.TableCell:
      return <td {...attributes}>{children}</td>

    // case BlockFormat.HorizontalLine:
    //  return <hr {...attributes} />

    case InlineFormat.Link:
      // TODO: Implement custom tooltip
      // const title = element.title ? `${element.title}: ${element.url}` : element.url
      // title={title}

      return (
        <Link data-title={element.title} data-href={element.url} {...attributes}>
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

  if (leaf[TextFormat.Superscript]) {
    children = <sup {...attributes}>{children}</sup>
  }

  if (leaf[TextFormat.Subscript]) {
    children = <sub {...attributes}>{children}</sub>
  }
  if (leaf.text === '😄') {
    children = <sub {...attributes}>{children}</sub>
  }

  return <span {...attributes}>{children}</span>
}

// TODO: Re-implement via `normalizeNode`
// See: https://github.com/ianstormtaylor/slate/blob/master/Changelog.md#0530--december-10-2019

// const withSchema = defineSchema([
//   {
//     for: 'node',
//     match: 'editor',
//     validate: {
//       children: [
//         {
//           match: [
//             ([node]) =>
//               node.type === BlockFormat.H1 ||
//               node.type === BlockFormat.H2 ||
//               node.type === BlockFormat.H3 ||
//               node.type === BlockFormat.UnorderedList ||
//               node.type === BlockFormat.OrderedList ||
//               node.type === BlockFormat.Paragraph ||
//               node.type === InlineFormat.Link
//           ]
//         }
//       ]
//     },
//     normalize: (editor, error) => {
//       const {code, path} = error

//       switch (code) {
//         case 'child_invalid':
//           Editor.setNodes(editor, {type: BlockFormat.Paragraph}, {at: path})
//           break
//       }
//     }
//   },

//   {
//     for: 'node',
//     match: ([node]) =>
//       node.type === BlockFormat.UnorderedList || node.type === BlockFormat.OrderedList,
//     validate: {
//       children: [{match: [([node]) => node.type === BlockFormat.ListItem]}]
//     },
//     normalize: (editor, error) => {
//       const {code, path} = error

//       switch (code) {
//         case 'child_invalid':
//           Editor.setNodes(editor, {type: BlockFormat.ListItem}, {at: path})
//           break
//       }
//     }
//   }
// ])

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

  //  <Slate editor={editor} value={value} onChange={value => setValue(value)}>
  //    <Editable renderElement={renderElement} renderLeaf={renderLeaf} />
  //  </Slate>

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={(newValue: SlateNode[]) => {
        setFocus(ReactEditor.isFocused(editor))
        if (value !== newValue) onChange(newValue)
      }}>
      <Toolbar fadeOut={!hasFocus}>
        <FormatButton icon={MaterialIconLooksOneOutlined} format={BlockFormat.H1} />
        <FormatButton icon={MaterialIconLooksTwoOutlined} format={BlockFormat.H2} />
        <FormatButton icon={MaterialIconLooks3Outlined} format={BlockFormat.H3} />

        <ToolbarDivider />

        <FormatButton icon={MaterialIconFormatListBulleted} format={BlockFormat.UnorderedList} />
        <FormatButton icon={MaterialIconFormatListNumbered} format={BlockFormat.OrderedList} />
        <InsertHtmlElementButton icon={MaterialIconGridOn} format={BlockFormat.Table} />

        <ToolbarDivider />

        <InsertHtmlElementButton
          icon={MaterialIconHorizontalRule}
          format={BlockFormat.HorizontalLine}
        />

        <ToolbarDivider />

        <FormatButton icon={MaterialIconFormatBold} format={TextFormat.Bold} />
        <FormatButton icon={MaterialIconFormatItalic} format={TextFormat.Italic} />
        <FormatButton icon={MaterialIconFormatUnderlined} format={TextFormat.Underline} />
        <FormatButton icon={MaterialIconFormatStrikethrough} format={TextFormat.Strikethrough} />

        <ToolbarDivider />

        <LinkFormatButton />
        <RemoveLinkFormatButton />

        <ToolbarDivider />

        {'😄 😁 🤯 🎸 ¿ å etc'.split(' ').map((txt, i) => (
          <InsertTextButton key={i} label={txt} />
        ))}

        <ToolbarDivider />

        <FormatButton icon={MaterialIconFormatSuperscript} format={TextFormat.Superscript} />
        <FormatButton icon={MaterialIconFormatSubscript} format={TextFormat.Subscript} />
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

interface SlateBlockButtonProps extends ToolbarButtonProps {
  readonly format: Format
}

function FormatButton({icon, format}: SlateBlockButtonProps) {
  const editor = useSlate()

  return (
    <ToolbarButton
      icon={icon}
      active={isFormatActive(editor, format)}
      onMouseDown={e => {
        e.preventDefault()
        toggleFormat(editor, format)
      }}
    />
  )
}

function InsertTextButton({label}: BaseButtonProps) {
  const editor = useSlate()

  return (
    <Button
      variant="text"
      style={{padding: '0px'}}
      label={label}
      onMouseDown={e => {
        e.preventDefault()
        label && editor.insertText(label as string)
      }}
    />
  )
}

function InsertHtmlElementButton({icon, format}: SlateBlockButtonProps) {
  // TODO for <hr>
  const editor = useSlate()

  const btn = (onMouseDown: () => any) => (
    <ToolbarButton
      icon={icon}
      active={false}
      onMouseDown={e => {
        e.preventDefault()
        onMouseDown()
      }}
    />
  )
  switch (format) {
    case BlockFormat.HorizontalLine:
      return btn(
        () => editor.insertText('-----------TODO  hr --------------------')
        // Transforms.insertNodes(editor, [
        //  {
        //    type: BlockFormat.HorizontalLine,
        //    children: [{text: ''}]
        //  }
        // ])
        // TODO editor.insertHtml(<hr />)
      )
    case BlockFormat.Table:
      return btn(() => {
        editor.insertBreak()
        editor.insertFragment([
          {
            children: [
              {
                text: 'TODO: senseful table insert handling, and add border styling buttons.'
              }
            ]
          },
          {
            type: 'table',
            children: [
              {
                type: 'table-row',
                children: [
                  {
                    type: 'table-cell',
                    children: [{text: ''}]
                  },
                  {
                    type: 'table-cell',
                    children: [{text: 'Human', bold: true}]
                  },
                  {
                    type: 'table-cell',
                    children: [{text: 'Dog', bold: true}]
                  },
                  {
                    type: 'table-cell',
                    children: [{text: 'Cat', bold: true}]
                  }
                ]
              },
              {
                type: 'table-row',
                children: [
                  {
                    type: 'table-cell',
                    children: [{text: '# of Feet', bold: true}]
                  },
                  {
                    type: 'table-cell',
                    children: [{text: '2'}]
                  },
                  {
                    type: 'table-cell',
                    children: [{text: '4'}]
                  },
                  {
                    type: 'table-cell',
                    children: [{text: '4'}]
                  }
                ]
              },
              {
                type: 'table-row',
                children: [
                  {
                    type: 'table-cell',
                    children: [{text: '# of Lives', bold: true}]
                  },
                  {
                    type: 'table-cell',
                    children: [{text: '1'}]
                  },
                  {
                    type: 'table-cell',
                    children: [{text: '1'}]
                  },
                  {
                    type: 'table-cell',
                    children: [{text: '9'}]
                  }
                ]
              }
            ]
          },
          {
            children: [
              {
                text: 'TODO'
              }
            ]
          }
        ])
      })
    default:
      return btn(() => {
        console.error(`Unavailable block format ${format}`)
      })
  }
}

function LinkFormatButton() {
  const editor = useSlate()
  const [isLinkDialogOpen, setLinkDialogOpen] = useState(false)
  const [selection, setSelection] = useState<Range | null>(null)

  const [title, setTitle] = useState('')
  const [url, setURL] = useState('')

  const validatedURL = validateURL(url)
  const isDisabled = !validatedURL

  const {t} = useTranslation()

  return (
    <>
      <ToolbarButton
        icon={MaterialIconLink}
        active={isFormatActive(editor, InlineFormat.Link)}
        onMouseDown={e => {
          e.preventDefault()

          const nodes = Array.from(
            Editor.nodes(editor, {
              at: editor.selection ?? undefined,
              match: node => node.type === InlineFormat.Link
            })
          )

          const tuple = nodes[0]

          if (tuple) {
            const [node] = tuple

            setTitle((node.title as string) ?? '')
            setURL((node.url as string) ?? '')
          } else {
            setTitle('')
            setURL('')
          }

          setSelection(editor.selection)
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
                  label={t('Cancel')}
                  onClick={() => setLinkDialogOpen(false)}
                />
              }
              rightChildren={
                <NavigationButton
                  icon={MaterialIconCheck}
                  disabled={isDisabled}
                  label={t('Apply')}
                  onClick={() => {
                    insertLink(editor, selection, validatedURL!, title || undefined)
                    setLinkDialogOpen(false)
                  }}
                />
              }
            />
            <PanelSection>
              <Box width={300}>
                <TextInput
                  label={t('blocks.richText.link')}
                  errorMessage={url && !validatedURL ? 'Invalid Link' : undefined}
                  value={url}
                  onChange={e => setURL(e.target.value)}
                  marginBottom={Spacing.ExtraSmall}
                />
                <TextInput
                  label={t('blocks.richText.title')}
                  description={t('blocks.richText.optionalDescription')}
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
  return url

  // TODO: Implement better URL validation with for support relative links.
  // try {
  //   return new URL(url).toString()
  // } catch (err) {
  //   try {
  //     return new URL(`https://${url}`).toString()
  //   } catch (err) {
  //     return null
  //   }
  // }
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
        removeLink(editor)
      }}
    />
  )
}

function isFormatActive(editor: Editor, format: Format) {
  if (TextFormats.includes(format)) {
    const marks = Editor.marks(editor)
    return marks ? marks[format] === true : false
  }

  if (BlockFormats.includes(format) || InlineFormats.includes(format)) {
    const [match] = Editor.nodes(editor, {
      match: node => node.type === format,
      mode: 'all'
    })

    return !!match
  }

  return false
}

function toggleFormat(editor: Editor, format: Format) {
  const isActive = isFormatActive(editor, format)
  const isList = ListFormats.includes(format)

  if (TextFormats.includes(format)) {
    if (isActive) {
      editor.removeMark(format)
    } else {
      editor.addMark(format, true)
    }
  }

  if (BlockFormats.includes(format)) {
    for (const format of ListFormats) {
      Transforms.unwrapNodes(editor, {match: node => node.type === format, split: true})
    }

    Transforms.setNodes(editor, {
      type: isActive ? BlockFormat.Paragraph : isList ? BlockFormat.ListItem : format
    })

    if (!isActive && isList) {
      Transforms.wrapNodes(editor, {type: format, children: []})
    }
  }
}

function insertLink(editor: Editor, selection: Range | null, url: string, title?: string) {
  if (selection) {
    if (Range.isCollapsed(selection)) {
      const nodes = Array.from(
        Editor.nodes(editor, {
          at: selection,
          match: node => node.type === InlineFormat.Link
        })
      )

      const tuple = nodes[0]

      if (tuple) {
        const [, path] = tuple
        Transforms.select(editor, path)
      }
    } else {
      Transforms.select(editor, selection)
    }
  }

  Transforms.unwrapNodes(editor, {match: node => node.type === InlineFormat.Link})
  Transforms.wrapNodes(editor, {type: InlineFormat.Link, url, title, children: []}, {split: true})
  Transforms.collapse(editor, {edge: 'end'})
}

function removeLink(editor: Editor) {
  Transforms.unwrapNodes(editor, {match: node => node.type === InlineFormat.Link})
}

function withRichText<T extends ReactEditor>(editor: T): T {
  const {insertData, isInline, deleteBackward, deleteForward, insertBreak} = editor

  editor.isInline = node => (InlineFormats.includes(node.type as string) ? true : isInline(node))
  editor.insertData = (data: any) => {
    const html = data.getData('text/html')

    if (html) {
      const parsed = new DOMParser().parseFromString(html, 'text/html')
      const fragment = deserialize(parsed.body)
      Editor.insertFragment(editor, fragment)
    } else {
      insertData(data)
    }
  }

  // https://github.com/ianstormtaylor/slate/blob/master/site/examples/tables.tsx
  editor.deleteBackward = unit => {
    const {selection} = editor

    if (selection && Range.isCollapsed(selection)) {
      const [cell] = Editor.nodes(editor, {
        match: n => n.type === BlockFormat.TableCell
      })

      if (cell) {
        const [, cellPath] = cell
        const start = Editor.start(editor, cellPath)

        if (Point.equals(selection.anchor, start)) {
          return
        }
      }
    }

    deleteBackward(unit)
  }

  editor.deleteForward = unit => {
    const {selection} = editor

    if (selection && Range.isCollapsed(selection)) {
      const [cell] = Editor.nodes(editor, {
        match: n => n.type === BlockFormat.TableCell
      })

      if (cell) {
        const [, cellPath] = cell
        const end = Editor.end(editor, cellPath)

        if (Point.equals(selection.anchor, end)) {
          return
        }
      }
    }

    deleteForward(unit)
  }

  editor.insertBreak = () => {
    const {selection} = editor

    if (selection) {
      const [table] = Editor.nodes(editor, {match: n => n.type === BlockFormat.Table})

      if (table) {
        return
      }
    }

    insertBreak()
  }

  return editor
}

export function createDefaultValue(): RichTextBlockValue {
  return [{type: BlockFormat.Paragraph, children: [{text: ''}]}]
}

function MaterialIconFormatSuperscript() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      enableBackground="new 0 0 24 24"
      height="24"
      viewBox="0 0 24 24"
      width="24">
      <g>
        <rect fill="none" height="24" width="24" x="0" y="0" />
        <path d="M22,7h-2v1h3v1h-4V7c0-0.55,0.45-1,1-1h2V5h-3V4h3c0.55,0,1,0.45,1,1v1C23,6.55,22.55,7,22,7z M5.88,20h2.66l3.4-5.42h0.12 l3.4,5.42h2.66l-4.65-7.27L17.81,6h-2.68l-3.07,4.99h-0.12L8.85,6H6.19l4.32,6.73L5.88,20z" />
      </g>
    </svg>
  )
}

function MaterialIconFormatSubscript() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      enableBackground="new 0 0 24 24"
      height="24"
      viewBox="0 0 24 24"
      width="24">
      <g>
        <rect fill="none" height="24" width="24" />
        <path d="M22,18h-2v1h3v1h-4v-2c0-0.55,0.45-1,1-1h2v-1h-3v-1h3c0.55,0,1,0.45,1,1v1C23,17.55,22.55,18,22,18z M5.88,18h2.66 l3.4-5.42h0.12l3.4,5.42h2.66l-4.65-7.27L17.81,4h-2.68l-3.07,4.99h-0.12L8.85,4H6.19l4.32,6.73L5.88,18z" />
      </g>
    </svg>
  )
}

function MaterialIconHorizontalRule() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      enableBackground="new 0 0 24 24"
      height="24"
      viewBox="0 0 24 24"
      width="24">
      <g>
        <rect fill="none" fillRule="evenodd" height="24" width="24" />
        <rect fillRule="evenodd" height="2" width="16" x="4" y="11" />
      </g>
    </svg>
  )
}
