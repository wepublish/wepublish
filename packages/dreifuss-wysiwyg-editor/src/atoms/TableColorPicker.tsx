import React, {useState, useEffect} from 'react'
import {BaseEditor, Editor, Transforms, Element as SlateElement} from 'slate'
import {useStoreEditor} from '@udecode/slate-plugins-core'

// import nanoid from 'nanoid'

// interface ColorPickerProps {
//   setColor: (color: string) => void
//   currentColor?: string
// }

// export interface TableCell extends SlateElement {
//   type: 'table-cell'
//   borderColor: string
// }

// export const DEFAULT_BORDER_COLOR: TableCell['borderColor'] = '#000000'

// export function emptyCellsTable(nrows: number, ncols: number): SlateElement[] {
//   return [
//     {
//       type: 'table-row',
//       children: Array.from({length: nrows}).map(() => ({
//         type: 'table-row',
//         children: Array.from({length: ncols}).map(
//           (): TableCell => ({
//             type: 'table-cell',
//             borderColor: DEFAULT_BORDER_COLOR,
//             //     // Wrap all content inside cell into paragraph block to enable break lines.
//             children: []
//           })
//         )
//       }))
//     }
//   ]
// }

export function TableColorPicker() {
  // const id = nanoid()
  const editor: BaseEditor = useStoreEditor()
  const [borderColor, setBorderColor] = useState<string>()
  console.log(borderColor)

  // useEffect(() => {
  //   const nodes = Editor.nodes(editor, {
  //     match: node => node.type === 'table-cell'
  //   })
  //   console.log(nodes)
  //   for (const [node] of nodes) {
  //     setBorderColor(node.borderColor as string)
  //     return
  //   }
  // })

  useEffect(() => {
    if (borderColor) {
      const nodes = Editor.nodes(editor, {
        match: node => node.type === 'table-cell'
      })
      for (const [, path] of nodes) {
        Transforms.setNodes(
          editor,
          {borderColor},
          {
            at: path,
            match: node => node.type === 'table-cell'
          }
        )
        return
      }
    }
  }, [borderColor])

  return (
    <>
      <input
        type="color"
        // value={currentColor}
        onChange={e => {
          setBorderColor(e.target.value)
        }}
        style={{cursor: 'pointer'}}
      />
    </>
  )
}
