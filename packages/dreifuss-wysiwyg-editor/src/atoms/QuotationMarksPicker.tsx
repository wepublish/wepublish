import React, {useContext, useEffect, useState} from 'react'
import {BaseEditor, BaseRange, Range, Editor, Transforms} from 'slate'
import {useStoreEditor} from '@udecode/slate-plugins-core'
import {PopoverContext} from '../atoms/PopoverContext'
// import './quotation-marks-picker.css'

function insertQuotationMarks(
  editor: BaseEditor,
  selection: BaseRange | null,
  selectedQuotationMarks: string
) {
  if (selection) {
    const nodes = Array.from(
      Editor.nodes(editor, {
        at: selection
      })
    )
    const tuple = nodes[0]
    if (tuple) {
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
            if (selection.anchor.offset > selection.focus.offset) {
              Transforms.insertText(editor, '"', {
                at: selection.anchor
              })
              Transforms.insertText(editor, '"', {
                at: selection.focus
              })
              break
            } else {
              Transforms.insertText(editor, '"', {
                at: selection.focus
              })
              Transforms.insertText(editor, '"', {
                at: selection.anchor
              })
              break
            }
          }
          case '<>': {
            if (selection.anchor.offset > selection.focus.offset) {
              Transforms.insertText(editor, '>', {
                at: selection.anchor
              })
              Transforms.insertText(editor, '<', {
                at: selection.focus
              })
              break
            } else {
              Transforms.insertText(editor, '>', {
                at: selection.focus
              })
              Transforms.insertText(editor, '<', {
                at: selection.anchor
              })
              break
            }
          }
          case "' '": {
            if (selection.anchor.offset > selection.focus.offset) {
              Transforms.insertText(editor, "'", {
                at: selection.anchor
              })
              Transforms.insertText(editor, "'", {
                at: selection.focus
              })
              break
            } else {
              Transforms.insertText(editor, "'", {
                at: selection.focus
              })
              Transforms.insertText(editor, "'", {
                at: selection.anchor
              })
              break
            }
          }
          default: {
            if (selection.anchor.offset > selection.focus.offset) {
              Transforms.insertText(editor, '>>', {
                at: selection.anchor
              })
              Transforms.insertText(editor, '<<', {
                at: selection.focus
              })
            } else {
              Transforms.insertText(editor, '>>', {
                at: selection.focus
              })
              Transforms.insertText(editor, '<<', {
                at: selection.anchor
              })
            }
          }
        }
      }
    } else {
      Transforms.insertText(editor, selectedQuotationMarks)
      Transforms.select(editor, {
        anchor: {
          path: selection.anchor.path,
          offset: selection.anchor.offset
        },
        focus: {path: selection.focus.path, offset: selection.focus.offset}
      })
    }
  }
}

export function QuotationMarksPicker() {
  const editor: BaseEditor = useStoreEditor()
  const {togglePopover} = useContext(PopoverContext)
  const [selection, setSelection] = useState<BaseRange | null>(null)
  let selectedQuotationMarks = ''
  // const [selectedQuotationMarks, setSelectedQuotationMarks] = useState<string>()

  useEffect(() => {
    setSelection(editor?.selection)
  }, [])

  return (
    <menu>
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
    // <select
    //   style={{backgroundColor: 'white', border: 'none', boxShadow: 'none'}}
    //   value={selectedQuotationMarks}
    //   onChange={e => {
    //     setSelectedQuotationMarks(e.target.value)
    //     insertQuotationMarks(editor, selection, selectedQuotationMarks)
    //   }}>
    //   <option value={'<<>>'}>{'<< >>'}</option>
    //   <option value={'<>'}>{'< >'}</option>
    //   <option value={'""'}>{'" "'}</option>
    //   <option value={"' '"}>{"' '"}</option>
    // </select>
  )
}
