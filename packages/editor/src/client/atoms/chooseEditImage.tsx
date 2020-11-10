import React from 'react'
import {Dropdown, Icon, IconButton, Panel} from 'rsuite'
import {PlaceholderInput} from './placeholderInput'
import {useTranslation} from 'react-i18next'

export interface ChooseEditImageProps {
  image: any
  disabled: boolean
  openChooseModalOpen: () => void
  openEditModalOpen: () => void
  removeImage: () => void
}

export function ChooseEditImage({
  image,
  disabled,
  openChooseModalOpen,
  openEditModalOpen,
  removeImage
}: ChooseEditImageProps) {
  const {t} = useTranslation()

  return (
    <Panel
      style={{
        height: 200
      }}>
      <PlaceholderInput onAddClick={() => openChooseModalOpen()}>
        {image && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%'
            }}>
            <div style={{position: 'absolute', zIndex: 1, left: 5, top: 5}}>
              <Dropdown
                renderTitle={() => {
                  return <IconButton appearance="primary" icon={<Icon icon="wrench" />} circle />
                }}>
                <Dropdown.Item disabled={disabled} onClick={() => openEditModalOpen()}>
                  <Icon icon="image" /> {t('chooseEditImage.chooseImage')}
                </Dropdown.Item>
                <Dropdown.Item disabled={disabled} onClick={() => openEditModalOpen()}>
                  <Icon icon="pencil" /> {t('chooseEditImage.editImage')}
                </Dropdown.Item>
                <Dropdown.Item disabled={disabled} onClick={() => removeImage()}>
                  <Icon icon="close" /> {t('chooseEditImage.removeImage')}
                </Dropdown.Item>
              </Dropdown>
            </div>
            {image.previewURL && <img src={image.previewURL} width="100%" height={200} />}
          </div>
        )}
      </PlaceholderInput>
    </Panel>
  )
}
