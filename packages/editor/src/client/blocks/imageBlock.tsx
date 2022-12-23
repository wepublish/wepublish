import styled from '@emotion/styled'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdBuild, MdEdit, MdPhoto} from 'react-icons/md'
import {Drawer, Dropdown, IconButton, Panel} from 'rsuite'

import {ImageRefFragment} from '../api'
import {BlockProps} from '../atoms/blockList'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {TypographicTextArea} from '../atoms/typographicTextArea'
import {ImageEditPanel} from '../panel/imageEditPanel'
import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImageBlockValue} from './types'

export const StyledPanel = styled(Panel)`
  height: 300px;
  margin-bottom: 0;
  overflow: hidden;
`

export const StyledImagePanel = styled(Panel)<{image: ImageRefFragment}>`
  padding: 0;
  position: relative;
  height: 100%;
  background-size: ${({image}) => (image?.height > 300 ? 'contain' : 'auto')};
  background-position-x: center;
  background-position-y: center;
  background-repeat: no-repeat;
  background-image: ${({image}) =>
    image?.largeURL ? `url(${image?.largeURL})` : 'https://via.placeholder.com/240x240'};
`

// TODO: Handle disabled prop
export function ImageBlock({value, onChange, autofocus}: BlockProps<ImageBlockValue>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const {image, caption} = value

  const {t} = useTranslation()

  useEffect(() => {
    if (autofocus && !value.image) {
      setChooseModalOpen(true)
    }
  }, [])

  function handleImageChange(image: ImageRefFragment | null) {
    onChange({...value, image})
  }

  return (
    <>
      <StyledPanel bodyFill bordered>
        <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
          {image && (
            <StyledImagePanel image={image}>
              <Dropdown
                renderToggle={(props: unknown, ref: React.Ref<HTMLButtonElement>) => (
                  <IconButton {...props} ref={ref} icon={<MdBuild />} circle appearance="subtle" />
                )}>
                <Dropdown.Item onClick={() => setChooseModalOpen(true)}>
                  <MdPhoto /> {t('blocks.image.overview.chooseImage')}
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setEditModalOpen(true)}>
                  <MdEdit /> {t('blocks.image.overview.editImage')}
                </Dropdown.Item>
                {/* TODO: Meta sync for metadata image */}
              </Dropdown>
            </StyledImagePanel>
          )}
        </PlaceholderInput>
      </StyledPanel>
      <TypographicTextArea
        variant="subtitle2"
        align="center"
        placeholder={t('blocks.image.overview.caption')}
        value={caption}
        onChange={e => {
          onChange({...value, caption: e.target.value})
        }}
      />
      <Drawer open={isChooseModalOpen} size="sm" onClose={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false)
            handleImageChange(value)
          }}
        />
      </Drawer>
      {image && (
        <Drawer open={isEditModalOpen} size="sm" onClose={() => setEditModalOpen(false)}>
          <ImageEditPanel id={image!.id} onClose={() => setEditModalOpen(false)} />
        </Drawer>
      )}
    </>
  )
}
