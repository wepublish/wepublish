import {Editor, Point, Element as SlateElement, Range} from 'slate'
import {jsx} from 'slate-hyperscript'
import {ReactEditor} from 'slate-react'
import {InlineFormats, BlockFormat, InlineFormat, TextFormat} from './formats'

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

export function withRichText<T extends ReactEditor>(editor: T): T {
  const {insertData, isInline} = editor
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

  return editor
}

export function withTable<T extends ReactEditor>(editor: T): T {
  const {deleteForward, deleteBackward, deleteFragment} = editor

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

// TODO: add 2 normalizeNode plugins (either integrate into existing olugins or new modules?)
// See: https://github.com/ianstormtaylor/slate/blob/master/Changelog.md#0530--december-10-2019

// import { Transforms, Element, Node } from 'slate'
//
// const withParagraphs = editor => {
//
// ************
// TODO Adapt this slate example to tables:
// Rules:
// - Table needs TableRow as child
// - TableRow needs TableCell as child
// - TableCell needs Paragraph as child
// ************
//
//   const { normalizeNode } = editor
//
//   editor.normalizeNode = entry => {
//     const [node, path] = entry
//
//     // If the element is a paragraph, ensure its children are valid.
//     if (Element.isElement(node) && node.type === 'paragraph') {
//       for (const [child, childPath] of Node.children(editor, path)) {
//         if (Element.isElement(child) && !editor.isInline(child)) {
//           Transforms.unwrapNodes(editor, { at: childPath })
//           return
//         }
//       }
//     }
//
//     // Fall back to the original `normalizeNode` to enforce other constraints.
//     normalizeNode(entry)
//   }
//
//   return editor
// }

// const withSchema = defineSchema([
//
// ************
// TODO This was started by previoud company of wepublish < implement?:
// ************
//
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
