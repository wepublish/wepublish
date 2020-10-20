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

import {useTranslation} from 'react-i18next'

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

  const {t} = useTranslation()

  return (
    <Panel>
      <PanelHeader
        title={t('blocks.imageGallery.panels.editGallery')}
        leftChildren={
          <NavigationButton
            icon={MaterialIconClose}
            label={t('blocks.imageGallery.panels.close')}
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

  const {t} = useTranslation()

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
                    title={t('blocks.imageGallery.panels.chooseImage')}
                    margin={Spacing.ExtraSmall}
                    onClick={() => setChooseModalOpen(true)}
                  />
                  <IconButton
                    icon={MaterialIconEditOutlined}
                    title={t('blocks.imageGallery.panels.editImage')}
                    margin={Spacing.ExtraSmall}
                    onClick={() => setEditModalOpen(true)}
                  />
                  <IconButton
                    icon={MaterialIconClose}
                    title={t('blocks.imageGallery.panels.removeImage')}
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
          placeholder={t('blocks.imageGallery.panels.caption')}
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
