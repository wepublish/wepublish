import React, {useState, useCallback} from 'react'

import {
  BlockProps,
  ListInput,
  FieldProps,
  Box,
  Card,
  PlaceholderInput,
  ZIndex,
  IconButton,
  Spacing,
  TypographicTextArea,
  Drawer,
  Image
} from '@karma.run/ui'

import {
  MaterialIconImageOutlined,
  MaterialIconEditOutlined,
  MaterialIconClose
} from '@karma.run/icons'

import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImagedEditPanel} from '../panel/imageEditPanel'

import {ListicleBlockValue, ListicleItem, RichTextBlockValue} from './types'
import {createDefaultValue, RichTextBlock} from './richTextBlock'
import {isFunctionalUpdate} from '@karma.run/react'

export function ListicleBlock({value, onChange, disabled}: BlockProps<ListicleBlockValue>) {
  return (
    <ListInput
      value={value.items}
      onChange={items =>
        onChange(value => ({
          items: isFunctionalUpdate(items) ? items(value.items) : items
        }))
      }
      defaultValue={{image: null, richText: createDefaultValue(), title: ''}}
      disabled={disabled}>
      {props => <ListicleItemElement {...props} />}
    </ListInput>
  )
}

export function ListicleItemElement({value, onChange}: FieldProps<ListicleItem>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const {image, title, richText} = value

  const handleRichTextChange = useCallback(
    (richText: React.SetStateAction<RichTextBlockValue>) =>
      onChange(value => ({
        ...value,
        richText: isFunctionalUpdate(richText) ? richText(value.richText) : richText
      })),
    [onChange]
  )

  return (
    <>
      <Box display="flex" flexDirection="row">
        <Card
          overflow="hidden"
          width={200}
          height={150}
          marginRight={Spacing.ExtraSmall}
          flexShrink={0}>
          <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
            {image && (
              <Box position="relative" width="100%" height="100%">
                <Box position="absolute" zIndex={ZIndex.Default} right={0} top={0}>
                  <IconButton
                    icon={MaterialIconImageOutlined}
                    title="Choose Image"
                    margin={Spacing.ExtraSmall}
                    onClick={() => setChooseModalOpen(true)}
                  />
                  <IconButton
                    icon={MaterialIconEditOutlined}
                    title="Edit Image"
                    margin={Spacing.ExtraSmall}
                    onClick={() => setEditModalOpen(true)}
                  />
                  <IconButton
                    icon={MaterialIconClose}
                    title="Remove Image"
                    margin={Spacing.ExtraSmall}
                    onClick={() => onChange(value => ({...value, image: null}))}
                  />
                </Box>
                {image.previewURL && <Image src={image.previewURL} width="100%" height="100%" />}
              </Box>
            )}
          </PlaceholderInput>
        </Card>
        <Box flexGrow={1}>
          <TypographicTextArea
            variant="h1"
            placeholder="Title"
            value={title}
            onChange={e => {
              const title = e.target.value
              onChange(value => ({...value, title}))
            }}
          />

          <RichTextBlock value={richText} onChange={handleRichTextChange} />
        </Box>
      </Box>

      <Drawer open={isChooseModalOpen} width={480}>
        {() => (
          <ImageSelectPanel
            onClose={() => setChooseModalOpen(false)}
            onSelect={image => {
              setChooseModalOpen(false)
              onChange(value => ({...value, image}))
            }}
          />
        )}
      </Drawer>
      <Drawer open={isEditModalOpen} width={480}>
        {() => (
          <ImagedEditPanel
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        )}
      </Drawer>
    </>
  )
}
