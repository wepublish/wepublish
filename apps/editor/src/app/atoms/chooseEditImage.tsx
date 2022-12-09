import React from 'react'
import {useTranslation} from 'react-i18next'
import {MdClose, MdEdit, MdPhoto} from 'react-icons/md'
import {Dropdown, IconButton, Panel, Placeholder} from 'rsuite'

import {PlaceholderInput} from './placeholderInput'

export interface ChooseEditImageProps {
  image: any
  header?: string
  disabled: boolean
  left?: number
  top?: number
  openChooseModalOpen?: () => void
  openEditModalOpen?: () => void
  removeImage?: () => void
  maxHeight?: number
}

export function ChooseEditImage({
  image,
  header,
  disabled,
  left = 5,
  top = 5,
  openChooseModalOpen,
  openEditModalOpen,
  removeImage,
  maxHeight = 240
}: ChooseEditImageProps): JSX.Element {
  const {t} = useTranslation()
  header = header ?? t('chooseEditImage.header')
  return (
    <Panel header={header} bodyFill>
      {!image && disabled === true && <Placeholder.Graph />}
      <PlaceholderInput onAddClick={() => openChooseModalOpen?.()} maxHeight={maxHeight}>
        {image && (
          <div
            style={{
              maxHeight,
              display: 'flex',
              justifyContent: 'center',
              position: 'relative',
              width: '100%',
              height: '100%'
            }}>
            <img
              src={image?.largeURL ?? '/static/placeholder-240x240.png'}
              style={{
                objectFit: 'contain',
                objectPosition: 'top left',
                width: '100%',
                height: '100%',
                maxHeight
              }}
            />
            {(openChooseModalOpen || openEditModalOpen || removeImage) && (
              <div style={{position: 'absolute', top, left}}>
                <Dropdown
                  renderToggle={(props: unknown, ref: React.Ref<HTMLButtonElement>) => (
                    <IconButton
                      {...props}
                      ref={ref}
                      icon={<MdEdit />}
                      circle
                      size="sm"
                      appearance="primary"
                    />
                  )}>
                  {openChooseModalOpen && (
                    <Dropdown.Item disabled={disabled} onClick={() => openChooseModalOpen()}>
                      <MdPhoto /> {t('chooseEditImage.chooseImage')}
                    </Dropdown.Item>
                  )}
                  {openEditModalOpen && (
                    <Dropdown.Item disabled={disabled} onClick={() => openEditModalOpen()}>
                      <MdEdit /> {t('chooseEditImage.editImage')}
                    </Dropdown.Item>
                  )}
                  {removeImage && (
                    <Dropdown.Item disabled={disabled} onClick={() => removeImage()}>
                      <MdClose /> {t('chooseEditImage.removeImage')}
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
