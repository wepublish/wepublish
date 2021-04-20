import React, {useState, useEffect} from 'react'

import {Drawer, Dropdown, Icon, IconButton, Panel} from 'rsuite'
import {BlockProps} from '../atoms/blockList'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {TypographicTextArea} from '../atoms/typographicTextArea'
import {ImageRefFragment} from '../api'

import {ImageBlockValue} from './types'

import {useTranslation} from 'react-i18next'
import {ImagedEditPanel, ImageSelectPanel, Reference} from '@wepublish/editor'
import {useImageQuery} from '@wepublish/editor/lib/client/api'

// TODO: Handle disabled prop
export function ImageBlock({value, onChange, autofocus}: BlockProps<ImageBlockValue>) {
  const {image, caption} = value
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const {data} = useImageQuery({
    skip: image?.record || !image?.recordId,
    variables: {
      id: image?.recordId!
    }
  })

  const {t} = useTranslation()

  useEffect(() => {
    if (autofocus && !value.image) {
      setChooseModalOpen(true)
    }
  }, [])

  function handleImageChange(image: Reference | null) {
    onChange({...value, image})
  }

  const imageRecord: ImageRefFragment = image?.record || data?.image
  let imageComponent = null
  if (imageRecord) {
    imageComponent = (
      <Panel
        style={{
          padding: 0,
          position: 'relative',
          height: '100%',
          backgroundSize: `${imageRecord.height > 300 ? 'contain' : 'auto'}`,
          backgroundPositionX: 'center',
          backgroundPositionY: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundImage: `url(${imageRecord?.largeURL ?? 'https://via.placeholder.com/240x240'})`
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
          {/* TODO: Meta sync for metadata image */}
        </Dropdown>
      </Panel>
    )
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
          {imageComponent}
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
          onSelect={value => {}}
          onSelectRef={value => {
            setChooseModalOpen(false)
            handleImageChange(value)
          }}
        />
      </Drawer>
      {image && (
        <Drawer show={isEditModalOpen} size={'sm'} onHide={() => setEditModalOpen(false)}>
          <ImagedEditPanel id={image!.recordId} onClose={() => setEditModalOpen(false)} />
        </Drawer>
      )}
    </>
  )
}
