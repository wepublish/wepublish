import React, {useState, useContext, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Icon, InputGroup, InputNumber} from 'rsuite'
import {Transforms} from 'slate'
import {useSlate} from 'slate-react'
import {ColorPicker} from '../../../atoms/colorPicker'
import {HBar, SubMenuContext} from '../../../atoms/toolbar'
import {WepublishEditor} from '../editor/wepublishEditor'
import {BlockFormat} from '../editor/formats'
import {defaultBorderColor, emptyCellsTable} from '../editor/elements'

import './tableMenu.less'

export function TableMenu() {
  const editor = useSlate()

  const {closeMenu} = useContext(SubMenuContext)

  const [nrows, setNrows] = useState(2)
  const [ncols, setNcols] = useState(1)
  const [borderColor, setBorderColor] = useState(defaultBorderColor)

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  const {t} = useTranslation()

  useEffect(() => {
    // set borderColor in slate node tree on colorPicker change
    const nodes = WepublishEditor.nodes(editor, {
      match: node => node.type === BlockFormat.Table
    })
    for (const [, path] of nodes) {
      Transforms.setNodes(
        editor,
        {borderColor},
        {
          at: path,
          match: node => node.type === BlockFormat.TableCell
        }
      )
      return
    }
  }, [borderColor])

  useEffect(() => {
    // Set borderColor of picker on menu mount.
    getBorderColorOfFocusedTable()
  }, [])

  useEffect(() => {
    // Update borderColor of picker when focusing other table.
    getBorderColorOfFocusedTable()
  }, [editor.selection])

  const getBorderColorOfFocusedTable = () => {
    const nodes = WepublishEditor.nodes(editor, {
      match: node => node.type === BlockFormat.TableCell
    })
    for (const [node] of nodes) {
      setBorderColor(node.borderColor as string)
      return
    }
  }

  const isBorderVisible = borderColor !== 'transparent'

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
          disabled={WepublishEditor.isFormatActive(editor, BlockFormat.Table)}
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

  const tableModifyControls = (
    <>
      {!showRemoveConfirm ? (
        <>
          {isBorderVisible ? (
            <HBar dividerBottom>
              <ColorPicker
                withColor={color => {
                  setBorderColor(color)
                }}
                currentColor={borderColor}
                label={t('blocks.richTextTable.border')}
              />
              <button className="icon-button" onClick={() => setBorderColor('transparent')}>
                <Icon icon="ban" style={{color: 'red'}} />
              </button>
            </HBar>
          ) : (
            <Button appearance="default" onClick={() => setBorderColor(defaultBorderColor)}>
              {t('blocks.richTextTable.addBorders')}
            </Button>
          )}
          <Button color="red" appearance="ghost" onClick={() => setShowRemoveConfirm(true)}>
            {t('blocks.richTextTable.deleteTable')}
          </Button>
        </>
      ) : (
        <HBar>
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
        </HBar>
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
      {WepublishEditor.isFormatActive(editor, BlockFormat.Table)
        ? tableModifyControls
        : tableInsertControls}
    </div>
  )
}
