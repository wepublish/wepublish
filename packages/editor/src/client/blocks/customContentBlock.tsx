import React, {useContext, useState} from 'react'
import Editor from 'react-simple-code-editor'
import {highlight, languages} from 'prismjs'
import 'prismjs/components/prism-markup'
import 'react-syntax-highlighter'

import {
  BlockProps,
  Box,
  Card,
  Drawer,
  IconButton,
  ThemeContext,
  Typography,
  ZIndex
} from '@karma.run/ui'

import {CustomContentBlockValue} from './types'
import {CustomContentEditPanel} from '../panel/customContentEditPanel'
import {MaterialIconEditOutlined} from '@karma.run/icons'

// TODO: Handle disabled prop
export function CustomContentBlock({
  value,
  onChange,
  autofocus
}: BlockProps<CustomContentBlockValue>) {
  const theme = useContext(ThemeContext)
  const isEmpty = value.content == undefined
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const {kind, format, height, width} = value

  return (
    <>
      <Box position="relative" width="100%">
        <Box position="absolute" zIndex={ZIndex.Default} right={0} top={0}>
          <IconButton
            icon={MaterialIconEditOutlined}
            title="Edit"
            onClick={() => setEditModalOpen(true)}
          />
        </Box>
      </Box>
      <Typography variant="body2" spacing="small">
        ATTENTION - Custom Content blocks will not be displayed over peering!
      </Typography>
      <Card
        height={isEmpty ? 500 : undefined}
        overflow="hidden"
        style={{backgroundColor: theme.colors.light}}>
        <Editor
          value={value.content}
          onValueChange={changedValue => onChange({...value, content: changedValue})}
          highlight={code => {
            switch (value.format) {
              case 'html':
                return highlight(code, languages.markup, 'markup')
              case 'json':
                return highlight(code, languages.json, 'json')
              case 'markdown':
                return highlight(code, languages.markdown, 'markdown')
              default:
                return code
            }
          }}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12
          }}
        />
      </Card>
      <Drawer open={isEditModalOpen} width={480}>
        {() => (
          <CustomContentEditPanel
            customContentData={{kind, format, height, width}}
            onSave={(kind, format, height, width) => {
              onChange({...value, kind, format, height, width})
              setEditModalOpen(false)
            }}
            onClose={() => setEditModalOpen(false)}
          />
        )}
      </Drawer>
    </>
  )
}
