import React, {useState} from 'react'
import nanoid from 'nanoid'

import {
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  Box,
  Spacing,
  Drawer,
  ListInput,
  ListValue,
  Card,
  PlaceholderInput,
  IconButton,
  ZIndex,
  FieldProps,
  Image,
  TypographicTextArea
} from '@karma.run/ui'

import {
  MaterialIconClose,
  MaterialIconImageOutlined,
  MaterialIconEditOutlined
} from '@karma.run/icons'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'

import {GalleryImageEdge} from '../blocks/types'

export interface AuthorEditPanelProps {
  id?: string
  initialImages: GalleryImageEdge[]

  onClose?(images: GalleryImageEdge[]): void
}

export function GalleryListEditPanel({id, initialImages, onClose}: AuthorEditPanelProps) {
  const [images, setImages] = useState<ListValue<GalleryImageEdge>[]>(() =>
    initialImages.map(value => ({
      id: nanoid(),
      value
    }))
  )

  return (
    <Panel>
      <PanelHeader
        title="Edit Gallery"
        leftChildren={
          <NavigationButton
            icon={MaterialIconClose}
            label="Close"
            onClick={() => onClose?.(images.map(({value}) => value))}
          />
        }
      />

      <PanelSection>
        <ListInput
          value={images}
          onChange={images => setImages(images)}
          defaultValue={{image: null, caption: ''}}>
          {props => <GalleryListItem {...props} />}
        </ListInput>
      </PanelSection>
    </Panel>
  )
}

export function GalleryListItem({value, onChange}: FieldProps<GalleryImageEdge>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const {image, caption} = value

  return (
    <>
      <Box>
        <Card overflow="hidden" height={150}>
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
        <TypographicTextArea
          variant="subtitle2"
          align="center"
          placeholder="Caption"
          value={caption}
          onChange={e => {
            const caption = e.target.value
            onChange(value => ({...value, caption}))
          }}
        />
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
