import React, {useState, useEffect} from 'react'

import {
  PlaceholderInput,
  Drawer,
  BlockProps,
  Image,
  Box,
  Spacing,
  IconButton,
  TypographicTextArea,
  ZIndex,
  Card,
  Typography
} from '@karma.run/ui'

import {
  MaterialIconEditOutlined,
  MaterialIconImageOutlined,
  MaterialIconChevronRight,
  MaterialIconChevronLeft,
  MaterialIconList,
  MaterialIconClose,
  MaterialIconAdd
} from '@karma.run/icons'

import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImagedEditPanel} from '../panel/imageEditPanel'
import {ImageRefFragment} from '../api'
import {ImageGalleryBlockValue} from './types'
import {GalleryListEditPanel} from '../panel/galleryListEditPanel'

export function ImageGalleryBlock({
  value,
  onChange,
  autofocus,
  disabled
}: BlockProps<ImageGalleryBlockValue>) {
  const [isGalleryListEditModalOpen, setGalleryListEditModalOpen] = useState(false)

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const [index, setIndex] = useState(0)

  const item = value.images[index]

  const image = item?.image
  const caption = item?.caption ?? ''

  const hasPrevious = index > 0
  const hasNext = index < value.images.length - 1

  const isNewIndex = !image && !caption && index >= value.images.length

  useEffect(() => {
    if (autofocus) {
      setGalleryListEditModalOpen(true)
    }
  }, [])

  function handleImageChange(image: ImageRefFragment | null) {
    onChange({
      ...value,
      images: Object.assign([], value.images, {
        [index]: {
          image,
          caption
        }
      })
    })
  }

  function handleCaptionChange(caption: string) {
    onChange({
      ...value,
      images: Object.assign([], value.images, {
        [index]: {
          image,
          caption
        }
      })
    })
  }

  return (
    <>
      <Box display="flex" alignItems="center" marginBottom={Spacing.ExtraSmall}>
        <Box flexBasis="0" flexGrow={1} flexShrink={1}>
          <IconButton
            icon={MaterialIconList}
            title="Edit Gallery List"
            onClick={() => setGalleryListEditModalOpen(true)}
            marginRight={Spacing.Tiny}
            disabled={disabled}
          />
        </Box>
        <Box flexBasis="0" display="flex" justifyContent="center" flexGrow={1} flexShrink={1}>
          <Typography variant={isNewIndex ? 'subtitle2' : 'subtitle1'} color="gray">
            {index + 1} / {Math.max(index + 1, value.images.length)} {isNewIndex ? '(New)' : ''}
          </Typography>
        </Box>
        <Box flexBasis="0" display="flex" justifyContent="flex-end" flexGrow={1} flexShrink={1}>
          <IconButton
            icon={MaterialIconChevronLeft}
            title="Previous"
            onClick={() => setIndex(index => index - 1)}
            disabled={disabled || !hasPrevious}
            marginRight={Spacing.Tiny}
          />
          <IconButton
            icon={MaterialIconChevronRight}
            title="Next"
            onClick={() => setIndex(index => index + 1)}
            disabled={disabled || !hasNext}
            marginRight={Spacing.ExtraSmall}
          />
          <IconButton
            icon={MaterialIconAdd}
            title="Add"
            onClick={() => setIndex(value.images.length)}
            disabled={disabled || isNewIndex}
          />
        </Box>
      </Box>
      <Card height={300} overflow="hidden" marginBottom={Spacing.ExtraSmall}>
        <Box position="relative" width="100%" height="100%">
          <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
            {image && (
              <Box position="relative" width="100%" height="100%">
                <Box position="absolute" zIndex={ZIndex.Default} right={0} top={0}>
                  <IconButton
                    icon={MaterialIconImageOutlined}
                    title="Choose Image"
                    onClick={() => setChooseModalOpen(true)}
                    disabled={disabled}
                    margin={Spacing.ExtraSmall}
                  />
                  <IconButton
                    icon={MaterialIconEditOutlined}
                    title="Edit Image"
                    onClick={() => setEditModalOpen(true)}
                    disabled={disabled}
                    margin={Spacing.ExtraSmall}
                  />
                  <IconButton
                    icon={MaterialIconClose}
                    title="Remove Image"
                    margin={Spacing.ExtraSmall}
                    disabled={disabled}
                    onClick={() => handleImageChange(null)}
                  />
                </Box>

                {image.largeURL && <Image src={image.largeURL} width="100%" height={300} contain />}
              </Box>
            )}
          </PlaceholderInput>
        </Box>
      </Card>
      <Box>
        <TypographicTextArea
          variant="subtitle2"
          align="center"
          placeholder="Caption"
          value={caption}
          disabled={disabled}
          onChange={e => {
            handleCaptionChange(e.target.value)
          }}
        />
      </Box>
      <Drawer open={isChooseModalOpen} width={480}>
        {() => (
          <ImageSelectPanel
            onClose={() => setChooseModalOpen(false)}
            onSelect={value => {
              setChooseModalOpen(false)
              handleImageChange(value)
            }}
          />
        )}
      </Drawer>
      <Drawer open={isEditModalOpen} width={480}>
        {() => <ImagedEditPanel id={image!.id} onClose={() => setEditModalOpen(false)} />}
      </Drawer>
      <Drawer open={isGalleryListEditModalOpen} width={480}>
        {() => (
          <GalleryListEditPanel
            initialImages={value.images}
            onClose={images => {
              onChange({images})
              setGalleryListEditModalOpen(false)
            }}
          />
        )}
      </Drawer>
    </>
  )
}
