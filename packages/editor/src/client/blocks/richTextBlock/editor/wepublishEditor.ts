import {Editor, Transforms, Node as SlateNode, Path} from 'slate'
import {RichTextBlockValue} from '../../types'
import {emptyTextParagraph} from './elements'
import {Format, TextFormats, BlockFormats, InlineFormats, ListFormats, BlockFormat} from './formats'

export const WepublishEditor = {
  // Extending the Editor according docs: https://docs.slatejs.org/concepts/07-plugins#helper-functions
  ...Editor,

  isFormatActive(editor: Editor, format: Format) {
    if (TextFormats.includes(format)) {
      const marks = this.marks(editor)
      return marks ? marks[format] === true : false
    }

    if (BlockFormats.includes(format) || InlineFormats.includes(format)) {
      const [match] = this.nodes(editor, {
        match: node => node.type === format,
        mode: 'all'
      })

      return !!match
    }

    return false
  },

  toggleFormat(editor: Editor, format: Format) {
    const isActive = this.isFormatActive(editor, format)
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
  },

  createDefaultValue(): RichTextBlockValue {
    return [emptyTextParagraph()]
  },

  isEmpty(editor: Editor) {
    return JSON.stringify(editor.children) === JSON.stringify(this.createDefaultValue())
  },

  nearestAncestor(editor: Editor, type: BlockFormat): {node: SlateNode; path: Path} | null {
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
}
