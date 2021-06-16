import React, {useState, useEffect} from 'react'
import {Editor, Transforms} from 'slate'
import {useStoreEditor} from '@udecode/slate-plugins-core'

export enum TableElementFormat {
  Table = 'table',
  TableRow = 'table-row',
  TableCell = 'table-cell'
}

export function TableColorPicker({editorId}: {editorId: string}) {
  const editor: any = useStoreEditor(editorId ?? 'main')

  const [borderColor, setBorderColor] = useState<string>()

  useEffect(() => {
    const nodes: any = Editor.nodes(editor, {
      match: (node: any) => node.type === 'table-cell'
    })
    for (const [node] of nodes) {
      setBorderColor(node.borderColor as string)
      return
    }
  }, [editor.selection])

  useEffect(() => {
    if (borderColor) {
      const nodes = Editor.nodes(editor, {
        match: (node: any) => node.type === TableElementFormat.Table
      })
      for (const [, path] of nodes) {
        Transforms.setNodes(
          editor,
          //@ts-ignore
          {borderColor: borderColor ?? '#000'},
          {
            at: path,
            match: (node: any) => node.type === TableElementFormat.TableCell
          }
        )
        return
      }
    }
  }, [borderColor])

  return (
    <input
      type="color"
      name="borderColor"
      style={{cursor: 'pointer'}}
      onChange={e => setBorderColor(e.target.value)}
    />
  )
}
