import React, {useState} from 'react'

import {
  EditorTemplate,
  NavigationBar,
  IconLabelButton,
  UnionListField,
  UnionListValue,
  TextField
} from '@karma.run/ui'

import {MaterialIconArrowBack, MaterialIconTextFormat} from '@karma.run/icons'

export type RichTextBlockValue = UnionListValue<'string', string>
export type BlockValue = RichTextBlockValue

export function ArticleEditor() {
  const [blocks, setBlocks] = useState<BlockValue[]>([])

  return (
    <EditorTemplate
      navigationChildren={
        <NavigationBar
          leftChildren={
            <IconLabelButton
              icon={MaterialIconArrowBack}
              label="Back"
              onClick={() => history.back()}
            />
          }
        />
      }>
      <UnionListField value={blocks} onChange={blocks => setBlocks(blocks)}>
        {{
          string: {
            field: props => <TextField {...props} />,
            defaultValue: '',
            label: 'String',
            icon: MaterialIconTextFormat
          }
        }}
      </UnionListField>
    </EditorTemplate>
  )
}
