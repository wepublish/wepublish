import React, {useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Form, FormGroup, ControlLabel, FormControl, ButtonToolbar, Schema} from 'rsuite'
import {Transforms, Range, Editor} from 'slate'
import {useSlate} from 'slate-react'
//import {SubMenuContext, ToolbarIconButton} from '../../../atoms/toolbar'
import {WepublishEditor} from '../editor/wepublishEditor'
import {InlineFormat} from '../editor/formats'
import axios from 'axios'
export function LinkMenu() {
  const editor = useSlate()
  //const {closeMenu} = useContext(SubMenuContext)
  const [title, setTitle] = useState('')
  const [url, setURL] = useState('')
  //const [selection, setSelection] = useState<Range | null>(null)
  // const {openMenu} = useContext(SubMenuContext)
  const {t} = useTranslation()
  const [isValidURL, setIsValidURL] = useState(false)
  const isDisabled = !isValidURL

  useEffect(() => {
    if (!url) return
    ;() =>
      async function validateURL(url: string) {
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
        await axios
          .get(url, {timeout: 5000})
          .then(function (response) {
            setIsValidURL(true)
          })
          .catch(function (error) {
            if (error.response?.status) {
              // exists with error
              setIsValidURL(true)
            } else {
              // invalid
              setIsValidURL(false)
            }
          })
      }
  }, [])

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
  // setSelection(editor.selection)
  console.log('validated url check: ', isValidURL)
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
              console.log(isValidURL)
            }}
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
// const {StringType, NumberType} = Schema.Types
// const model = Schema.Model({
//   name: StringType().isRequired('This field is required.'),
//   email: StringType()
//     .isEmail('Please enter a valid email address.')
//     .isRequired('This field is required.')
// })
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
