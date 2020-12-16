import React, {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, ControlLabel, Form, FormControl, FormGroup, Modal} from 'rsuite'
import {Editor, Transforms, Range} from 'slate'
import {useSlate} from 'slate-react'
import {ToolbarIconButton} from '../../atoms/toolbar'
import {isFormatActive} from './editorUtils'
import {InlineFormat} from './formats'

export function LinkFormatButton() {
  const editor = useSlate()
  const [isLinkDialogOpen, setLinkDialogOpen] = useState(false)
  const [selection, setSelection] = useState<Range | null>(null)

  const [title, setTitle] = useState('')
  const [url, setURL] = useState('')

  const validatedURL = validateURL(url)
  const isDisabled = !validatedURL

  const {t} = useTranslation()

  return (
    <>
      <ToolbarIconButton
        icon="link"
        active={isFormatActive(editor, InlineFormat.Link)}
        onMouseDown={e => {
          e.preventDefault()

          const nodes = Array.from(
            Editor.nodes(editor, {
              at: editor.selection ?? undefined,
              match: node => node.type === InlineFormat.Link
            })
          )

          const tuple = nodes[0]

          if (tuple) {
            const [node] = tuple

            setTitle((node.title as string) ?? '')
            setURL((node.url as string) ?? '')
          } else {
            setTitle('')
            setURL('')
          }

          setSelection(editor.selection)
          setLinkDialogOpen(true)
        }}
      />
      <Modal show={isLinkDialogOpen} size={'sm'} onHide={() => setLinkDialogOpen(false)}>
        <Modal.Body>
          <Form fluid={true}>
            <FormGroup>
              <ControlLabel>{t('blocks.richText.link')}</ControlLabel>
              <FormControl
                errorMessage={url && !validatedURL ? 'Invalid Link' : undefined}
                value={url}
                onChange={url => setURL(url)}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('blocks.richText.title')}</ControlLabel>
              <FormControl value={title} onChange={title => setTitle(title)} />
            </FormGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={isDisabled}
            onClick={() => {
              insertLink(editor, selection, validatedURL!, title || undefined)
              setLinkDialogOpen(false)
            }}>
            {t('blocks.richText.apply')}
          </Button>
          <Button onClick={() => setLinkDialogOpen(false)}>{t('blocks.richText.cancel')}</Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

function validateURL(url: string): string | null {
  return url

  // TODO: Implement better URL validation with for support relative links.
  // try {
  //   return new URL(url).toString()
  // } catch (err) {
  //   try {
  //     return new URL(`https://${url}`).toString()
  //   } catch (err) {
  //     return null
  //   }
  // }
}

export function RemoveLinkFormatButton() {
  const editor = useSlate()

  return (
    <ToolbarIconButton
      icon="unlink"
      active={isFormatActive(editor, InlineFormat.Link)}
      disabled={!isFormatActive(editor, InlineFormat.Link)}
      onMouseDown={e => {
        e.preventDefault()
        removeLink(editor)
      }}
    />
  )
}

function insertLink(editor: Editor, selection: Range | null, url: string, title?: string) {
  if (selection) {
    if (Range.isCollapsed(selection)) {
      const nodes = Array.from(
        Editor.nodes(editor, {
          at: selection,
          match: node => node.type === InlineFormat.Link
        })
      )

      const tuple = nodes[0]

      if (tuple) {
        const [, path] = tuple
        Transforms.select(editor, path)
      }
    } else {
      Transforms.select(editor, selection)
    }
  }

  Transforms.unwrapNodes(editor, {match: node => node.type === InlineFormat.Link})
  Transforms.wrapNodes(editor, {type: InlineFormat.Link, url, title, children: []}, {split: true})
  Transforms.collapse(editor, {edge: 'end'})
}

function removeLink(editor: Editor) {
  Transforms.unwrapNodes(editor, {match: node => node.type === InlineFormat.Link})
}
