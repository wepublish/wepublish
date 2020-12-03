import React, {
  useState,
  memo,
  useEffect,
  useMemo,
  ButtonHTMLAttributes,
  useRef,
  useCallback
} from 'react'
import {
  Editor,
  Node as SlateNode,
  Element as SlateElement,
  createEditor,
  Range,
  Transforms,
  Point
} from 'slate'

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

import {BlockProps} from '../atoms/blockList'
import {Toolbar, ToolbarButtonProps, ToolbarButton, ToolbarDivider} from '../atoms/toolbar'
import {EmojiButton} from '../atoms/emojiButton'
import {RichTextBlockValue} from './types'

import {useTranslation} from 'react-i18next'
import {
  Button,
  ControlLabel,
  Form,
  FormControl,
  FormGroup,
  InputGroup,
  InputNumber,
  Modal,
  Popover,
  Whisper
} from 'rsuite'

import './richTextBlockTable.less'
import {SVGIcon} from 'rsuite/lib/@types/common'
import {IconNames} from 'rsuite/lib/Icon'

enum BlockFormat {
  H1 = 'heading-one',
  H2 = 'heading-two',
  H3 = 'heading-three',
  Paragraph = 'paragraph',
  UnorderedList = 'unordered-list',
  OrderedList = 'ordered-list',
  ListItem = 'list-item',
  Table = 'table',
  TableRow = 'table-row',
  TableCell = 'table-cell'
}

enum InlineFormat {
  Link = 'link'
}

enum TextFormat {
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
  TB: () => ({type: BlockFormat.Table}),
  TR: () => ({type: BlockFormat.TableRow}),
  TD: (el: Element) => ({
    type: BlockFormat.TableCell,
    borderColor: el.getAttribute('borderColor')
  })
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
      return <h1 {...attributes}>{children}</h1>

    case BlockFormat.H2:
      return <h2 {...attributes}>{children}</h2>

    case BlockFormat.H3:
      return <h3 {...attributes}>{children}</h3>

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
      // TODO custom borderColor using colorPicker
      return (
        <td
          {...attributes}
          style={{
            borderColor:
              element.borderColor === 'transparent'
                ? `rgb(0, 0, 0, 0.1)`
                : (element.borderColor as string)
          }}>
          {children}
        </td>
      )

    case InlineFormat.Link:
      // TODO: Implement custom tooltip
      // const title = element.title ? `${element.title}: ${element.url}` : element.url
      // title={title}

      return (
        <a data-title={element.title} data-href={element.url} {...attributes}>
          {children}
        </a>
      )

    default:
      return <p {...attributes}>{children}</p>
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

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={(newValue: SlateNode[]) => {
        setFocus(ReactEditor.isFocused(editor))
        if (value !== newValue) onChange(newValue)
      }}>
      <Toolbar fadeOut={!hasFocus}>
        <FormatButton icon="header" format={BlockFormat.H1} />
        <FormatButton icon="header" format={BlockFormat.H2} />
        <FormatButton icon="header" format={BlockFormat.H3} />

        <ToolbarDivider />

        <FormatButton icon="list-ul" format={BlockFormat.UnorderedList} />
        <FormatButton icon="list-ol" format={BlockFormat.OrderedList} />

        <ToolbarDivider />

        <TableButton icon="table" iconActive="close" />

        <ToolbarDivider />

        <FormatButton icon="bold" format={TextFormat.Bold} />
        <FormatButton icon="italic" format={TextFormat.Italic} />
        <FormatButton icon="underline" format={TextFormat.Underline} />
        <FormatButton icon="strikethrough" format={TextFormat.Strikethrough} />
        <FormatButton icon="superscript" format={TextFormat.Superscript} />
        <FormatButton icon="subscript" format={TextFormat.Subscript} />

        <ToolbarDivider />

        <LinkFormatButton />
        <RemoveLinkFormatButton />

        <ToolbarDivider />

        <EmojiButton icon="smile-o" iconActive="close" />
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
        icon="link"
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
      <Modal show={isLinkDialogOpen} size={'sm'} onHide={() => setLinkDialogOpen(false)}>
        <Modal.Body>
          <Form fluid={true}>
            <FormGroup>
              <ControlLabel>{t('blocks.richText.link')}</ControlLabel>
              <FormControl
                errorMessage={url && !validatedURL ? 'Invalid Link' : undefined}
                value={url}
                onChange={url => setURL(url)}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('blocks.richText.title')}</ControlLabel>
              <FormControl value={title} onChange={title => setTitle(title)} />
            </FormGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={isDisabled}
            onClick={() => {
              insertLink(editor, selection, validatedURL!, title || undefined)
              setLinkDialogOpen(false)
            }}>
            {t('Apply')}
          </Button>
          <Button onClick={() => setLinkDialogOpen(false)}>{t('Cancel')}</Button>
        </Modal.Footer>
      </Modal>
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
      icon="unlink"
      active={isFormatActive(editor, InlineFormat.Link)}
      disabled={!isFormatActive(editor, InlineFormat.Link)}
      onMouseDown={e => {
        e.preventDefault()
        removeLink(editor)
      }}
    />
  )
}

export interface TableButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly icon: IconNames | SVGIcon
  readonly iconActive?: IconNames | SVGIcon
}

