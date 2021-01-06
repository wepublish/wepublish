import {Transforms, Element as SlateElement, Node as SlateNode} from 'slate'
import {ReactEditor} from 'slate-react'
import {BlockFormat} from './formats'

// TODO: add 2 normalizeNode plugins (either integrate into existing plugins or new modules?)
// See: https://github.com/ianstormtaylor/slate/blob/master/Changelog.md#0530--december-10-2019

export function withNormTables<T extends ReactEditor>(editor: T): T {
  const {normalizeNode} = editor

  editor.normalizeNode = entry => {
    const [node] = entry

    // ************
    // TODO Adapt this slate example to tables:
    // Rules:
    // - Table needs TableRow as child
    // - TableRow needs TableCell as child
    // - TableCell needs Paragraph as child
    // ************
    if (SlateElement.isElement(node) && node.type === BlockFormat.Table) {
      const tableChild = SlateNode.child(node, 0)
      console.log(tableChild)
      if (SlateElement.isElement(tableChild) && tableChild.type !== BlockFormat.TableRow) {
        console.log('corrected')
        //  Wrap table content into tablerow if not yet.
        Transforms.wrapNodes(
          editor,
          {type: BlockFormat.TableRow, children: []},
          {
            // TODO findPath not working, use iterative approach editor.nodes(...)
            at: ReactEditor.findPath(editor, tableChild),
            mode: 'all'
          }
        )

        return
      }
    }

    // do this in nested way?
    // or one after the other ?

    // same with tableRow ?
    if (SlateElement.isElement(node) && node.type === BlockFormat.TableRow) {
      const rowChild = SlateNode.child(node, 0)
      console.log(rowChild)
      if (SlateElement.isElement(rowChild) && rowChild.type !== BlockFormat.TableCell) {
        console.log('corrected')
        Transforms.wrapNodes(
          editor,
          {type: BlockFormat.TableCell, children: []},
          {
            // TODO findPath not working, use iterative approach editor.nodes(...)
            at: ReactEditor.findPath(editor, rowChild),
            mode: 'all'
          }
        )

        return
      }
    }

    // const [child, childPath] = SlateNode.child(node, 0)
    // {type: BlockFormat.Paragraph, children: [{text: ''}]}
    //   if (!(SlateElement.isElement(child) === BlockFormat.Paragraph) {
    //     Transforms.unwrapNodes(editor, {at: childPath})
    //     return
    //   }
    // }

    // Fall back to the original `normalizeNode` to enforce other constraints.
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
