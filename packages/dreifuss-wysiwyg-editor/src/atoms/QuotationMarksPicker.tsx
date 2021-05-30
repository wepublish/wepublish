import React, {useContext, useEffect, useState} from 'react'
import {BaseEditor, BaseRange, Range, Editor, Node, Transforms} from 'slate'
import {useStoreEditor} from '@udecode/slate-plugins-core'
import {PopoverContext} from '../atoms/PopoverContext'

// interface QuotationMarksPickerProps {
//   setQuotationMarks: (quotationMarks: string) => void
// }

function insertQuotationMarks(
  editor: BaseEditor,
  selection: BaseRange | null,
  selectedQuotationMarks: string
) {
  if (selection) {
    // if (Range.isCollapsed(selection)) {
    console.log('hi')
    console.log(editor)
    console.log(selection)
    console.log(selectedQuotationMarks)
    const nodes = Array.from(
      Editor.nodes(editor, {
        at: selection
        // match: (node: Node) => node.type === 'link'
      })
    )
    const tuple = nodes[0]
    console.log(tuple)
    if (tuple) {
      // const [, path] = tuple
      // Transforms.select(editor, path)
      // const location = (selection.anchor.offset)
      console.log(selection.focus)
      console.log(selection.anchor)
      Transforms.setSelection(editor, {
        anchor: {
          path: selection.anchor.path,
          offset: selection.anchor.offset
        },
        focus: {path: selection.focus.path, offset: selection.focus.offset}
      })
      if (Range.isCollapsed(selection)) {
        switch (selectedQuotationMarks) {
          case '""': {
            Transforms.insertText(editor, '"', {
              at: selection.anchor
            })
            Transforms.insertText(editor, '"', {
              at: selection.focus
            })
            break
          }
          case '<>': {
            Transforms.insertText(editor, '>', {
              at: selection.anchor
            })
            Transforms.insertText(editor, '<', {
              at: selection.focus
            })
            break
          }
          case "' '": {
            Transforms.insertText(editor, "'", {
              at: selection.anchor
            })
            Transforms.insertText(editor, "'", {
              at: selection.focus
            })
            break
          }
          default: {
            Transforms.insertText(editor, '>>', {
              at: selection.anchor
            })
            Transforms.insertText(editor, '<<', {
              at: selection.focus
            })
          }
        }
      } else {
        switch (selectedQuotationMarks) {
          case '""': {
            Transforms.insertText(editor, '"', {
              at: selection.anchor
            })
            Transforms.insertText(editor, '"', {
              at: selection.focus
            })
            break
          }
          case '<>': {
            Transforms.insertText(editor, '<', {
              at: selection.anchor
            })
            Transforms.insertText(editor, '>', {
              at: selection.focus
            })
            break
          }
          case "' '": {
            Transforms.insertText(editor, "'", {
              at: selection.anchor
            })
            Transforms.insertText(editor, "'", {
              at: selection.focus
            })
            break
          }
          default: {
            Transforms.insertText(editor, '<<', {
              at: selection.anchor
            })
            Transforms.insertText(editor, '>>', {
              at: selection.focus
            })
          }
        }
      }
    } else {
      console.log('noooo')
      Transforms.insertText(editor, selectedQuotationMarks)
      Transforms.select(editor, {
        anchor: {
          path: selection.anchor.path,
          offset: selection.anchor.offset
        },
        focus: {path: selection.focus.path, offset: selection.focus.offset}
      })
    }
    // } else {
    //   Transforms.select(editor, selection)
    // }
  }
}

export function QuotationMarksPicker() {
  const editor: BaseEditor = useStoreEditor()
  const {togglePopover} = useContext(PopoverContext)
  const [selection, setSelection] = useState<BaseRange | null>(null)
  // const [selectedQuotationMarks, setSelectedQuotationMarks] = useState<string | null>('<<>>')
  let selectedQuotationMarks = ''

  useEffect(() => {
    setSelection(editor?.selection)

    // const nodes = Array.from(
    //   Editor.nodes(editor, {
    //     at: editor?.selection ?? undefined,
    //     // match: (node: any) => node.type === 'link'
    //   })
    // )
    // const tuple = nodes[0]
    // if (tuple) {
    //   const [node] = tuple
    // setTitle((node.title as string) ?? '')

    // const nodeUrl = node.url as string
    // if (
    //   !nodeUrl.startsWith(prefixType.https) ||
    //   !nodeUrl.startsWith(prefixType.http) ||
    //   !nodeUrl.startsWith(prefixType.mailto)
    // ) {
    //   setPrefix(prefixType.other)
    // }
    // setURL((nodeUrl as string) ?? '')
    // } else if (editor.selection) {
    //   const text = Editor.string(editor, editor.selection)
    // console.log(text)
    // setTitle(text ?? '')
    // }
  }, [])

  return (
    <menu
      // onChange={e => {
      //   setQuotationMarks()
      // }}
      style={{cursor: 'pointer'}}>
      <button
        onClick={e => {
          e.preventDefault()
          selectedQuotationMarks = '<<>>'
          insertQuotationMarks(editor, selection, selectedQuotationMarks)
          togglePopover()
        }}>
        {'<< >>'}
      </button>
      <button
        onClick={e => {
          e.preventDefault()
          selectedQuotationMarks = '<>'
          insertQuotationMarks(editor, selection, selectedQuotationMarks)
          togglePopover()
        }}>
        {' '}
        {'< >'}{' '}
      </button>
      <button
        onClick={e => {
          e.preventDefault()
          selectedQuotationMarks = "' '"
          insertQuotationMarks(editor, selection, selectedQuotationMarks)
          togglePopover()
        }}>
        {' '}
        {"' '"}{' '}
      </button>
      <button
        onClick={e => {
          e.preventDefault()
          selectedQuotationMarks = '""'
          insertQuotationMarks(editor, selection, selectedQuotationMarks)
          togglePopover()
        }}>
        {' '}
        {'" "'}{' '}
      </button>
    </menu>
    // <Menu
    //   id="simple-menu"
    //   anchorEl={anchorEl}
    //   keepMounted
    //   open={Boolean(anchorEl)}
    //   onClose={handleClose}>
    //   <MenuItem onClick={handleClose}>Profile</MenuItem>
    //   <MenuItem onClick={handleClose}>My account</MenuItem>
    //   <MenuItem onClick={handleClose}>Logout</MenuItem>
    // </Menu>
  )
}
