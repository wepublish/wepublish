import {Editor, Transforms, Node as SlateNode, Path} from 'slate'
import {Format, TextFormats, BlockFormats, InlineFormats, ListFormats, BlockFormat} from './formats'

// Slate docs can be confusing providing different concepts, APIs and terminology. For example, there are
// many possible ways to get a nodes children. There is no much guidance though. Further the package is in
// early stage and changing. Therefore all operations on the slate node tree are collected here.

// distinguish: with selection / without selection

export function isFormatActive(editor: Editor, format: Format) {
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

export function toggleFormat(editor: Editor, format: Format) {
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

export function nearestAncestor(
  editor: Editor,
  type: BlockFormat
): {node: SlateNode; path: Path} | null {
  const {selection} = editor
  if (!selection) return null
  const nodes = Array.from(
    Editor.nodes(editor, {
      at: selection,
      match: node => node.type === type
    })
  )
  if (!nodes![0]) return null
  return {node: nodes[0][0], path: nodes[0][1]}
}

export function allNodes(editor: Editor): SlateNode[] {
  return editor.children
}

// TODO findPath not working, use iterative approach editor.nodes(...)
// ReactEditor.findPath(editor, tableChild),
