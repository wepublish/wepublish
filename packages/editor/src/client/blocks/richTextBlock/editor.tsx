import React from 'react'
import {Editor, Element as SlateElement, Range, Point} from 'slate'

import {RenderElementProps, RenderLeafProps, ReactEditor} from 'slate-react'

import {jsx} from 'slate-hyperscript'

import {BlockFormat, InlineFormat, TextFormat, InlineFormats} from './formats'

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

export function renderElement({attributes, children, element}: RenderElementProps) {
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

export function renderLeaf({attributes, children, leaf}: RenderLeafProps) {
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

export function withRichText<T extends ReactEditor>(editor: T): T {
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
