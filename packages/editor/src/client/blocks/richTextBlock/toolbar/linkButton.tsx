import React, {useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, ControlLabel, Form, FormControl, FormGroup} from 'rsuite'
import {Transforms, Range, Editor} from 'slate'
import {useSlate} from 'slate-react'
import {ToolbarIconButton} from '../../../atoms/toolbar'
import {WepublishEditor} from '../editor/wepublishEditor'
import {InlineFormat} from '../editor/formats'

export function LinkFormatButton() {
  const editor = useSlate()
  const [selection, setSelection] = useState<Range | null>(null)

  const [title, setTitle] = useState('')
  const [url, setURL] = useState('')

  const validatedURL = validateURL(url)
  const isDisabled = !validatedURL

  const {t} = useTranslation()

  useEffect(() => {
    const nodes = Array.from(
      WepublishEditor.nodes(editor, {
        at: editor.selection ?? undefined,
        match: node => node.type === InlineFormat.Link
      })
    )
    const tuple = nodes[0]

    console.log('tuple: ', tuple)
    if (tuple) {
      const [node] = tuple
      setTitle((node.title as string) ?? '')
      setURL((node.url as string) ?? '')
    } else {
      setTitle('')
      setURL('')
    }

    setSelection(editor.selection)
  })

  return (
    <>
      <Form>
        <FormGroup>
          <ControlLabel>{t('blocks.richText.link')}</ControlLabel>
          <FormControl
            errorMessage={url && !validatedURL ? 'Invalid Link' : undefined}
            value={url}
            onChange={url => setURL(url)}
            //or highlighted text
          />
        </FormGroup>
        <FormGroup>
          <ControlLabel>{t('blocks.richText.text')}</ControlLabel>
          <FormControl value={title} onChange={title => setTitle(title)} />
        </FormGroup>
        <Button
          disabled={isDisabled}
          onClick={() => {
            insertLink(editor, selection, validatedURL!, title || undefined)
          }}>
          {t('blocks.richText.insert')}
        </Button>
      </Form>
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
      active={WepublishEditor.isFormatActive(editor, InlineFormat.Link)}
      disabled={!WepublishEditor.isFormatActive(editor, InlineFormat.Link)}
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
        WepublishEditor.nodes(editor, {
          at: selection,
          match: node => node.type === InlineFormat.Link
        })
      )
      console.log('selection', selection)
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
