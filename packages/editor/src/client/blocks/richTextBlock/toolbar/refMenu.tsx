import React, {useState, useEffect, useContext} from 'react'
import {SubMenuContext} from '../../../atoms/toolbar'
import {RefSelectPanel} from '../../../panel/refSelectPanel'
import {Transforms, Range, Editor} from 'slate'
import {useSlate} from 'slate-react'
import {WepublishEditor} from '../editor/wepublishEditor'
import {InlineFormat} from '../editor/formats'
import {Button, ButtonToolbar, ControlLabel, Form, FormControl, FormGroup} from 'rsuite'
import {useTranslation} from 'react-i18next'
import {ContentModelSchemaFieldRefTypeMap, Reference} from '../../../interfaces/referenceType'
import {ReferencePreview} from '../../../atoms/referencePreview'

export function RefMenu({types}: {types: ContentModelSchemaFieldRefTypeMap}) {
  const {t} = useTranslation()
  const editor = useSlate()
  const [selection, setSelection] = useState<Range | null>(null)
  const [title, setTitle] = useState('')
  const [reference, setReferences] = useState<Reference | undefined>(undefined)
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
      setReferences(node.reference as Reference)
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
        </FormGroup>
        <FormGroup>
          <ControlLabel>{t('blocks.richText.reference')}</ControlLabel>
          <ReferencePreview
            reference={reference}
            onClose={() => setReferences(undefined)}></ReferencePreview>
        </FormGroup>
        <ButtonToolbar>
          <Button
            disabled={!reference}
            onClick={e => {
              e.preventDefault()
              insertLink(editor, selection, reference, title || undefined)
              closeMenu()
            }}>
            {t('blocks.richText.insert')}
          </Button>
          <RemoveLinkFormatButton />
          <Button
            onClick={e => {
              e.preventDefault()
              closeMenu()
            }}>
            {t('blocks.richText.cancel')}
          </Button>
        </ButtonToolbar>
      </Form>
      <RefSelectPanel
        config={types}
        onClose={() => {
          insertLink(editor, selection, reference, title || undefined)
          closeMenu()
        }}
        onSelectRef={ref => {
          setReferences(ref)
        }}
      />
    </>
  )
}

function insertLink(
  editor: Editor,
  selection: Range | null,
  reference?: Reference,
  title?: string
) {
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
    {type: InlineFormat.Reference, reference, title, children: []},
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
