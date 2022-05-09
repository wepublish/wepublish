import React, {useState, useEffect, useContext} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Form, ButtonToolbar, InputGroup, IconButton} from 'rsuite'
import {Transforms, Range, Editor} from 'slate'
import {useSlate} from 'slate-react'
import {WepublishEditor} from '../editor/wepublishEditor'
import {InlineFormat} from '../editor/formats'
import {SubMenuContext} from '../../../atoms/toolbar'
import UnlinkIcon from '@rsuite/icons/legacy/Unlink'

export function LinkMenu() {
  const editor = useSlate()

  const {closeMenu} = useContext(SubMenuContext)

  const [title, setTitle] = useState('')
  const [url, setURL] = useState('')

  enum prefixType {
    http = 'http://',
    https = 'https://',
    mailto = 'mailto:',
    other = 'other'
  }

  const [prefix, setPrefix] = useState<prefixType | string>(prefixType.http)

  const [selection, setSelection] = useState<Range | null>(null)

  const [isValidURL, setIsValidURL] = useState(false)
  const [isValidMail, setIsValidMail] = useState(false)
  const isDisabled = !url || !title

  const {t} = useTranslation()

  useEffect(() => {
    if (prefix === prefixType.mailto) {
      validateMail(url).then(value => setIsValidMail(value))
    } else {
      validateURL(url).then(value => setIsValidURL(value))
    }

    if (url.startsWith(prefixType.https)) {
      setPrefix(prefixType.https)
      setURL(url.replace(prefixType.https, ''))
    } else if (url.startsWith(prefixType.http)) {
      setPrefix(prefixType.http)
      setURL(url.replace(prefixType.http, ''))
    } else if (url.startsWith(prefixType.mailto)) {
      setPrefix(prefixType.mailto)
      setURL(url.replace(prefixType.mailto, ''))
    }
  }, [url])

  useEffect(() => {
    setSelection(editor.selection)

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

      const nodeUrl = node.url as string
      if (
        !nodeUrl.startsWith(prefixType.https) ||
        !nodeUrl.startsWith(prefixType.http) ||
        !nodeUrl.startsWith(prefixType.mailto)
      ) {
        setPrefix(prefixType.other)
      }
      setURL((nodeUrl as string) ?? '')
    } else if (editor.selection) {
      const text = Editor.string(editor, editor.selection)
      setTitle(text ?? '')
    }
  }, [])

  return (
    <>
      <Form fluid>
        <Form.Group>
          <Form.ControlLabel>{t('blocks.richText.link')}</Form.ControlLabel>
          <InputGroup>
            <select
              style={{backgroundColor: 'white', border: 'none', boxShadow: 'none'}}
              value={prefix}
              onChange={e => {
                setPrefix(e.target.value)
              }}>
              <option value={prefixType.http}>{prefixType.http}</option>
              <option value={prefixType.https}>{prefixType.https}</option>
              <option value={prefixType.mailto}>{prefixType.mailto}</option>
              <option value={prefixType.other}>{prefixType.other}</option>
            </select>

            <Form.Control name="url" value={url} onChange={(url: string) => setURL(url)} />
          </InputGroup>
          {prefix !== prefixType.mailto && url && !isValidURL ? (
            <Form.HelpText> {t('blocks.richText.invalidLink')}</Form.HelpText>
          ) : undefined}
          {prefix === prefixType.mailto && url && !isValidMail ? (
            <Form.HelpText> {t('blocks.richText.invalidMail')} </Form.HelpText>
          ) : undefined}
        </Form.Group>
        <Form.Group>
          <Form.ControlLabel>{t('blocks.richText.text')}</Form.ControlLabel>
          <Form.Control
            name="title"
            value={title}
            onChange={(title: string) => {
              setTitle(title)
            }}
          />
        </Form.Group>
        <ButtonToolbar>
          <Button
            disabled={isDisabled}
            onClick={e => {
              e.preventDefault()
              insertLink(
                editor,
                selection,
                prefix !== prefixType.other ? prefix + url : url,
                title || undefined
              )
              closeMenu()
            }}>
            {t('blocks.richText.insert')}
          </Button>
          <RemoveLinkFormatButton />
        </ButtonToolbar>
      </Form>
    </>
  )
}

async function validateMail(mail: string) {
  if (mail) {
    const pattern = new RegExp('^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$', 'i')
    return pattern.test(mail)
  }
  return false
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
    return pattern.test(url)
  }
  return false
}

export function RemoveLinkFormatButton() {
  const editor = useSlate()
  const {closeMenu} = useContext(SubMenuContext)

  const {t} = useTranslation()

  return (
    <IconButton
      icon={<UnlinkIcon />}
      active={WepublishEditor.isFormatActive(editor, InlineFormat.Link)}
      disabled={!WepublishEditor.isFormatActive(editor, InlineFormat.Link)}
      onMouseDown={() => {
        removeLink(editor)
        closeMenu()
      }}>
      {t('blocks.richText.remove')}
    </IconButton>
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

  Transforms.unwrapNodes(editor, {match: node => node.type === InlineFormat.Link})
  Transforms.wrapNodes(editor, {type: InlineFormat.Link, url, title, children: []}, {split: true})
  Transforms.collapse(editor, {edge: 'end'})
}

function removeLink(editor: Editor) {
  Transforms.unwrapNodes(editor, {match: node => node.type === InlineFormat.Link})
}
