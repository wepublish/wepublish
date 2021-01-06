import {Transforms, Element as SlateElement, Node as SlateNode} from 'slate'
import {ReactEditor} from 'slate-react'
import {BlockFormat} from './formats'

// TODO: add 2 normalizeNode plugins (either integrate into existing plugins or new modules?)
// See: https://github.com/ianstormtaylor/slate/blob/master/Changelog.md#0530--december-10-2019

export function withNormTables<T extends ReactEditor>(editor: T): T {
  const {normalizeNode} = editor

  editor.normalizeNode = entry => {
    const [node, path] = entry

    // ************
    // TODO Adapt this slate example to tables:
    // Rules:
    // - Table needs TableRow as child
    // - TableRow needs TableCell as child
    // - TableCell needs Paragraph as child
    // ************
    if (SlateElement.isElement(node) && node.type === BlockFormat.Table) {
      for (const [child, childPath] of SlateNode.children(editor, path)) {
        if (SlateElement.isElement(child) && child.type !== BlockFormat.TableRow) {
          Transforms.wrapNodes(
            editor,
            {type: BlockFormat.TableRow, children: child.children},
            {
              // TODO findPath not working, use iterative approach editor.nodes(...)
              at: childPath,
              mode: 'all'
            }
          )
          return
        }
      }
    }

    if (SlateElement.isElement(node) && node.type === BlockFormat.TableRow) {
      for (const [child, childPath] of SlateNode.children(editor, path)) {
        if (SlateElement.isElement(child) && child.type !== BlockFormat.TableCell) {
          Transforms.wrapNodes(
            editor,
            {type: BlockFormat.TableCell, borderColor: 'black', children: child.children},
            {
              // TODO findPath not working, use iterative approach editor.nodes(...)
              at: childPath,
              mode: 'all'
            }
          )
          return
        }
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
