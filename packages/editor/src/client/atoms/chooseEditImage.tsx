import React from 'react'
import {Dropdown, IconButton, Panel, Placeholder} from 'rsuite'
import {PlaceholderInput} from './placeholderInput'
import {useTranslation} from 'react-i18next'
import WrenchIcon from '@rsuite/icons/legacy/Wrench'
import ImageIcon from '@rsuite/icons/legacy/Image'
import PencilIcon from '@rsuite/icons/legacy/Pencil'
import CloseIcon from '@rsuite/icons/legacy/Close'

export interface ChooseEditImageProps {
  image: any
  header?: string
  disabled: boolean
  left?: number
  top?: number
  openChooseModalOpen?: () => void
  openEditModalOpen?: () => void
  removeImage?: () => void
}

export function ChooseEditImage({
  image,
  header,
  disabled,
  left,
  top,
  openChooseModalOpen,
  openEditModalOpen,
  removeImage
}: ChooseEditImageProps): JSX.Element {
  const {t} = useTranslation()
  header = header ?? t('chooseEditImage.header')
  return (
    <Panel header={header} bodyFill>
      {!image && disabled === true && <Placeholder.Graph />}
      <PlaceholderInput onAddClick={() => openChooseModalOpen?.()}>
        {image && (
          <div
            style={{
              maxHeight: '240',
              display: 'flex',
              justifyContent: 'center',
              position: 'relative'
            }}>
            <img
              src={image?.largeURL ?? '/static/placeholder-240x240.png'}
              style={{objectFit: 'contain'}}
            />
            {(openChooseModalOpen || openEditModalOpen || removeImage) && (
              <div style={{position: 'absolute', left: left, top: top}}>
                <Dropdown
                  renderToggle={(props: unknown, ref: React.Ref<HTMLButtonElement>) => (
                    <IconButton
                      {...props}
                      ref={ref}
                      icon={<WrenchIcon />}
                      circle
                      appearance="primary"
                    />
                  )}>
                  {openChooseModalOpen && (
                    <Dropdown.Item disabled={disabled} onClick={() => openChooseModalOpen()}>
                      <ImageIcon /> {t('chooseEditImage.chooseImage')}
                    </Dropdown.Item>
                  )}
                  {openEditModalOpen && (
                    <Dropdown.Item disabled={disabled} onClick={() => openEditModalOpen()}>
                      <PencilIcon /> {t('chooseEditImage.editImage')}
                    </Dropdown.Item>
                  )}
                  {removeImage && (
                    <Dropdown.Item disabled={disabled} onClick={() => removeImage()}>
                      <CloseIcon /> {t('chooseEditImage.removeImage')}
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
