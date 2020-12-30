import {Editor, Transforms, Node as SlateNode, Path} from 'slate'
import {Format, TextFormats, BlockFormats, InlineFormats, ListFormats, BlockFormat} from './formats'

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
