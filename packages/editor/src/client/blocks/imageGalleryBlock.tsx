import React, {useState, useEffect} from 'react'

import {Drawer, Dropdown, IconButton, Panel} from 'rsuite'

import {PlaceholderInput} from '../atoms/placeholderInput'
import {TypographicTextArea} from '../atoms/typographicTextArea'
import {BlockProps} from '../atoms/blockList'

import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImagedEditPanel} from '../panel/imageEditPanel'
import {ImageRefFragment} from '../api'
import {ImageGalleryBlockValue} from './types'
import {GalleryListEditPanel} from '../panel/galleryListEditPanel'

import {useTranslation} from 'react-i18next'
import ImageIcon from '@rsuite/icons/legacy/Image'
import PencilIcon from '@rsuite/icons/legacy/Pencil'
import WrenchIcon from '@rsuite/icons/legacy/Wrench'
import ListIcon from '@rsuite/icons/legacy/List'
import ArrowCircleLeftIcon from '@rsuite/icons/legacy/ArrowCircleLeft'
import ArrowCircleRightIcon from '@rsuite/icons/legacy/ArrowCircleRight'
import PlusCircleIcon from '@rsuite/icons/legacy/PlusCircle'

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

  const {t} = useTranslation()

  useEffect(() => {
    if (autofocus && !value.images[0].image) {
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 10
        }}>
        <div
          style={{
            flexBasis: 0,
            flexGrow: 1,
            flexShrink: 1
          }}>
          <IconButton
            icon={<ListIcon />}
            onClick={() => setGalleryListEditModalOpen(true)}
            disabled={disabled}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flexBasis: 0,
            justifyContent: 'center',
            flexGrow: 1,
            flexShrink: 1
          }}>
          <p style={{color: 'gray'}} color="gray">
            {index + 1} / {Math.max(index + 1, value.images.length)} {isNewIndex ? '(New)' : ''}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            flexBasis: 0,
            justifyContent: 'flex-end',
            flexGrow: 1,
            flexShrink: 1
          }}>
          <IconButton
            icon={<ArrowCircleLeftIcon />}
            onClick={() => setIndex(index => index - 1)}
            disabled={disabled || !hasPrevious}
            style={{
              marginRight: 5
            }}
          />
          <IconButton
            icon={<ArrowCircleRightIcon />}
            onClick={() => setIndex(index => index + 1)}
            disabled={disabled || !hasNext}
            style={{
              marginRight: 10
            }}
          />
          <IconButton
            icon={<PlusCircleIcon />}
            onClick={() => setIndex(value.images.length)}
            disabled={disabled || isNewIndex}
          />
        </div>
      </div>
      <Panel
        bordered
        bodyFill
        style={{
          height: 300,
          overflow: 'hidden',
          marginBottom: 10
        }}>
        <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
          {image && (
            <div
              style={{
                padding: 0,
                position: 'relative',
                height: '100%',
                backgroundSize: `${image?.height > 300 ? 'contain' : 'auto'}`,
                backgroundPositionX: 'center',
                backgroundPositionY: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundImage: `url(${image?.largeURL ?? 'https://via.placeholder.com/240x240'})`
              }}>
              <Dropdown
                renderToggle={(props: unknown, ref: React.Ref<HTMLButtonElement>) => (
                  <IconButton
                    {...props}
                    ref={ref}
                    icon={<WrenchIcon />}
                    circle
                    appearance="subtle"
                  />
                )}>
                <Dropdown.Item onClick={() => setChooseModalOpen(true)}>
                  <ImageIcon /> {t('blocks.image.overview.chooseImage')}
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setEditModalOpen(true)}>
                  <PencilIcon /> {t('blocks.image.overview.editImage')}
                </Dropdown.Item>
                {/* TODO: Meta sync */}
              </Dropdown>
            </div>
          )}
        </PlaceholderInput>
      </Panel>
      <TypographicTextArea
        variant="subtitle2"
        align="center"
        placeholder={t('blocks.imageGallery.overview.caption')}
        value={caption}
        disabled={disabled}
        onChange={e => {
          handleCaptionChange(e.target.value)
        }}
      />
      <Drawer open={isChooseModalOpen} size={'sm'} onClose={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false)
            handleImageChange(value)
          }}
        />
      </Drawer>
      {image && (
        <Drawer open={isEditModalOpen} size={'sm'} onClose={() => setEditModalOpen(false)}>
          <ImagedEditPanel id={image!.id} onClose={() => setEditModalOpen(false)} />
        </Drawer>
      )}
      <Drawer
        open={isGalleryListEditModalOpen}
        size={'sm'}
        onClose={() => setGalleryListEditModalOpen(false)}>
        <GalleryListEditPanel
          initialImages={value.images}
          onSave={images => {
            onChange({images})
            setGalleryListEditModalOpen(false)
          }}
          onClose={() => setGalleryListEditModalOpen(false)}
        />
      </Drawer>
    </>
  )
}
