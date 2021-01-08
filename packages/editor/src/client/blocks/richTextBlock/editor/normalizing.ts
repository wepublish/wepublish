import {Transforms, Element as SlateElement, Node as SlateNode, Editor, NodeEntry} from 'slate'
import {ReactEditor} from 'slate-react'
import {BlockFormat} from './formats'

// TODO: add 2 normalizeNode plugins (either integrate into existing plugins or new modules?)
// See: https://github.com/ianstormtaylor/slate/blob/master/Changelog.md#0530--december-10-2019

export function withNormTables<T extends ReactEditor>(editor: T): T {
  const {normalizeNode} = editor

  editor.normalizeNode = entry => {
    const [node, path] = entry

    const ensureChildType = (childType: BlockFormat, extraWrapperAttrs?: {[key: string]: any}) => {
      if (SlateElement.isElement(node)) {
        for (const [child, childPath] of SlateNode.children(editor, path)) {
          if (SlateElement.isElement(child) && child.type !== childType) {
            Transforms.wrapNodes(
              editor,
              {type: childType, children: child.children, ...extraWrapperAttrs},
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

    const ensureParentType = (
      parentType: BlockFormat,
      extraWrapperAttrs?: {[key: string]: any}
    ) => {
      const parent = SlateNode.parent(editor, path)
      console.log('node:', node)
      console.log('parent:', parent)
      if (
        !SlateElement.isElement(parent) ||
        (SlateElement.isElement(parent) && parent.type !== parentType)
      ) {
        Transforms.wrapNodes(
          editor,
          {type: parentType, children: node.children as SlateElement[], ...extraWrapperAttrs}, // TODO simply =node  ?
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
          // recursive / multipass / kicking off a new normalization pass
          ensureChildType(BlockFormat.TableRow)
          return

        case BlockFormat.TableRow:
          ensureChildType(BlockFormat.TableCell, {borderColor: 'black'})
          ensureParentType(BlockFormat.Table)
          return

        case BlockFormat.TableCell:
          console.log('is cell')
          ensureParentType(BlockFormat.TableRow)
          return
      }
    }

    // ************
    // Rules:
    // - TableCell needs Paragraph as child (TODO)
    // ************

    // - TableCell needs TableRow as parent
    // if (SlateElement.isElement(node) && node.type === BlockFormat.TableCell) {
    //   const parent = SlateNode.parent(editor, path)
    //   console.log(BlockFormat.TableCell)
    //   console.log('node:', node)
    //   console.log('parent:', parent)
    //   if (
    //     !SlateElement.isElement(parent) ||
    //     (SlateElement.isElement(parent) && parent.type !== BlockFormat.TableRow)
    //   ) {
    //     Transforms.wrapNodes(
    //       editor,
    //       {type: BlockFormat.TableRow, children: parent.children},
    //       {
    //         at: path,
    //         mode: 'all'
    //       }
    //     )
    //     return
    //   }
    // }

    // // - TableRow needs Table as parent
    // if (SlateElement.isElement(node) && node.type === BlockFormat.TableRow) {
    //   const parent = SlateNode.parent(editor, path)
    //   console.log(BlockFormat.TableRow)
    //   console.log('node:', node)
    //   console.log('parent:', parent)
    //   if (
    //     !SlateElement.isElement(parent) ||
    //     (SlateElement.isElement(parent) && parent.type !== BlockFormat.Table)
    //   ) {
    //     Transforms.wrapNodes(
    //       editor,
    //       {type: BlockFormat.Table, children: node.children},
    //       {
    //         at: path,
    //         mode: 'all'
    //       }
    //     )
    //     return
    //   }
    // }

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
