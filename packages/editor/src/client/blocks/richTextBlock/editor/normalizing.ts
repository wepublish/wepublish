import {Transforms, Element as SlateElement, Node as SlateNode, Path} from 'slate'
import {ReactEditor} from 'slate-react'
import {defaultBorderColor, emptyTextParagraph} from './elements'
import {BlockFormat} from './formats'

// See: https://github.com/ianstormtaylor/slate/blob/master/Changelog.md#0530--december-10-2019

// TODO
// - TableCell needs Paragraph as child

export function withNormalizeNode<T extends ReactEditor>(editor: T): T {
  const {normalizeNode} = editor

  editor.normalizeNode = entry => {
    const [node, path] = entry

    if (SlateElement.isElement(node)) {
      switch (node.type) {
        // order of corrections is important !

        case BlockFormat.TableCell:
          if (ensureParentType(BlockFormat.TableRow)) return
          if (ensureHasBorderColor()) return
          break

        case BlockFormat.TableRow:
          if (ensureChildType(BlockFormat.TableCell, {borderColor: defaultBorderColor})) return
          if (ensureParentType(BlockFormat.Table)) return
          // TODO? mergeAdjacentRows()
          break

        case BlockFormat.Table:
          if (ensureChildType(BlockFormat.TableRow)) return
          if (ensureSubseedingParagraph()) return
          // mergeAdjacentTables()
          break
      }
      // TODO ensure ol / li structure (see at bottom)
    }

    function ensureHasBorderColor() {
      if (!node.borderColor) {
        Transforms.setNodes(editor, {borderColor: defaultBorderColor}, {at: path})
        return true
      }
      return false
    }

    function ensureChildType(type: BlockFormat, extraWrapperAttrs: {[key: string]: any} = {}) {
      if (SlateElement.isElement(node)) {
        for (const [child, childPath] of SlateNode.children(editor, path)) {
          if (!SlateElement.isElement(child) || child.type !== type) {
            wrapAllChildren(type, [child, childPath], extraWrapperAttrs)
            return true
          }
        }
      }
      return false
    }

    function ensureParentType(type: BlockFormat, extraWrapperAttrs: {[key: string]: any} = {}) {
      const parent = SlateNode.parent(editor, path)
      if (!SlateElement.isElement(parent) || parent.type !== type) {
        wrapAllChildren(type, [node, path], extraWrapperAttrs)
        return true
      }
      return false
    }

    function wrapAllChildren(
      type: BlockFormat,
      [node, path]: typeof entry,
      extraWrapperAttrs?: {[key: string]: any}
    ) {
      Transforms.wrapNodes(
        editor,
        {type, children: node.children as SlateElement[], ...extraWrapperAttrs}, // TODO simply =node  ?
        {
          at: path,
          mode: 'all'
        }
      )
    }

    function ensureSubseedingParagraph() {
      // Ensure Table is followed by paragraph at bottom for flawless continuation
      const pathOfSubsequent: Path = [path[0] + 1]
      const subsequentNode = SlateNode.has(editor, pathOfSubsequent)
        ? SlateNode.get(editor, pathOfSubsequent)
        : null
      if (
        !SlateElement.isElement(subsequentNode) ||
        subsequentNode.type !== BlockFormat.Paragraph
      ) {
        Transforms.insertNodes(editor, emptyTextParagraph(), {at: pathOfSubsequent})
        return true
      }
      return false
    }

    // function mergeAdjacentTables() {
    //   // TODO
    // }

    // Fall back to the original `normalizeNode` to enforce builtin constraints.
    normalizeNode(entry)
  }

  // const ensurePreceeding....
  // Type of previous Sibling node on top

  return editor
}

// const withSchema = defineSchema([
//
// ************
// TODO
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
