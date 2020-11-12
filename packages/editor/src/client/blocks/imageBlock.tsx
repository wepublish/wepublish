import React, {useState, useEffect} from 'react'

import {Drawer, Dropdown, Icon, IconButton, Panel} from 'rsuite'
import {BlockProps} from '../atoms/blockList'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {TypographicTextArea} from '../atoms/typographicTextArea'

import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImagedEditPanel} from '../panel/imageEditPanel'
import {ImageRefFragment} from '../api'
import {ImageBlockValue} from './types'

import {useTranslation} from 'react-i18next'

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
      <Panel
        bodyFill={true}
        bordered={true}
        style={{
          height: 300,
          overflow: 'hidden',
          marginBottom: 10
        }}>
        <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
          {image && (
            <Panel
              style={{
                padding: 0,
                position: 'relative',
                width: '100%',
                height: '200px',
                backgroundSize: 'cover',
                backgroundImage: `url(${image?.largeURL ?? 'https://via.placeholder.com/240x240'})`
              }}>
              <Dropdown
                renderTitle={() => {
                  return <IconButton appearance="subtle" icon={<Icon icon="wrench" />} circle />
                }}>
                <Dropdown.Item onClick={() => setChooseModalOpen(true)}>
                  <Icon icon="image" /> {t('blocks.image.overview.chooseImage')}
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setEditModalOpen(true)}>
                  <Icon icon="pencil" /> {t('blocks.image.overview.editImage')}
                </Dropdown.Item>
                {/* TODO: Meta sync */}
              </Dropdown>
            </Panel>
          )}
        </PlaceholderInput>
      </Panel>
      <TypographicTextArea
        variant="subtitle2"
        align="center"
        placeholder={t('blocks.image.overview.caption')}
        value={caption}
        onChange={e => {
          onChange({...value, caption: e.target.value})
        }}
      />
      <Drawer show={isChooseModalOpen} size={'sm'} onHide={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false)
            handleImageChange(value)
          }}
        />
      </Drawer>
      {image && (
        <Drawer show={isEditModalOpen} size={'sm'} onHide={() => setEditModalOpen(false)}>
          <ImagedEditPanel id={image!.id} onClose={() => setEditModalOpen(false)} />
        </Drawer>
      )}
    </>
  )
}
