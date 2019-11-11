import React, {useState, useEffect} from 'react'
import {Value, Block, Document} from 'slate'

import {
  EditorTemplate,
  NavigationBar,
  NavigationButton,
  RichTextField,
  PlaceholderInput,
  BlockListValue,
  BlockListField,
  Drawer,
  FieldProps,
  Image,
  Box,
  Layer,
  LayerContainer,
  Spacing,
  OptionButtonSmall
} from '@karma.run/ui'

import {
  MaterialIconArrowBack,
  MaterialIconTextFormat,
  MaterialIconInsertDriveFileOutlined,
  MaterialIconPublishOutlined,
  MaterialIconSaveOutlined,
  MaterialIconImage,
  MaterialIconEditOutlined
} from '@karma.run/icons'

import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImageReference} from '../api/types'
import {RouteNavigationLinkButton, ArticleListRoute} from '../route'

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
            field: props => <RichTextField {...props} />,
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

export function ImageBlock({value, onChange}: FieldProps<ImageReference | null>) {
  const [isModalOpen, setModalOpen] = useState(false)

  useEffect(() => setModalOpen(true), [])

  return (
    <>
      <Box height={300}>
        <PlaceholderInput onAddClick={() => setModalOpen(true)}>
          {value && (
            <LayerContainer>
              <Layer>
                <Image src={value.url} width={value.width} height={value.height} contain />
              </Layer>
              <Layer>
                <Box
                  padding={Spacing.ExtraSmall}
                  flexDirection="row"
                  justifyContent="flex-end"
                  flex>
                  <OptionButtonSmall
                    icon={MaterialIconEditOutlined}
                    onClick={() => setModalOpen(true)}
                  />
                </Box>
              </Layer>
            </LayerContainer>
          )}
        </PlaceholderInput>
      </Box>
      <Drawer open={isModalOpen} width={480}>
        {() => (
          <ImageSelectPanel
            onClose={() => setModalOpen(false)}
            onSelect={value => {
              setModalOpen(false)
              onChange(value)
            }}
          />
        )}
      </Drawer>
    </>
  )
}
