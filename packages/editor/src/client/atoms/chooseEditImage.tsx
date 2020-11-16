import React from 'react'
import {Dropdown, Icon, IconButton, Panel} from 'rsuite'
import {PlaceholderInput} from './placeholderInput'
import {useTranslation} from 'react-i18next'

export interface ChooseEditImageProps {
  image: any
  header?: string
  disabled: boolean
  openChooseModalOpen?: () => void
  openEditModalOpen?: () => void
  removeImage?: () => void
}

export function ChooseEditImage({
  image,
  header,
  disabled,
  openChooseModalOpen,
  openEditModalOpen,
  removeImage
}: ChooseEditImageProps) {
  const {t} = useTranslation()
  header = header ?? t('chooseEditImage.header')
  return (
    <Panel
      header={header}
      style={{
        height: 300
      }}>
      <PlaceholderInput onAddClick={() => openChooseModalOpen?.()}>
        {image && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%'
            }}>
            {(openChooseModalOpen || openEditModalOpen || removeImage) && (
              <div style={{position: 'absolute', zIndex: 1, left: 5, top: 5}}>
                <Dropdown
                  renderTitle={() => {
                    return <IconButton appearance="primary" icon={<Icon icon="wrench" />} circle />
                  }}>
                  {openChooseModalOpen && (
                    <Dropdown.Item disabled={disabled} onClick={() => openChooseModalOpen()}>
                      <Icon icon="image" /> {t('chooseEditImage.chooseImage')}
                    </Dropdown.Item>
                  )}
                  {openEditModalOpen && (
                    <Dropdown.Item disabled={disabled} onClick={() => openEditModalOpen()}>
                      <Icon icon="pencil" /> {t('chooseEditImage.editImage')}
                    </Dropdown.Item>
                  )}
                  {removeImage && (
                    <Dropdown.Item disabled={disabled} onClick={() => removeImage()}>
                      <Icon icon="close" /> {t('chooseEditImage.removeImage')}
                    </Dropdown.Item>
                  )}
                </Dropdown>
              </div>
            )}
            <img
              src={image.previewURL ?? 'https://via.placeholder.com/200'}
              width="100%"
              height={200}
            />
          </div>
        )}
      </PlaceholderInput>
    </Panel>
  )
}
