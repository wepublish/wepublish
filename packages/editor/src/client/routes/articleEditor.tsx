import React, {useState} from 'react'
import {Value, Block, Document} from 'slate'

import {
  EditorTemplate,
  NavigationBar,
  NavigationButton,
  BlockListValue,
  BlockList
} from '@karma.run/ui'

import {
  MaterialIconArrowBack,
  MaterialIconTextFormat,
  MaterialIconInsertDriveFileOutlined,
  MaterialIconPublishOutlined,
  MaterialIconSaveOutlined,
  MaterialIconImage,
  MaterialIconTitle
} from '@karma.run/icons'

import {RouteNavigationLinkButton, ArticleListRoute} from '../route'
import {RichTextBlock} from '../blocks/richTextBlock'
import {ImageBlock, ImageBlockValue} from '../blocks/imageBlock'
import {TitleBlockValue, TitleBlock} from '../blocks/titleBlock'

export type RichTextBlockListValue = BlockListValue<'richText', Value>
export type TitleBlockListValue = BlockListValue<'title', TitleBlockValue>
export type ImageBlockListValue = BlockListValue<'image', ImageBlockValue>
export type BlockValue = TitleBlockListValue | RichTextBlockListValue | ImageBlockListValue

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
      <BlockList value={blocks} onChange={blocks => setBlocks(blocks)} allowInit>
        {{
          title: {
            field: props => <TitleBlock {...props} />,
            defaultValue: {title: '', lead: ''},
            label: 'Title',
            icon: MaterialIconTitle
          },

          richText: {
            field: props => <RichTextBlock {...props} />,
            defaultValue: Value.create({document: Document.create([Block.create('')])}),
            label: 'Rich Text',
            icon: MaterialIconTextFormat
          },

          image: {
            field: props => <ImageBlock {...props} />,
            defaultValue: {image: null, caption: ''},
            label: 'Image',
            icon: MaterialIconImage
          }
        }}
      </BlockList>
    </EditorTemplate>
  )
}
