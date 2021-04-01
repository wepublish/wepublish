import React, {useState, useEffect, useContext} from 'react'
import {SubMenuContext} from '../../../atoms/toolbar'
import {RefSelectPanel} from '../../../panel/refSelectPanel'
import {Transforms, Range, Editor} from 'slate'
import {useSlate} from 'slate-react'
import {WepublishEditor} from '../editor/wepublishEditor'
import {InlineFormat} from '../editor/formats'
import {Button, ButtonToolbar, ControlLabel, Form, FormControl, FormGroup} from 'rsuite'
import {useTranslation} from 'react-i18next'
import {ContentModelSchemaFieldRefTypeMap} from '../../../interfaces/referenceType'

export function RefMenu({types}: {types: ContentModelSchemaFieldRefTypeMap}) {
  const {t} = useTranslation()
  const editor = useSlate()
  const [selection, setSelection] = useState<Range | null>(null)
  const [title, setTitle] = useState('')
  const [url, setURL] = useState('')
  const {closeMenu} = useContext(SubMenuContext)

  useEffect(() => {
    setSelection(editor.selection)

    const nodes = Array.from(
      WepublishEditor.nodes(editor, {
        at: editor.selection ?? undefined,
        match: node => node.type === InlineFormat.Reference
      })
    )

    const tuple = nodes[0]
    if (tuple) {
      const [node] = tuple
      setTitle((node.title as string) ?? '')
      setURL((node.url as string) ?? '')
    } else if (editor.selection) {
      const text = Editor.string(editor, editor.selection)
      setTitle(text ?? '')
    }
  }, [])

  return (
    <>
      <Form fluid>
        <FormGroup>
          <ControlLabel>{t('blocks.richText.text')}</ControlLabel>
          <FormControl
            value={title}
            onChange={title => {
              setTitle(title)
            }}
          />
          <p>{url}</p>
        </FormGroup>
        <ButtonToolbar>
          <Button
            onClick={e => {
              e.preventDefault()
              insertLink(editor, selection, url, title || undefined)
              closeMenu()
            }}>
            {t('blocks.richText.insert')}
          </Button>
          <RemoveLinkFormatButton />
        </ButtonToolbar>
      </Form>
      <RefSelectPanel
        config={types}
        onClose={() => {
          insertLink(editor, selection, url, title || undefined)
          closeMenu()
        }}
        onSelectRef={ref => {
          setURL(`wepublish://${ref.contentType}/${ref.recordId}/${ref.peerId}`)
        }}
      />
    </>
  )
}

function insertLink(editor: Editor, selection: Range | null, url: string, title?: string) {
  if (selection) {
    if (Range.isCollapsed(selection)) {
      const nodes = Array.from(
        WepublishEditor.nodes(editor, {
          at: selection,
          match: node => node.type === InlineFormat.Reference
        })
      )
      const tuple = nodes[0]

      if (tuple) {
        const [, path] = tuple
        Transforms.select(editor, path)
      } else {
        Transforms.insertText(editor, title ?? '')
        Transforms.select(editor, {
          anchor: {
            path: selection.anchor.path,
            offset: selection.anchor.offset + (title?.length ?? 0)
          },
          focus: {path: selection.focus.path, offset: selection.focus.offset}
        })
      }
    } else {
      Transforms.select(editor, selection)
    }
  }

  Transforms.unwrapNodes(editor, {match: node => node.type === InlineFormat.Reference})
  Transforms.wrapNodes(
    editor,
    {type: InlineFormat.Reference, url, title, children: []},
    {split: true}
  )
  Transforms.collapse(editor, {edge: 'end'})
}

export function RemoveLinkFormatButton() {
  const editor = useSlate()
  const {closeMenu} = useContext(SubMenuContext)

  const {t} = useTranslation()

  return (
    <Button
      icon="unlink"
      active={WepublishEditor.isFormatActive(editor, InlineFormat.Reference)}
      disabled={!WepublishEditor.isFormatActive(editor, InlineFormat.Reference)}
      onMouseDown={() => {
        removeLink(editor)
        closeMenu()
      }}>
      {t('blocks.richText.remove')}
    </Button>
  )
}

function removeLink(editor: Editor) {
  Transforms.unwrapNodes(editor, {match: node => node.type === InlineFormat.Reference})
}
