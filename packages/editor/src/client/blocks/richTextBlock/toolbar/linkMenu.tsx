import React, {useState, useContext, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Form, FormGroup, ControlLabel, FormControl, ButtonToolbar} from 'rsuite'
import {Transforms, Range, Editor} from 'slate'
import {useSlate} from 'slate-react'
import {SubMenuContext, ToolbarIconButton} from '../../../atoms/toolbar'
import {WepublishEditor} from '../editor/wepublishEditor'
import {InlineFormat} from '../editor/formats'

export function LinkMenu() {
  const editor = useSlate()

  //const {closeMenu} = useContext(SubMenuContext)

  const [title, setTitle] = useState('')
  const [url, setURL] = useState('')

  const [selection, setSelection] = useState<Range | null>(null)

  const validatedURL = validateURL(url)
  const isDisabled = !validatedURL

  const {openMenu} = useContext(SubMenuContext)
  const {t} = useTranslation()

  useEffect(() => {
    const nodes = Array.from(
      WepublishEditor.nodes(editor, {
        at: editor.selection ?? undefined,
        match: node => node.type === InlineFormat.Link
      })
    )
    const tuple = nodes[0]
    if (tuple) {
      const [node] = tuple
      setTitle((node.title as string) ?? '')
      setURL((node.url as string) ?? '')
    } /*else {
      setTitle('')
      setURL('')
    } */
  }, [editor.selection])

  setSelection(editor.selection)

  return (
    <>
      <Form fluid>
        <FormGroup>
          <ControlLabel>{t('blocks.richText.link')}</ControlLabel>
          <FormControl
            errorMessage={url && !validatedURL ? 'Invalid Link' : undefined}
            value={url}
            onChange={url => setURL(url)}
          />
        </FormGroup>
        <FormGroup>
          <ControlLabel>{t('blocks.richText.text')}</ControlLabel>
          <FormControl
            value={title ? title : window.getSelection()?.toString()}
            //TODO change title
            onChange={title => {
              setTitle(title)
            }}
          />
        </FormGroup>
        <ButtonToolbar>
          <Button
            disabled={isDisabled}
            onClick={e => {
              e.preventDefault()
              insertLink(editor, editor.selection, validatedURL!, title || undefined)
            }}>
            {t('blocks.richText.insert')}
          </Button>
          <RemoveLinkFormatButton />
        </ButtonToolbar>
      </Form>
    </>
  )
}

function validateURL(url: string): string | null {
  return url
  //return boolean
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
  const {t} = useTranslation()

  return (
    <Button
      icon="unlink"
      active={WepublishEditor.isFormatActive(editor, InlineFormat.Link)}
      disabled={!WepublishEditor.isFormatActive(editor, InlineFormat.Link)}
      onMouseDown={() => {
        //e.preventDefault()
        removeLink(editor)
      }}>
      {t('blocks.richText.remove')}
    </Button>
  )
}

function insertLink(editor: Editor, selection: Range | null, url: string, title?: string) {
  if (selection) {
    if (Range.isCollapsed(selection)) {
      const nodes = Array.from(
        WepublishEditor.nodes(editor, {
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
