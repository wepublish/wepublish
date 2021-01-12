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
}: ChooseEditImageProps): JSX.Element {
  const {t} = useTranslation()
  header = header ?? t('chooseEditImage.header')
  const panelHeight = image ? (image.height < 240 ? image.height : 240) : 240
  return (
    <Panel header={header} style={{}}>
      <PlaceholderInput onAddClick={() => openChooseModalOpen?.()}>
        {image && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: panelHeight
            }}>
            <img
              style={{maxHeight: '240'}}
              src={image?.largeURL ?? '/static/placeholder-240x240.png'}
            />
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
          </div>
        )}
      </PlaceholderInput>
    </Panel>
  )
}
