import React, {useState} from 'react'
import {Value, Block, Document} from 'slate'

import {
  EditorTemplate,
  NavigationBar,
  IconButton,
  UnionListField,
  UnionListValue,
  RichTextField
} from '@karma.run/ui'

import {MaterialIconArrowBack, MaterialIconTextFormat} from '@karma.run/icons'

export type RichTextBlockValue = UnionListValue<'richText', Value>
export type TitleBlockValue = UnionListValue<'title', {title: string; text: string}>
export type BlockValue = RichTextBlockValue

export function ArticleEditor() {
  const [blocks, setBlocks] = useState<BlockValue[]>([])

  return (
    <EditorTemplate
      navigationChildren={
        <NavigationBar
          leftChildren={
            <IconButton icon={MaterialIconArrowBack} label="Back" onClick={() => history.back()} />
          }
        />
      }>
      <UnionListField value={blocks} onChange={blocks => setBlocks(blocks)}>
        {{
          richText: {
            field: props => <RichTextField {...props} />,
            defaultValue: Value.create({document: Document.create([Block.create('')])}),
            label: 'String',
            icon: MaterialIconTextFormat
          }
        }}
      </UnionListField>
    </EditorTemplate>
  )
}