function TableButton({icon, iconActive}: TableButtonProps) {
  const editor = useSlate()

  const [nrows, setNrows] = useState(2)
  const [ncols, setNcols] = useState(1)

  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  const triggerRef = useRef<any>(null)

  const popOverRef = useCallback((node: any) => {
    setIsPopoverOpen(!!node)
  }, [])

  const {t} = useTranslation()

  const openPopover = () => {
    triggerRef.current!.open()
  }

  const closePopover = () => {
    triggerRef.current!.close()
  }

  const isBorderVisible = () => {
    const [match] = Editor.nodes(editor, {
      match: node => node.borderColor && node.borderColor !== 'transparent',
      mode: 'all'
    })

    return !!match
  }

  const tableInsertControls = (
    <>
      {[
        {
          label: t('blocks.richTextTable.rows'),
          num: nrows,
          setNumber: setNrows
        },
        {
          label: t('blocks.richTextTable.columns'),
          num: ncols,
          setNumber: setNcols
        }
      ].map(({label, num, setNumber}, i) => (
        <InputGroup
          style={{width: '150px'}}
          disabled={isFormatActive(editor, BlockFormat.Table)}
          key={i}>
          <InputGroup.Addon style={{width: '80px'}}>{label}</InputGroup.Addon>
          <InputNumber value={num} onChange={val => setNumber(val as number)} min={1} max={100} />
        </InputGroup>
      ))}
      <Button
        onClick={() => {
          Transforms.insertNodes(editor, emptyCellsTable(nrows, ncols))
          // following is needed for the popover to nicely stick to the TableButton.
          closePopover()
          openPopover()
        }}>
        {t('blocks.richTextTable.insertTable')}
      </Button>
    </>
  )

  const removeTable = () => {
    Transforms.removeNodes(editor, {
      at: editor.selection ?? undefined,
      match: node => node.type === BlockFormat.Table
    })
  }

  const setTableCellBorderColor = (color: string) => {
    const {selection} = editor
    if (selection) {
      const nodes = Array.from(
        Editor.nodes(editor, {
          at: selection,
          match: node => node.type === BlockFormat.Table
        })
      )
      Transforms.setNodes(
        editor,
        {borderColor: color},
        {at: nodes[0][1], match: node => node.type === BlockFormat.TableCell}
      )
    }
  }

  const tableActiveControls = (
    <>
      {!showRemoveConfirm ? (
        <>
          {isBorderVisible() ? (
            <Button appearance="subtle" onClick={() => setTableCellBorderColor('transparent')}>
              {t('blocks.richTextTable.hideBorders')}
            </Button>
          ) : (
            <Button appearance="default" onClick={() => setTableCellBorderColor('black')}>
              {t('blocks.richTextTable.showBorders')}
            </Button>
          )}
          <Button color="red" appearance="ghost" onClick={() => setShowRemoveConfirm(true)}>
            {t('blocks.richTextTable.deleteTable')}
          </Button>
        </>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
            width: '100%'
          }}>
          <Button
            color="red"
            appearance="primary"
            onClick={() => {
              removeTable()
              closePopover()
              setShowRemoveConfirm(false)
            }}>
            {t('blocks.richTextTable.delete')}
          </Button>
          <Button appearance="default" onClick={() => setShowRemoveConfirm(false)}>
            {t('blocks.richTextTable.cancel')}
          </Button>
        </div>
      )}
    </>
  )

  const tableSpecs = (
    <Popover ref={popOverRef}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: '10em',
          width: '15em'
        }}>
        {isFormatActive(editor, BlockFormat.Table) ? tableActiveControls : tableInsertControls}
      </div>
    </Popover>
  )

  const emptyTextParagraph = () => ({type: BlockFormat.Paragraph, children: [{text: ''}]})

  const emptyCellsTable = (nrows: number, ncols: number): SlateElement[] => [
    {
      type: BlockFormat.Table,
      children: Array.from({length: nrows}).map(() => ({
        type: BlockFormat.TableRow,
        children: Array.from({length: ncols}).map(() => ({
          type: BlockFormat.TableCell,
          borderColor: 'black',
          // Wrap all content inside cell into paragraph block to enable break lines.
          children: [emptyTextParagraph()]
        }))
      }))
    },
    // Append empty paragraph after table block for easy continuation.
    emptyTextParagraph()
  ]

  return (
    <Whisper placement="top" speaker={tableSpecs} ref={triggerRef} trigger="none">
      <ToolbarButton
        icon={isPopoverOpen && iconActive ? iconActive : icon}
        active={isFormatActive(editor, BlockFormat.Table) || isPopoverOpen}
        onMouseDown={e => {
          e.preventDefault()
          isPopoverOpen ? closePopover() : openPopover()
        }}
      />
    </Whisper>
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
  const {insertData, isInline, deleteForward, deleteBackward, deleteFragment} = editor
  // The delete commands are adjusted to avoid modifying the table structure directly. Some
  // unwanted  behaviour occurs when doing so.

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

  const tablePreventDelete = (
    location: 'start' | 'end',
    check: 'rangeIncludes' | 'pointEquals'
  ): boolean => {
    const {selection} = editor

    if (selection) {
      const [cell] = Editor.nodes(editor, {
        match: n =>
          !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === BlockFormat.TableCell
      })

      if (cell) {
        const [, cellPath] = cell
        const point = Editor[location](editor, cellPath)

        if (check === 'pointEquals') {
          return Point.equals(selection.anchor, point)
        } else if (check === 'rangeIncludes') {
          return Range.includes(selection, point)
        }
      }
    }
    return false
  }

  editor.deleteFragment = () => {
    if (tablePreventDelete('start', 'rangeIncludes')) {
      return
    }

    deleteFragment()
  }

  editor.deleteBackward = unit => {
    if (tablePreventDelete('start', 'pointEquals')) {
      return
    }

    deleteBackward(unit)
  }

  editor.deleteForward = unit => {
    if (tablePreventDelete('end', 'pointEquals')) {
      return
    }

    deleteForward(unit)
  }

  return editor
}

export function createDefaultValue(): RichTextBlockValue {
  return [{type: BlockFormat.Paragraph, children: [{text: ''}]}]
}
