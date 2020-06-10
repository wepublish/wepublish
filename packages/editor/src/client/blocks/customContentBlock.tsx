import React, {useContext} from 'react'
import Editor from 'react-simple-code-editor'
import {highlight, languages} from 'prismjs'
import 'prismjs/components/prism-markup'
import 'react-syntax-highlighter'

import {BlockProps, Card, ThemeContext} from '@karma.run/ui'

import {CustomContentBlockValue} from './types'

// TODO: Handle disabled prop
export function CustomContentBlock({
  value,
  onChange,
  autofocus
}: BlockProps<CustomContentBlockValue>) {
  const theme = useContext(ThemeContext)
  const isEmpty = value.content == undefined

  return (
    <>
      <Card
        height={isEmpty ? 300 : undefined}
        overflow="hidden"
        style={{backgroundColor: theme.colors.light}}>
        <Editor
          value={value.content}
          onValueChange={changedValue => onChange({...value, content: changedValue})}
          highlight={code => {
            return highlight(code, languages.markup, 'markup')
          }}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12
          }}
        />
      </Card>
    </>
  )
}
