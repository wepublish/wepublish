import {Transforms, Element as SlateElement, Node as SlateNode, Editor, NodeEntry} from 'slate'
import {ReactEditor} from 'slate-react'
import {BlockFormat} from './formats'

// See: https://github.com/ianstormtaylor/slate/blob/master/Changelog.md#0530--december-10-2019

// TODO
// - TableCell needs Paragraph as child

export function withNormTables<T extends ReactEditor>(editor: T): T {
  const {normalizeNode} = editor

  editor.normalizeNode = entry => {
    const [node, path] = entry

    const ensureChildType = (type: BlockFormat, extraWrapperAttrs?: {[key: string]: any}) => {
      if (SlateElement.isElement(node)) {
        for (const [child, childPath] of SlateNode.children(editor, path)) {
          if (SlateElement.isElement(child) && child.type !== type) {
            Transforms.wrapNodes(
              editor,
              {type, children: child.children, ...extraWrapperAttrs},
              {
                at: childPath,
                mode: 'all'
              }
            )
            return
          }
        }
      }
    }

    const ensureParentType = (type: BlockFormat, extraWrapperAttrs?: {[key: string]: any}) => {
      const parent = SlateNode.parent(editor, path)
      if (
        !SlateElement.isElement(parent) ||
        (SlateElement.isElement(parent) && parent.type !== type)
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
    }

    if (SlateElement.isElement(node)) {
      switch (node.type) {
        case BlockFormat.Table:
          ensureChildType(BlockFormat.TableRow)
          return

        case BlockFormat.TableRow:
          // order is important !
          ensureChildType(BlockFormat.TableCell, {borderColor: 'black'})
          ensureParentType(BlockFormat.Table)
          return

        case BlockFormat.TableCell:
          ensureParentType(BlockFormat.TableRow)
          return
      }
    }

    // Fall back to the original `normalizeNode` to enforce builtin constraints.
    normalizeNode(entry)
  }

  return editor
}

// const withSchema = defineSchema([
//
// ************
// TODO This was started by previous company of wepublish < implement?:
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
