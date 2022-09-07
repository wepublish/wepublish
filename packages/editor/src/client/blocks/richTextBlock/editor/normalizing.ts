import {Transforms, Element as SlateElement, Node as SlateNode, Path} from 'slate'
import {ReactEditor} from 'slate-react'
import {DEFAULT_BORDER_COLOR, emptyTextParagraph} from './elements'
import {BlockFormat} from './formats'

export function withNormalizeNode<T extends ReactEditor>(editor: T): T {
  const {normalizeNode} = editor

  editor.normalizeNode = entry => {
    const [node, path] = entry

    if (SlateElement.isElement(node)) {
      switch (node.type) {
        case BlockFormat.TableCell:
          if (ensureParentType(BlockFormat.TableRow)) return
          if (ensureHasBorderColor()) return
          // TODO if child is text node wrap into paragraph. Text directly in tablecell behaves wrongly
          break

        case BlockFormat.TableRow:
          // Order of corrections is important!
          // Explanation (missing):
          // Seems to have an effect when requiring constraints on parent and children.
          // Actually, (IMO) it should not have an effect, as every new or modified node gets checked from it's lowest node upwards
          // (see https://docs.slatejs.org/concepts/10-normalizing#multi-pass-normalizing).
          // TODO find reason or report to slate?
          if (ensureChildType(BlockFormat.TableCell, {borderColor: DEFAULT_BORDER_COLOR})) return
          if (ensureParentType(BlockFormat.Table)) return
          // TODO? mergeAdjacentRows()
          break

        case BlockFormat.Table:
          if (ensureChildType(BlockFormat.TableRow)) return
          if (mergeAdjacent()) return // needed when copy pasting tables
          if (ensureSubseedingParagraph()) return
          break
      }
      // TODO ensure ol / li structure (see at bottom)
    }

    function ensureHasBorderColor() {
      if (!node.borderColor) {
        Transforms.setNodes(editor, {borderColor: DEFAULT_BORDER_COLOR}, {at: path})
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

    function mergeAdjacent() {
      const pathOfPreceding: Path = [path[0] + 1]
      const precedingNode = SlateNode.has(editor, pathOfPreceding)
        ? SlateNode.get(editor, pathOfPreceding)
        : null
      if (SlateElement.isElement(precedingNode) && precedingNode.type === node.type) {
        Transforms.mergeNodes(editor, {at: pathOfPreceding})
        return true
      }
      return false
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

  // function ensureTableCellOneOfTypes(
  //   types: [BlockFormat],
  //   extraWrapperAttrs: {[key: string]: any} = {}
  // ) {
  //   if (SlateElement.isElement(node)) {
  //     for (const [child, childPath] of SlateNode.children(editor, path)) {
  //       if (!SlateElement.isElement(child) || types.indexOf(child.type as BlockFormat) < 0) {
  //         wrapAllChildren(BlockFormat.Paragraph, [child, childPath], extraWrapperAttrs)
  //         return true
  //       }
  //     }
  //   }
  //   return false
  // }

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
//           Transforms.setNodes(editor, {type: BlockFormat.Paragraph}, {at: path})
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
//           Transforms.setNodes(editor, {type: BlockFormat.ListItem}, {at: path})
//           break
//       }
//     }
//   }
// ])
