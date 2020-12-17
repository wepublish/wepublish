import React, {useState, useContext} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, InputGroup, InputNumber} from 'rsuite'
import {Editor, Transforms, Element as SlateElement} from 'slate'
import {useSlate} from 'slate-react'
import {SubMenuContext} from '../../atoms/toolbar'
import {isFormatActive} from './editorUtils'
import {BlockFormat} from './formats'
import {ColorPicker} from '../../atoms/colorPicker'

import './tableMenu.less'

export function TableMenu() {
  const editor = useSlate()
  const {closeMenu} = useContext(SubMenuContext)

  const [nrows, setNrows] = useState(2)
  const [ncols, setNcols] = useState(1)

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  const {t} = useTranslation()

  const isBorderVisible = () => {
    const [match] = Editor.nodes(editor, {
      match: node => (node.borderColor && node.borderColor !== 'transparent') as boolean,
      mode: 'all'
    })

    return !!match
  }

  const emptyTextParagraph = () => ({type: BlockFormat.Paragraph, children: [{text: ''}]})

  const emptyCellsTable = (nrows: number, ncols: number): SlateElement[] => [
    {
      type: BlockFormat.Table,
      children: Array.from({length: nrows}).map(() => ({
        type: BlockFormat.TableRow,
        children: Array.from({length: ncols}).map(() => ({
          type: BlockFormat.TableCell,
          borderColor: 'black',
          // Wrap all content inside cell into paragraph block to enable break lines.
          children: [emptyTextParagraph()]
        }))
      }))
    },
    // Append empty paragraph after table block for easy continuation.
    emptyTextParagraph()
  ]

  const tableInsertControls = (
    <>
      {[
        {
          label: t('blocks.richTextTable.rows'),
          num: nrows,
          setNumber: setNrows
        },
        {
          label: t('blocks.richTextTable.columns'),
          num: ncols,
          setNumber: setNcols
        }
      ].map(({label, num, setNumber}, i) => (
        <InputGroup
          style={{width: '150px'}}
          disabled={isFormatActive(editor, BlockFormat.Table)}
          key={i}>
          <InputGroup.Addon style={{width: '80px'}}>{label}</InputGroup.Addon>
          <InputNumber value={num} onChange={val => setNumber(val as number)} min={1} max={100} />
        </InputGroup>
      ))}
      <Button
        onClick={() => {
          Transforms.insertNodes(editor, emptyCellsTable(nrows, ncols))
        }}>
        {t('blocks.richTextTable.insertTable')}
      </Button>
    </>
  )

  const removeTable = () => {
    Transforms.removeNodes(editor, {
      at: editor.selection ?? undefined,
      match: node => node.type === BlockFormat.Table
    })
  }

  const setTableCellBorderColor = (color: string) => {
    const {selection} = editor
    if (selection) {
      const nodes = Array.from(
        Editor.nodes(editor, {
          at: selection,
          match: node => node.type === BlockFormat.Table
        })
      )
      Transforms.setNodes(
        editor,
        {borderColor: color},
        {at: nodes[0][1], match: node => node.type === BlockFormat.TableCell}
      )
    }
  }

  const tableModifyControls = (
    <>
      {!showRemoveConfirm ? (
        <>
          {isBorderVisible() ? (
            <>
              <ColorPicker
                withColor={color => {
                  setTableCellBorderColor(color)
                }}
              />
              <Button appearance="subtle" onClick={() => setTableCellBorderColor('transparent')}>
                {t('blocks.richTextTable.clearBorders')}
              </Button>
            </>
          ) : (
            <Button appearance="default" onClick={() => setTableCellBorderColor('black')}>
              {t('blocks.richTextTable.addBorders')}
            </Button>
          )}
          <Button color="red" appearance="ghost" onClick={() => setShowRemoveConfirm(true)}>
            {t('blocks.richTextTable.deleteTable')}
          </Button>
        </>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
            width: '100%'
          }}>
          <Button
            color="red"
            appearance="primary"
            onClick={() => {
              removeTable()
              closeMenu()
              setShowRemoveConfirm(false)
            }}>
            {t('blocks.richTextTable.delete')}
          </Button>
          <Button appearance="default" onClick={() => setShowRemoveConfirm(false)}>
            {t('blocks.richTextTable.cancel')}
          </Button>
        </div>
      )}
    </>
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '10em',
        width: '15em'
      }}>
      {isFormatActive(editor, BlockFormat.Table) ? tableModifyControls : tableInsertControls}
    </div>
  )
}
