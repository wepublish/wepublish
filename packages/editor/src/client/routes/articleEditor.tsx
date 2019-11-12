import React, {useState} from 'react'
import {Value, Block, Document} from 'slate'

import {
  EditorTemplate,
  NavigationBar,
  NavigationButton,
  BlockListValue,
  BlockListField
} from '@karma.run/ui'

import {
  MaterialIconArrowBack,
  MaterialIconTextFormat,
  MaterialIconInsertDriveFileOutlined,
  MaterialIconPublishOutlined,
  MaterialIconSaveOutlined,
  MaterialIconImage
} from '@karma.run/icons'

import {ImageReference} from '../api/types'
import {RouteNavigationLinkButton, ArticleListRoute} from '../route'
import {RichTextBlock} from '../blocks/richTextBlock'
import {ImageBlock} from '../blocks/imageBlock'

export type RichTextBlockValue = BlockListValue<'richText', Value>
export type TitleBlockValue = BlockListValue<'title', {title: string; text: string}>
export type ImageBlockValue = BlockListValue<'image', ImageReference | null>
export type BlockValue = RichTextBlockValue | ImageBlockValue

export function ArticleEditor() {
  const [blocks, setBlocks] = useState<BlockValue[]>([])

  return (
    <EditorTemplate
      navigationChildren={
        <NavigationBar
          leftChildren={
            <RouteNavigationLinkButton
              icon={MaterialIconArrowBack}
              label="Back"
              route={ArticleListRoute.create({})}
            />
          }
          centerChildren={
            <>
              <NavigationButton icon={MaterialIconInsertDriveFileOutlined} label="Metadata" />
              <NavigationButton icon={MaterialIconSaveOutlined} label="Save" />
              <NavigationButton icon={MaterialIconPublishOutlined} label="Publish" />
            </>
          }
        />
      }>
      <BlockListField value={blocks} onChange={blocks => setBlocks(blocks)}>
        {{
          richText: {
            field: props => <RichTextBlock {...props} />,
            defaultValue: Value.create({document: Document.create([Block.create('')])}),
            label: 'Rich Text',
            icon: MaterialIconTextFormat
          },

          image: {
            field: props => <ImageBlock {...props} />,
            defaultValue: null,
            label: 'Image',
            icon: MaterialIconImage
          }
        }}
      </BlockListField>
    </EditorTemplate>
  )
}
