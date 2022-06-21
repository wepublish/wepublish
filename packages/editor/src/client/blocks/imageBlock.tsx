import React, {useState, useEffect} from 'react'

import {Drawer, Dropdown, IconButton, Panel} from 'rsuite'
import {BlockProps} from '../atoms/blockList'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {TypographicTextArea} from '../atoms/typographicTextArea'

import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImagedEditPanel} from '../panel/imageEditPanel'
import {ImageRefFragment} from '../api'
import {ImageBlockValue} from './types'

import {useTranslation} from 'react-i18next'
import WrenchIcon from '@rsuite/icons/legacy/Wrench'
import PencilIcon from '@rsuite/icons/legacy/Pencil'
import ImageIcon from '@rsuite/icons/legacy/Image'

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
        bodyFill
        bordered
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
                {/* TODO: Meta sync for metadata image */}
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
    </>
  )
}
