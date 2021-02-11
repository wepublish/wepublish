import React, {useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Form, FormGroup, ControlLabel, FormControl, ButtonToolbar} from 'rsuite'
import {Transforms, Range, Editor} from 'slate'
import {useSlate} from 'slate-react'
import {WepublishEditor} from '../editor/wepublishEditor'
import {InlineFormat} from '../editor/formats'
import axios from 'axios'

export function LinkMenu() {
  const editor = useSlate()

  const [title, setTitle] = useState('')
  const [url, setURL] = useState('')

  const {t} = useTranslation()
  const [isValidURL, setIsValidURL] = useState(false)
  const isDisabled = !isValidURL

  useEffect(() => {
    validateURL(url).then(value => setIsValidURL(value))
  }, [url])

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
    }
  }, [editor.selection])

  return (
    <>
      <Form fluid>
        <FormGroup>
          <ControlLabel>{t('blocks.richText.link')}</ControlLabel>
          <FormControl
            errorMessage={url && !isValidURL ? 'Invalid Link' : undefined}
            value={url}
            onChange={url => {
              setURL(url)
            }}
          />
        </FormGroup>
        <FormGroup>
          <ControlLabel>{t('blocks.richText.text')}</ControlLabel>
          <FormControl
            value={title}
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
              insertLink(editor, editor.selection, url, title || undefined)
            }}>
            {t('blocks.richText.insert')}
          </Button>
          <RemoveLinkFormatButton />
        </ButtonToolbar>
      </Form>
    </>
  )
}

async function validateURL(url: string) {
  if (url) {
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i'
    )
    if (!pattern.test(url)) return false
    return await axios
      .get(url, {timeout: 100})
      .then(function () {
        return true
      })
      .catch(function (error: any) {
        if (error.response?.status) return true
        return false
      })
  }
  return false
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
  Transforms.unwrapNodes(editor, {
    match: node => node.type === InlineFormat.Link
  })
  Transforms.wrapNodes(editor, {type: InlineFormat.Link, url, title, children: []}, {split: true})
  Transforms.collapse(editor, {edge: 'end'})
}
function removeLink(editor: Editor) {
  Transforms.unwrapNodes(editor, {
    match: node => node.type === InlineFormat.Link
  })
}
